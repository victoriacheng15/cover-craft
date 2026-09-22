package handlers

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/middleware"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/queue"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

// GenerateCarouselHandler handles carousel generation job submission (POST /api/generateCarousel).
//
// Workflow:
//  1. Validates HTTP method is POST.
//  2. Decodes and validates incoming CarouselParams (slide count, dimensions, WCAG AA compliance).
//  3. Provisions a pending Job record in MongoDB.
//  4. Enqueues the Job ID to Azure Queue Storage for asynchronous background processing.
//  5. Returns HTTP 202 (Accepted) with the Job ID for client status polling.
func GenerateCarouselHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var params services.CarouselParams
	err := json.NewDecoder(r.Body).Decode(&params)
	if err != nil {
		writeJSONError(w, "Payload must be a valid carousel configuration.", http.StatusBadRequest)
		return
	}

	// 1. Perform validation checks
	validationErrors := services.ValidateCarouselParams(params)
	if len(validationErrors) > 0 {
		slog.WarnContext(r.Context(), "Carousel validation failed", slog.Int("error_count", len(validationErrors)))

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

	job := db.Job{
		ID:            jobId,
		Type:          "carousel",
		Status:        "pending",
		Carousel:      params,
		Results:       []string{},
		Attempts:      0,
		MaxAttempts:   3,
		ResultDetails: make(map[string]db.JobResult),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	if db.MongoClient != nil {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		_, err = db.MongoClient.Database("cover-craft").Collection("jobs").InsertOne(ctx, job)
		cancel()
		if err != nil {
			slog.ErrorContext(r.Context(), "Failed to insert carousel job into MongoDB",
				slog.Any("error", err),
				slog.String("job_id", jobId.Hex()),
			)
			writeJSONError(w, "Failed to provision carousel job", http.StatusInternalServerError)
			return
		}
	} else {
		slog.WarnContext(r.Context(), "MongoDB client not configured. Proceeding without database.")
	}

	// 3. Connect to Azure Queue Storage and publish Job ID and correlation ID
	if queue.QueueClientService != nil {
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		corrID := middleware.GetCorrelationID(r.Context())
		msgBytes, _ := json.Marshal(QueueJobMessage{
			JobID:         jobId.Hex(),
			CorrelationID: corrID,
		})
		err = queue.QueueClientService.EnqueueJob(ctx, string(msgBytes))
		cancel()
		if err != nil {
			slog.ErrorContext(r.Context(), "Failed to enqueue carousel job message in Queue",
				slog.Any("error", err),
				slog.String("job_id", jobId.Hex()),
			)
			writeJSONError(w, "Failed to enqueue carousel job task", http.StatusInternalServerError)
			return
		}
	} else {
		slog.WarnContext(r.Context(), "Queue service not configured. Proceeding without enqueuing task.")
	}

	slog.InfoContext(r.Context(), "Carousel job accepted for processing",
		slog.String("job_id", jobId.Hex()),
		slog.Int("total_slides", len(params.Slides)),
	)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusAccepted)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Carousel job accepted for processing.",
		"id":      jobId.Hex(),
		"jobId":   jobId.Hex(),
	})
}
