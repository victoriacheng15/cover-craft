package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthHandler(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		wantStatus int
	}{
		{
			name:       "GET request succeeds",
			method:     http.MethodGet,
			wantStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req, err := http.NewRequest(tt.method, "/api/health", nil)
			if err != nil {
				t.Fatal(err)
			}

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(HealthHandler)
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.wantStatus {
				t.Errorf("HealthHandler() returned wrong status: got %v, want %v", status, tt.wantStatus)
			}

			var resp HealthResponse
			if err := json.NewDecoder(rr.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode health check response: %v", err)
			}

			if resp.Data.IsoTime == "" {
				t.Errorf("HealthHandler() returned empty isoTime")
			}
			if resp.Data.LocalTime == "" {
				t.Errorf("HealthHandler() returned empty localTime")
			}
		})
	}
}
