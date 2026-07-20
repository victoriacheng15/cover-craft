package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/handlers"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/queue"
)

func main() {
	// 1. Resolve Port (FUNCTIONS_CUSTOMHANDLER_PORT is injected by the Azure host)
	port := os.Getenv("FUNCTIONS_CUSTOMHANDLER_PORT")
	if port == "" {
		port = "8080" // Fallback for standalone local run
	}

	// 2. Initialize Database Connection
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Println("Warning: MONGODB_URI environment variable not set. Running database-less operations only.")
	} else {
		log.Printf("Connecting to MongoDB...")
		err := db.ConnectMongo(mongoURI)
		if err != nil {
			log.Fatalf("Failed to connect to MongoDB: %v", err)
		}
		log.Println("MongoDB connection established.")
	}

	// 3. Initialize Queue Connection
	storageConn := os.Getenv("AzureWebJobsStorage")
	if storageConn == "" {
		log.Println("Warning: AzureWebJobsStorage not set. Queue operations will fail.")
	} else {
		log.Printf("Connecting to Azure Queue Storage...")
		err := queue.InitQueue(storageConn, "batch-jobs")
		if err != nil {
			log.Fatalf("Failed to initialize Queue service: %v", err)
		}

		// Verify/create queue asynchronously at startup
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		err = queue.QueueClientService.CreateQueueIfNotExists(ctx)
		cancel()
		if err != nil {
			log.Printf("Warning: failed to verify/create queue 'batch-jobs': %v", err)
		} else {
			log.Println("Queue Storage connection established.")
		}
	}

	// 4. Configure HTTP Handlers
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", handlers.HealthHandler)
	mux.HandleFunc("/api/analytics", handlers.AnalyticsHandler)
	mux.HandleFunc("/api/metrics", handlers.MetricsHandler)
	mux.HandleFunc("/api/generateImage", handlers.GenerateImageHandler)
	mux.HandleFunc("/api/generateImages", handlers.GenerateImagesHandler)
	mux.HandleFunc("/api/getJobStatus", handlers.GetJobStatusHandler)
	mux.HandleFunc("/processJobs", handlers.ProcessJobsHandler)

	// 5. Start Server
	listenAddr := fmt.Sprintf(":%s", port)
	log.Printf("Go Azure Functions Custom Handler listening on %s", listenAddr)
	log.Fatal(http.ListenAndServe(listenAddr, mux))
}
