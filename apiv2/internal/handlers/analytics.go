package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"time"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/db"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

const (
	EventGenerateClick         = "generate_click"
	EventDownloadClick         = "download_click"
	EventImageGenerated        = "image_generated"
	EventGenerateGifClick      = "generate_gif_click"
	EventDownloadGifClick      = "download_gif_click"
	EventGifGenerated          = "gif_generated"
	EventGenerateCarouselClick = "generate_carousel_click"
	EventDownloadCarouselClick = "download_carousel_click"
	EventCarouselGenerated     = "carousel_generated"
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
	HourlyTrend                []HourlyTrendItem `json:"hourlyTrend"`
}

type FormatItem struct {
	Format string `json:"format"`
	Count  int    `json:"count"`
}

type BorderDistribution struct {
	WithBorder    int `json:"withBorder"`
	WithoutBorder int `json:"withoutBorder"`
}

type SlideCountItem struct {
	Range string `json:"range"`
	Count int    `json:"count"`
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

type SubtitleLengthStats struct {
	ID                interface{} `json:"_id"`
	AvgSubtitleLength float64     `json:"avgSubtitleLength"`
	MinSubtitleLength int         `json:"minSubtitleLength"`
	MaxSubtitleLength int         `json:"maxSubtitleLength"`
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
	SubtitleLengthStats       SubtitleLengthStats  `json:"subtitleLengthStats"`
	TitleLengthDistribution   TitleDistribution    `json:"titleLengthDistribution"`
	SubtitleUsagePercent      float64              `json:"subtitleUsagePercent"`
	SubtitleUsageDistribution SubtitleDistribution `json:"subtitleUsageDistribution"`
	SubtitleTrendOverTime     []WeeklyTrendItem    `json:"subtitleTrendOverTime"`
	FormatDistribution        []FormatItem         `json:"formatDistribution"`
	BorderUsagePercent        float64              `json:"borderUsagePercent"`
	BorderUsageDistribution   BorderDistribution   `json:"borderUsageDistribution"`
	AvgSlideCount             float64              `json:"avgSlideCount"`
	SlideCountDistribution    []SlideCountItem     `json:"slideCountDistribution"`
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
	AvgBackendDuration         float64             `json:"avgBackendDuration"`
	MinBackendDuration         float64             `json:"minBackendDuration"`
	MaxBackendDuration         float64             `json:"maxBackendDuration"`
	P50BackendDuration         float64             `json:"p50BackendDuration"`
	P95BackendDuration         float64             `json:"p95BackendDuration"`
	P99BackendDuration         float64             `json:"p99BackendDuration"`
	BackendDurationTrend       []DurationTrendItem `json:"backendDurationTrend"`
	AvgGifBackendDuration      float64             `json:"avgGifBackendDuration,omitempty"`
	AvgCarouselBackendDuration float64             `json:"avgCarouselBackendDuration,omitempty"`
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

	// Total generation attempts across all formats (image, gif, carousel)
	attempts, err := coll.CountDocuments(ctx, bson.M{
		"event": bson.M{"$in": bson.A{EventGenerateClick, EventGenerateGifClick, EventGenerateCarouselClick}},
	})
	if err != nil {
		return data, err
	}
	data.UiGenerationAttempts = int(attempts)

	// Total successful generations across all formats (image, gif, carousel)
	totalSuccess, err := coll.CountDocuments(ctx, bson.M{
		"event":  bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
		"status": bson.M{"$in": bson.A{"success", "completed"}},
	})
	if err != nil {
		return data, err
	}
	data.TotalSuccessfulGenerations = int(totalSuccess)

	// Total downloads across all formats (image, gif, carousel)
	totalDownloads, err := coll.CountDocuments(ctx, bson.M{
		"event":  bson.M{"$in": bson.A{EventDownloadClick, EventDownloadGifClick, EventDownloadCarouselClick}},
		"status": "success",
	})
	if err != nil {
		return data, err
	}
	data.TotalDownloads = int(totalDownloads)

	// Rates
	if data.UiGenerationAttempts > 0 {
		data.DownloadRate = float64(data.TotalDownloads) / float64(data.UiGenerationAttempts) * 100
	}

	// Daily trend (IMAGE_GENERATED, GIF_GENERATED, and CAROUSEL_GENERATED successes)
	dailyPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"timestamp": bson.M{"$gte": thirtyDaysAgo},
			"event":     bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status":    bson.M{"$in": bson.A{"success", "completed"}},
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

	// Hourly trend (IMAGE_GENERATED, GIF_GENERATED, and CAROUSEL_GENERATED successes)
	hourlyPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"timestamp": bson.M{"$gte": thirtyDaysAgo},
			"event":     bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status":    bson.M{"$in": bson.A{"success", "completed"}},
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

	// Common filter for title analysis across all formats
	completeFilter := bson.M{
		"event":       bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
		"status":      bson.M{"$in": bson.A{"success", "completed"}},
		"titleLength": bson.M{"$exists": true, "$ne": nil},
	}

	// Top Fonts (pre-populate all available font presets with 0 counts)
	fontPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"event":  bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status": bson.M{"$in": bson.A{"success", "completed"}},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   "$font",
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"count": -1}}},
		{{Key: "$limit", Value: 10}},
	}
	fontCursor, err := coll.Aggregate(ctx, fontPipe)
	fontCounts := map[string]int{
		"Montserrat":       0,
		"Roboto":           0,
		"Lato":             0,
		"Playfair Display": 0,
		"Open Sans":        0,
	}
	allFonts := []string{"Montserrat", "Roboto", "Lato", "Playfair Display", "Open Sans"}
	if err == nil {
		defer fontCursor.Close(ctx)
		for fontCursor.Next(ctx) {
			var res struct {
				ID    string `bson:"_id"`
				Count int    `bson:"count"`
			}
			if err := fontCursor.Decode(&res); err == nil && res.ID != "" {
				if _, exists := fontCounts[res.ID]; !exists {
					allFonts = append(allFonts, res.ID)
				}
				fontCounts[res.ID] = res.Count
			}
		}
	}
	sort.SliceStable(allFonts, func(i, j int) bool {
		return fontCounts[allFonts[i]] > fontCounts[allFonts[j]]
	})
	data.TopFonts = make([]FontItem, 0, len(allFonts))
	for _, f := range allFonts {
		data.TopFonts = append(data.TopFonts, FontItem{Font: f, Count: fontCounts[f]})
	}

	// Top Sizes (pre-populate standard size presets with 0 counts)
	sizePipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"event":  bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status": bson.M{"$in": bson.A{"success", "completed"}},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   bson.M{"width": "$size.width", "height": "$size.height"},
			"count": bson.M{"$sum": 1},
		}}},
		{{Key: "$sort", Value: bson.M{"count": -1}}},
		{{Key: "$limit", Value: 10}},
	}
	sizeCursor, err := coll.Aggregate(ctx, sizePipe)
	sizeCounts := map[string]int{
		"Square (1080 × 1080)":   0,
		"Post (1200 × 627)":      0,
		"Portrait (1080 × 1350)": 0,
	}
	allSizes := []string{"Square (1080 × 1080)", "Post (1200 × 627)", "Portrait (1080 × 1350)"}
	if err == nil {
		defer sizeCursor.Close(ctx)
		for sizeCursor.Next(ctx) {
			var res struct {
				ID struct {
					Width  int `bson:"width"`
					Height int `bson:"height"`
				} `bson:"_id"`
				Count int `bson:"count"`
			}
			if err := sizeCursor.Decode(&res); err == nil {
				label := "Others"
				if res.ID.Width == 1200 && res.ID.Height == 627 {
					label = "Post (1200 × 627)"
				} else if res.ID.Width == 1080 && res.ID.Height == 1080 {
					label = "Square (1080 × 1080)"
				} else if res.ID.Width == 1080 && res.ID.Height == 1350 {
					label = "Portrait (1080 × 1350)"
				}

				if _, exists := sizeCounts[label]; !exists {
					allSizes = append(allSizes, label)
				}
				sizeCounts[label] += res.Count
			}
		}
	}
	sort.SliceStable(allSizes, func(i, j int) bool {
		return sizeCounts[allSizes[i]] > sizeCounts[allSizes[j]]
	})
	data.TopSizes = make([]SizeItem, 0, len(allSizes))
	for _, s := range allSizes {
		data.TopSizes = append(data.TopSizes, SizeItem{Size: s, Count: sizeCounts[s]})
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

	// Subtitle Stats (for documents with subtitleLength > 0)
	subStatsPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"event":          bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status":         bson.M{"$in": bson.A{"success", "completed"}},
			"subtitleLength": bson.M{"$gt": 0},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":               nil,
			"avgSubtitleLength": bson.M{"$avg": "$subtitleLength"},
			"minSubtitleLength": bson.M{"$min": "$subtitleLength"},
			"maxSubtitleLength": bson.M{"$max": "$subtitleLength"},
		}}},
	}
	subStatsCursor, err := coll.Aggregate(ctx, subStatsPipe)
	if err == nil {
		defer subStatsCursor.Close(ctx)
		if subStatsCursor.Next(ctx) {
			_ = subStatsCursor.Decode(&data.SubtitleLengthStats)
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
		"event":          bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
		"status":         bson.M{"$in": bson.A{"success", "completed"}},
		"subtitleLength": bson.M{"$gt": 0},
	})
	if totalCoversGenerated > 0 {
		data.SubtitleUsagePercent = float64(withSubtitle) / float64(totalCoversGenerated) * 100
	}

	// Subtitle Distribution (none: 0, short <= 17, medium <= 43, long > 43)
	subDistPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"event":          bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status":         bson.M{"$in": bson.A{"success", "completed"}},
			"subtitleLength": bson.M{"$exists": true, "$ne": nil},
		}}},
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
			"event":     bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status":    bson.M{"$in": bson.A{"success", "completed"}},
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

	// Format Distribution (Image Cover vs GIF Slideshow vs Carousel Deck)
	coverCount, _ := coll.CountDocuments(ctx, bson.M{"event": EventImageGenerated, "status": "success"})
	gifCount, _ := coll.CountDocuments(ctx, bson.M{"event": EventGifGenerated, "status": "success"})
	carouselCount, _ := coll.CountDocuments(ctx, bson.M{
		"event":  EventCarouselGenerated,
		"status": bson.M{"$in": bson.A{"success", "completed"}},
	})
	data.FormatDistribution = []FormatItem{
		{Format: "Image Cover", Count: int(coverCount)},
		{Format: "GIF Slideshow", Count: int(gifCount)},
		{Format: "Carousel Deck", Count: int(carouselCount)},
	}

	// Border Usage across all successful generations
	borderPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"event":  bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status": bson.M{"$in": bson.A{"success", "completed"}},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":   bson.M{"$ifNull": bson.A{"$hasBorder", false}},
			"count": bson.M{"$sum": 1},
		}}},
	}
	borderCursor, err := coll.Aggregate(ctx, borderPipe)
	if err == nil {
		defer borderCursor.Close(ctx)
		for borderCursor.Next(ctx) {
			var res struct {
				ID    bool `bson:"_id"`
				Count int  `bson:"count"`
			}
			if err := borderCursor.Decode(&res); err == nil {
				if res.ID {
					data.BorderUsageDistribution.WithBorder = res.Count
				} else {
					data.BorderUsageDistribution.WithoutBorder = res.Count
				}
			}
		}
		totalWithBorder := data.BorderUsageDistribution.WithBorder
		totalAll := totalWithBorder + data.BorderUsageDistribution.WithoutBorder
		if totalAll > 0 {
			data.BorderUsagePercent = float64(totalWithBorder) / float64(totalAll) * 100
		}
	}

	// Slide Count Stats for GIFs and Carousels
	slideStatsPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"event":      bson.M{"$in": bson.A{EventGifGenerated, EventCarouselGenerated}},
			"status":     bson.M{"$in": bson.A{"success", "completed"}},
			"slideCount": bson.M{"$exists": true, "$ne": nil},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id":           nil,
			"avgSlideCount": bson.M{"$avg": "$slideCount"},
		}}},
	}
	slideStatsCursor, err := coll.Aggregate(ctx, slideStatsPipe)
	if err == nil {
		defer slideStatsCursor.Close(ctx)
		if slideStatsCursor.Next(ctx) {
			var res struct {
				AvgSlideCount float64 `bson:"avgSlideCount"`
			}
			if err := slideStatsCursor.Decode(&res); err == nil {
				data.AvgSlideCount = res.AvgSlideCount
			}
		}
	}

	// Slide Count Distribution (2 slides, 3-4 slides, 5+ slides)
	slideDistPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"event":      bson.M{"$in": bson.A{EventGifGenerated, EventCarouselGenerated}},
			"status":     bson.M{"$in": bson.A{"success", "completed"}},
			"slideCount": bson.M{"$exists": true, "$ne": nil},
		}}},
		{{Key: "$group", Value: bson.M{
			"_id": bson.M{"$cond": bson.A{
				bson.M{"$eq": bson.A{"$slideCount", 2}},
				"2 slides",
				bson.M{"$cond": bson.A{
					bson.M{"$lte": bson.A{"$slideCount", 4}},
					"3-4 slides",
					"5+ slides",
				}},
			}},
			"count": bson.M{"$sum": 1},
		}}},
	}
	slideDistCursor, err := coll.Aggregate(ctx, slideDistPipe)
	data.SlideCountDistribution = []SlideCountItem{
		{Range: "2 slides", Count: 0},
		{Range: "3-4 slides", Count: 0},
		{Range: "5+ slides", Count: 0},
	}
	if err == nil {
		defer slideDistCursor.Close(ctx)
		slideCounts := make(map[string]int)
		for slideDistCursor.Next(ctx) {
			var res struct {
				ID    string `bson:"_id"`
				Count int    `bson:"count"`
			}
			if err := slideDistCursor.Decode(&res); err == nil && res.ID != "" {
				slideCounts[res.ID] = res.Count
			}
		}
		data.SlideCountDistribution = []SlideCountItem{
			{Range: "2 slides", Count: slideCounts["2 slides"]},
			{Range: "3-4 slides", Count: slideCounts["3-4 slides"]},
			{Range: "5+ slides", Count: slideCounts["5+ slides"]},
		}
	}

	return data, nil
}

