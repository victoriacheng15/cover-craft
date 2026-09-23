package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"regexp"
	"sort"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

// QueueJobMessage represents the serialized payload sent to the Azure Queue.
type QueueJobMessage struct {
	JobID         string `json:"jobId"`
	CorrelationID string `json:"correlationId,omitempty"`
}

// GetJobStatusHandler handles polling for job progress (GET /api/getJobStatus)
func GetJobStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	jobId := r.URL.Query().Get("jobId")
	if jobId == "" {
		writeJSONError(w, "Missing jobId query parameter", http.StatusBadRequest)
		return
	}

	if db.MongoClient == nil {
		writeJSONError(w, "Database connection not available", http.StatusInternalServerError)
		return
	}

	var job db.Job
	var err error
	collection := db.MongoClient.Database("cover-craft").Collection("jobs")

	// 1. Try full ObjectID lookup first
	if len(jobId) == 24 && regexp.MustCompile(`^[0-9a-fA-F]{24}$`).MatchString(jobId) {
		objID, parseErr := primitive.ObjectIDFromHex(jobId)
		if parseErr == nil {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			err = collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&job)
			cancel()
		} else {
			err = mongo.ErrNoDocuments
		}
	} else if len(jobId) == 8 && regexp.MustCompile(`^[0-9a-fA-F]{8}$`).MatchString(jobId) {
		// 2. Try partial lookup for 8-character hex strings (last 8 chars)
		pipeline := mongo.Pipeline{
			{{Key: "$addFields", Value: bson.M{"idStr": bson.M{"$toString": "$_id"}}}},
			{{Key: "$match", Value: bson.M{"idStr": bson.M{"$regex": jobId + "$"}}}},
			{{Key: "$limit", Value: 1}},
		}
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		cursor, aggErr := collection.Aggregate(ctx, pipeline)
		if aggErr == nil {
			if cursor.Next(ctx) {
				err = cursor.Decode(&job)
			} else {
				err = mongo.ErrNoDocuments
			}
			cursor.Close(ctx)
		} else {
			err = aggErr
		}
		cancel()
	} else {
		writeJSONError(w, "Invalid Job ID format. Provide either the full 24-character ID or the last 8 characters.", http.StatusBadRequest)
		return
	}

	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			writeJSONError(w, "Job not found", http.StatusNotFound)
			return
		}
		slog.ErrorContext(r.Context(), "Database lookup error for jobId",
			slog.String("job_id", jobId),
			slog.Any("error", err),
		)
		writeJSONError(w, "Database error", http.StatusInternalServerError)
		return
	}

	results := getFinalResults(job)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	total := len(job.Requests)
	if job.Type == "carousel" && job.Carousel != nil {
		if c, ok := job.Carousel.(*services.CarouselParams); ok && c != nil {
			total = len(c.Slides)
		} else {
			bsonBytes, bErr := bson.Marshal(job.Carousel)
			if bErr == nil {
				var cp services.CarouselParams
				if uErr := bson.Unmarshal(bsonBytes, &cp); uErr == nil {
					total = len(cp.Slides)
				}
			}
		}
	}

	response := map[string]interface{}{
		"id":        job.ID.Hex(),
		"status":    job.Status,
		"progress":  len(results),
		"total":     total,
		"results":   results,
		"createdAt": job.CreatedAt,
		"updatedAt": job.UpdatedAt,
	}
	if job.PDFURL != "" {
		response["pdfUrl"] = job.PDFURL
	}
	if job.Error != "" {
		response["error"] = job.Error
	}
	_ = json.NewEncoder(w).Encode(response)
}

// getFinalResults builds the formatted results list (Urls or errors) sorted by request index
func getFinalResults(job db.Job) []string {
	if len(job.ResultDetails) == 0 {
		if job.Results != nil {
			return job.Results
		}
		return []string{}
	}

	type indexedResult struct {
		index int
		val   string
	}
	var items []indexedResult
	for _, det := range job.ResultDetails {
		val := fmt.Sprintf("error: %s", det.Error)
		if det.Status == "success" && det.DataURL != "" {
			val = det.DataURL
		} else if det.Error == "" {
			val = "error: Failed to render"
		}
		items = append(items, indexedResult{index: det.Index, val: val})
	}

	// Sort by index ascending
	sort.Slice(items, func(i, j int) bool {
		return items[i].index < items[j].index
	})

	res := make([]string, len(items))
	for i, item := range items {
		res[i] = item.val
	}
	return res
}

// writeJSONError formats and returns a JSON error response
func writeJSONError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	_ = json.NewEncoder(w).Encode(ErrorResponse{Error: message})
}
