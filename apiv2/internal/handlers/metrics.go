package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
)

type ErrorResponse struct {
	Error string `json:"error"`
}

type MetricsResponse struct {
	Data struct {
		Received   db.Metric `json:"received"`
		ServerTime string    `json:"serverTime"`
	} `json:"data"`
}

func MetricsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed"})
		return
	}

	var metric db.Metric
	err := json.NewDecoder(r.Body).Decode(&metric)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Invalid JSON body"})
		return
	}

	if metric.Event == "" || metric.Timestamp.IsZero() {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Missing required fields: event, timestamp"})
		return
	}

	if db.MongoClient == nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Database client not connected"})
		return
	}

	collection := db.MongoClient.Database("cover-craft").Collection("metrics")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	_, err = collection.InsertOne(ctx, metric)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to store metric in database"})
		return
	}

	var resp MetricsResponse
	resp.Data.Received = metric
	resp.Data.ServerTime = time.Now().UTC().Format(time.RFC3339)

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
