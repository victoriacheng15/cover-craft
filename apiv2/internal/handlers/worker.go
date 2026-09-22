package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/middleware"
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
		slog.ErrorContext(r.Context(), "Failed to decode queue trigger payload", slog.Any("error", err))
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	// Extract rawQueueItem case-insensitively
	var rawQueueItem string
	for k, v := range payload.Data {
		if strings.ToLower(k) == "myqueueitem" {
			rawQueueItem = fmt.Sprintf("%v", v)
			break
		}
	}
	rawQueueItem = strings.Trim(rawQueueItem, "\"")

	if rawQueueItem == "" {
		slog.WarnContext(r.Context(), "myQueueItem missing from trigger payload")
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	jobIdStr := rawQueueItem
	if strings.HasPrefix(rawQueueItem, "{") {
		var queueMsg QueueJobMessage
		if err := json.Unmarshal([]byte(rawQueueItem), &queueMsg); err == nil && queueMsg.JobID != "" {
			jobIdStr = queueMsg.JobID
			if queueMsg.CorrelationID != "" {
				r = r.WithContext(middleware.WithCorrelationID(r.Context(), queueMsg.CorrelationID))
			}
		}
	}

	if db.MongoClient == nil {
		slog.ErrorContext(r.Context(), "MongoDB client not connected in queue worker")
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	objID, err := primitive.ObjectIDFromHex(jobIdStr)
	if err != nil {
		slog.WarnContext(r.Context(), "Invalid Job ID format in queue item", slog.String("job_id", jobIdStr))
		w.WriteHeader(http.StatusOK) // Return 200 so host removes the corrupted message
		return
	}

	slog.InfoContext(r.Context(), "Attempting to claim lock on job", slog.String("job_id", jobIdStr))
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
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
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
			findCtx, findCancel := context.WithTimeout(r.Context(), 5*time.Second)
			findErr := collection.FindOne(findCtx, bson.M{"_id": objID}).Decode(&existingJob)
			findCancel()
			if findErr == nil {
				if existingJob.Status != "completed" && existingJob.Status != "failed" && existingJob.Attempts >= existingJob.MaxAttempts {
					updateCtx, updateCancel := context.WithTimeout(r.Context(), 5*time.Second)
					_, _ = collection.UpdateOne(updateCtx, bson.M{"_id": objID}, bson.M{
						"$set": bson.M{
							"status":    "failed",
							"error":     "Job exceeded maximum processing attempts.",
							"lastError": "Job exceeded maximum processing attempts.",
						},
						"$unset": bson.M{"processingStartedAt": ""},
					})
					updateCancel()
				}
			}
			slog.InfoContext(r.Context(), "Job not found, finalized, or processing by another listener", slog.String("job_id", jobIdStr))
			w.WriteHeader(http.StatusOK)
			return
		}
		slog.ErrorContext(r.Context(), "Database error claiming lock for job", slog.String("job_id", jobIdStr), slog.Any("error", err))
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	slog.InfoContext(r.Context(), "Lock claimed successfully on job. Processing requests...", slog.String("job_id", jobIdStr))

	// Deferred panic recovery to reset/fail job cleanly in case of panic
	defer func() {
		if rcv := recover(); rcv != nil {
			slog.ErrorContext(r.Context(), "CRITICAL PANIC in worker for job", slog.String("job_id", jobIdStr), slog.Any("panic", rcv))
			handleGlobalError(r.Context(), objID, fmt.Errorf("panic: %v", rcv), &job)
		}
	}()

	err = processJobExecution(r.Context(), objID, job)
	if err != nil {
		slog.ErrorContext(r.Context(), "Error during job execution", slog.String("job_id", jobIdStr), slog.Any("error", err))
		handleGlobalError(r.Context(), objID, err, &job)
	}

	w.WriteHeader(http.StatusOK)
}

// processJobExecution routes execution based on job type
func processJobExecution(ctx context.Context, objID primitive.ObjectID, job db.Job) error {
	if job.Type == "carousel" || job.Carousel != nil {
		return processCarouselJobExecution(ctx, objID, job)
	}
	return processBatchJobExecution(ctx, objID, job)
}

