package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"sort"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/queue"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

// GenerateImagesHandler handles bulk image generation job creation (POST /api/generateImages)
func GenerateImagesHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var requests []services.ImageParams
	err := json.NewDecoder(r.Body).Decode(&requests)
	if err != nil {
		writeJSONError(w, "Payload must be a JSON array of image configurations.", http.StatusBadRequest)
		return
	}

	// 1. Perform bulk validation checks
	validationErrors := services.ValidateBatchRequest(requests)
	if len(validationErrors) > 0 {
		log.Printf("Batch validation failed: %d errors", len(validationErrors))

		// Capture individual validation metrics asynchronously
		go func(reqs []services.ImageParams, errs []services.ValidationError) {
			for i, item := range reqs {
				contrastRatio, _ := services.GetContrastRatio(item.BackgroundColor, item.TextColor)
				wcagLevel := services.GetWCAGLevel(contrastRatio)

				var itemErrors []string
				prefix := fmt.Sprintf("requests[%d].", i)
				for _, e := range errs {
					if strings.HasPrefix(e.Field, prefix) {
						itemErrors = append(itemErrors, e.Message)
					}
				}

				errMsg := "Validation failed"
				if len(itemErrors) > 0 {
					errMsg = strings.Join(itemErrors, "; ")
				}
				if len(errMsg) > 1000 {
					errMsg = errMsg[:1000]
				}

				var subLen int
				if item.Subtitle != nil {
					subLen = len(*item.Subtitle)
				}

				storeMetric(db.Metric{
					Event:          "image_generated",
					Timestamp:      time.Now().UTC(),
					Status:         "validation_error",
					ErrorMessage:   errMsg,
					Size:           &db.SizePreset{Width: item.Width, Height: item.Height},
					Font:           string(item.Font),
					TitleLength:    intPtr(len(item.Title)),
					SubtitleLength: intPtr(subLen),
					ContrastRatio:  floatPtr(contrastRatio),
					WcagLevel:      wcagLevel,
				})
			}
		}(requests, validationErrors)

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":   "Validation failed",
			"details": validationErrors,
		})
		return
	}

	// 2. Provision Pending Job in MongoDB
	jobId := primitive.NewObjectID()
	now := time.Now().UTC()

	requestsInterfaces := make([]interface{}, len(requests))
	for i, r := range requests {
		requestsInterfaces[i] = r
	}

	job := db.Job{
		ID:            jobId,
		Status:        "pending",
		Requests:      requestsInterfaces,
		Results:       []string{},
		Attempts:      0,
		MaxAttempts:   3,
		ResultDetails: make(map[string]db.JobResult),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if db.MongoClient != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_, err = db.MongoClient.Database("cover-craft").Collection("jobs").InsertOne(ctx, job)
		cancel()
		if err != nil {
			log.Printf("Failed to insert job into MongoDB: %v", err)
			writeJSONError(w, "Failed to provision batch job", http.StatusInternalServerError)
			return
		}
	} else {
		log.Println("Warning: MongoDB client not configured. Proceeding without database.")
	}

	// 3. Connect to Azure Queue Storage and publish Job ID
	if queue.QueueClientService != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err = queue.QueueClientService.EnqueueJob(ctx, jobId.Hex())
		cancel()
		if err != nil {
			log.Printf("Failed to enqueue job message in Queue: %v", err)
			writeJSONError(w, "Failed to enqueue batch job task", http.StatusInternalServerError)
			return
		}
	} else {
		log.Println("Warning: Queue service not configured. Proceeding without enqueuing task.")
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Batch job accepted for processing.",
		"id":      jobId.Hex(),
		"jobId":   jobId.Hex(),
	})
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
		log.Printf("Database lookup error for jobId %s: %v", jobId, err)
		writeJSONError(w, "Database error", http.StatusInternalServerError)
		return
	}

	results := getFinalResults(job)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	response := map[string]interface{}{
		"id":        job.ID.Hex(),
		"status":    job.Status,
		"progress":  len(results),
		"total":     len(job.Requests),
		"results":   results,
		"createdAt": job.CreatedAt,
		"updatedAt": job.UpdatedAt,
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
