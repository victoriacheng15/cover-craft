package middleware

import (
	"bytes"
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCorrelationIDMiddleware(t *testing.T) {
	t.Run("generates correlation ID when header is absent", func(t *testing.T) {
		var capturedID string
		handler := CorrelationID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedID = GetCorrelationID(r.Context())
			w.WriteHeader(http.StatusOK)
		}))

		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if capturedID == "" {
			t.Fatal("expected generated correlation ID, got empty string")
		}
		if rec.Header().Get(CorrelationIDHeader) != capturedID {
			t.Errorf("header %q = %q; want %q", CorrelationIDHeader, rec.Header().Get(CorrelationIDHeader), capturedID)
		}
	})

	t.Run("preserves incoming correlation ID header", func(t *testing.T) {
		incomingID := "custom-correlation-id-123"
		var capturedID string
		handler := CorrelationID(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			capturedID = GetCorrelationID(r.Context())
			w.WriteHeader(http.StatusOK)
		}))

		req := httptest.NewRequest(http.MethodGet, "/test", nil)
		req.Header.Set(CorrelationIDHeader, incomingID)
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		if capturedID != incomingID {
			t.Errorf("captured ID = %q; want %q", capturedID, incomingID)
		}
		if rec.Header().Get(CorrelationIDHeader) != incomingID {
			t.Errorf("response header = %q; want %q", rec.Header().Get(CorrelationIDHeader), incomingID)
		}
	})
}

func TestContextHandler(t *testing.T) {
	var buf bytes.Buffer
	baseHandler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelInfo})
	wrappedHandler := NewContextHandler(baseHandler)
	logger := slog.New(wrappedHandler)

	ctx := WithCorrelationID(context.Background(), "test-corr-456")
	logger.InfoContext(ctx, "test log message", slog.String("action", "generate"))

	var logData map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &logData); err != nil {
		t.Fatalf("failed to parse log JSON: %v", err)
	}

	if logData["correlation_id"] != "test-corr-456" {
		t.Errorf("correlation_id = %v; want %q", logData["correlation_id"], "test-corr-456")
	}
	if logData["action"] != "generate" {
		t.Errorf("action = %v; want %q", logData["action"], "generate")
	}
	if logData["msg"] != "test log message" {
		t.Errorf("msg = %v; want %q", logData["msg"], "test log message")
	}
}
