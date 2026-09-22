package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/queue"
)

func TestGenerateCarouselHandler(t *testing.T) {
	origMongo := db.MongoClient
	origQueue := queue.QueueClientService
	db.MongoClient = nil
	queue.QueueClientService = nil
	defer func() {
		db.MongoClient = origMongo
		queue.QueueClientService = origQueue
	}()

	sub1 := "Intro"
	sub2 := "Details"
	validCarouselJSON := `{
		"width": 1080,
		"height": 1080,
		"backgroundColor": "#000000",
		"textColor": "#ffffff",
		"font": "Montserrat",
		"slides": [
			{"title": "Slide 1", "subtitle": "` + sub1 + `"},
			{"title": "Slide 2", "subtitle": "` + sub2 + `"}
		]
	}`

	invalidValidationJSON := `{
		"width": 1080,
		"height": 1080,
		"backgroundColor": "#ffffff",
		"textColor": "#ffffff",
		"font": "Montserrat",
		"slides": [
			{"title": "Slide 1"}
		]
	}`

	tests := []struct {
		name           string
		method         string
		body           string
		wantStatusCode int
		wantErrorMsg   string
		checkAccepted  bool
	}{
		{
			name:           "Valid carousel request returns 202 Accepted",
			method:         http.MethodPost,
			body:           validCarouselJSON,
			wantStatusCode: http.StatusAccepted,
			checkAccepted:  true,
		},
		{
			name:           "Validation failure returns 400 Bad Request",
			method:         http.MethodPost,
			body:           invalidValidationJSON,
			wantStatusCode: http.StatusBadRequest,
			wantErrorMsg:   "Validation failed",
		},
		{
			name:           "Malformed JSON returns 400 Bad Request",
			method:         http.MethodPost,
			body:           "not-json",
			wantStatusCode: http.StatusBadRequest,
			wantErrorMsg:   "Payload must be a valid carousel configuration.",
		},
		{
			name:           "GET request returns 405 Method Not Allowed",
			method:         http.MethodGet,
			body:           "",
			wantStatusCode: http.StatusMethodNotAllowed,
			wantErrorMsg:   "Method not allowed",
		},
		{
			name:           "PUT request returns 405 Method Not Allowed",
			method:         http.MethodPut,
			body:           `{}`,
			wantStatusCode: http.StatusMethodNotAllowed,
			wantErrorMsg:   "Method not allowed",
		},
		{
			name:           "DELETE request returns 405 Method Not Allowed",
			method:         http.MethodDelete,
			body:           "",
			wantStatusCode: http.StatusMethodNotAllowed,
			wantErrorMsg:   "Method not allowed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var bodyReader *strings.Reader
			if tt.body != "" {
				bodyReader = strings.NewReader(tt.body)
			} else {
				bodyReader = strings.NewReader("")
			}

			req := httptest.NewRequest(tt.method, "/api/generateCarousel", bodyReader)
			rr := httptest.NewRecorder()

			GenerateCarouselHandler(rr, req)

			if rr.Code != tt.wantStatusCode {
				t.Errorf("GenerateCarouselHandler() status = %d, want %d", rr.Code, tt.wantStatusCode)
			}

			contentType := rr.Header().Get("Content-Type")
			if !strings.HasPrefix(contentType, "application/json") {
				t.Errorf("GenerateCarouselHandler() Content-Type = %q, want application/json", contentType)
			}

			if tt.checkAccepted {
				var resp map[string]interface{}
				if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
					t.Fatalf("Failed to decode response body as JSON: %v", err)
				}
				if resp["message"] != "Carousel job accepted for processing." {
					t.Errorf("unexpected message: %v", resp["message"])
				}
				if resp["id"] == nil || resp["jobId"] == nil {
					t.Errorf("expected id and jobId in response, got %v", resp)
				}
			} else if tt.wantErrorMsg != "" {
				var resp map[string]interface{}
				if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
					t.Fatalf("Failed to decode response body as JSON: %v", err)
				}
				if resp["error"] != tt.wantErrorMsg {
					t.Errorf("GenerateCarouselHandler() error = %v, want %q", resp["error"], tt.wantErrorMsg)
				}
			}
		})
	}
}
