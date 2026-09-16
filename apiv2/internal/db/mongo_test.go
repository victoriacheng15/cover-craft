package db

import (
	"context"
	"os"
	"testing"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func TestConnectMongo(t *testing.T) {
	// Test client initialization unconditionally
	dummyURI := "mongodb://localhost:27017"
	err := ConnectMongo(dummyURI)
	if err != nil {
		t.Skip("skipping local connect test: mongo client failed to connect to offline local host:", err)
	}

	if MongoClient == nil {
		t.Error("expected MongoClient to be set after ConnectMongo, got nil")
	}

	// Only perform remote Ping check if MONGODB_URI env variable is provided
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Log("skipping remote Ping verification: MONGODB_URI not set")
		return
	}

	err = ConnectMongo(mongoURI)
	if err != nil {
		t.Skip("skipping remote Ping: connection failed:", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	err = MongoClient.Ping(ctx, nil)
	if err != nil {
		t.Errorf("failed to ping MongoDB instance: %v", err)
	}
}

func TestEnsureMetricsIndexes(t *testing.T) {
	// 1. Nil client returns nil
	if err := EnsureMetricsIndexes(context.Background(), nil); err != nil {
		t.Errorf("expected nil error for nil client, got %v", err)
	}

	// 2. Integration check if MONGODB_URI is provided
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		t.Log("skipping EnsureMetricsIndexes integration: MONGODB_URI not set")
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
	if err != nil {
		t.Skip("failed to connect to MongoDB:", err)
	}
	defer client.Disconnect(ctx)

	if err := EnsureMetricsIndexes(ctx, client); err != nil {
		t.Errorf("failed to create metrics compound index: %v", err)
	}
}
