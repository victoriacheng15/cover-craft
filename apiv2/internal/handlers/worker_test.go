package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/queue"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

func TestProcessJobsHandler(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		body       interface{}
		setupMock  bool
		wantStatus int
	}{
		{
			name:       "Disallowed method GET returns 405",
			method:     http.MethodGet,
			body:       nil,
			setupMock:  true,
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "Invalid JSON payload returns 400",
			method:     http.MethodPost,
			body:       "bad-json-string",
			setupMock:  true,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "Missing myQueueItem returns 400",
			method: http.MethodPost,
			body: map[string]interface{}{
				"Data": map[string]interface{}{
					"unrelatedField": "123",
				},
			},
			setupMock:  true,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:   "Invalid Job ID hex format returns 200 (early exit for poison messages)",
			method: http.MethodPost,
			body: map[string]interface{}{
				"Data": map[string]interface{}{
					"myQueueItem": "invalid-hex-format",
				},
			},
			setupMock:  true,
			wantStatus: http.StatusOK,
		},
		{
			name:   "Nil database client returns 500",
			method: http.MethodPost,
			body: map[string]interface{}{
				"Data": map[string]interface{}{
					"myQueueItem": "65f6ba89e0239c7c00000001",
				},
			},
			setupMock:  false, // Database client is nil
			wantStatus: http.StatusInternalServerError,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.setupMock {
				ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
				defer cancel()
				client, _ := mongo.Connect(ctx, options.Client().ApplyURI("mongodb://localhost:27017"))
				db.MongoClient = client
			} else {
				db.MongoClient = nil
			}
			queue.QueueClientService = nil

			var reqBody io.Reader
			if tt.body != nil {
				jsonBytes, err := json.Marshal(tt.body)
				if err != nil {
					t.Fatalf("failed to marshal request body: %v", err)
				}
				reqBody = bytes.NewBuffer(jsonBytes)
			}

			req, err := http.NewRequest(tt.method, "/processJobs", reqBody)
			if err != nil {
				t.Fatal(err)
			}
			if tt.body != nil {
				req.Header.Set("Content-Type", "application/json")
			}

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(ProcessJobsHandler)
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.wantStatus {
				t.Errorf("ProcessJobsHandler() returned wrong status: got %v, want %v. Body: %s", status, tt.wantStatus, rr.Body.String())
			}
		})
	}
}

