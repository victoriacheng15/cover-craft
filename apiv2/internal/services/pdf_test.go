package services

import (
	"bytes"
	"testing"
)

func TestCompilePDF(t *testing.T) {
	deck := CarouselParams{
		Width:           1080,
		Height:          1350,
		BackgroundColor: "#0F172A",
		TextColor:       "#F8FAFC",
		Font:            CarouselParamsFontMontserrat,
		Slides: []CarouselSlideParams{
			{Title: "Slide One"},
			{Title: "Slide Two"},
		},
	}

	slide1, err := GenerateCarouselSlidePNG(deck, 0)
	if err != nil {
		t.Fatalf("failed to render slide 0: %v", err)
	}
	slide2, err := GenerateCarouselSlidePNG(deck, 1)
	if err != nil {
		t.Fatalf("failed to render slide 1: %v", err)
	}

	pdfBytes, err := CompilePDF(1080, 1350, [][]byte{slide1, slide2})
	if err != nil {
		t.Fatalf("expected successful PDF compilation, got error: %v", err)
	}

	if len(pdfBytes) == 0 {
		t.Fatal("expected non-empty PDF bytes, got 0")
	}

	// Validate standard PDF header magic bytes "%PDF-"
	if !bytes.HasPrefix(pdfBytes, []byte("%PDF-")) {
		t.Errorf("expected PDF header prefix %%PDF-, got %q", string(pdfBytes[:8]))
	}
}

func TestCompilePDF_CustomFormats(t *testing.T) {
	formats := []struct {
		name   string
		width  int
		height int
	}{
		{"Square (1080x1080)", 1080, 1080},
		{"Portrait (1080x1350)", 1080, 1350},
		{"Post (1200x627)", 1200, 627},
	}

	for _, fmtCase := range formats {
		t.Run(fmtCase.name, func(t *testing.T) {
			deck := CarouselParams{
				Width:           fmtCase.width,
				Height:          fmtCase.height,
				BackgroundColor: "#1E293B",
				TextColor:       "#F1F5F9",
				Font:            CarouselParamsFontRoboto,
				Slides: []CarouselSlideParams{
					{Title: "Format Test Slide"},
				},
			}

			slideBytes, err := GenerateCarouselSlidePNG(deck, 0)
			if err != nil {
				t.Fatalf("failed to render slide: %v", err)
			}

			pdfBytes, err := CompilePDF(fmtCase.width, fmtCase.height, [][]byte{slideBytes})
			if err != nil {
				t.Fatalf("failed to compile PDF for %s: %v", fmtCase.name, err)
			}

			if !bytes.HasPrefix(pdfBytes, []byte("%PDF-")) {
				t.Errorf("expected valid PDF header for %s", fmtCase.name)
			}
		})
	}
}

func TestCompileCarouselDeckPDF(t *testing.T) {
	subtitle := "Architectural overview of streaming pipelines"
	listItems := []string{
		"High throughput event ingestion",
		"Partition-based parallel consumption",
		"Zero-data-loss dead letter queues",
	}
	border := Double
	author := "@cloud_lead"

	deck := CarouselParams{
		Width:           1080,
		Height:          1350,
		BackgroundColor: "#0F172A",
		TextColor:       "#F8FAFC",
		Font:            CarouselParamsFontMontserrat,
		BorderStyle:     &border,
		AuthorHandle:    &author,
		Slides: []CarouselSlideParams{
			{
				Title:    "Event-Driven Architecture",
				Subtitle: &subtitle,
			},
			{
				Title:     "Key Principles",
				ListItems: &listItems,
			},
		},
	}

	pdfBytes, err := CompileCarouselDeckPDF(deck)
	if err != nil {
		t.Fatalf("expected successful deck compilation, got error: %v", err)
	}

	if !bytes.HasPrefix(pdfBytes, []byte("%PDF-")) {
		t.Errorf("expected valid PDF header, got %q", string(pdfBytes[:8]))
	}

	// Multi-page PDF with 2 high-res embedded slides should be substantial in size
	if len(pdfBytes) < 5000 {
		t.Errorf("expected substantial PDF byte size (>5000 bytes), got %d", len(pdfBytes))
	}
}

func TestCompilePDF_ValidationErrors(t *testing.T) {
	validSlide := []byte{0x89, 0x50, 0x4E, 0x47} // dummy bytes for dimension checks

	t.Run("Invalid width", func(t *testing.T) {
		if _, err := CompilePDF(0, 1080, [][]byte{validSlide}); err == nil {
			t.Error("expected error for zero width, got nil")
		}
	})

	t.Run("Invalid height", func(t *testing.T) {
		if _, err := CompilePDF(1080, -10, [][]byte{validSlide}); err == nil {
			t.Error("expected error for negative height, got nil")
		}
	})

	t.Run("Empty slide slice", func(t *testing.T) {
		if _, err := CompilePDF(1080, 1080, [][]byte{}); err == nil {
			t.Error("expected error for empty slide slice, got nil")
		}
	})

	t.Run("Empty slide bytes", func(t *testing.T) {
		if _, err := CompilePDF(1080, 1080, [][]byte{{}}); err == nil {
			t.Error("expected error for empty slide content, got nil")
		}
	})

	t.Run("Corrupt slide bytes", func(t *testing.T) {
		corrupt := []byte("this is not a valid image")
		if _, err := CompilePDF(1080, 1080, [][]byte{corrupt}); err == nil {
			t.Error("expected error for corrupt image bytes, got nil")
		}
	})

	t.Run("Empty deck slides in CompileCarouselDeckPDF", func(t *testing.T) {
		emptyDeck := CarouselParams{
			Width:  1080,
			Height: 1080,
			Slides: []CarouselSlideParams{},
		}
		if _, err := CompileCarouselDeckPDF(emptyDeck); err == nil {
			t.Error("expected error for empty deck slides, got nil")
		}
	})
}
