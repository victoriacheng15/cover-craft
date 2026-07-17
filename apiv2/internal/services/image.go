package services

import (
	"bytes"
	"fmt"
	"image"
	"image/png"
	"math"
	"os"
	"path/filepath"
	"strings"

	"github.com/fogleman/gg"
)

// Constants matching shared configuration
const (
	Padding               = 40.0
	HeadingMinSize        = 32.0
	HeadingPercentage     = 0.075
	SubheadingMinSize     = 24.0
	SubheadingPercentage  = 0.055
	LineSpacingMultiplier = 1.2
)

// ImageParams holds the rendering configuration for a cover image
type ImageParams struct {
	Width           int    `json:"width"`
	Height          int    `json:"height"`
	BackgroundColor string `json:"backgroundColor"`
	TextColor       string `json:"textColor"`
	Font            string `json:"font"`
	Title           string `json:"title"`
	Subtitle        string `json:"subtitle"`
}

// GeneratePNG renders the canvas and returns raw PNG bytes
func GeneratePNG(params ImageParams) ([]byte, error) {
	dc := gg.NewContext(params.Width, params.Height)

	// Fill background
	dc.SetHexColor(params.BackgroundColor)
	dc.Clear()

	// Calculate text dimensions
	maxTextWidth := float64(params.Width) - Padding*2
	centerX := float64(params.Width) / 2.0
	centerY := float64(params.Height) / 2.0

	// Dynamic scaling base
	scaleBase := float64(params.Width)
	if float64(params.Height) > scaleBase {
		scaleBase = float64(params.Height)
	}

	// Calculate font sizes
	headingFontSize := math.Round(math.Max(HeadingMinSize, scaleBase*HeadingPercentage))
	subheadingFontSize := math.Round(math.Max(SubheadingMinSize, scaleBase*SubheadingPercentage))
	lineSpacing := headingFontSize * LineSpacingMultiplier

	// Clean font name (e.g. "Open Sans" -> "OpenSans")
	fontNameCleaned := strings.ReplaceAll(params.Font, " ", "")

	// Load Bold Font for Heading
	boldFontFile := fmt.Sprintf("%s-Bold.ttf", fontNameCleaned)
	boldFontPath, err := findFontPath(boldFontFile)
	if err != nil {
		return nil, err
	}
	if err := dc.LoadFontFace(boldFontPath, headingFontSize); err != nil {
		return nil, fmt.Errorf("failed to load bold font face from %s: %w", boldFontPath, err)
	}

	dc.SetHexColor(params.TextColor)

	headingY := centerY
	if params.Subtitle != "" {
		headingY = centerY - lineSpacing/2
	}

	// Draw heading text
	if err := drawTextWithCompression(dc, params.Title, centerX, headingY, maxTextWidth); err != nil {
		return nil, err
	}

	// Load Regular Font and Draw Subheading
	if params.Subtitle != "" {
		regularFontFile := fmt.Sprintf("%s-Regular.ttf", fontNameCleaned)
		regularFontPath, err := findFontPath(regularFontFile)
		if err != nil {
			return nil, err
		}
		if err := dc.LoadFontFace(regularFontPath, subheadingFontSize); err != nil {
			return nil, fmt.Errorf("failed to load regular font face from %s: %w", regularFontPath, err)
		}

		dc.SetHexColor(params.TextColor)
		subheadingY := centerY + lineSpacing/2

		if err := drawTextWithCompression(dc, params.Subtitle, centerX, subheadingY, maxTextWidth); err != nil {
			return nil, err
		}
	}

	return encodePNG(dc.Image())
}

// drawTextWithCompression mimics canvas fillText with a maxWidth parameter
func drawTextWithCompression(dc *gg.Context, text string, x, y, maxWidth float64) error {
	w, _ := dc.MeasureString(text)
	if w > maxWidth {
		scaleX := maxWidth / w
		dc.Push()
		dc.Scale(scaleX, 1.0)
		dc.DrawStringAnchored(text, x/scaleX, y, 0.5, 0.5)
		dc.Pop()
	} else {
		dc.DrawStringAnchored(text, x, y, 0.5, 0.5)
	}
	return nil
}

// encodePNG helper to marshal image interface to raw PNG bytes
func encodePNG(img image.Image) ([]byte, error) {
	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

// findFontPath traverses up the directory tree to search for fonts relative to working directory (supports test context)
func findFontPath(fontFile string) (string, error) {
	dir := "."
	for i := 0; i < 4; i++ {
		path := filepath.Join(dir, "assets", "fonts", fontFile)
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
		pathWithPrefix := filepath.Join(dir, "apiv2", "assets", "fonts", fontFile)
		if _, err := os.Stat(pathWithPrefix); err == nil {
			return pathWithPrefix, nil
		}
		dir = filepath.Join(dir, "..")
	}
	return "", fmt.Errorf("could not find font file %s in local or ancestor asset directories", fontFile)
}
