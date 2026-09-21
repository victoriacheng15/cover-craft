package services

import (
	"bytes"
	"fmt"

	"github.com/phpdave11/gofpdf"
)

// CompilePDF assembles a slice of in-memory PNG image bytes into a multi-page PDF document
// with exact custom dimensions and zero margins (full bleed).
func CompilePDF(width, height int, slidePNGs [][]byte) ([]byte, error) {
	if width <= 0 || height <= 0 {
		return nil, fmt.Errorf("invalid dimensions for PDF compilation: %dx%d", width, height)
	}
	if len(slidePNGs) == 0 {
		return nil, fmt.Errorf("cannot compile PDF: no slide images provided")
	}

	orientation := "P"
	if width > height {
		orientation = "L"
	}

	pdf := gofpdf.NewCustom(&gofpdf.InitType{
		OrientationStr: orientation,
		UnitStr:        "pt",
		Size: gofpdf.SizeType{
			Wd: float64(width),
			Ht: float64(height),
		},
	})

	// Enforce zero margins and disable auto page breaking for full bleed slide placement
	pdf.SetMargins(0, 0, 0)
	pdf.SetAutoPageBreak(false, 0)

	for i, pngBytes := range slidePNGs {
		if len(pngBytes) == 0 {
			return nil, fmt.Errorf("slide %d image is empty", i)
		}

		pdf.AddPage()

		imgName := fmt.Sprintf("slide_%d.png", i)
		imgOptions := gofpdf.ImageOptions{
			ImageType: "PNG",
			ReadDpi:   false,
		}

		pdf.RegisterImageOptionsReader(imgName, imgOptions, bytes.NewReader(pngBytes))
		if err := pdf.Error(); err != nil {
			return nil, fmt.Errorf("failed to register slide %d image: %w", i, err)
		}

		pdf.ImageOptions(imgName, 0, 0, float64(width), float64(height), false, imgOptions, 0, "")
		if err := pdf.Error(); err != nil {
			return nil, fmt.Errorf("failed to place slide %d on page: %w", i, err)
		}
	}

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, fmt.Errorf("failed to write compiled PDF: %w", err)
	}

	return buf.Bytes(), nil
}

// CompileCarouselDeckPDF renders all slides in a CarouselParams deck and compiles them into a multi-page PDF.
func CompileCarouselDeckPDF(deck CarouselParams) ([]byte, error) {
	if len(deck.Slides) == 0 {
		return nil, fmt.Errorf("carousel deck must contain at least one slide")
	}

	slidePNGs := make([][]byte, len(deck.Slides))
	for i := range deck.Slides {
		pngBytes, err := GenerateCarouselSlidePNG(deck, i)
		if err != nil {
			return nil, fmt.Errorf("failed to render slide %d: %w", i, err)
		}
		slidePNGs[i] = pngBytes
	}

	return CompilePDF(deck.Width, deck.Height, slidePNGs)
}
