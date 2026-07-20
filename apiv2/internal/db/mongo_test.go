package db

import (
	"context"
	"os"
	"testing"
	"time"
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
