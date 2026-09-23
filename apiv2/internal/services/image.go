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

// RenderCarouselSlideFrame renders an individual carousel slide canvas frame into an image.Image
func RenderCarouselSlideFrame(deck CarouselParams, slideIndex int) (image.Image, error) {
	if slideIndex < 0 || slideIndex >= len(deck.Slides) {
		return nil, fmt.Errorf("slide index %d out of bounds (total slides: %d)", slideIndex, len(deck.Slides))
	}

	slide := deck.Slides[slideIndex]

	// Determine effective colors for this slide
	backgroundColor := deck.BackgroundColor
	if slide.BackgroundColor != nil && strings.TrimSpace(*slide.BackgroundColor) != "" {
		backgroundColor = *slide.BackgroundColor
	}

	textColor := deck.TextColor
	if slide.TextColor != nil && strings.TrimSpace(*slide.TextColor) != "" {
		textColor = *slide.TextColor
	}

	dc := gg.NewContext(deck.Width, deck.Height)

	// Fill background
	dc.SetHexColor(backgroundColor)
	dc.Clear()

	// Draw border if requested
	if deck.BorderStyle != nil && *deck.BorderStyle != None {
		dc.SetHexColor(textColor)
		switch *deck.BorderStyle {
		case Single:
			inset := 18.0
			dc.SetLineWidth(BorderWidth)
			dc.DrawRectangle(inset, inset, float64(deck.Width)-2*inset, float64(deck.Height)-2*inset)
			dc.Stroke()
		case Double:
			// Outer border
			outerInset := 18.0
			dc.SetLineWidth(BorderWidth)
			dc.DrawRectangle(outerInset, outerInset, float64(deck.Width)-2*outerInset, float64(deck.Height)-2*outerInset)
			dc.Stroke()
			// Inner border: 10px gap from outer border (28px total)
			innerInset := 28.0
			dc.SetLineWidth(BorderWidth)
			dc.DrawRectangle(innerInset, innerInset, float64(deck.Width)-2*innerInset, float64(deck.Height)-2*innerInset)
			dc.Stroke()
		}
	}

	// Clean font name
	fontNameCleaned := strings.ReplaceAll(string(deck.Font), " ", "")

	// Load fonts
	headingFontSize := math.Round(math.Max(HeadingMinSize, float64(deck.Width)*0.052))
	bodyFontSize := math.Round(math.Max(SubheadingMinSize, float64(deck.Width)*0.034))
	cornerFontSize := math.Round(math.Max(16.0, float64(deck.Width)*0.022))

	boldFontFile := fmt.Sprintf("%s-Bold.ttf", fontNameCleaned)
	boldFontPath, err := findFontPath(boldFontFile)
	if err != nil {
		return nil, err
	}

	regularFontFile := fmt.Sprintf("%s-Regular.ttf", fontNameCleaned)
	regularFontPath, err := findFontPath(regularFontFile)
	if err != nil {
		return nil, err
	}

	// Draw corner branding: Author Handle
	cornerMargin := 44.0
	if deck.AuthorHandle != nil && strings.TrimSpace(*deck.AuthorHandle) != "" {
		if err := dc.LoadFontFace(regularFontPath, cornerFontSize); err != nil {
			return nil, fmt.Errorf("failed to load regular font face for author handle: %w", err)
		}
		dc.SetHexColor(textColor)

		pos := CarouselParamsAuthorHandlePositionBottomLeft
		if deck.AuthorHandlePosition != nil {
			pos = *deck.AuthorHandlePosition
		}

		x, y, ax, ay := getCornerCoordinates(deck.Width, deck.Height, string(pos), cornerMargin)
		dc.DrawStringAnchored(*deck.AuthorHandle, x, y, ax, ay)
	}

	// Draw corner pagination: Slide Number (e.g., 01 / 05)
	showSlideNumbers := true
	if deck.ShowSlideNumbers != nil {
		showSlideNumbers = *deck.ShowSlideNumbers
	}
	if showSlideNumbers {
		if err := dc.LoadFontFace(regularFontPath, cornerFontSize); err != nil {
			return nil, fmt.Errorf("failed to load regular font face for slide number: %w", err)
		}
		dc.SetHexColor(textColor)

		slideNumPos := CarouselParamsSlideNumberPositionTopRight
		if deck.SlideNumberPosition != nil {
			slideNumPos = *deck.SlideNumberPosition
		}

		slideNumStr := fmt.Sprintf("%02d / %02d", slideIndex+1, len(deck.Slides))
		x, y, ax, ay := getCornerCoordinates(deck.Width, deck.Height, string(slideNumPos), cornerMargin)
		dc.DrawStringAnchored(slideNumStr, x, y, ax, ay)
	}

	// Calculate content boundary box
	contentMargin := 150.0
	topBound := 150.0
	bottomBound := float64(deck.Height) - 150.0
	boxHeight := bottomBound - topBound
	boxWidth := float64(deck.Width) - 2*contentMargin

	// Determine horizontal alignment
	textAlign := CarouselSlideParamsTextAlignLeft
	if slide.TextAlign != nil {
		textAlign = *slide.TextAlign
	}

	var ax, targetX float64
	switch textAlign {
	case CarouselSlideParamsTextAlignCenter:
		ax = 0.5
		targetX = float64(deck.Width) / 2.0
	case CarouselSlideParamsTextAlignRight:
		ax = 1.0
		targetX = float64(deck.Width) - contentMargin
	default: // Left
		ax = 0.0
		targetX = contentMargin
	}

	// Wrap Title lines
	if err := dc.LoadFontFace(boldFontPath, headingFontSize); err != nil {
		return nil, fmt.Errorf("failed to load bold font face for title: %w", err)
	}
	titleLines := dc.WordWrap(slide.Title, boxWidth)
	titleLineHeight := headingFontSize * LineSpacingMultiplier
	titleHeight := float64(len(titleLines)) * titleLineHeight

	// Check body mode: List items vs Subtitle
	hasListItems := slide.ListItems != nil && len(*slide.ListItems) > 0
	hasSubtitle := slide.Subtitle != nil && strings.TrimSpace(*slide.Subtitle) != ""

	gap := headingFontSize * 1.25
	bodyLineHeight := bodyFontSize * 1.35
	itemSpacing := bodyFontSize * 0.55

	var wrappedListItems [][]string
	var subtitleLines []string
	bodyHeight := 0.0

	if hasListItems {
		if err := dc.LoadFontFace(regularFontPath, bodyFontSize); err != nil {
			return nil, fmt.Errorf("failed to load regular font face for list items: %w", err)
		}
		items := *slide.ListItems
		for _, rawItem := range items {
			itemText := fmt.Sprintf("• %s", rawItem)
			lines := dc.WordWrap(itemText, boxWidth)
			wrappedListItems = append(wrappedListItems, lines)
			bodyHeight += float64(len(lines)) * bodyLineHeight
		}
		if len(items) > 1 {
			bodyHeight += float64(len(items)-1) * itemSpacing
		}
	} else if hasSubtitle {
		if err := dc.LoadFontFace(regularFontPath, bodyFontSize); err != nil {
			return nil, fmt.Errorf("failed to load regular font face for subtitle: %w", err)
		}
		subtitleLines = dc.WordWrap(*slide.Subtitle, boxWidth)
		bodyHeight = float64(len(subtitleLines)) * bodyLineHeight
	}

	totalContentHeight := titleHeight
	if hasListItems || hasSubtitle {
		totalContentHeight += gap + bodyHeight
	}

	// Determine vertical alignment and starting Y
	verticalAlign := CarouselSlideParamsVerticalAlignTop
	if slide.VerticalAlign != nil {
		verticalAlign = *slide.VerticalAlign
	}

	var startY float64
	switch verticalAlign {
	case CarouselSlideParamsVerticalAlignCenter:
		startY = topBound + (boxHeight-totalContentHeight)/2.0
	case CarouselSlideParamsVerticalAlignBottom:
		startY = bottomBound - totalContentHeight
	default: // Top
		startY = topBound
	}

	if startY < topBound {
		startY = topBound
	}

	// Draw Title
	if err := dc.LoadFontFace(boldFontPath, headingFontSize); err != nil {
		return nil, err
	}
	dc.SetHexColor(textColor)
	currentY := startY + headingFontSize
	for _, line := range titleLines {
		dc.DrawStringAnchored(line, targetX, currentY, ax, 0.8)
		currentY += titleLineHeight
	}

	// Draw Body (List or Subtitle)
	if hasListItems {
		if err := dc.LoadFontFace(regularFontPath, bodyFontSize); err != nil {
			return nil, err
		}
		dc.SetHexColor(textColor)
		currentY += gap - titleLineHeight + bodyFontSize
		for j, lines := range wrappedListItems {
			for _, line := range lines {
				dc.DrawStringAnchored(line, targetX, currentY, ax, 0.8)
				currentY += bodyLineHeight
			}
			if j < len(wrappedListItems)-1 {
				currentY += itemSpacing
			}
		}
	} else if hasSubtitle {
		if err := dc.LoadFontFace(regularFontPath, bodyFontSize); err != nil {
			return nil, err
		}
		dc.SetHexColor(textColor)
		currentY += gap - titleLineHeight + bodyFontSize
		for _, line := range subtitleLines {
			dc.DrawStringAnchored(line, targetX, currentY, ax, 0.8)
			currentY += bodyLineHeight
		}
	}

	return dc.Image(), nil
}

// GenerateCarouselSlidePNG renders an individual carousel slide and returns encoded PNG bytes
func GenerateCarouselSlidePNG(deck CarouselParams, slideIndex int) ([]byte, error) {
	img, err := RenderCarouselSlideFrame(deck, slideIndex)
	if err != nil {
		return nil, err
	}
	return encodePNG(img)
}

func getCornerCoordinates(width, height int, position string, margin float64) (x, y, ax, ay float64) {
	switch position {
	case "top-left":
		return margin, margin, 0.0, 0.0
	case "top-right":
		return float64(width) - margin, margin, 1.0, 0.0
	case "bottom-right":
		return float64(width) - margin, float64(height) - margin, 1.0, 1.0
	default: // bottom-left
		return margin, float64(height) - margin, 0.0, 1.0
	}
}
