package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/queue"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

// ProcessJobsHandler handles the storage queue worker trigger (POST /processJobs)
func ProcessJobsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var payload struct {
		Data map[string]interface{} `json:"Data"`
	}
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		log.Printf("Failed to decode queue trigger payload: %v", err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Extract the jobIdStr case-insensitively
	var jobIdStr string
	for k, v := range payload.Data {
		if strings.ToLower(k) == "myqueueitem" {
			jobIdStr = fmt.Sprintf("%v", v)
			break
		}
	}
	jobIdStr = strings.Trim(jobIdStr, "\"")

	if jobIdStr == "" {
		log.Println("Error: myQueueItem missing from trigger payload")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if db.MongoClient == nil {
		log.Println("Error: MongoDB client not connected in queue worker")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	objID, err := primitive.ObjectIDFromHex(jobIdStr)
	if err != nil {
		log.Printf("Invalid Job ID format in queue item: %s", jobIdStr)
		w.WriteHeader(http.StatusOK) // Return 200 so host removes the corrupted message
		return
	}

	log.Printf("Attempting to claim lock on Job %s", jobIdStr)
	collection := db.MongoClient.Database("cover-craft").Collection("jobs")
	staleBefore := time.Now().Add(-5 * time.Minute)

	query := bson.M{
		"_id": objID,
		"$or": []bson.M{
			{"status": "pending", "$or": []bson.M{
				{"attempts": bson.M{"$exists": false}},
				{"attempts": bson.M{"$lt": 3}},
			}},
			{"status": "processing", "processingStartedAt": bson.M{"$lt": staleBefore}, "$or": []bson.M{
				{"attempts": bson.M{"$exists": false}},
				{"attempts": bson.M{"$lt": 3}},
			}},
		},
	}

	update := bson.M{
		"$set": bson.M{
			"status":              "processing",
			"processingStartedAt": time.Now().UTC(),
			"maxAttempts":         3,
		},
		"$inc": bson.M{"attempts": 1},
	}

	var job db.Job
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	err = collection.FindOneAndUpdate(
		ctx,
		query,
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	).Decode(&job)
	cancel()

	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Lock failed. Let's inspect the existing job status
			var existingJob db.Job
			ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
			findErr := collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&existingJob)
			cancel()
			if findErr == nil {
				if existingJob.Status != "completed" && existingJob.Status != "failed" && existingJob.Attempts >= existingJob.MaxAttempts {
					ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
					_, _ = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
						"$set": bson.M{
							"status":    "failed",
							"error":     "Job exceeded maximum processing attempts.",
							"lastError": "Job exceeded maximum processing attempts.",
						},
						"$unset": bson.M{"processingStartedAt": ""},
					})
					cancel()
				}
			}
			log.Printf("Job %s not found, finalized, or processing by another listener", jobIdStr)
			w.WriteHeader(http.StatusOK)
			return
		}
		log.Printf("Database error claiming lock for job %s: %v", jobIdStr, err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	log.Printf("Lock claimed successfully on Job %s. Processing requests...", jobIdStr)

	// Deferred panic recovery to reset/fail job cleanly in case of panic
	defer func() {
		if rcv := recover(); rcv != nil {
			log.Printf("CRITICAL PANIC in worker for jobId %s: %v", jobIdStr, rcv)
			handleGlobalError(objID, fmt.Errorf("panic: %v", rcv), &job)
		}
	}()

	err = processJobExecution(objID, job)
	if err != nil {
		log.Printf("Error during job execution for %s: %v", jobIdStr, err)
		handleGlobalError(objID, err, &job)
	}

	w.WriteHeader(http.StatusOK)
}

