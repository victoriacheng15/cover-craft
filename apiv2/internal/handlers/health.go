package handlers

import (
	"encoding/json"
	"net/http"
	"time"
)

type HealthResponse struct {
	Data struct {
		LocalTime string `json:"localTime"`
		IsoTime   string `json:"isoTime"`
	} `json:"data"`
}

func HealthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	now := time.Now()
	var resp HealthResponse
	resp.Data.LocalTime = now.Local().Format("2006-01-02 15:04:05")
	resp.Data.IsoTime = now.UTC().Format(time.RFC3339)

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(resp)
}
