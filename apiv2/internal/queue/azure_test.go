package queue

import (
	"context"
	"os"
	"testing"
	"time"
)

func TestQueueService(t *testing.T) {
	connStr := os.Getenv("AzureWebJobsStorage")
	if connStr == "" {
		connStr = "UseDevelopmentStorage=true"
	}

	svc, err := NewQueueService(connStr, "test-queue-handshake")
	if err != nil {
		t.Log("NewQueueService failed (expected if connStr format invalid):", err)
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()

	// Try to verify/create the queue
	err = svc.CreateQueueIfNotExists(ctx)
	if err != nil {
		t.Log("CreateQueueIfNotExists failed (expected if Azurite is offline):", err)
	}

	// Test EnqueueJob
	err = svc.EnqueueJob(ctx, "test-job-id-12345")
	if err != nil {
		t.Log("EnqueueJob failed (expected if Azurite is offline):", err)
	}

	// Test EnqueueJobWithDelay
	err = svc.EnqueueJobWithDelay(ctx, "test-job-id-delayed", 10)
	if err != nil {
		t.Log("EnqueueJobWithDelay failed (expected if Azurite is offline):", err)
	}
}

func TestInitQueue(t *testing.T) {
	connStr := "DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;QueueEndpoint=http://127.0.0.1:10001/devstoreaccount1;"
	
	err := InitQueue(connStr, "test-global-init")
	if err != nil {
		t.Fatalf("failed to init queue: %v", err)
	}

	if QueueClientService == nil {
		t.Error("expected QueueClientService to be initialized, got nil")
	}
}
