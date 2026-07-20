package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
)

func TestMetricsHandler_Rejections(t *testing.T) {
	// 1. Method not allowed
	req, _ := http.NewRequest(http.MethodGet, "/api/metrics", nil)
	rr := httptest.NewRecorder()
	MetricsHandler(rr, req)
	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status 405, got %d", rr.Code)
	}

	// 2. Invalid JSON format
	req, _ = http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBufferString("invalid-json"))
	rr = httptest.NewRecorder()
	MetricsHandler(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rr.Code)
	}

	// 3. Missing event name
	badPayload1 := map[string]interface{}{
		"timestamp": time.Now().UTC(),
	}
	bodyBytes, _ := json.Marshal(badPayload1)
	req, _ = http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBuffer(bodyBytes))
	rr = httptest.NewRecorder()
	MetricsHandler(rr, req)
	if rr.Code != http.StatusBadRequest {
		t.Errorf("expected status 400, got %d", rr.Code)
	}

	// 4. Database client not connected
	db.MongoClient = nil
	goodPayload := map[string]interface{}{
		"event":     "test_event",
		"timestamp": time.Now().UTC(),
	}
	bodyBytes, _ = json.Marshal(goodPayload)
	req, _ = http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBuffer(bodyBytes))
	rr = httptest.NewRecorder()
	MetricsHandler(rr, req)
	if rr.Code != http.StatusInternalServerError {
		t.Errorf("expected status 500, got %d", rr.Code)
	}
}

func TestMetricsHandler_Integration(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping metrics integration test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("skipping metrics integration test: failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()

	collection := client.Database("cover-craft").Collection("metrics")

	testEventName := "unit_test_metric_cleanup_marker"
	payload := map[string]interface{}{
		"event":     testEventName,
		"timestamp": time.Now().UTC(),
	}
	bodyBytes, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, "/api/metrics", bytes.NewBuffer(bodyBytes))
	rr := httptest.NewRecorder()
	MetricsHandler(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	// Clean up the created test metric document from database
	_, _ = collection.DeleteMany(ctx, bson.M{"event": testEventName})
}
