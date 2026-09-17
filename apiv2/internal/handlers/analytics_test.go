package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
)

func TestAnalyticsHandler_Rejections(t *testing.T) {
	// 1. Method not allowed
	req, _ := http.NewRequest(http.MethodPost, "/api/analytics", nil)
	rr := httptest.NewRecorder()
	AnalyticsHandler(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status 405, got %d", rr.Code)
	}

	// 2. Database client not connected
	db.MongoClient = nil
	req, _ = http.NewRequest(http.MethodGet, "/api/analytics", nil)
	rr = httptest.NewRecorder()
	AnalyticsHandler(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", rr.Code)
	}
}

func TestAnalyticsHandler_Integration(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping analytics integration test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("skipping analytics integration test: failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()

	req, _ := http.NewRequest(http.MethodGet, "/api/analytics", nil)
	rr := httptest.NewRecorder()
	AnalyticsHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}
}

func TestCalculatePercentile(t *testing.T) {
	// Empty slice
	if p := calculatePercentile(nil, 0.5); p != 0.0 {
		t.Errorf("expected 0.0 for empty slice, got %f", p)
	}

	// Normal slice
	durations := []float64{10, 20, 30, 40, 50, 60, 70, 80, 90, 100}
	p50 := calculatePercentile(durations, 0.5)
	if p50 != 60 {
		t.Errorf("expected 60 for p50, got %f", p50)
	}
	p95 := calculatePercentile(durations, 0.95)
	if p95 != 100 {
		t.Errorf("expected 100 for p95, got %f", p95)
	}
}
