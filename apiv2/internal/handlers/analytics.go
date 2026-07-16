package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	EventGenerateClick  = "generate_click"
	EventDownloadClick  = "download_click"
	EventImageGenerated = "image_generated"
)

// ===================================================================================
// Structs representing analytics data contracts
// ===================================================================================

type DailyTrendItem struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

type HourlyTrendItem struct {
	Hour  int `json:"hour"`
	Count int `json:"count"`
}

type UserEngagementData struct {
	UiGenerationAttempts       int               `json:"uiGenerationAttempts"`
	TotalDownloads             int               `json:"totalDownloads"`
	DownloadRate               float64           `json:"downloadRate"`
	DailyTrend                 []DailyTrendItem  `json:"dailyTrend"`
	TotalSuccessfulGenerations int               `json:"totalSuccessfulGenerations"`
	UiUsagePercent             float64           `json:"uiUsagePercent"`
	ApiUsagePercent            float64           `json:"apiUsagePercent"`
	HourlyTrend                []HourlyTrendItem `json:"hourlyTrend"`
}

type FontItem struct {
	Font  string `json:"font"`
	Count int    `json:"count"`
}

type SizeItem struct {
	Size  string `json:"size"`
	Count int    `json:"count"`
}

type TitleLengthStats struct {
	ID             interface{} `json:"_id"`
	AvgTitleLength float64     `json:"avgTitleLength"`
	MinTitleLength int         `json:"minTitleLength"`
	MaxTitleLength int         `json:"maxTitleLength"`
}

type TitleDistribution struct {
	Short  int `json:"short"`
	Medium int `json:"medium"`
	Long   int `json:"long"`
}

type SubtitleDistribution struct {
	None   int `json:"none"`
	Short  int `json:"short"`
	Medium int `json:"medium"`
	Long   int `json:"long"`
}

type WeeklyTrendItem struct {
	Week       string  `json:"week"`
	Percentage float64 `json:"percentage"`
}

type FeaturePopularityData struct {
	TopFonts                  []FontItem           `json:"topFonts"`
	TopSizes                  []SizeItem           `json:"topSizes"`
	TitleLengthStats          TitleLengthStats     `json:"titleLengthStats"`
	TitleLengthDistribution   TitleDistribution    `json:"titleLengthDistribution"`
	SubtitleUsagePercent      float64              `json:"subtitleUsagePercent"`
	SubtitleUsageDistribution SubtitleDistribution `json:"subtitleUsageDistribution"`
	SubtitleTrendOverTime     []WeeklyTrendItem    `json:"subtitleTrendOverTime"`
}

type WcagDistributionItem struct {
	Level string `json:"level"`
	Count int    `json:"count"`
}

type ContrastStats struct {
	ID               interface{} `json:"_id"`
	AvgContrastRatio float64     `json:"avgContrastRatio"`
	MinContrastRatio float64     `json:"minContrastRatio"`
	MaxContrastRatio float64     `json:"maxContrastRatio"`
}

type WcagTrendItem struct {
	Date string `json:"date"`
	AAA  int    `json:"AAA"`
	AA   int    `json:"AA"`
}

type AccessibilityComplianceData struct {
	WcagDistribution []WcagDistributionItem `json:"wcagDistribution"`
	ContrastStats    ContrastStats          `json:"contrastStats"`
	WcagTrend        []WcagTrendItem        `json:"wcagTrend"`
}

type DurationTrendItem struct {
	Date        string  `json:"date"`
	AvgDuration float64 `json:"avgDuration"`
	P50         float64 `json:"p50"`
	P95         float64 `json:"p95"`
	P99         float64 `json:"p99"`
}

type BackendPerformance struct {
	AvgBackendDuration   float64             `json:"avgBackendDuration"`
	MinBackendDuration   float64             `json:"minBackendDuration"`
	MaxBackendDuration   float64             `json:"maxBackendDuration"`
	P50BackendDuration   float64             `json:"p50BackendDuration"`
	P95BackendDuration   float64             `json:"p95BackendDuration"`
	P99BackendDuration   float64             `json:"p99BackendDuration"`
	BackendDurationTrend []DurationTrendItem `json:"backendDurationTrend"`
}

