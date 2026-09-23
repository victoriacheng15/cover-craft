package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
)

func TestMetricsHandler_Rejections(t *testing.T) {
	// 1. Method not allowed
	req, _ := http.NewRequest(http.MethodGet, "/api/metrics", nil)
	rr := httptest.NewRecorder()
	MetricsHandler(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status 405, got %d", rr.Code)
	}

	// 2. Invalid JSON format
	req, _ = http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBufferString("invalid-json"))
	rr = httptest.NewRecorder()
	MetricsHandler(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rr.Code)
	}

	// 3. Missing event name
	badPayload1 := map[string]interface{}{
		"timestamp": time.Now().UTC(),
	}
	bodyBytes, _ := json.Marshal(badPayload1)
	req, _ = http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBuffer(bodyBytes))
	rr = httptest.NewRecorder()
	MetricsHandler(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rr.Code)
	}

	// 4. Database client not connected
	db.MongoClient = nil
	goodPayload := map[string]interface{}{
		"event":     "test_event",
		"timestamp": time.Now().UTC(),
	}
	bodyBytes, _ = json.Marshal(goodPayload)
	req, _ = http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBuffer(bodyBytes))
	rr = httptest.NewRecorder()
	MetricsHandler(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", rr.Code)
	}
}

func TestMetricsHandler_Integration(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping metrics integration test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("skipping metrics integration test: failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()

	collection := client.Database("cover-craft").Collection("metrics")

	testEventName := "unit_test_metric_cleanup_marker"
	payload := map[string]interface{}{
		"event":     testEventName,
		"timestamp": time.Now().UTC(),
	}
	bodyBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBuffer(bodyBytes))
	rr := httptest.NewRecorder()
	MetricsHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	// Clean up the created test metric document from database
	_, _ = collection.DeleteMany(ctx, bson.M{"event": testEventName})
}

func TestMetricsBuffer_EnqueueAndSaturation(t *testing.T) {
	mb := &MetricsBuffer{
		ch:            make(chan db.Metric, 2),
		batchSize:     10,
		flushInterval: 10 * time.Second,
		flushReq:      make(chan chan struct{}),
		stopCh:        make(chan struct{}),
		doneCh:        make(chan struct{}),
	}
	defer close(mb.stopCh)

	if !mb.Enqueue(db.Metric{Event: "event1"}) {
		t.Error("expected first enqueue to succeed")
	}
	if !mb.Enqueue(db.Metric{Event: "event2"}) {
		t.Error("expected second enqueue to succeed")
	}
	if mb.Enqueue(db.Metric{Event: "event3"}) {
		t.Error("expected third enqueue to be dropped when buffer is full")
	}
}

func TestMetricsBuffer_BatchFlush(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping batch flush test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()

	coll := client.Database("cover-craft").Collection("metrics")
	testPrefix := "batch_flush_test_"

	mb := NewMetricsBuffer(100, 3, 50*time.Millisecond)
	defer mb.Stop()

	for i := 0; i < 3; i++ {
		mb.Enqueue(db.Metric{
			Event:     testPrefix + "event",
			Timestamp: time.Now().UTC(),
			Status:    "success",
		})
	}

	mb.Flush()

	count, err := coll.CountDocuments(ctx, bson.M{"event": testPrefix + "event"})
	if err != nil {
		t.Fatalf("failed to count metrics: %v", err)
	}
	if count < 3 {
		t.Errorf("expected at least 3 documents, got %d", count)
	}

	_, _ = coll.DeleteMany(ctx, bson.M{"event": testPrefix + "event"})
}

func TestMetricsHandler_CarouselMetric(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping metrics integration test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("skipping metrics integration test: failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()

	collection := client.Database("cover-craft").Collection("metrics")

	testEventName := "unit_test_carousel_metric_" + time.Now().Format("20060102150405")
	payload := map[string]interface{}{
		"event":           testEventName,
		"timestamp":       time.Now().UTC(),
		"status":          "success",
		"compileDuration": 125,
		"fileSizeBytes":   45200,
		"borderStyle":     "double",
		"slideCount":      4,
		"duration":        350,
		"font":            "Montserrat",
		"size": map[string]int{
			"width":  1080,
			"height": 1080,
		},
	}
	bodyBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBuffer(bodyBytes))
	rr := httptest.NewRecorder()
	MetricsHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var resp MetricsResponse
	if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Data.Received.CompileDuration == nil || *resp.Data.Received.CompileDuration != 125 {
		t.Errorf("expected compileDuration 125, got %v", resp.Data.Received.CompileDuration)
	}
	if resp.Data.Received.FileSizeBytes == nil || *resp.Data.Received.FileSizeBytes != 45200 {
		t.Errorf("expected fileSizeBytes 45200, got %v", resp.Data.Received.FileSizeBytes)
	}
	if resp.Data.Received.BorderStyle != "double" {
		t.Errorf("expected borderStyle 'double', got %q", resp.Data.Received.BorderStyle)
	}
	if resp.Data.Received.SlideCount == nil || *resp.Data.Received.SlideCount != 4 {
		t.Errorf("expected slideCount 4, got %v", resp.Data.Received.SlideCount)
	}

	// Verify persistence in MongoDB
	var doc db.Metric
	findCtx, findCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer findCancel()
	err = collection.FindOne(findCtx, bson.M{"event": testEventName}).Decode(&doc)
	if err != nil {
		t.Fatalf("failed to find metric document in MongoDB: %v", err)
	}
	if doc.CompileDuration == nil || *doc.CompileDuration != 125 {
		t.Errorf("persisted compileDuration mismatch: %v", doc.CompileDuration)
	}
	if doc.FileSizeBytes == nil || *doc.FileSizeBytes != 45200 {
		t.Errorf("persisted fileSizeBytes mismatch: %v", doc.FileSizeBytes)
	}
	if doc.BorderStyle != "double" {
		t.Errorf("persisted borderStyle mismatch: %v", doc.BorderStyle)
	}

	// Clean up
	_, _ = collection.DeleteMany(ctx, bson.M{"event": testEventName})
}
