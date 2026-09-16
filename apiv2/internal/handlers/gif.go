package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

// GenerateGifHandler processes animated GIF generation requests
func GenerateGifHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed"})
		return
	}

	bodyBytes, err := io.ReadAll(r.Body)
	if err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to read request body"})
		return
	}

	var params services.GifParams
	if err := json.Unmarshal(bodyBytes, &params); err != nil {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid JSON body"})
		return
	}

	// Default delay if omitted
	if params.DelayMs == nil {
		defaultDelay := services.GifParamsDelayMs(1500)
		params.DelayMs = &defaultDelay
	}

	// Format filename
	filename := "slideshow"
	if params.Filename != nil && strings.TrimSpace(*params.Filename) != "" {
		filename = strings.TrimSpace(*params.Filename)
	}

	// Validate parameters
	validationErrors := services.ValidateGifParams(params)
	if len(validationErrors) > 0 {
		slog.WarnContext(r.Context(), "Validation failed for GIF generation parameters", slog.Any("errors", validationErrors))

		storeMetric(db.Metric{
			Event:        "gif_generated",
			Timestamp:    time.Now().UTC(),
			Status:       "validation_error",
			ErrorMessage: fmt.Sprintf("Validation failed: %d errors", len(validationErrors)),
			Size:         &db.SizePreset{Width: params.Width, Height: params.Height},
		})

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":   "Validation failed",
			"details": validationErrors,
		})
		return
	}

	// Generate GIF and measure duration
	startTime := time.Now()
	gifBytes, err := services.GenerateGIF(params)
	duration := int(time.Since(startTime).Milliseconds())

	if err != nil {
		slog.ErrorContext(r.Context(), "Error generating animated GIF", slog.Any("error", err))

		storeMetric(db.Metric{
			Event:        "gif_generated",
			Timestamp:    time.Now().UTC(),
			Status:       "error",
			ErrorMessage: err.Error(),
			Size:         &db.SizePreset{Width: params.Width, Height: params.Height},
			Duration:     intPtr(duration),
		})

		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Generation-Duration", strconv.Itoa(duration))
		w.Header().Set("Server-Timing", fmt.Sprintf("generation;dur=%d", duration))
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{
			Error: "Internal server error",
		})
		return
	}

	// Store Success Metric
	storeMetric(db.Metric{
		Event:     "gif_generated",
		Timestamp: time.Now().UTC(),
		Status:    "success",
		Size:      &db.SizePreset{Width: params.Width, Height: params.Height},
		Duration:  intPtr(duration),
	})

	slog.InfoContext(r.Context(), "Animated GIF generated successfully",
		slog.String("filename", filename),
		slog.Int("slides_count", len(params.Slides)),
		slog.Int("duration_ms", duration),
	)

	// Return GIF output
	w.Header().Set("Content-Type", "image/gif")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s-%d.gif\"", filename, time.Now().Unix()))
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Server-Timing", fmt.Sprintf("generation;dur=%d", duration))
	w.Header().Set("X-Generation-Duration", strconv.Itoa(duration))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(gifBytes)
}