type ClientPerformance struct {
	AvgClientDuration   float64             `json:"avgClientDuration"`
	MinClientDuration   float64             `json:"minClientDuration"`
	MaxClientDuration   float64             `json:"maxClientDuration"`
	P50ClientDuration   float64             `json:"p50ClientDuration"`
	P95ClientDuration   float64             `json:"p95ClientDuration"`
	P99ClientDuration   float64             `json:"p99ClientDuration"`
	ClientDurationTrend []DurationTrendItem `json:"clientDurationTrend"`
}

type NetworkLatency struct {
	AvgNetworkLatency float64 `json:"avgNetworkLatency"`
}

type PerformanceBySize struct {
	Size               string  `json:"size"`
	AvgBackendDuration float64 `json:"avgBackendDuration"`
	P95BackendDuration float64 `json:"p95BackendDuration"`
	AvgClientDuration  float64 `json:"avgClientDuration"`
	P95ClientDuration  float64 `json:"p95ClientDuration"`
}

type PerformanceMetricsData struct {
	BackendPerformance BackendPerformance  `json:"backendPerformance"`
	ClientPerformance  ClientPerformance   `json:"clientPerformance"`
	NetworkLatency     NetworkLatency      `json:"networkLatency"`
	PerformanceBySize  []PerformanceBySize `json:"performanceBySize"`
}

type AnalyticsResult struct {
	UserEngagement          UserEngagementData          `json:"userEngagement"`
	FeaturePopularity       FeaturePopularityData       `json:"featurePopularity"`
	AccessibilityCompliance AccessibilityComplianceData `json:"accessibilityCompliance"`
	PerformanceMetrics      PerformanceMetricsData      `json:"performanceMetrics"`
}

type AnalyticsResponse struct {
	Data AnalyticsResult `json:"data"`
}

// ===================================================================================
// GET /api/analytics Route Handler
// ===================================================================================

func AnalyticsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodGet {
		w.WriteHeader(http.StatusMethodNotAllowed)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Method not allowed"})
		return
	}

	if db.MongoClient == nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Database client not connected"})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	metricsColl := db.MongoClient.Database("cover-craft").Collection("metrics")
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)

	// Fetch user engagement
	userEng, err := queryUserEngagement(ctx, metricsColl, thirtyDaysAgo)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to fetch user engagement: " + err.Error()})
		return
	}

	// Fetch feature popularity
	featPop, err := queryFeaturePopularity(ctx, metricsColl, userEng.TotalSuccessfulGenerations, thirtyDaysAgo)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to fetch feature popularity: " + err.Error()})
		return
	}

	// Fetch accessibility compliance
	accComp, err := queryAccessibilityCompliance(ctx, metricsColl, thirtyDaysAgo)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to fetch accessibility: " + err.Error()})
		return
	}

	// Fetch performance metrics
	perfMet, err := queryPerformanceMetrics(ctx, metricsColl, thirtyDaysAgo)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(ErrorResponse{Error: "Failed to fetch performance: " + err.Error()})
		return
	}

	response := AnalyticsResponse{
		Data: AnalyticsResult{
			UserEngagement:          userEng,
			FeaturePopularity:       featPop,
			AccessibilityCompliance: accComp,
			PerformanceMetrics:      perfMet,
		},
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(response)
}

// ===================================================================================
// Helper queries implementing aggregations
// ===================================================================================

