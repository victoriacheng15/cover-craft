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

func TestGeneratePNG_WithBorder(t *testing.T) {
	hasBorder := true
	params := ImageParams{
		Width:           800,
		Height:          600,
		BackgroundColor: "#1a1a1a",
		TextColor:       "#ffffff",
		Font:            "Montserrat",
		Title:           "With Inset Border",
		HasBorder:       &hasBorder,
	}

	pngBytes, err := GeneratePNG(params)
	if err != nil {
		t.Fatalf("expected success with border, got error: %v", err)
	}

	if len(pngBytes) == 0 {
		t.Error("expected non-empty byte slice for bordered cover")
	}
}

func TestRenderCarouselSlideFrame_SubtitleMode(t *testing.T) {
	subtitle := "A deep dive into distributed event streaming systems."
	author := "@software_lead"
	border := Single
	authorPos := CarouselParamsAuthorHandlePositionBottomLeft
	slideNumPos := CarouselParamsSlideNumberPositionTopRight
	showSlideNums := true

	deck := CarouselParams{
		Width:                1080,
		Height:               1350,
		BackgroundColor:      "#0F172A",
		TextColor:            "#F8FAFC",
		Font:                 CarouselParamsFontMontserrat,
		BorderStyle:          &border,
		AuthorHandle:         &author,
		AuthorHandlePosition: &authorPos,
		ShowSlideNumbers:     &showSlideNums,
		SlideNumberPosition:  &slideNumPos,
		Slides: []CarouselSlideParams{
			{
				Title:    "Architecting For Scale",
				Subtitle: &subtitle,
			},
			{
				Title: "Slide Two Without Subtitle",
			},
		},
	}

	img, err := RenderCarouselSlideFrame(deck, 0)
	if err != nil {
		t.Fatalf("expected successful carousel slide rendering, got error: %v", err)
	}

	if img.Bounds().Dx() != 1080 || img.Bounds().Dy() != 1350 {
		t.Errorf("expected bounds 1080x1350, got %dx%d", img.Bounds().Dx(), img.Bounds().Dy())
	}

	// Render slide without subtitle
	img2, err := RenderCarouselSlideFrame(deck, 1)
	if err != nil {
		t.Fatalf("expected success for slide 2, got error: %v", err)
	}
	if img2 == nil {
		t.Fatal("expected non-nil image for slide 2")
	}
}

func TestRenderCarouselSlideFrame_ListMode(t *testing.T) {
	listItems := []string{
		"Decouple compute from state storage",
		"Partition streams using stable hash keys",
		"Implement backpressure across producer pipelines",
		"Monitor p99 latency SLAs rigorously",
	}
	border := Double
	author := "@cloud_architect"
	align := CarouselSlideParamsTextAlignLeft
	vAlign := CarouselSlideParamsVerticalAlignCenter

	deck := CarouselParams{
		Width:           1080,
		Height:          1080,
		BackgroundColor: "#1E293B",
		TextColor:       "#F1F5F9",
		Font:            CarouselParamsFontRoboto,
		BorderStyle:     &border,
		AuthorHandle:    &author,
		Slides: []CarouselSlideParams{
			{
				Title:         "Key Principles of Stream Processing",
				ListItems:     &listItems,
				TextAlign:     &align,
				VerticalAlign: &vAlign,
			},
		},
	}

	img, err := RenderCarouselSlideFrame(deck, 0)
	if err != nil {
		t.Fatalf("expected successful list slide rendering, got error: %v", err)
	}

	if img.Bounds().Dx() != 1080 || img.Bounds().Dy() != 1080 {
		t.Errorf("expected bounds 1080x1080, got %dx%d", img.Bounds().Dx(), img.Bounds().Dy())
	}
}

