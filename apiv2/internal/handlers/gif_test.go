package handlers

import (
	"bytes"
	"encoding/json"
	"image/gif"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/victoriacheng15/cover-craft/apiv2/internal/services"
)

func TestGenerateGifHandler_MethodNotAllowed(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/generateGif", nil)
	w := httptest.NewRecorder()

	GenerateGifHandler(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected status %d, got %d", http.StatusMethodNotAllowed, w.Code)
	}
}

func TestGenerateGifHandler_InvalidJSON(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/generateGif", bytes.NewReader([]byte("{not valid json}")))
	w := httptest.NewRecorder()

	GenerateGifHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}
}

func TestGenerateGifHandler_ValidationFailure(t *testing.T) {
	body := services.GifParams{
		Width:           800,
		Height:          600,
		BackgroundColor: "#374151",
		Slides: []services.GifSlideParams{
			{Title: "Only one slide", Font: services.GifSlideParamsFontMontserrat},
		},
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/api/generateGif", bytes.NewReader(bodyBytes))
	w := httptest.NewRecorder()

	GenerateGifHandler(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected status %d, got %d", http.StatusBadRequest, w.Code)
	}

	var resp map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp["error"] != "Validation failed" {
		t.Errorf("expected error 'Validation failed', got %v", resp["error"])
	}
}

func TestGenerateGifHandler_Success(t *testing.T) {
	filename := "test-gif"
	delay1500 := services.GifParamsDelayMs(1500)
	textColor := "#F9FAFB"
	hasBorder := true

	body := services.GifParams{
		Width:           400,
		Height:          300,
		BackgroundColor: "#1E3A8A",
		DelayMs:         &delay1500,
		Filename:        &filename,
		Slides: []services.GifSlideParams{
			{
				Title:     "Slide 1",
				Font:      services.GifSlideParamsFontMontserrat,
				TextColor: &textColor,
				HasBorder: &hasBorder,
			},
			{
				Title: "Slide 2",
				Font:  services.GifSlideParamsFontRoboto,
			},
		},
	}
	bodyBytes, _ := json.Marshal(body)

	req := httptest.NewRequest(http.MethodPost, "/api/generateGif", bytes.NewReader(bodyBytes))
	w := httptest.NewRecorder()

	GenerateGifHandler(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d. Body: %s", http.StatusOK, w.Code, w.Body.String())
	}

	contentType := w.Header().Get("Content-Type")
	if contentType != "image/gif" {
		t.Errorf("expected Content-Type 'image/gif', got '%s'", contentType)
	}

	decoded, err := gif.DecodeAll(w.Body)
	if err != nil {
		t.Fatalf("failed to decode output as GIF: %v", err)
	}

	if len(decoded.Image) != 2 {
		t.Errorf("expected 2 frames in animated GIF, got %d", len(decoded.Image))
	}
}

func TestGifHasBorder(t *testing.T) {
	// Empty slides
	if res := gifHasBorder(nil); res != nil {
		t.Errorf("expected nil for empty slides, got %v", *res)
	}

	// No border on any slide
	f := false
	slidesNoBorder := []services.GifSlideParams{
		{Title: "1", HasBorder: &f},
		{Title: "2"},
	}
	if res := gifHasBorder(slidesNoBorder); res == nil || *res != false {
		t.Errorf("expected false, got %v", res)
	}

	// Border on one slide
	tr := true
	slidesWithBorder := []services.GifSlideParams{
		{Title: "1", HasBorder: &f},
		{Title: "2", HasBorder: &tr},
	}
	if res := gifHasBorder(slidesWithBorder); res == nil || *res != true {
		t.Errorf("expected true, got %v", res)
	}
}