func queryUserEngagement(ctx context.Context, coll *mongo.Collection, thirtyDaysAgo time.Time) (UserEngagementData, error) {
	var data UserEngagementData

	// GENERATE_CLICK attempts count
	uiAttempts, err := coll.CountDocuments(ctx, bson.M{"event": EventGenerateClick})
	if err != nil {
		return data, err
	}
	data.UiGenerationAttempts = int(uiAttempts)

	// IMAGE_GENERATED success count
	totalSuccess, err := coll.CountDocuments(ctx, bson.M{"event": EventImageGenerated, "status": "success"})
	if err != nil {
		return data, err
	}
	data.TotalSuccessfulGenerations = int(totalSuccess)

	// DOWNLOAD_CLICK success count
	totalDownloads, err := coll.CountDocuments(ctx, bson.M{"event": EventDownloadClick, "status": "success"})
	if err != nil {
		return data, err
	}
	data.TotalDownloads = int(totalDownloads)

	// Rates & Usage share
	if data.UiGenerationAttempts > 0 {
		data.DownloadRate = float64(data.TotalDownloads) / float64(data.UiGenerationAttempts) * 100
	}

	estimatedApi := data.TotalSuccessfulGenerations - data.UiGenerationAttempts
	if estimatedApi < 0 {
		estimatedApi = 0
	}

	if data.TotalSuccessfulGenerations > 0 {
		data.ApiUsagePercent = float64(estimatedApi) / float64(data.TotalSuccessfulGenerations) * 100
		data.UiUsagePercent = 100 - data.ApiUsagePercent
	}

	// Daily trend (IMAGE_GENERATED successes)
	dailyPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"timestamp": bson.M{"$gte": thirtyDaysAgo},
			"event":     EventImageGenerated,
			"status":    "success",
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$timestamp"}},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"_id": 1}}},
	}
	dailyCursor, err := coll.Aggregate(ctx, dailyPipe)
	if err != nil {
		return data, err
	}
	defer dailyCursor.Close(ctx)

	data.DailyTrend = []DailyTrendItem{}
	for dailyCursor.Next(ctx) {
		var result struct {
			ID    string `bson:"_id"`
			Count int    `bson:"count"`
		}
		if err := dailyCursor.Decode(&result); err == nil {
			data.DailyTrend = append(data.DailyTrend, DailyTrendItem{Date: result.ID, Count: result.Count})
		}
	}

	// Hourly trend
	hourlyPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"timestamp": bson.M{"$gte": thirtyDaysAgo},
			"event":     EventImageGenerated,
			"status":    "success",
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   bson.M{"$hour": "$timestamp"},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"_id": 1}}},
	}
	hourlyCursor, err := coll.Aggregate(ctx, hourlyPipe)
	if err != nil {
		return data, err
	}
	defer hourlyCursor.Close(ctx)

	data.HourlyTrend = []HourlyTrendItem{}
	for hourlyCursor.Next(ctx) {
		var result struct {
			ID    int `bson:"_id"`
			Count int `bson:"count"`
		}
		if err := hourlyCursor.Decode(&result); err == nil {
			data.HourlyTrend = append(data.HourlyTrend, HourlyTrendItem{Hour: result.ID, Count: result.Count})
		}
	}

	return data, nil
}

