package queue

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/storage/azqueue"
)

// QueueService encapsulates Azure Queue operations
type QueueService struct {
	client *azqueue.QueueClient
}

// QueueClientService is the shared singleton for queue operations
var QueueClientService *QueueService

// InitQueue initializes the global QueueClientService
func InitQueue(connectionString, queueName string) error {
	svc, err := NewQueueService(connectionString, queueName)
	if err != nil {
		return err
	}
	QueueClientService = svc
	return nil
}

// NewQueueService creates a new instance of QueueService
func NewQueueService(connectionString, queueName string) (*QueueService, error) {
	serviceClient, err := azqueue.NewServiceClientFromConnectionString(connectionString, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create ServiceClient from connection string: %w", err)
	}

	queueClient := serviceClient.NewQueueClient(queueName)
	return &QueueService{client: queueClient}, nil
}

// CreateQueueIfNotExists creates the queue if it doesn't already exist
func (q *QueueService) CreateQueueIfNotExists(ctx context.Context) error {
	_, err := q.client.Create(ctx, nil)
	if err != nil {
		var respErr *azcore.ResponseError
		if errors.As(err, &respErr) && respErr.StatusCode == 409 {
			// 409 Conflict: QueueAlreadyExists
			return nil
		}
		return fmt.Errorf("failed to create queue: %w", err)
	}
	return nil
}

// EnqueueJob publishes a Job ID message (Base64-encoded) to the queue
func (q *QueueService) EnqueueJob(ctx context.Context, jobId string) error {
	// Azure Functions Core Tools expects queue messages to be Base64-encoded strings
	encodedMsg := base64.StdEncoding.EncodeToString([]byte(jobId))

	_, err := q.client.EnqueueMessage(ctx, encodedMsg, nil)
	if err != nil {
		return fmt.Errorf("failed to enqueue message: %w", err)
	}
	return nil
}