// processJobExecution performs the sequential rendering of batch requests
func processJobExecution(objID primitive.ObjectID, job db.Job) error {
	collection := db.MongoClient.Database("cover-craft").Collection("jobs")
	resultDetails := make(map[string]db.JobResult)
	if job.ResultDetails != nil {
		for k, v := range job.ResultDetails {
			resultDetails[k] = v
		}
	}

	for i, req := range job.Requests {
		idxStr := fmt.Sprintf("%d", i)
		if _, exists := resultDetails[idxStr]; exists {
			log.Printf("Skipping already finalized image result for job %s index %d", objID.Hex(), i)
			continue
		}

		// Marshal BSON document req to BSON bytes and unmarshal into services.ImageParams
		bsonBytes, err := bson.Marshal(req)
		if err != nil {
			return fmt.Errorf("failed to marshal request at index %d: %w", i, err)
		}
		var currentRequest services.ImageParams
		if err := bson.Unmarshal(bsonBytes, &currentRequest); err != nil {
			return fmt.Errorf("failed to parse image parameters at index %d: %w", i, err)
		}

		startTime := time.Now()
		var lastError error
		var detail *db.JobResult

		for attempt := 1; attempt <= 3; attempt++ {
			pngBytes, err := services.GeneratePNG(currentRequest)
			durationMs := int(time.Since(startTime).Milliseconds())

			if err == nil {
				base64Data := fmt.Sprintf("data:image/png;base64,%s", base64.StdEncoding.EncodeToString(pngBytes))
				detail = &db.JobResult{
					Index:     i,
					Status:    "success",
					DataURL:   base64Data,
					Attempts:  attempt,
					UpdatedAt: time.Now().UTC(),
				}

				// Store success metric asynchronously
				go func(item services.ImageParams, dur int, att int) {
					contrastRatio, _ := services.GetContrastRatio(item.BackgroundColor, item.TextColor)
					wcagLevel := services.GetWCAGLevel(contrastRatio)

					var subLen int
					if item.Subtitle != nil {
						subLen = len(*item.Subtitle)
					}

					storeMetric(db.Metric{
						Event:          "image_generated",
						Timestamp:      time.Now().UTC(),
						Status:         "success",
						Size:           &db.SizePreset{Width: item.Width, Height: item.Height},
						Font:           string(item.Font),
						TitleLength:    intPtr(len(item.Title)),
						SubtitleLength: intPtr(subLen),
						ContrastRatio:  floatPtr(contrastRatio),
						WcagLevel:      wcagLevel,
						Duration:       intPtr(dur),
					})
				}(currentRequest, durationMs, attempt)
				break
			} else {
				lastError = err
				log.Printf("Image render attempt %d failed for job %s index %d: %v", attempt, objID.Hex(), i, err)
				if attempt < 3 {
					// Exponential backoff with jitter (250ms -> 500ms -> 1000ms)
					delay := 250 * (1 << uint(attempt-1))
					jitter := rand.Intn(101)
					time.Sleep(time.Duration(delay+jitter) * time.Millisecond)
				}
			}
		}

		if detail == nil {
			durationMs := int(time.Since(startTime).Milliseconds())
			errMsg := "Failed to render"
			if lastError != nil {
				errMsg = lastError.Error()
			}
			detail = &db.JobResult{
				Index:     i,
				Status:    "error",
				Error:     errMsg,
				Attempts:  3,
				UpdatedAt: time.Now().UTC(),
			}

			// Store error metric asynchronously
			go func(item services.ImageParams, dur int, msg string) {
				contrastRatio, _ := services.GetContrastRatio(item.BackgroundColor, item.TextColor)
				wcagLevel := services.GetWCAGLevel(contrastRatio)

				var subLen int
				if item.Subtitle != nil {
					subLen = len(*item.Subtitle)
				}

				storeMetric(db.Metric{
					Event:          "image_generated",
					Timestamp:      time.Now().UTC(),
					Status:         "error",
					ErrorMessage:   msg,
					Size:           &db.SizePreset{Width: item.Width, Height: item.Height},
					Font:           string(item.Font),
					TitleLength:    intPtr(len(item.Title)),
					SubtitleLength: intPtr(subLen),
					ContrastRatio:  floatPtr(contrastRatio),
					WcagLevel:      wcagLevel,
					Duration:       intPtr(dur),
				})
			}(currentRequest, durationMs, errMsg)
		}

		resultDetails[idxStr] = *detail

		// Save intermediate result detail to database
		updateField := fmt.Sprintf("resultDetails.%s", idxStr)
		resultsField := fmt.Sprintf("results.%d", i)
		pubResult := publicResultFromDetail(*detail)

		updateQuery := bson.M{
			"$set": bson.M{
				updateField:  *detail,
				resultsField: pubResult,
			},
		}
		if detail.Status == "error" {
			updateQuery["$set"].(bson.M)["lastError"] = detail.Error
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_, err = collection.UpdateOne(ctx, bson.M{"_id": objID}, updateQuery)
		cancel()
		if err != nil {
			return fmt.Errorf("failed to save intermediate image result at index %d: %w", i, err)
		}
	}

	// Finalize Job document status
	hasSuccess := false
	for _, det := range resultDetails {
		if det.Status == "success" {
			hasSuccess = true
			break
		}
	}

	processedCount := len(resultDetails)
	allImagesFinal := processedCount == len(job.Requests)

	var finalStatus string
	if allImagesFinal && hasSuccess {
		finalStatus = "completed"
	} else {
		finalStatus = "failed"
	}

	var finalError string
	if !hasSuccess {
		finalError = "All images failed to generate."
	}

	updateFinal := bson.M{
		"$set": bson.M{
			"status":  finalStatus,
			"results": getFinalResultsMap(resultDetails, len(job.Requests)),
		},
	}

	unsetFields := bson.M{"processingStartedAt": ""}
	if finalError == "" {
		unsetFields["error"] = ""
		unsetFields["lastError"] = ""
	} else {
		updateFinal["$set"].(bson.M)["error"] = finalError
		updateFinal["$set"].(bson.M)["lastError"] = finalError
	}
	updateFinal["$unset"] = unsetFields

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	_, err := collection.UpdateOne(ctx, bson.M{"_id": objID}, updateFinal)
	cancel()
	if err != nil {
		return fmt.Errorf("failed to finalize job document: %w", err)
	}

	log.Printf("Batch job %s finalized. Processed: %d, status: %s", objID.Hex(), processedCount, finalStatus)
	return nil
}

// handleGlobalError recovers the Job status from failures and schedules queue retries
func handleGlobalError(objID primitive.ObjectID, globalErr error, job *db.Job) {
	if db.MongoClient == nil {
		return
	}
	collection := db.MongoClient.Database("cover-craft").Collection("jobs")
	errorMessage := globalErr.Error()

	maxAttempts := 3
	attempts := 3
	if job != nil {
		if job.MaxAttempts > 0 {
			maxAttempts = job.MaxAttempts
		}
		if job.Attempts > 0 {
			attempts = job.Attempts
		}
	}

	if attempts < maxAttempts {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		_, _ = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
			"$set": bson.M{
				"status":    "pending",
				"lastError": errorMessage,
			},
			"$unset": bson.M{"processingStartedAt": ""},
		})
		cancel()

		if queue.QueueClientService != nil {
			ctx, cancel = context.WithTimeout(context.Background(), 5*time.Second)
			_ = queue.QueueClientService.EnqueueJobWithDelay(ctx, objID.Hex(), 30)
			cancel()
		}
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	_, _ = collection.UpdateOne(ctx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{
			"status":    "failed",
			"error":     errorMessage,
			"lastError": errorMessage,
		},
		"$unset": bson.M{"processingStartedAt": ""},
	})
	cancel()
}

func publicResultFromDetail(detail db.JobResult) string {
	if detail.Status == "success" && detail.DataURL != "" {
		return detail.DataURL
	}
	if detail.Error != "" {
		return fmt.Sprintf("error: %s", detail.Error)
	}
	return "error: Failed to render"
}

func getFinalResultsMap(details map[string]db.JobResult, total int) []string {
	results := make([]string, total)
	for i := 0; i < total; i++ {
		idxStr := fmt.Sprintf("%d", i)
		if det, ok := details[idxStr]; ok {
			results[i] = publicResultFromDetail(det)
		} else {
			results[i] = "error: Failed to render"
		}
	}
	return results
}
