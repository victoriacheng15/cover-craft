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

func TestGenerateImagesHandler(t *testing.T) {
	tests := []struct {
		name            string
		method          string
		body            interface{}
		wantStatus      int
		wantDetailField string
	}{
		{
			name:   "Valid batch request succeeds",
			method: http.MethodPost,
			body: []map[string]interface{}{
				{
					"width":           800,
					"height":          600,
					"backgroundColor": "#ffffff",
					"textColor":       "#000000",
					"font":            "Montserrat",
					"title":           "Batch Item 1",
					"filename":        "file1",
				},
			},
			wantStatus: http.StatusAccepted,
		},
		{
			name:       "Disallowed method GET returns 405",
			method:     http.MethodGet,
			body:       nil,
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "Invalid JSON payload format returns 400",
			method:     http.MethodPost,
			body:       "not-a-json-array",
			wantStatus: http.StatusBadRequest,
		},
		{
			name:            "Validation error - empty batch",
			method:          http.MethodPost,
			body:            []interface{}{},
			wantStatus:      http.StatusBadRequest,
			wantDetailField: "requests",
		},
		{
			name:   "Validation error - exceeds maximum size of 5",
			method: http.MethodPost,
			body: []map[string]interface{}{
				{"width": 800, "height": 600, "backgroundColor": "#fff", "textColor": "#000", "font": "Roboto", "title": "1", "filename": "1"},
				{"width": 800, "height": 600, "backgroundColor": "#fff", "textColor": "#000", "font": "Roboto", "title": "2", "filename": "2"},
				{"width": 800, "height": 600, "backgroundColor": "#fff", "textColor": "#000", "font": "Roboto", "title": "3", "filename": "3"},
				{"width": 800, "height": 600, "backgroundColor": "#fff", "textColor": "#000", "font": "Roboto", "title": "4", "filename": "4"},
				{"width": 800, "height": 600, "backgroundColor": "#fff", "textColor": "#000", "font": "Roboto", "title": "5", "filename": "5"},
				{"width": 800, "height": 600, "backgroundColor": "#fff", "textColor": "#000", "font": "Roboto", "title": "6", "filename": "6"},
			},
			wantStatus:      http.StatusBadRequest,
			wantDetailField: "requests",
		},
		{
			name:   "Validation error - nested parameter invalid",
			method: http.MethodPost,
			body: []map[string]interface{}{
				{
					"width":           0, // Invalid width
					"height":          600,
					"backgroundColor": "#ffffff",
					"textColor":       "#000000",
					"font":            "Montserrat",
					"title":           "Item 1",
					"filename":        "file1",
				},
			},
			wantStatus:      http.StatusBadRequest,
			wantDetailField: "requests[0].width",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			db.MongoClient = nil
			queue.QueueClientService = nil

			var reqBody io.Reader
			if tt.body != nil {
				jsonBytes, err := json.Marshal(tt.body)
				if err != nil {
					t.Fatalf("failed to marshal request body: %v", err)
				}
				reqBody = bytes.NewBuffer(jsonBytes)
			}

			req, err := http.NewRequest(tt.method, "/api/generateImages", reqBody)
			if err != nil {
				t.Fatal(err)
			}
			if tt.body != nil {
				req.Header.Set("Content-Type", "application/json")
			}

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(GenerateImagesHandler)
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.wantStatus {
				t.Errorf("GenerateImagesHandler() returned wrong status: got %v, want %v. Body: %s", status, tt.wantStatus, rr.Body.String())
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

func TestGetJobStatusHandler(t *testing.T) {
	tests := []struct {
		name       string
		method     string
		url        string
		setupMock  bool
		wantStatus int
	}{
		{
			name:       "Missing jobId parameter returns 400",
			method:     http.MethodGet,
			url:        "/api/getJobStatus",
			setupMock:  true,
			wantStatus: http.StatusBadRequest,
		},
		{
			name:       "Disallowed method POST returns 405",
			method:     http.MethodPost,
			url:        "/api/getJobStatus?jobId=123",
			setupMock:  true,
			wantStatus: http.StatusMethodNotAllowed,
		},
		{
			name:       "Nil database client returns 500",
			method:     http.MethodGet,
			url:        "/api/getJobStatus?jobId=65f6ba89e0239c7c00000001",
			setupMock:  false, // No database
			wantStatus: http.StatusInternalServerError,
		},
		{
			name:       "Invalid format Job ID returns 400",
			method:     http.MethodGet,
			url:        "/api/getJobStatus?jobId=invalid-id-format",
			setupMock:  true,
			wantStatus: http.StatusBadRequest,
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

			req, err := http.NewRequest(tt.method, tt.url, nil)
			if err != nil {
				t.Fatal(err)
			}

			rr := httptest.NewRecorder()
			handler := http.HandlerFunc(GetJobStatusHandler)
			handler.ServeHTTP(rr, req)

			if status := rr.Code; status != tt.wantStatus {
				t.Errorf("GetJobStatusHandler() returned wrong status: got %v, want %v. Body: %s", status, tt.wantStatus, rr.Body.String())
			}
		})
	}
}

func TestGetJobStatusIntegration(t *testing.T) {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Skip("skipping GetJobStatus integration test: MONGODB_URI not set")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("skipping GetJobStatus integration test: failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	db.MongoClient = client
	defer func() { db.MongoClient = nil }()

	collection := client.Database("cover-craft").Collection("jobs")

	jobId := primitive.NewObjectID()
	now := time.Now().UTC()
	job := db.Job{
		ID:     jobId,
		Status: "completed",
		Requests: []interface{}{
			services.ImageParams{
				Width: 400, Height: 300, BackgroundColor: "#ffffff", TextColor: "#000000", Font: "Montserrat", Title: "Title 1",
			},
		},
		Results:       []string{"data:image/png;base64,abc"},
		Attempts:      1,
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

	// 1. Query by full 24-character Job ID
	req, _ := http.NewRequest(http.MethodGet, "/api/getJobStatus?jobId="+jobId.Hex(), nil)
	rr := httptest.NewRecorder()
	handler := http.HandlerFunc(GetJobStatusHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d. Body: %s", rr.Code, rr.Body.String())
	}

	// 2. Query by last 8 characters of Job ID
	last8 := jobId.Hex()[16:]
	req, _ = http.NewRequest(http.MethodGet, "/api/getJobStatus?jobId="+last8, nil)
	rr = httptest.NewRecorder()
	handler = http.HandlerFunc(GetJobStatusHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Errorf("expected status 200 for 8-char lookup, got %d. Body: %s", rr.Code, rr.Body.String())
	}
}
