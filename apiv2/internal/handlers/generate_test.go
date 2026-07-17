package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

func TestGenerateImageHandler(t *testing.T) {
	tests := []struct {
		name            string
		method          string
		url             string
		body            interface{}
		wantStatus      int
		expectImage     bool
		wantDetailField string
	}{
		{
			name:        "GET request with query params succeeds",
			method:      http.MethodGet,
			url:         "/api/generateImage?width=800&height=600&backgroundColor=%23ffffff&textColor=%23000000&font=Montserrat&title=Test+Title",
			body:        nil,
			wantStatus:  http.StatusOK,
			expectImage: true,
		},
		{
			name:   "POST request with JSON body succeeds",
			method: http.MethodPost,
			url:    "/api/generateImage",
			body: map[string]interface{}{
				"width":           1080,
				"height":          1080,
				"backgroundColor": "#ffffff",
				"textColor":       "#000000",
				"font":            "Roboto",
				"title":           "Test Title",
				"subtitle":        "Sub",
				"filename":        "custom-name",
			},
			wantStatus:  http.StatusOK,
			expectImage: true,
		},
		{
			name:   "Validation failure - width too small",
			method: http.MethodPost,
			url:    "/api/generateImage",
			body: map[string]interface{}{
				"width":           0,
				"height":          400,
				"backgroundColor": "#ffffff",
				"textColor":       "#000000",
				"font":            "Montserrat",
				"title":           "Bad Width",
			},
			wantStatus:      http.StatusBadRequest,
			wantDetailField: "width",
		},
		{
			name:   "Validation failure - invalid font",
			method: http.MethodPost,
			url:    "/api/generateImage",
			body: map[string]interface{}{
				"width":           800,
				"height":          600,
				"backgroundColor": "#ffffff",
				"textColor":       "#000000",
				"font":            "Comic Sans",
				"title":           "Bad Font",
			},
			wantStatus:      http.StatusBadRequest,
			wantDetailField: "font",
		},
		{
			name:   "Validation failure - poor contrast ratio",
			method: http.MethodPost,
			url:    "/api/generateImage",
			body: map[string]interface{}{
				"width":           800,
				"height":          600,
				"backgroundColor": "#ffffff",
				"textColor":       "#ffff00", // Yellow text on white background (contrast FAIL)
				"font":            "Montserrat",
				"title":           "Poor Contrast",
			},
			wantStatus:      http.StatusBadRequest,
			wantDetailField: "contrast",
		},
		{
			name:        "Disallowed method PUT returns 405",
			method:      http.MethodPut,
			url:         "/api/generateImage",
			body:        nil,
			wantStatus:  http.StatusMethodNotAllowed,
			expectImage: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var reqBody io.Reader
			if tt.body != nil {
				jsonBytes, err := json.Marshal(tt.body)
				if err != nil {
					t.Fatalf("failed to marshal request body: %v", err)
				}
				reqBody = bytes.NewBuffer(jsonBytes)
			}

			req, err := http.NewRequest(tt.method, tt.url, reqBody)
			if err != nil {
				t.Fatal(err)
			}
			if tt.body != nil {
				req.Header.Set("Content-Type", "application/json")
			}

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(GenerateImageHandler)
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.wantStatus {
				t.Errorf("GenerateImageHandler() returned wrong status: got %v, want %v. Body: %s", status, tt.wantStatus, rr.Body.String())
			}

			if tt.expectImage {
				contentType := rr.Header().Get("Content-Type")
				if contentType != "image/png" {
					t.Errorf("expected Content-Type image/png, got %s", contentType)
				}
			}

			if tt.wantDetailField != "" {
				var resp struct {
					Error   string                     `json:"error"`
					Details []services.ValidationError `json:"details"`
				}
				if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
					t.Fatalf("failed to decode error body: %v", err)
				}

				foundField := false
				for _, detail := range resp.Details {
					if detail.Field == tt.wantDetailField {
						foundField = true
						break
					}
				}

				if !foundField {
					t.Errorf("expected validation error for field %q, but details were: %+v", tt.wantDetailField, resp.Details)
				}
			}
		})
	}
}

func TestStoreMetric(t *testing.T) {
	// 1. Test when MongoClient is nil (covers early return)
	db.MongoClient = nil
	storeMetric(db.Metric{Event: "test"})

	// 2. Test when MongoClient is non-nil (covers database insertion path)
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		t.Skip("skipping Mongo client test: ", err)
	}

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()

	storeMetric(db.Metric{
		Event:     "image_generated",
		Timestamp: time.Now().UTC(),
		Status:    "success",
	})
}