func TestProcessJobsIntegration(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping integration test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("skipping integration test: failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()
	queue.QueueClientService = nil

	collection := client.Database("cover-craft").Collection("jobs")

	jobId := primitive.NewObjectID()
	now := time.Now().UTC()
	job := db.Job{
		ID:     jobId,
		Status: "pending",
		Requests: []interface{}{
			services.ImageParams{
				Width:           400,
				Height:          300,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "Integration Test 1",
			},
			services.ImageParams{
				Width:           400,
				Height:          300,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "InvalidFontName", // Triggers rendering failure to test publicResultFromDetail error path
				Title:           "Integration Test 2",
			},
		},
		Results:       []string{},
		Attempts:      0,
		MaxAttempts:   3,
		ResultDetails: make(map[string]db.JobResult),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	_, err = collection.InsertOne(ctx, job)
	if err != nil {
		t.Fatalf("failed to insert test job: %v", err)
	}
	defer func() {
		ctxDel, cancelDel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancelDel()
		_, _ = collection.DeleteOne(ctxDel, bson.M{"_id": jobId})
	}()

	body := map[string]interface{}{
		"Data": map[string]interface{}{
			"myQueueItem": jobId.Hex(),
		},
	}
	jsonBytes, _ := json.Marshal(body)
	req, err := http.NewRequest(http.MethodPost, "/processJobs", bytes.NewBuffer(jsonBytes))
	if err != nil {
		t.Fatal(err)
	}
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(ProcessJobsHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var updatedJob db.Job
	ctxVerify, cancelVerify := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelVerify()
	err = collection.FindOne(ctxVerify, bson.M{"_id": jobId}).Decode(&updatedJob)
	if err != nil {
		t.Fatalf("failed to find updated job: %v", err)
	}

	if updatedJob.Status != "completed" {
		t.Errorf("expected status 'completed', got %q. Error: %q, LastError: %q", updatedJob.Status, updatedJob.Error, updatedJob.LastError)
	}

	if len(updatedJob.Results) != 2 {
		t.Errorf("expected 2 results, got %d", len(updatedJob.Results))
	}
}

func TestProcessJobsGlobalError(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping integration test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("skipping integration test: failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()
	queue.QueueClientService = nil

	collection := client.Database("cover-craft").Collection("jobs")

	jobId := primitive.NewObjectID()
	now := time.Now().UTC()
	job := db.Job{
		ID:            jobId,
		Status:        "pending",
		Requests:      []interface{}{"corrupted-string-request"},
		Results:       []string{},
		Attempts:      0,
		MaxAttempts:   3,
		ResultDetails: make(map[string]db.JobResult),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	_, err = collection.InsertOne(ctx, job)
	if err != nil {
		t.Fatalf("failed to insert test job: %v", err)
	}
	defer func() {
		ctxDel, cancelDel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancelDel()
		_, _ = collection.DeleteOne(ctxDel, bson.M{"_id": jobId})
	}()

	body := map[string]interface{}{
		"Data": map[string]interface{}{
			"myQueueItem": jobId.Hex(),
		},
	}
	jsonBytes, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPost, "/processJobs", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(ProcessJobsHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	var updatedJob db.Job
	ctxVerify, cancelVerify := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelVerify()
	err = collection.FindOne(ctxVerify, bson.M{"_id": jobId}).Decode(&updatedJob)
	if err != nil {
		t.Fatalf("failed to find updated job: %v", err)
	}

	if updatedJob.Status != "pending" {
		t.Errorf("expected status 'pending', got %q", updatedJob.Status)
	}
	if updatedJob.Attempts != 1 {
		t.Errorf("expected attempts 1, got %d", updatedJob.Attempts)
	}
	if updatedJob.LastError == "" {
		t.Error("expected lastError to be populated")
	}
}

func TestProcessJobsMaxAttemptsReached(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping integration test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("skipping integration test: failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()
	queue.QueueClientService = nil

	collection := client.Database("cover-craft").Collection("jobs")

	jobId := primitive.NewObjectID()
	now := time.Now().UTC()
	job := db.Job{
		ID:            jobId,
		Status:        "pending",
		Requests:      []interface{}{"corrupted-string-request"},
		Results:       []string{},
		Attempts:      2,
		MaxAttempts:   3,
		ResultDetails: make(map[string]db.JobResult),
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	_, err = collection.InsertOne(ctx, job)
	if err != nil {
		t.Fatalf("failed to insert test job: %v", err)
	}
	defer func() {
		ctxDel, cancelDel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancelDel()
		_, _ = collection.DeleteOne(ctxDel, bson.M{"_id": jobId})
	}()

	body := map[string]interface{}{
		"Data": map[string]interface{}{
			"myQueueItem": jobId.Hex(),
		},
	}
	jsonBytes, _ := json.Marshal(body)
	req, _ := http.NewRequest(http.MethodPost, "/processJobs", bytes.NewBuffer(jsonBytes))
	req.Header.Set("Content-Type", "application/json")

	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(ProcessJobsHandler)
	handler.ServeHTTP(rr, req)

	var updatedJob db.Job
	ctxVerify, cancelVerify := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancelVerify()
	err = collection.FindOne(ctxVerify, bson.M{"_id": jobId}).Decode(&updatedJob)
	if err != nil {
		t.Fatalf("failed to find updated job: %v", err)
	}

	if updatedJob.Status != "failed" {
		t.Errorf("expected status 'failed', got %q", updatedJob.Status)
	}
	if updatedJob.Attempts != 3 {
		t.Errorf("expected attempts 3, got %d", updatedJob.Attempts)
	}
	if updatedJob.Error == "" {
		t.Error("expected error to be populated")
	}
}
