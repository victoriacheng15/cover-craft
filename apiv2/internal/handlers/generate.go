package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

// GenerateImageHandler processes image drawing requests
func GenerateImageHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed"})
		return
	}

	var bodyText string
	if r.Method == http.MethodPost && r.Body != nil {
		if bodyBytes, err := io.ReadAll(r.Body); err == nil {
			bodyText = string(bodyBytes)
		}
	}

	// 1. Extract and merge parameters
	extracted := extractParams(r, bodyText)

	// 2. Format filename
	filename := extracted.Filename
	if strings.TrimSpace(filename) == "" {
		filename = fmt.Sprintf("cover-%d.png", time.Now().Unix())
	}

	params := services.ImageParams{
		Width:           extracted.Width,
		Height:          extracted.Height,
		BackgroundColor: extracted.BackgroundColor,
		TextColor:       extracted.TextColor,
		Font:            extracted.Font,
		Title:           extracted.Title,
		Subtitle:        extracted.Subtitle,
	}

	// Calculate contrast ratio for metrics
	contrastRatio, _ := services.GetContrastRatio(params.BackgroundColor, params.TextColor)
	wcagLevel := services.GetWCAGLevel(contrastRatio)

	// 3. Validate parameters
	validationErrors := services.ValidateImageParams(params)
	if len(validationErrors) > 0 {
		log.Printf("Validation failed for image generation parameters: %v", validationErrors)

		// Record validation error metric to MongoDB
		go storeMetric(db.Metric{
			Event:          "image_generated",
			Timestamp:      time.Now().UTC(),
			Status:         "validation_error",
			ErrorMessage:   fmt.Sprintf("Validation failed: %d errors", len(validationErrors)),
			Size:           &db.SizePreset{Width: params.Width, Height: params.Height},
			Font:           params.Font,
			TitleLength:    intPtr(len(params.Title)),
			SubtitleLength: intPtr(len(params.Subtitle)),
			ContrastRatio:  floatPtr(contrastRatio),
			WcagLevel:      wcagLevel,
		})

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"error":   "Validation failed",
			"details": validationErrors,
		})
		return
	}

	// 4. Generate Image and Track performance
	startTime := time.Now()
	pngBytes, err := services.GeneratePNG(params)
	duration := int(time.Since(startTime).Milliseconds())

	if err != nil {
		log.Printf("Error generating cover image: %v", err)

		// Record error metric to MongoDB
		go storeMetric(db.Metric{
			Event:          "image_generated",
			Timestamp:      time.Now().UTC(),
			Status:         "error",
			ErrorMessage:   err.Error(),
			Size:           &db.SizePreset{Width: params.Width, Height: params.Height},
			Font:           params.Font,
			TitleLength:    intPtr(len(params.Title)),
			SubtitleLength: intPtr(len(params.Subtitle)),
			ContrastRatio:  floatPtr(contrastRatio),
			WcagLevel:      wcagLevel,
			Duration:       intPtr(duration),
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

	// 5. Store Success Metric
	go storeMetric(db.Metric{
		Event:          "image_generated",
		Timestamp:      time.Now().UTC(),
		Status:         "success",
		Size:           &db.SizePreset{Width: params.Width, Height: params.Height},
		Font:           params.Font,
		TitleLength:    intPtr(len(params.Title)),
		SubtitleLength: intPtr(len(params.Subtitle)),
		ContrastRatio:  floatPtr(contrastRatio),
		WcagLevel:      wcagLevel,
		Duration:       intPtr(duration),
	})

	// 6. Return PNG output
	w.Header().Set("Content-Type", "image/png")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s-%d.png\"", filename, time.Now().Unix()))
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Server-Timing", fmt.Sprintf("generation;dur=%d", duration))
	w.Header().Set("X-Generation-Duration", strconv.Itoa(duration))
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(pngBytes)
}

type extractedParams struct {
	Width           int
	Height          int
	BackgroundColor string
	TextColor       string
	Font            string
	Title           string
	Subtitle        string
	Filename        string
}

// extractParams extracts parameters from query parameters and falls back to JSON body values
func extractParams(r *http.Request, body string) extractedParams {
	var params extractedParams

	// Try parsing body JSON first
	var bodyParams struct {
		Width           *int   `json:"width"`
		Height          *int   `json:"height"`
		BackgroundColor string `json:"backgroundColor"`
		TextColor       string `json:"textColor"`
		Font            string `json:"font"`
		Title           string `json:"title"`
		Subtitle        string `json:"subtitle"`
		Filename        string `json:"filename"`
	}
	if body != "" {
		if err := json.Unmarshal([]byte(body), &bodyParams); err != nil {
			log.Printf("Request body contained invalid JSON, falling back to query parameters: %v", err)
		}
	}

	// 1. Width extraction
	qWidth := r.URL.Query().Get("width")
	if qWidth != "" {
		if val, err := strconv.Atoi(qWidth); err == nil {
			params.Width = val
		}
	} else if bodyParams.Width != nil {
		params.Width = *bodyParams.Width
	}

	// 2. Height extraction
	qHeight := r.URL.Query().Get("height")
	if qHeight != "" {
		if val, err := strconv.Atoi(qHeight); err == nil {
			params.Height = val
		}
	} else if bodyParams.Height != nil {
		params.Height = *bodyParams.Height
	}

	// 3. String extractions with fallback
	params.BackgroundColor = getParamWithFallback(r.URL.Query().Get("backgroundColor"), bodyParams.BackgroundColor)
	params.TextColor = getParamWithFallback(r.URL.Query().Get("textColor"), bodyParams.TextColor)
	params.Font = getParamWithFallback(r.URL.Query().Get("font"), bodyParams.Font)
	params.Title = getParamWithFallback(r.URL.Query().Get("title"), bodyParams.Title)
	params.Subtitle = getParamWithFallback(r.URL.Query().Get("subtitle"), bodyParams.Subtitle)
	params.Filename = getParamWithFallback(r.URL.Query().Get("filename"), bodyParams.Filename)

	return params
}

func getParamWithFallback(queryVal, bodyVal string) string {
	if queryVal != "" {
		return queryVal
	}
	return bodyVal
}

func storeMetric(metric db.Metric) {
	if db.MongoClient == nil {
		return
	}
	coll := db.MongoClient.Database("cover-craft").Collection("metrics")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = coll.InsertOne(ctx, metric)
}

func intPtr(v int) *int {
	return &v
}

func floatPtr(v float64) *float64 {
	return &v
}
