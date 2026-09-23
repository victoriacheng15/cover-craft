package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/handlers"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/middleware"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/queue"
)

func main() {
	// 0. Initialize Structured Logger with Context-aware correlation ID Handler
	jsonHandler := slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	})
	logger := slog.New(middleware.NewContextHandler(jsonHandler))
	slog.SetDefault(logger)

	// 1. Resolve Port (FUNCTIONS_CUSTOMHANDLER_PORT is injected by the Azure host)
	port := os.Getenv("FUNCTIONS_CUSTOMHANDLER_PORT")
	if port == "" {
		port = "8080" // Fallback for standalone local run
	}

	// 2. Initialize Database Connection
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		slog.Warn("MONGODB_URI environment variable not set. Running database-less operations only.")
	} else {
		slog.Info("Connecting to MongoDB...")
		err := db.ConnectMongo(mongoURI)
		if err != nil {
			slog.Error("Failed to connect to MongoDB", "error", err)
			os.Exit(1)
		}
		slog.Info("MongoDB connection established.")
	}

	// 3. Initialize Queue Connection
	storageConn := os.Getenv("AzureWebJobsStorage")
	if storageConn == "" {
		slog.Warn("AzureWebJobsStorage not set. Queue operations will fail.")
	} else {
		slog.Info("Connecting to Azure Queue Storage...")
		err := queue.InitQueue(storageConn, "batch-jobs")
		if err != nil {
			slog.Error("Failed to initialize Queue service", "error", err)
			os.Exit(1)
		}

		// Verify/create queue asynchronously at startup
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err = queue.QueueClientService.CreateQueueIfNotExists(ctx)
		cancel()
		if err != nil {
			slog.Warn("Failed to verify/create queue 'batch-jobs'", "error", err)
		} else {
			slog.Info("Queue Storage connection established.")
		}
	}

	// 4. Configure HTTP Handlers
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", handlers.HealthHandler)
	mux.HandleFunc("/api/analytics", handlers.AnalyticsHandler)
	mux.HandleFunc("/api/metrics", handlers.MetricsHandler)
	mux.HandleFunc("/api/generateImage", handlers.GenerateImageHandler)
	mux.HandleFunc("/api/generateGif", handlers.GenerateGifHandler)
	mux.HandleFunc("/api/generateCarousel", handlers.GenerateCarouselHandler)
	mux.HandleFunc("/api/getJobStatus", handlers.GetJobStatusHandler)
	mux.HandleFunc("/processJobs", handlers.ProcessJobsHandler)

	// Wrap mux with CorrelationID middleware
	handler := middleware.CorrelationID(mux)

	// 5. Start Server
	listenAddr := fmt.Sprintf(":%s", port)
	slog.Info("Go Azure Functions Custom Handler listening", "addr", listenAddr)
	if err := http.ListenAndServe(listenAddr, handler); err != nil {
		slog.Error("Server terminated unexpectedly", "error", err)
		os.Exit(1)
	}
}
