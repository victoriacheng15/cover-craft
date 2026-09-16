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
	BorderInset           = 12.0
	BorderWidth           = 4.0
	HeadingMinSize        = 32.0
	HeadingPercentage     = 0.075
	SubheadingMinSize     = 24.0
	SubheadingPercentage  = 0.055
	LineSpacingMultiplier = 1.2
)

// RenderFrame renders a canvas frame into an image.Image
func RenderFrame(width, height int, backgroundColor, textColor, font, title string, subtitle *string, hasBorder bool) (image.Image, error) {
	dc := gg.NewContext(width, height)

	// Fill background
	dc.SetHexColor(backgroundColor)
	dc.Clear()

	// Draw inset border if enabled
	if hasBorder {
		dc.SetHexColor(textColor)
		dc.SetLineWidth(BorderWidth)
		dc.DrawRectangle(BorderInset, BorderInset, float64(width)-2*BorderInset, float64(height)-2*BorderInset)
		dc.Stroke()
	}

	// Calculate text dimensions
	maxTextWidth := float64(width) - Padding*2
	centerX := float64(width) / 2.0
	centerY := float64(height) / 2.0

	// Dynamic scaling base
	scaleBase := float64(width)
	if float64(height) > scaleBase {
		scaleBase = float64(height)
	}

	// Calculate font sizes
	headingFontSize := math.Round(math.Max(HeadingMinSize, scaleBase*HeadingPercentage))
	subheadingFontSize := math.Round(math.Max(SubheadingMinSize, scaleBase*SubheadingPercentage))
	lineSpacing := headingFontSize * LineSpacingMultiplier

	// Clean font name (e.g. "Open Sans" -> "OpenSans")
	fontNameCleaned := strings.ReplaceAll(font, " ", "")

	// Load Bold Font for Heading
	boldFontFile := fmt.Sprintf("%s-Bold.ttf", fontNameCleaned)
	boldFontPath, err := findFontPath(boldFontFile)
	if err != nil {
		return nil, err
	}
	if err := dc.LoadFontFace(boldFontPath, headingFontSize); err != nil {
		return nil, fmt.Errorf("failed to load bold font face from %s: %w", boldFontPath, err)
	}

	dc.SetHexColor(textColor)

	hasSubtitle := subtitle != nil && *subtitle != ""
	headingY := centerY
	if hasSubtitle {
		headingY = centerY - lineSpacing/2
	}

	// Draw heading text
	if err := drawTextWithCompression(dc, title, centerX, headingY, maxTextWidth); err != nil {
		return nil, err
	}

	// Load Regular Font and Draw Subheading
	if hasSubtitle {
		regularFontFile := fmt.Sprintf("%s-Regular.ttf", fontNameCleaned)
		regularFontPath, err := findFontPath(regularFontFile)
		if err != nil {
			return nil, err
		}
		if err := dc.LoadFontFace(regularFontPath, subheadingFontSize); err != nil {
			return nil, fmt.Errorf("failed to load regular font face from %s: %w", regularFontPath, err)
		}

		dc.SetHexColor(textColor)
		subheadingY := centerY + lineSpacing/2

		if err := drawTextWithCompression(dc, *subtitle, centerX, subheadingY, maxTextWidth); err != nil {
			return nil, err
		}
	}

	return dc.Image(), nil
}

// GeneratePNG renders the canvas and returns raw PNG bytes
func GeneratePNG(params ImageParams) ([]byte, error) {
	hasBorder := params.HasBorder != nil && *params.HasBorder
	img, err := RenderFrame(params.Width, params.Height, params.BackgroundColor, params.TextColor, string(params.Font), params.Title, params.Subtitle, hasBorder)
	if err != nil {
		return nil, err
	}
	return encodePNG(img)
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