func queryAccessibilityCompliance(ctx context.Context, coll *mongo.Collection, thirtyDaysAgo time.Time) (AccessibilityComplianceData, error) {
	var data AccessibilityComplianceData
	data.WcagDistribution = []WcagDistributionItem{
		{Level: "AAA", Count: 0},
		{Level: "AA", Count: 0},
	}

	// WCAG distribution
	wcagPipe := mongo.Pipeline{
		{{Key: "$match", Value: bson.M{
			"event":     bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status":    bson.M{"$in": bson.A{"success", "completed"}},
			"wcagLevel": bson.M{"$in": []string{"AA", "AAA"}},
		}}},
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
		{{Key: "$match", Value: bson.M{
			"event":         bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status":        bson.M{"$in": bson.A{"success", "completed"}},
			"contrastRatio": bson.M{"$exists": true},
		}}},
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
		{{Key: "$match", Value: bson.M{
			"timestamp": bson.M{"$gte": thirtyDaysAgo},
			"event":     bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
			"status":    bson.M{"$in": bson.A{"success", "completed"}},
			"wcagLevel": bson.M{"$in": []string{"AA", "AAA"}},
		}}},
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

	// Get all backend durations across all 3 generation formats
	backendCursor, err := coll.Find(ctx, bson.M{
		"event":    bson.M{"$in": bson.A{EventImageGenerated, EventGifGenerated, EventCarouselGenerated}},
		"status":   bson.M{"$in": bson.A{"success", "completed"}},
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

	// Get GIF backend durations
	gifCursor, err := coll.Find(ctx, bson.M{
		"event":    EventGifGenerated,
		"status":   "success",
		"duration": bson.M{"$exists": true, "$ne": nil},
	})
	if err == nil {
		defer gifCursor.Close(ctx)
		gifDurations := []float64{}
		sumGifDur := 0.0
		for gifCursor.Next(ctx) {
			var metric struct {
				Duration *int `bson:"duration"`
			}
			if err := gifCursor.Decode(&metric); err == nil && metric.Duration != nil {
				val := float64(*metric.Duration)
				gifDurations = append(gifDurations, val)
				sumGifDur += val
			}
		}
		if len(gifDurations) > 0 {
			data.BackendPerformance.AvgGifBackendDuration = sumGifDur / float64(len(gifDurations))
		}
	}

	// Get Carousel backend durations
	carouselCursor, err := coll.Find(ctx, bson.M{
		"event":    EventCarouselGenerated,
		"status":   bson.M{"$in": bson.A{"success", "completed"}},
		"duration": bson.M{"$exists": true, "$ne": nil},
	})
	if err == nil {
		defer carouselCursor.Close(ctx)
		carouselDurations := []float64{}
		sumCarouselDur := 0.0
		for carouselCursor.Next(ctx) {
			var metric struct {
				Duration *int `bson:"duration"`
			}
			if err := carouselCursor.Decode(&metric); err == nil && metric.Duration != nil {
				val := float64(*metric.Duration)
				carouselDurations = append(carouselDurations, val)
				sumCarouselDur += val
			}
		}
		if len(carouselDurations) > 0 {
			data.BackendPerformance.AvgCarouselBackendDuration = sumCarouselDur / float64(len(carouselDurations))
		}
	}

	// Get Client durations across client-tracked metrics
	clientCursor, err := coll.Find(ctx, bson.M{
		"clientDuration": bson.M{"$exists": true, "$ne": nil, "$gt": 0},
	})
	if err == nil {
		defer clientCursor.Close(ctx)
		clientDurations := []float64{}
		minClient, maxClient := 999999.0, 0.0
		sumClient := 0.0
		for clientCursor.Next(ctx) {
			var metric struct {
				ClientDuration *int `bson:"clientDuration"`
			}
			if err := clientCursor.Decode(&metric); err == nil && metric.ClientDuration != nil {
				val := float64(*metric.ClientDuration)
				clientDurations = append(clientDurations, val)
				sumClient += val
				if val < minClient {
					minClient = val
				}
				if val > maxClient {
					maxClient = val
				}
			}
		}
		if len(clientDurations) > 0 {
			data.ClientPerformance.AvgClientDuration = sumClient / float64(len(clientDurations))
			data.ClientPerformance.MinClientDuration = minClient
			data.ClientPerformance.MaxClientDuration = maxClient
			data.ClientPerformance.P50ClientDuration = calculatePercentile(clientDurations, 0.50)
			data.ClientPerformance.P95ClientDuration = calculatePercentile(clientDurations, 0.95)
			data.ClientPerformance.P99ClientDuration = calculatePercentile(clientDurations, 0.99)
		}
	}

	// Calculate network latency (difference between client duration and backend duration)
	if data.ClientPerformance.AvgClientDuration > 0 && data.BackendPerformance.AvgBackendDuration > 0 {
		diff := data.ClientPerformance.AvgClientDuration - data.BackendPerformance.AvgBackendDuration
		if diff > 0 {
			data.NetworkLatency.AvgNetworkLatency = diff
		}
	}

	// Group and compute performance by image size preset
	type sizePerfAgg struct {
		backendDurations []float64
		clientDurations  []float64
	}
	sizeMap := map[string]*sizePerfAgg{
		"Square (1080 × 1080)":   {backendDurations: []float64{}, clientDurations: []float64{}},
		"Post (1200 × 627)":      {backendDurations: []float64{}, clientDurations: []float64{}},
		"Portrait (1080 × 1350)": {backendDurations: []float64{}, clientDurations: []float64{}},
	}
	presetOrder := []string{"Square (1080 × 1080)", "Post (1200 × 627)", "Portrait (1080 × 1350)"}

	sizeCursor, err := coll.Find(ctx, bson.M{
		"size": bson.M{"$exists": true, "$ne": nil},
		"$or": bson.A{
			bson.M{"duration": bson.M{"$exists": true, "$ne": nil}},
			bson.M{"clientDuration": bson.M{"$exists": true, "$ne": nil}},
		},
	})
	if err == nil {
		defer sizeCursor.Close(ctx)
		for sizeCursor.Next(ctx) {
			var doc struct {
				Size           *db.SizePreset `bson:"size"`
				Duration       *int           `bson:"duration"`
				ClientDuration *int           `bson:"clientDuration"`
			}
			if err := sizeCursor.Decode(&doc); err == nil && doc.Size != nil {
				label := ""
				if doc.Size.Width == 1080 && doc.Size.Height == 1080 {
					label = "Square (1080 × 1080)"
				} else if doc.Size.Width == 1200 && doc.Size.Height == 627 {
					label = "Post (1200 × 627)"
				} else if doc.Size.Width == 1080 && doc.Size.Height == 1350 {
					label = "Portrait (1080 × 1350)"
				} else if doc.Size.Width > 0 && doc.Size.Height > 0 {
					label = fmt.Sprintf("Custom (%d × %d)", doc.Size.Width, doc.Size.Height)
					if _, exists := sizeMap[label]; !exists {
						sizeMap[label] = &sizePerfAgg{backendDurations: []float64{}, clientDurations: []float64{}}
						presetOrder = append(presetOrder, label)
					}
				}
				if label != "" {
					agg := sizeMap[label]
					if doc.Duration != nil {
						agg.backendDurations = append(agg.backendDurations, float64(*doc.Duration))
					}
					if doc.ClientDuration != nil && *doc.ClientDuration > 0 {
						agg.clientDurations = append(agg.clientDurations, float64(*doc.ClientDuration))
					}
				}
			}
		}

		data.PerformanceBySize = []PerformanceBySize{}
		for _, label := range presetOrder {
			agg := sizeMap[label]
			avgBackend := 0.0
			p95Backend := 0.0
			if len(agg.backendDurations) > 0 {
				sum := 0.0
				for _, d := range agg.backendDurations {
					sum += d
				}
				avgBackend = sum / float64(len(agg.backendDurations))
				p95Backend = calculatePercentile(agg.backendDurations, 0.95)
			}
			avgClient := 0.0
			p95Client := 0.0
			if len(agg.clientDurations) > 0 {
				sum := 0.0
				for _, d := range agg.clientDurations {
					sum += d
				}
				avgClient = sum / float64(len(agg.clientDurations))
				p95Client = calculatePercentile(agg.clientDurations, 0.95)
			}
			data.PerformanceBySize = append(data.PerformanceBySize, PerformanceBySize{
				Size:               label,
				AvgBackendDuration: avgBackend,
				P95BackendDuration: p95Backend,
				AvgClientDuration:  avgClient,
				P95ClientDuration:  p95Client,
			})
		}
	}

	data.BackendPerformance.BackendDurationTrend = []DurationTrendItem{}
	data.ClientPerformance.ClientDurationTrend = []DurationTrendItem{}

	return data, nil
}

func calculatePercentile(durations []float64, percentile float64) float64 {
	length := len(durations)
	if length == 0 {
		return 0.0
	}
	sorted := make([]float64, length)
	copy(sorted, durations)
	sort.Float64s(sorted)
	index := int(float64(length) * percentile)
	if index >= length {
		index = length - 1
	}
	return sorted[index]
}