// processBatchJobExecution performs the sequential rendering of batch requests
func processBatchJobExecution(ctx context.Context, objID primitive.ObjectID, job db.Job) error {
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
			slog.InfoContext(ctx, "Skipping already finalized image result", slog.String("job_id", objID.Hex()), slog.Int("index", i))
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

				// Store success metric into bounded in-memory buffer
				contrastRatio, _ := services.GetContrastRatio(currentRequest.BackgroundColor, currentRequest.TextColor)
				wcagLevel := services.GetWCAGLevel(contrastRatio)

				var subLen int
				if currentRequest.Subtitle != nil {
					subLen = len(*currentRequest.Subtitle)
				}

				storeMetric(db.Metric{
					Event:          EventImageGenerated,
					Timestamp:      time.Now().UTC(),
					Status:         "success",
					Size:           &db.SizePreset{Width: currentRequest.Width, Height: currentRequest.Height},
					Font:           string(currentRequest.Font),
					HasBorder:      currentRequest.HasBorder,
					TitleLength:    intPtr(len(currentRequest.Title)),
					SubtitleLength: intPtr(subLen),
					ContrastRatio:  floatPtr(contrastRatio),
					WcagLevel:      wcagLevel,
					Duration:       intPtr(durationMs),
				})
				break
			} else {
				lastError = err
				slog.WarnContext(ctx, "Image render attempt failed",
					slog.Int("attempt", attempt),
					slog.String("job_id", objID.Hex()),
					slog.Int("index", i),
					slog.Any("error", err),
				)
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

			// Store error metric into bounded in-memory buffer
			contrastRatio, _ := services.GetContrastRatio(currentRequest.BackgroundColor, currentRequest.TextColor)
			wcagLevel := services.GetWCAGLevel(contrastRatio)

			var subLen int
			if currentRequest.Subtitle != nil {
				subLen = len(*currentRequest.Subtitle)
			}

			storeMetric(db.Metric{
				Event:          EventImageGenerated,
				Timestamp:      time.Now().UTC(),
				Status:         "error",
				ErrorMessage:   errMsg,
				Size:           &db.SizePreset{Width: currentRequest.Width, Height: currentRequest.Height},
				Font:           string(currentRequest.Font),
				HasBorder:      currentRequest.HasBorder,
				TitleLength:    intPtr(len(currentRequest.Title)),
				SubtitleLength: intPtr(subLen),
				ContrastRatio:  floatPtr(contrastRatio),
				WcagLevel:      wcagLevel,
				Duration:       intPtr(durationMs),
			})
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

		saveCtx, saveCancel := context.WithTimeout(ctx, 5*time.Second)
		_, err = collection.UpdateOne(saveCtx, bson.M{"_id": objID}, updateQuery)
		saveCancel()
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

	finalCtx, finalCancel := context.WithTimeout(ctx, 5*time.Second)
	_, err := collection.UpdateOne(finalCtx, bson.M{"_id": objID}, updateFinal)
	finalCancel()
	if err != nil {
		return fmt.Errorf("failed to finalize job document: %w", err)
	}

	slog.InfoContext(ctx, "Batch job finalized",
		slog.String("job_id", objID.Hex()),
		slog.Int("processed_count", processedCount),
		slog.String("status", finalStatus),
	)
	return nil
}