func TestRenderCarouselSlideFrame_Alignments(t *testing.T) {
	alignments := []struct {
		hAlign CarouselSlideParamsTextAlign
		vAlign CarouselSlideParamsVerticalAlign
	}{
		{CarouselSlideParamsTextAlignLeft, CarouselSlideParamsVerticalAlignTop},
		{CarouselSlideParamsTextAlignCenter, CarouselSlideParamsVerticalAlignCenter},
		{CarouselSlideParamsTextAlignRight, CarouselSlideParamsVerticalAlignBottom},
	}

	for _, align := range alignments {
		t.Run(string(align.hAlign)+"-"+string(align.vAlign), func(t *testing.T) {
			sub := "Testing alignment combinations"
			deck := CarouselParams{
				Width:           1080,
				Height:          1080,
				BackgroundColor: "#000000",
				TextColor:       "#FFFFFF",
				Font:            CarouselParamsFontLato,
				Slides: []CarouselSlideParams{
					{
						Title:         "Alignment Test",
						Subtitle:      &sub,
						TextAlign:     &align.hAlign,
						VerticalAlign: &align.vAlign,
					},
				},
			}

			img, err := RenderCarouselSlideFrame(deck, 0)
			if err != nil {
				t.Fatalf("failed to render alignment combination: %v", err)
			}
			if img == nil {
				t.Fatal("expected non-nil image")
			}
		})
	}
}

func TestRenderCarouselSlideFrame_SlideOverrides(t *testing.T) {
	bgOverride := "#312E81"
	textOverride := "#E0E7FF"
	sub := "Checking per-slide theme overrides"

	deck := CarouselParams{
		Width:           1080,
		Height:          1080,
		BackgroundColor: "#000000",
		TextColor:       "#FFFFFF",
		Font:            CarouselParamsFontOpenSans,
		Slides: []CarouselSlideParams{
			{
				Title:           "Overridden Slide",
				Subtitle:        &sub,
				BackgroundColor: &bgOverride,
				TextColor:       &textOverride,
			},
		},
	}

	img, err := RenderCarouselSlideFrame(deck, 0)
	if err != nil {
		t.Fatalf("expected successful slide override rendering, got: %v", err)
	}
	if img == nil {
		t.Fatal("expected non-nil image")
	}
}

func TestRenderCarouselSlideFrame_OutOfBounds(t *testing.T) {
	deck := CarouselParams{
		Width:           1080,
		Height:          1080,
		BackgroundColor: "#000000",
		TextColor:       "#FFFFFF",
		Font:            CarouselParamsFontPlayfairDisplay,
		Slides: []CarouselSlideParams{
			{Title: "Only Slide"},
		},
	}

	if _, err := RenderCarouselSlideFrame(deck, -1); err == nil {
		t.Error("expected error for negative slide index, got nil")
	}
	if _, err := RenderCarouselSlideFrame(deck, 1); err == nil {
		t.Error("expected error for out of bounds slide index, got nil")
	}
}

func TestRenderCarouselSlideFrame_InvalidFont(t *testing.T) {
	deck := CarouselParams{
		Width:           1080,
		Height:          1080,
		BackgroundColor: "#000000",
		TextColor:       "#FFFFFF",
		Font:            "NonExistentFont",
		Slides: []CarouselSlideParams{
			{Title: "Title"},
		},
	}

	if _, err := RenderCarouselSlideFrame(deck, 0); err == nil {
		t.Error("expected error for missing font, got nil")
	}
}

func TestGenerateCarouselSlidePNG(t *testing.T) {
	sub := "Testing PNG encoding helper"
	deck := CarouselParams{
		Width:           1080,
		Height:          1080,
		BackgroundColor: "#111827",
		TextColor:       "#F9FAFB",
		Font:            CarouselParamsFontMontserrat,
		Slides: []CarouselSlideParams{
			{
				Title:    "PNG Encoding Test",
				Subtitle: &sub,
			},
		},
	}

	pngBytes, err := GenerateCarouselSlidePNG(deck, 0)
	if err != nil {
		t.Fatalf("expected success, got error: %v", err)
	}

	// Verify PNG magic bytes: \x89PNG\r\n\x1a\n
	pngMagic := []byte{0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A}
	if len(pngBytes) < 8 {
		t.Fatalf("png bytes length %d too short", len(pngBytes))
	}
	for i := 0; i < 8; i++ {
		if pngBytes[i] != pngMagic[i] {
			t.Errorf("byte %d does not match PNG magic: got 0x%02X, expected 0x%02X", i, pngBytes[i], pngMagic[i])
		}
	}
}