func queryFeaturePopularity(ctx context.Context, coll *mongo.Collection, totalCoversGenerated int, thirtyDaysAgo time.Time) (FeaturePopularityData, error) {
	var data FeaturePopularityData

	// Common filter for valid/complete documents
	completeFilter := bson.M{
		"status":        "success",
		"titleLength":   bson.M{"$exists": true, "$ne": nil},
		"contrastRatio": bson.M{"$exists": true, "$ne": nil},
		"wcagLevel":     bson.M{"$in": []string{"AA", "AAA"}},
	}

	// Top Fonts
	fontPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"event": EventImageGenerated, "status": "success"}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$font",
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"count": -1}}},
		{{Key: "$limit", Value: 10}},
	}
	fontCursor, err := coll.Aggregate(ctx, fontPipe)
	if err == nil {
		defer fontCursor.Close(ctx)
		data.TopFonts = []FontItem{}
		for fontCursor.Next(ctx) {
			var res struct {
				ID    string `bson:"_id"`
				Count int    `bson:"count"`
			}
			if err := fontCursor.Decode(&res); err == nil && res.ID != "" {
				data.TopFonts = append(data.TopFonts, FontItem{Font: res.ID, Count: res.Count})
			}
		}
	}

	// Top Sizes
	sizePipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"event": EventImageGenerated, "status": "success"}}},
		{{Key: "$group", Value: bson.M{
			"_id":   bson.M{"width": "$size.width", "height": "$size.height"},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"count": -1}}},
		{{Key: "$limit", Value: 10}},
	}
	sizeCursor, err := coll.Aggregate(ctx, sizePipe)
	if err == nil {
		defer sizeCursor.Close(ctx)
		data.TopSizes = []SizeItem{}
		for sizeCursor.Next(ctx) {
			var res struct {
				ID struct {
					Width  int `bson:"width"`
					Height int `bson:"height"`
				} `bson:"_id"`
				Count int `bson:"count"`
			}
			if err := sizeCursor.Decode(&res); err == nil {
				label := "others"
				if res.ID.Width == 1200 && res.ID.Height == 627 {
					label = "Post (1200 × 627)"
				} else if res.ID.Width == 1080 && res.ID.Height == 1080 {
					label = "Square (1080 × 1080)"
				}
				data.TopSizes = append(data.TopSizes, SizeItem{Size: label, Count: res.Count})
			}
		}
	}

	// Title Stats
	statsPipe := mongo.Pipeline{
		{{Key: "$match", Value: completeFilter}},
		{{Key: "$group", Value: bson.M{
			"_id":            nil,
			"avgTitleLength": bson.M{"$avg": "$titleLength"},
			"minTitleLength": bson.M{"$min": "$titleLength"},
			"maxTitleLength": bson.M{"$max": "$titleLength"},
		}}},
	}
	statsCursor, err := coll.Aggregate(ctx, statsPipe)
	if err == nil {
		defer statsCursor.Close(ctx)
		if statsCursor.Next(ctx) {
			_ = statsCursor.Decode(&data.TitleLengthStats)
		}
	}

	// Title Distribution (Thresholds: short <= 10, medium <= 25, long > 25)
	titleDistPipe := mongo.Pipeline{
		{{Key: "$match", Value: completeFilter}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{"$cond": bson.A{
				bson.M{"$lte": bson.A{"$titleLength", 10}},
				"short",
				bson.M{"$cond": bson.A{
					bson.M{"$lte": bson.A{"$titleLength", 25}},
					"medium",
					"long",
				}},
			}},
			"count": bson.M{"$sum": 1},
		}}},
	}
	titleDistCursor, err := coll.Aggregate(ctx, titleDistPipe)
	if err == nil {
		defer titleDistCursor.Close(ctx)
		for titleDistCursor.Next(ctx) {
			var res struct {
				ID    string `bson:"_id"`
				Count int    `bson:"count"`
			}
			if err := titleDistCursor.Decode(&res); err == nil {
				if res.ID == "short" {
					data.TitleLengthDistribution.Short = res.Count
				} else if res.ID == "medium" {
					data.TitleLengthDistribution.Medium = res.Count
				} else if res.ID == "long" {
					data.TitleLengthDistribution.Long = res.Count
				}
			}
		}
	}

	// Subtitle usage
	withSubtitle, _ := coll.CountDocuments(ctx, bson.M{
		"event":          EventImageGenerated,
		"status":         "success",
		"subtitleLength": bson.M{"$gt": 0},
	})
	if totalCoversGenerated > 0 {
		data.SubtitleUsagePercent = float64(withSubtitle) / float64(totalCoversGenerated) * 100
	}

	// Subtitle Distribution (none: 0, short <= 17, medium <= 43, long > 43)
	subDistPipe := mongo.Pipeline{
		{{Key: "$match", Value: completeFilter}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{"$cond": bson.A{
				bson.M{"$eq": bson.A{"$subtitleLength", 0}},
				"none",
				bson.M{"$cond": bson.A{
					bson.M{"$lte": bson.A{"$subtitleLength", 17}},
					"short",
					bson.M{"$cond": bson.A{
						bson.M{"$lte": bson.A{"$subtitleLength", 43}},
						"medium",
						"long",
					}},
				}},
			}},
			"count": bson.M{"$sum": 1},
		}}},
	}
	subDistCursor, err := coll.Aggregate(ctx, subDistPipe)
	if err == nil {
		defer subDistCursor.Close(ctx)
		for subDistCursor.Next(ctx) {
			var res struct {
				ID    string `bson:"_id"`
				Count int    `bson:"count"`
			}
			if err := subDistCursor.Decode(&res); err == nil {
				if res.ID == "none" {
					data.SubtitleUsageDistribution.None = res.Count
				} else if res.ID == "short" {
					data.SubtitleUsageDistribution.Short = res.Count
				} else if res.ID == "medium" {
					data.SubtitleUsageDistribution.Medium = res.Count
				} else if res.ID == "long" {
					data.SubtitleUsageDistribution.Long = res.Count
				}
			}
		}
	}

	// Subtitle weekly trend
	weeklyPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"timestamp": bson.M{"$gte": thirtyDaysAgo},
			"event":     EventImageGenerated,
			"status":    "success",
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":        bson.M{"$dateToString": bson.M{"format": "%G-W%V", "date": "$timestamp"}},
			"totalCount": bson.M{"$sum": 1},
			"withSubtitle": bson.M{"$sum": bson.M{"$cond": bson.A{
				bson.M{"$gt": bson.A{"$subtitleLength", 0}},
				1,
				0,
			}}},
		}}},
		{{Key: "$sort", Value: bson.M{"_id": 1}}},
	}
	weeklyCursor, err := coll.Aggregate(ctx, weeklyPipe)
	if err == nil {
		defer weeklyCursor.Close(ctx)
		data.SubtitleTrendOverTime = []WeeklyTrendItem{}
		for weeklyCursor.Next(ctx) {
			var res struct {
				ID           string `bson:"_id"`
				TotalCount   int    `bson:"totalCount"`
				WithSubtitle int    `bson:"withSubtitle"`
			}
			if err := weeklyCursor.Decode(&res); err == nil && res.ID != "" {
				pct := 0.0
				if res.TotalCount > 0 {
					pct = float64(res.WithSubtitle) / float64(res.TotalCount) * 100
				}
				data.SubtitleTrendOverTime = append(data.SubtitleTrendOverTime, WeeklyTrendItem{Week: res.ID, Percentage: pct})
			}
		}
	}

	return data, nil
}

