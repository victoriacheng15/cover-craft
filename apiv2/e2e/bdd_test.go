package e2e

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/cucumber/godog"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/handlers"
	"github.com/victoriacheng15/cover-craft/apiv2/internal/queue"
)

func init() {
	// Auto-load environment variables from local.settings.json for seamless local testing
	file, err := os.ReadFile("../local.settings.json")
	if err == nil {
		var settings struct {
			Values map[string]string `json:"Values"`
		}
		if err := json.Unmarshal(file, &settings); err == nil {
			for k, v := range settings.Values {
				if os.Getenv(k) == "" {
					_ = os.Setenv(k, v)
				}
			}
		}
	}
}

func TestFeatures(t *testing.T) {
	suite := godog.TestSuite{
		ScenarioInitializer: InitializeScenario,
		Options: &godog.Options{
			Format:   "pretty",
			Paths:    []string{"features"},
			TestingT: t,
		},
	}

	if suite.Run() != 0 {
		t.Fatal("non-zero status returned, BDD features failed")
	}
}

func InitializeScenario(ctx *godog.ScenarioContext) {
	tc := &testContext{
		router: http.NewServeMux(),
	}

	// Register router handlers
	tc.router.HandleFunc("/api/health", handlers.HealthHandler)
	tc.router.HandleFunc("/api/generateImage", handlers.GenerateImageHandler)
	tc.router.HandleFunc("/api/generateImages", handlers.GenerateImagesHandler)
	tc.router.HandleFunc("/api/getJobStatus", handlers.GetJobStatusHandler)
	tc.router.HandleFunc("/api/analytics", handlers.AnalyticsHandler)
	tc.router.HandleFunc("/api/metrics", handlers.MetricsHandler)
	tc.router.HandleFunc("/processJobs", handlers.ProcessJobsHandler)

	ctx.Step(`^I send a "([^"]*)" request to "([^"]*)"$`, tc.iSendRequestTo)
	ctx.Step(`^I send a "([^"]*)" request to "([^"]*)" with parameters:$`, tc.iSendRequestToWithParameters)
	ctx.Step(`^I send a "([^"]*)" request to "([^"]*)" with body:$`, tc.iSendRequestToWithBody)
	ctx.Step(`^the response status code should be (\d+)$`, tc.responseStatusCodeShouldBe)
	ctx.Step(`^the response content type should be "([^"]*)"$`, tc.responseContentTypeShouldBe)
	ctx.Step(`^the response body should contain "([^"]*)" with value "([^"]*)"$`, tc.responseBodyShouldContainWithValue)
	ctx.Step(`^the response body should contain "([^"]*)"$`, tc.responseBodyShouldContain)
	ctx.Step(`^the database and queue are mock initialized$`, tc.theDatabaseAndQueueAreMockInitialized)
	ctx.Step(`^the database contains a job with ID "([^"]*)" and status "([^"]*)"$`, tc.theDatabaseContainsAJobWithIDAndStatus)

	// Clean up database resources after scenario runs
	ctx.After(func(ctx context.Context, sc *godog.Scenario, err error) (context.Context, error) {
		if db.MongoClient != nil {
			// Clean up the BDD test job
			if id, parseErr := primitive.ObjectIDFromHex("65f6ba89e0239c7c00000001"); parseErr == nil {
				ctxDel, cancel := context.WithTimeout(context.Background(), 2*time.Second)
				defer cancel()
				_, _ = db.MongoClient.Database("cover-craft").Collection("jobs").DeleteOne(ctxDel, bson.M{"_id": id})
			}
			_ = db.MongoClient.Disconnect(context.Background())
			db.MongoClient = nil
		}
		return ctx, nil
	})
}

type testContext struct {
	response *httptest.ResponseRecorder
	router   *http.ServeMux
}

func (tc *testContext) iSendRequestTo(method, route string) error {
	req := httptest.NewRequest(method, route, nil)
	tc.response = httptest.NewRecorder()
	tc.router.ServeHTTP(tc.response, req)
	return nil
}

func (tc *testContext) iSendRequestToWithParameters(method, route string, table *godog.Table) error {
	u, err := url.Parse(route)
	if err != nil {
		return err
	}
	q := u.Query()
	for _, row := range table.Rows {
		if len(row.Cells) == 2 {
			q.Set(row.Cells[0].Value, row.Cells[1].Value)
		}
	}
	u.RawQuery = q.Encode()

	req := httptest.NewRequest(method, u.String(), nil)
	tc.response = httptest.NewRecorder()
	tc.router.ServeHTTP(tc.response, req)
	return nil
}

func (tc *testContext) iSendRequestToWithBody(method, route string, body *godog.DocString) error {
	req := httptest.NewRequest(method, route, bytes.NewBufferString(body.Content))
	req.Header.Set("Content-Type", "application/json")
	tc.response = httptest.NewRecorder()
	tc.router.ServeHTTP(tc.response, req)
	return nil
}

func (tc *testContext) responseStatusCodeShouldBe(expectedCode int) error {
	if tc.response.Code != expectedCode {
		return fmt.Errorf("expected status code %d, but got %d (body: %s)", expectedCode, tc.response.Code, tc.response.Body.String())
	}
	return nil
}

func (tc *testContext) responseContentTypeShouldBe(expectedType string) error {
	contentType := tc.response.Header().Get("Content-Type")
	if !strings.Contains(contentType, expectedType) {
		return fmt.Errorf("expected Content-Type to contain %q, but got %q", expectedType, contentType)
	}
	return nil
}

func (tc *testContext) responseBodyShouldContainWithValue(key, value string) error {
	var bodyMap map[string]interface{}
	if err := json.Unmarshal(tc.response.Body.Bytes(), &bodyMap); err != nil {
		return fmt.Errorf("failed to unmarshal response body: %v (body: %s)", err, tc.response.Body.String())
	}

	val, exists := bodyMap[key]
	if !exists {
		return fmt.Errorf("response body does not contain key %q", key)
	}

	strVal := fmt.Sprintf("%v", val)
	if strVal != value {
		return fmt.Errorf("expected key %q to have value %q, but got %q", key, value, strVal)
	}
	return nil
}

func (tc *testContext) responseBodyShouldContain(key string) error {
	var bodyMap map[string]interface{}
	if err := json.Unmarshal(tc.response.Body.Bytes(), &bodyMap); err != nil {
		return fmt.Errorf("failed to unmarshal response body: %v (body: %s)", err, tc.response.Body.String())
	}

	if _, exists := bodyMap[key]; !exists {
		return fmt.Errorf("response body does not contain key %q (body: %s)", key, tc.response.Body.String())
	}
	return nil
}

func (tc *testContext) theDatabaseAndQueueAreMockInitialized() error {
	db.MongoClient = nil
	queue.QueueClientService = nil
	return nil
}

func (tc *testContext) theDatabaseContainsAJobWithIDAndStatus(id, status string) error {
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		return nil
	}

	if db.MongoClient == nil {
		ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
		defer cancel()
		client, err := mongo.Connect(ctx, options.Client().ApplyURI(mongoURI))
		if err != nil {
			return nil
		}
		db.MongoClient = client
	}

	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	collection := db.MongoClient.Database("cover-craft").Collection("jobs")
	_, _ = collection.DeleteOne(ctx, bson.M{"_id": objID})

	_, err = collection.InsertOne(ctx, db.Job{
		ID:        objID,
		Status:    status,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})
	return err
}
