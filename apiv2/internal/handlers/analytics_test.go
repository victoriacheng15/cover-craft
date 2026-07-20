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