// processCarouselJobExecution performs sequential slide rendering and PDF compilation for carousel jobs
func processCarouselJobExecution(ctx context.Context, objID primitive.ObjectID, job db.Job) error {
	collection := db.MongoClient.Database("cover-craft").Collection("jobs")

	var carousel services.CarouselParams
	if job.Carousel != nil {
		if cp, ok := job.Carousel.(services.CarouselParams); ok {
			carousel = cp
		} else if cpp, ok := job.Carousel.(*services.CarouselParams); ok && cpp != nil {
			carousel = *cpp
		} else {
			bsonBytes, err := bson.Marshal(job.Carousel)
			if err != nil {
				return fmt.Errorf("failed to marshal carousel payload: %w", err)
			}
			if err := bson.Unmarshal(bsonBytes, &carousel); err != nil {
				return fmt.Errorf("failed to unmarshal carousel parameters: %w", err)
			}
		}
	} else if len(job.Requests) > 0 {
		bsonBytes, err := bson.Marshal(job.Requests[0])
		if err != nil {
			return fmt.Errorf("failed to marshal carousel request: %w", err)
		}
		if err := bson.Unmarshal(bsonBytes, &carousel); err != nil {
			return fmt.Errorf("failed to parse carousel parameters: %w", err)
		}
	} else {
		return fmt.Errorf("job %s contains no carousel parameters", objID.Hex())
	}

	resultDetails := make(map[string]db.JobResult)
	if job.ResultDetails != nil {
		for k, v := range job.ResultDetails {
			resultDetails[k] = v
		}
	}

	slidePNGs := make([][]byte, len(carousel.Slides))

	for i := 0; i < len(carousel.Slides); i++ {
		idxStr := fmt.Sprintf("%d", i)

		// Check if already rendered and succeeded
		if det, exists := resultDetails[idxStr]; exists && det.Status == "success" {
			slog.InfoContext(ctx, "Re-rendering cached slide to extract buffer for PDF", slog.String("job_id", objID.Hex()), slog.Int("index", i))
			pngBytes, err := services.GenerateCarouselSlidePNG(carousel, i)
			if err == nil {
				slidePNGs[i] = pngBytes
			}
			continue
		}

		var lastError error
		var detail *db.JobResult

		for attempt := 1; attempt <= 3; attempt++ {
			pngBytes, err := services.GenerateCarouselSlidePNG(carousel, i)
			if err == nil {
				slidePNGs[i] = pngBytes
				base64Data := fmt.Sprintf("data:image/png;base64,%s", base64.StdEncoding.EncodeToString(pngBytes))
				detail = &db.JobResult{
					Index:     i,
					Status:    "success",
					DataURL:   base64Data,
					Attempts:  attempt,
					UpdatedAt: time.Now().UTC(),
				}
				break
			} else {
				lastError = err
				slog.WarnContext(ctx, "Carousel slide render attempt failed",
					slog.Int("attempt", attempt),
					slog.String("job_id", objID.Hex()),
					slog.Int("index", i),
					slog.Any("error", err),
				)
				if attempt < 3 {
					delay := 250 * (1 << uint(attempt-1))
					jitter := rand.Intn(101)
					time.Sleep(time.Duration(delay+jitter) * time.Millisecond)
				}
			}
		}

		if detail == nil {
			errMsg := "Failed to render carousel slide"
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
		}

		resultDetails[idxStr] = *detail

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

		saveCtx, saveCancel := context.WithTimeout(ctx, 5*time.Second)
		_, err := collection.UpdateOne(saveCtx, bson.M{"_id": objID}, updateQuery)
		saveCancel()
		if err != nil {
			return fmt.Errorf("failed to save intermediate carousel slide result at index %d: %w", i, err)
		}
	}

	// Verify all slides rendered successfully
	allSlidesSuccess := true
	for j := 0; j < len(carousel.Slides); j++ {
		idxStr := fmt.Sprintf("%d", j)
		if det, ok := resultDetails[idxStr]; !ok || det.Status != "success" || len(slidePNGs[j]) == 0 {
			allSlidesSuccess = false
			break
		}
	}

	var pdfDataURL string
	var pdfCompileErr error

	if allSlidesSuccess {
		pdfBytes, err := services.CompilePDF(carousel.Width, carousel.Height, slidePNGs)
		if err != nil {
			pdfCompileErr = fmt.Errorf("failed to compile carousel PDF: %w", err)
			slog.ErrorContext(ctx, "Failed to compile carousel PDF",
				slog.String("job_id", objID.Hex()),
				slog.Any("error", err),
			)
		} else {
			pdfDataURL = fmt.Sprintf("data:application/pdf;base64,%s", base64.StdEncoding.EncodeToString(pdfBytes))
		}
	}

	var finalStatus string
	if allSlidesSuccess && pdfCompileErr == nil {
		finalStatus = "completed"
	} else {
		finalStatus = "failed"
	}

	updateFinal := bson.M{
		"$set": bson.M{
			"status":  finalStatus,
			"results": getFinalResultsMap(resultDetails, len(carousel.Slides)),
		},
	}

	if pdfDataURL != "" {
		updateFinal["$set"].(bson.M)["pdfUrl"] = pdfDataURL
	}

	unsetFields := bson.M{"processingStartedAt": ""}
	if finalStatus == "completed" {
		unsetFields["error"] = ""
		unsetFields["lastError"] = ""
	} else {
		finalError := "One or more carousel slides failed to render."
		if pdfCompileErr != nil {
			finalError = pdfCompileErr.Error()
		}
		updateFinal["$set"].(bson.M)["error"] = finalError
		updateFinal["$set"].(bson.M)["lastError"] = finalError
	}
	updateFinal["$unset"] = unsetFields

	finalCtx, finalCancel := context.WithTimeout(ctx, 5*time.Second)
	_, err := collection.UpdateOne(finalCtx, bson.M{"_id": objID}, updateFinal)
	finalCancel()
	if err != nil {
		return fmt.Errorf("failed to finalize carousel job document: %w", err)
	}

	slog.InfoContext(ctx, "Carousel job finalized",
		slog.String("job_id", objID.Hex()),
		slog.Int("total_slides", len(carousel.Slides)),
		slog.String("status", finalStatus),
	)
	return nil
}

// handleGlobalError recovers the Job status from failures and schedules queue retries
func handleGlobalError(ctx context.Context, objID primitive.ObjectID, globalErr error, job *db.Job) {
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
		updateCtx, updateCancel := context.WithTimeout(ctx, 5*time.Second)
		_, _ = collection.UpdateOne(updateCtx, bson.M{"_id": objID}, bson.M{
			"$set": bson.M{
				"status":    "pending",
				"lastError": errorMessage,
			},
			"$unset": bson.M{"processingStartedAt": ""},
		})
		updateCancel()

		if queue.QueueClientService != nil {
			enqueueCtx, enqueueCancel := context.WithTimeout(ctx, 5*time.Second)
			corrID := middleware.GetCorrelationID(ctx)
			msgBytes, _ := json.Marshal(QueueJobMessage{
				JobID:         objID.Hex(),
				CorrelationID: corrID,
			})
			_ = queue.QueueClientService.EnqueueJobWithDelay(enqueueCtx, string(msgBytes), 30)
			enqueueCancel()
		}
		return
	}

	failCtx, failCancel := context.WithTimeout(ctx, 5*time.Second)
	_, _ = collection.UpdateOne(failCtx, bson.M{"_id": objID}, bson.M{
		"$set": bson.M{
			"status":    "failed",
			"error":     errorMessage,
			"lastError": errorMessage,
		},
		"$unset": bson.M{"processingStartedAt": ""},
	})
	failCancel()
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