func queryAccessibilityCompliance(ctx context.Context, coll *mongo.Collection, thirtyDaysAgo time.Time) (AccessibilityComplianceData, error) {
	var data AccessibilityComplianceData

	// WCAG distribution
	wcagPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"event": EventImageGenerated, "status": "success", "wcagLevel": bson.M{"$in": []string{"AA", "AAA"}}}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$wcagLevel",
			"count": bson.M{"$sum": 1},
		}}},
	}
	wcagCursor, err := coll.Aggregate(ctx, wcagPipe)
	if err == nil {
		defer wcagCursor.Close(ctx)
		distributionMap := map[string]int{"AA": 0, "AAA": 0}
		for wcagCursor.Next(ctx) {
			var res struct {
				ID    string `bson:"_id"`
				Count int    `bson:"count"`
			}
			if err := wcagCursor.Decode(&res); err == nil {
				distributionMap[res.ID] = res.Count
			}
		}
		data.WcagDistribution = []WcagDistributionItem{
			{Level: "AAA", Count: distributionMap["AAA"]},
			{Level: "AA", Count: distributionMap["AA"]},
		}
	}

	// Contrast stats
	contrastPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"event": EventImageGenerated, "status": "success", "contrastRatio": bson.M{"$exists": true}}}},
		{{Key: "$group", Value: bson.M{
			"_id":              nil,
			"avgContrastRatio": bson.M{"$avg": "$contrastRatio"},
			"minContrastRatio": bson.M{"$min": "$contrastRatio"},
			"maxContrastRatio": bson.M{"$max": "$contrastRatio"},
		}}},
	}
	contrastCursor, err := coll.Aggregate(ctx, contrastPipe)
	if err == nil {
		defer contrastCursor.Close(ctx)
		if contrastCursor.Next(ctx) {
			_ = contrastCursor.Decode(&data.ContrastStats)
		}
	}

	// WCAG Trend over time
	trendPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{"timestamp": bson.M{"$gte": thirtyDaysAgo}, "event": EventImageGenerated, "status": "success", "wcagLevel": bson.M{"$in": []string{"AA", "AAA"}}}}},
		{{Key: "$group", Value: bson.M{
			"_id":   bson.M{"date": bson.M{"$dateToString": bson.M{"format": "%Y-%m-%d", "date": "$timestamp"}}, "wcagLevel": "$wcagLevel"},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"_id.date": 1}}},
	}
	trendCursor, err := coll.Aggregate(ctx, trendPipe)
	if err == nil {
		defer trendCursor.Close(ctx)
		trendMap := make(map[string]*WcagTrendItem)
		for trendCursor.Next(ctx) {
			var res struct {
				ID struct {
					Date      string `bson:"date"`
					WcagLevel string `bson:"wcagLevel"`
				} `bson:"_id"`
				Count int `bson:"count"`
			}
			if err := trendCursor.Decode(&res); err == nil && res.ID.Date != "" {
				if _, ok := trendMap[res.ID.Date]; !ok {
					trendMap[res.ID.Date] = &WcagTrendItem{Date: res.ID.Date}
				}
				if res.ID.WcagLevel == "AAA" {
					trendMap[res.ID.Date].AAA = res.Count
				} else if res.ID.WcagLevel == "AA" {
					trendMap[res.ID.Date].AA = res.Count
				}
			}
		}

		data.WcagTrend = []WcagTrendItem{}
		for _, item := range trendMap {
			data.WcagTrend = append(data.WcagTrend, *item)
		}
	}

	return data, nil
}

