package db

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type SizePreset struct {
	Width  int `bson:"width,omitempty" json:"width,omitempty"`
	Height int `bson:"height,omitempty" json:"height,omitempty"`
}

type JobResult struct {
	Index     int       `bson:"index" json:"index"`
	Status    string    `bson:"status" json:"status"`
	DataURL   string    `bson:"dataUrl,omitempty" json:"dataUrl,omitempty"`
	Error     string    `bson:"error,omitempty" json:"error,omitempty"`
	Attempts  int       `bson:"attempts" json:"attempts"`
	UpdatedAt time.Time `bson:"updatedAt" json:"updatedAt"`
}

type Job struct {
	ID                  primitive.ObjectID   `bson:"_id,omitempty" json:"id"`
	Status              string               `bson:"status" json:"status"`
	Requests            []interface{}        `bson:"requests" json:"requests"`
	Results             []string             `bson:"results" json:"results"`
	Error               string               `bson:"error,omitempty" json:"error,omitempty"`
	Attempts            int                  `bson:"attempts" json:"attempts"`
	MaxAttempts         int                  `bson:"maxAttempts" json:"maxAttempts"`
	ProcessingStartedAt *time.Time           `bson:"processingStartedAt,omitempty" json:"processingStartedAt,omitempty"`
	LastError           string               `bson:"lastError,omitempty" json:"lastError,omitempty"`
	ResultDetails       map[string]JobResult `bson:"resultDetails" json:"resultDetails"`
	CreatedAt           time.Time            `bson:"createdAt" json:"createdAt"`
	UpdatedAt           time.Time            `bson:"updatedAt" json:"updatedAt"`
}

type Metric struct {
	Event          string      `bson:"event" json:"event"`
	Timestamp      time.Time   `bson:"timestamp" json:"timestamp"`
	Status         string      `bson:"status" json:"status"`
	ErrorMessage   string      `bson:"errorMessage,omitempty" json:"errorMessage,omitempty"`
	Size           *SizePreset `bson:"size,omitempty" json:"size,omitempty"`
	Font           string      `bson:"font,omitempty" json:"font,omitempty"`
	TitleLength    *int        `bson:"titleLength,omitempty" json:"titleLength,omitempty"`
	SubtitleLength *int        `bson:"subtitleLength,omitempty" json:"subtitleLength,omitempty"`
	ContrastRatio  *float64    `bson:"contrastRatio,omitempty" json:"contrastRatio,omitempty"`
	WcagLevel      string      `bson:"wcagLevel,omitempty" json:"wcagLevel,omitempty"`
	Duration       *int        `bson:"duration,omitempty" json:"duration,omitempty"`
	ClientDuration *int        `bson:"clientDuration,omitempty" json:"clientDuration,omitempty"`
}

var MongoClient *mongo.Client

func ConnectMongo(uri string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}

	err = client.Ping(ctx, nil)
	if err != nil {
		return err
	}

	MongoClient = client
	return nil
}
