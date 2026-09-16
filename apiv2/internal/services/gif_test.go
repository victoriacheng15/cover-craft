package services

import (
	"bytes"
	"image/gif"
	"testing"
)

func TestGenerateGIF_Success(t *testing.T) {
	subText := "Second Slide Subtitle"
	textColor := "#F9FAFB"
	hasBorder := true
	delay1500 := GifParamsDelayMs(1500)

	params := GifParams{
		Width:           400,
		Height:          300,
		BackgroundColor: "#1E3A8A",
		DelayMs:         &delay1500,
		Slides: []GifSlideParams{
			{
				Title:     "Slide 1: Overview",
				Font:      GifSlideParamsFontMontserrat,
				TextColor: &textColor,
				HasBorder: &hasBorder,
			},
			{
				Title:    "Slide 2: Details",
				Subtitle: &subText,
				Font:     GifSlideParamsFontRoboto,
				// TextColor omitted to test auto-generated WCAG AA compliant color
			},
		},
	}

	gifBytes, err := GenerateGIF(params)
	if err != nil {
		t.Fatalf("expected successful GIF generation, got error: %v", err)
	}

	if len(gifBytes) == 0 {
		t.Fatal("expected non-empty byte slice, got 0 bytes")
	}

	decoded, err := gif.DecodeAll(bytes.NewReader(gifBytes))
	if err != nil {
		t.Fatalf("failed to decode generated GIF: %v", err)
	}

	if len(decoded.Image) != 2 {
		t.Errorf("expected 2 frames, got %d", len(decoded.Image))
	}

	if len(decoded.Delay) != 2 {
		t.Errorf("expected 2 delay entries, got %d", len(decoded.Delay))
	} else {
		// 1500ms -> 150 hundredths of a second
		if decoded.Delay[0] != 150 || decoded.Delay[1] != 150 {
			t.Errorf("expected delay 150, got [%d, %d]", decoded.Delay[0], decoded.Delay[1])
		}
	}

	if decoded.LoopCount != 0 {
		t.Errorf("expected loop count 0 (infinite), got %d", decoded.LoopCount)
	}
}

func TestGenerateGIF_ThreeSlidesWithPresetDelay(t *testing.T) {
	delay2000 := GifParamsDelayMs(2000)

	params := GifParams{
		Width:           300,
		Height:          200,
		BackgroundColor: "#000000",
		DelayMs:         &delay2000,
		Slides: []GifSlideParams{
			{Title: "Frame 1", Font: GifSlideParamsFontMontserrat},
			{Title: "Frame 2", Font: GifSlideParamsFontRoboto},
			{Title: "Frame 3", Font: GifSlideParamsFontLato},
		},
	}

	gifBytes, err := GenerateGIF(params)
	if err != nil {
		t.Fatalf("expected successful GIF generation, got error: %v", err)
	}

	decoded, err := gif.DecodeAll(bytes.NewReader(gifBytes))
	if err != nil {
		t.Fatalf("failed to decode generated GIF: %v", err)
	}

	if len(decoded.Image) != 3 {
		t.Errorf("expected 3 frames, got %d", len(decoded.Image))
	}

	if decoded.Delay[0] != 200 {
		t.Errorf("expected delay 200 (2000ms), got %d", decoded.Delay[0])
	}
}

func TestGenerateGIF_FailsLessThanTwoSlides(t *testing.T) {
	params := GifParams{
		Width:           400,
		Height:          300,
		BackgroundColor: "#374151",
		Slides: []GifSlideParams{
			{Title: "Only One", Font: GifSlideParamsFontMontserrat},
		},
	}

	_, err := GenerateGIF(params)
	if err == nil {
		t.Fatal("expected error when generating GIF with less than 2 slides, got nil")
	}
}

func TestGenerateGIF_InvalidFontFails(t *testing.T) {
	params := GifParams{
		Width:           400,
		Height:          300,
		BackgroundColor: "#374151",
		Slides: []GifSlideParams{
			{Title: "Slide 1", Font: "NonExistentFont"},
			{Title: "Slide 2", Font: GifSlideParamsFontMontserrat},
		},
	}

	_, err := GenerateGIF(params)
	if err == nil {
		t.Fatal("expected error with invalid font, got nil")
	}
}