func queryPerformanceMetrics(ctx context.Context, coll *mongo.Collection, thirtyDaysAgo time.Time) (PerformanceMetricsData, error) {
	var data PerformanceMetricsData

	// Get all backend durations
	backendCursor, err := coll.Find(ctx, bson.M{
		"event":    EventImageGenerated,
		"status":   "success",
		"duration": bson.M{"$exists": true, "$ne": nil},
	})
	if err == nil {
		defer backendCursor.Close(ctx)
		durations := []float64{}
		minDur, maxDur := 999999.0, 0.0
		sumDur := 0.0
		for backendCursor.Next(ctx) {
			var metric struct {
				Duration *int `bson:"duration"`
			}
			if err := backendCursor.Decode(&metric); err == nil && metric.Duration != nil {
				val := float64(*metric.Duration)
				durations = append(durations, val)
				sumDur += val
				if val < minDur {
					minDur = val
				}
				if val > maxDur {
					maxDur = val
				}
			}
		}
		if len(durations) > 0 {
			data.BackendPerformance.AvgBackendDuration = sumDur / float64(len(durations))
			data.BackendPerformance.MinBackendDuration = minDur
			data.BackendPerformance.MaxBackendDuration = maxDur
			data.BackendPerformance.P50BackendDuration = calculatePercentile(durations, 0.50)
			data.BackendPerformance.P95BackendDuration = calculatePercentile(durations, 0.95)
			data.BackendPerformance.P99BackendDuration = calculatePercentile(durations, 0.99)
		}
	}

	// Local stub daily trends for simplicity in initial PR (can aggregate or calculate percentiles per date group in memory)
	data.BackendPerformance.BackendDurationTrend = []DurationTrendItem{}
	data.ClientPerformance.ClientDurationTrend = []DurationTrendItem{}
	data.PerformanceBySize = []PerformanceBySize{}

	return data, nil
}

func calculatePercentile(durations []float64, percentile float64) float64 {
	length := len(durations)
	if length == 0 {
		return 0.0
	}
	index := int(float64(length) * percentile)
	if index >= length {
		index = length - 1
	}
	return durations[index]
}
