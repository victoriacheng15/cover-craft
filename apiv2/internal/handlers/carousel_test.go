package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestGenerateCarouselHandler(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		body           string
		wantStatusCode int
		wantErrorMsg   string
	}{
		{
			name:           "POST request returns 501 Not Implemented",
			method:         http.MethodPost,
			body:           `{"title":"Test Carousel"}`,
			wantStatusCode: http.StatusNotImplemented,
			wantErrorMsg:   "Carousel generation endpoint is not yet implemented",
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

			var resp ErrorResponse
			if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
				t.Fatalf("Failed to decode response body as JSON: %v", err)
			}

			if resp.Error != tt.wantErrorMsg {
				t.Errorf("GenerateCarouselHandler() error message = %q, want %q", resp.Error, tt.wantErrorMsg)
			}
		})
	}
}
