package services

import (
	"testing"
)

func TestGeneratePNG(t *testing.T) {
	subText := "Beautiful cover image generation"
	params := ImageParams{
		Width:           800,
		Height:          600,
		BackgroundColor: "#000d33",
		TextColor:       "#ff5733",
		Font:            "Montserrat",
		Title:           "Go Rendering Service",
		Subtitle:        &subText,
	}

	pngBytes, err := GeneratePNG(params)
	if err != nil {
		t.Fatalf("expected successful PNG generation, got error: %v", err)
	}

	if len(pngBytes) == 0 {
		t.Error("expected non-empty byte slice, got 0 bytes")
	}
}

func TestGeneratePNG_FontNotFound(t *testing.T) {
	params := ImageParams{
		Width:           800,
		Height:          600,
		BackgroundColor: "#ffffff",
		TextColor:       "#000000",
		Font:            "InvalidFakeFontName",
		Title:           "Should Fail Font Load",
	}

	_, err := GeneratePNG(params)
	if err == nil {
		t.Fatal("expected error due to missing font, but got nil")
	}
}

func TestGeneratePNG_NoSubtitle(t *testing.T) {
	params := ImageParams{
		Width:           400,
		Height:          300,
		BackgroundColor: "#000000",
		TextColor:       "#ffffff",
		Font:            "Roboto",
		Title:           "No Subtitle Test",
		Subtitle:        nil,
	}

	pngBytes, err := GeneratePNG(params)
	if err != nil {
		t.Fatalf("expected success without subtitle, got error: %v", err)
	}

	if len(pngBytes) == 0 {
		t.Error("expected non-empty byte slice")
	}
}
