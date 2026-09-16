package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"sync"
	"time"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type MetricsResponse struct {
	Data struct {
		Received   db.Metric `json:"received"`
		ServerTime string    `json:"serverTime"`
	} `json:"data"`
}

const (
	defaultBufferSize    = 1000
	defaultBatchSize     = 50
	defaultFlushInterval = 500 * time.Millisecond
)

// MetricsBuffer buffers incoming metrics in-memory and flushes them to MongoDB in batches.
type MetricsBuffer struct {
	ch            chan db.Metric
	batchSize     int
	flushInterval time.Duration
	flushReq      chan chan struct{}
	stopCh        chan struct{}
	doneCh        chan struct{}
	stopOnce      sync.Once
}

// NewMetricsBuffer creates and starts a new MetricsBuffer worker.
func NewMetricsBuffer(bufferSize, batchSize int, flushInterval time.Duration) *MetricsBuffer {
	mb := &MetricsBuffer{
		ch:            make(chan db.Metric, bufferSize),
		batchSize:     batchSize,
		flushInterval: flushInterval,
		flushReq:      make(chan chan struct{}),
		stopCh:        make(chan struct{}),
		doneCh:        make(chan struct{}),
	}
	go mb.worker()
	return mb
}

func (mb *MetricsBuffer) worker() {
	defer close(mb.doneCh)
	ticker := time.NewTicker(mb.flushInterval)
	defer ticker.Stop()

	batch := make([]interface{}, 0, mb.batchSize)

	flush := func() {
		if len(batch) == 0 {
			return
		}
		if db.MongoClient != nil {
			coll := db.MongoClient.Database("cover-craft").Collection("metrics")
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			_, err := coll.InsertMany(ctx, batch)
			cancel()
			if err != nil {
				slog.Error("Failed to flush batch metrics to MongoDB", "error", err, "count", len(batch))
			}
		}
		batch = make([]interface{}, 0, mb.batchSize)
	}

	for {
		select {
		case metric, ok := <-mb.ch:
			if !ok {
				flush()
				return
			}
			batch = append(batch, metric)
			if len(batch) >= mb.batchSize {
				flush()
			}
		case <-ticker.C:
			flush()
		case ack := <-mb.flushReq:
			flush()
			close(ack)
		case <-mb.stopCh:
			for {
				select {
				case m, ok := <-mb.ch:
					if ok {
						batch = append(batch, m)
						if len(batch) >= mb.batchSize {
							flush()
						}
					} else {
						flush()
						return
					}
				default:
					flush()
					return
				}
			}
		}
	}
}

// Enqueue sends a metric into the bounded channel non-blockingly. Drops with a warning log if full.
func (mb *MetricsBuffer) Enqueue(metric db.Metric) bool {
	select {
	case mb.ch <- metric:
		return true
	default:
		slog.Warn("Metrics channel buffer saturated, dropping metric", "event", metric.Event)
		return false
	}
}

// Flush synchronously flushes all currently buffered metrics to the database.
func (mb *MetricsBuffer) Flush() {
	ack := make(chan struct{})
	select {
	case mb.flushReq <- ack:
		<-ack
	case <-mb.doneCh:
	}
}

// Stop terminates the worker routine and flushes remaining metrics.
func (mb *MetricsBuffer) Stop() {
	mb.stopOnce.Do(func() {
		close(mb.stopCh)
		<-mb.doneCh
	})
}

var GlobalMetricsBuffer *MetricsBuffer

func init() {
	InitMetricsBuffer(defaultBufferSize, defaultBatchSize, defaultFlushInterval)
}

// InitMetricsBuffer initializes or replaces the GlobalMetricsBuffer singleton.
func InitMetricsBuffer(bufferSize, batchSize int, flushInterval time.Duration) {
	if GlobalMetricsBuffer != nil {
		GlobalMetricsBuffer.Stop()
	}
	GlobalMetricsBuffer = NewMetricsBuffer(bufferSize, batchSize, flushInterval)
}

// storeMetric delegates to the global buffered metrics pipeline.
func storeMetric(metric db.Metric) {
	if GlobalMetricsBuffer != nil {
		GlobalMetricsBuffer.Enqueue(metric)
	}
}

func MetricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed"})
		return
	}

	var metric db.Metric
	err := json.NewDecoder(r.Body).Decode(&metric)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid JSON body"})
		return
	}

	if metric.Event == "" || metric.Timestamp.IsZero() {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Missing required fields: event, timestamp"})
		return
	}

	if db.MongoClient == nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Database client not connected"})
		return
	}

	collection := db.MongoClient.Database("cover-craft").Collection("metrics")
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, metric)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to store metric in database"})
		return
	}

	var resp MetricsResponse
	resp.Data.Received = metric
	resp.Data.ServerTime = time.Now().UTC().Format(time.RFC3339)

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
