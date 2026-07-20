package services

import (
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
)

const (
	MaxTitleLength    = 40
	MaxSubtitleLength = 70
	MinSize           = 1
	MaxSize           = 1200
	WcagAaThreshold   = 4.5
)

var (
	HexColorRegex = regexp.MustCompile(`^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$`)
	AllowedFonts  = map[string]bool{
		"Montserrat":       true,
		"Roboto":           true,
		"Lato":             true,
		"Playfair Display": true,
		"Open Sans":        true,
	}
)

// RGB representation for contrast math
type RGB struct {
	R, G, B float64
}

// HexToRGB parses a hex color string into RGB values
func HexToRGB(hex string) (*RGB, error) {
	if !HexColorRegex.MatchString(hex) {
		return nil, fmt.Errorf("invalid hex color format")
	}

	cleaned := strings.Replace(hex, "#", "", 1)
	if len(cleaned) == 3 {
		cleaned = string([]byte{cleaned[0], cleaned[0], cleaned[1], cleaned[1], cleaned[2], cleaned[2]})
	}

	rVal, err := strconv.ParseInt(cleaned[0:2], 16, 64)
	if err != nil {
		return nil, err
	}
	gVal, err := strconv.ParseInt(cleaned[2:4], 16, 64)
	if err != nil {
		return nil, err
	}
	bVal, err := strconv.ParseInt(cleaned[4:6], 16, 64)
	if err != nil {
		return nil, err
	}

	return &RGB{R: float64(rVal), G: float64(gVal), B: float64(bVal)}, nil
}

// RelativeLuminance calculates luminance for WCAG math
func RelativeLuminance(rgb *RGB) float64 {
	channels := [3]float64{rgb.R, rgb.G, rgb.B}
	for i, c := range channels {
		norm := c / 255.0
		if norm <= 0.03928 {
			channels[i] = norm / 12.92
		} else {
			channels[i] = math.Pow((norm+0.055)/1.055, 2.4)
		}
	}
	return 0.2126*channels[0] + 0.7152*channels[1] + 0.0722*channels[2]
}

// GetContrastRatio returns the WCAG contrast ratio between two hex colors
func GetContrastRatio(color1, color2 string) (float64, error) {
	rgb1, err := HexToRGB(color1)
	if err != nil {
		return 0, err
	}
	rgb2, err := HexToRGB(color2)
	if err != nil {
		return 0, err
	}

	lum1 := RelativeLuminance(rgb1)
	lum2 := RelativeLuminance(rgb2)

	lighter := math.Max(lum1, lum2)
	darker := math.Min(lum1, lum2)

	return (lighter + 0.05) / (darker + 0.05), nil
}

// GetWCAGLevel maps a contrast ratio to a WCAG compliance level string
func GetWCAGLevel(ratio float64) string {
	if ratio >= 7.0 {
		return "AAA"
	}
	if ratio >= WcagAaThreshold {
		return "AA"
	}
	return "FAIL"
}

// ValidateImageParams checks all image constraints and compliance requirements
func ValidateImageParams(params ImageParams) []ValidationError {
	var errors []ValidationError

	// Size validation
	if params.Width < MinSize || params.Width > MaxSize {
		errors = append(errors, ValidationError{
			Field:   "width",
			Message: fmt.Sprintf("Width must be between %d and %d", MinSize, MaxSize),
		})
	}
	if params.Height < MinSize || params.Height > MaxSize {
		errors = append(errors, ValidationError{
			Field:   "height",
			Message: fmt.Sprintf("Height must be between %d and %d", MinSize, MaxSize),
		})
	}

	// Color format validation
	if !HexColorRegex.MatchString(params.BackgroundColor) {
		errors = append(errors, ValidationError{
			Field:   "backgroundColor",
			Message: "Color must be a valid HEX format (e.g., #FFFFFF or #FFF)",
		})
	}
	if !HexColorRegex.MatchString(params.TextColor) {
		errors = append(errors, ValidationError{
			Field:   "textColor",
			Message: "Color must be a valid HEX format (e.g., #FFFFFF or #FFF)",
		})
	}

	// Font validation
	if !AllowedFonts[string(params.Font)] {
		var fontNames []string
		for f := range AllowedFonts {
			fontNames = append(fontNames, f)
		}
		errors = append(errors, ValidationError{
			Field:   "font",
			Message: fmt.Sprintf("Font must be one of: %s", strings.Join(fontNames, ", ")),
		})
	}

	// Text length validation
	if strings.TrimSpace(params.Title) == "" {
		errors = append(errors, ValidationError{
			Field:   "title",
			Message: "Title is required",
		})
	} else if len(params.Title) > MaxTitleLength {
		errors = append(errors, ValidationError{
			Field:   "title",
			Message: fmt.Sprintf("Title must be %d characters or less", MaxTitleLength),
		})
	}

	if params.Subtitle != nil && len(*params.Subtitle) > MaxSubtitleLength {
		errors = append(errors, ValidationError{
			Field:   "subtitle",
			Message: fmt.Sprintf("Subtitle must be %d characters or less", MaxSubtitleLength),
		})
	}

	// Contrast validation (only if color formats are valid)
	if HexColorRegex.MatchString(params.BackgroundColor) && HexColorRegex.MatchString(params.TextColor) {
		ratio, err := GetContrastRatio(params.BackgroundColor, params.TextColor)
		if err != nil || ratio < WcagAaThreshold {
			errors = append(errors, ValidationError{
				Field:   "contrast",
				Message: fmt.Sprintf("Contrast ratio must be at least %.1f for WCAG AA compliance", WcagAaThreshold),
			})
		}
	}

	return errors
}

// ValidateBatchRequest checks multiple ImageParams constraints for bulk validation
func ValidateBatchRequest(requests []ImageParams) []ValidationError {
	var errors []ValidationError
	if len(requests) == 0 {
		errors = append(errors, ValidationError{
			Field:   "requests",
			Message: "Batch request must contain at least one configuration",
		})
		return errors
	}
	if len(requests) > 5 {
		errors = append(errors, ValidationError{
			Field:   "requests",
			Message: "Batch size exceeds the maximum limit of 5",
		})
		return errors
	}
	for i, req := range requests {
		subErrors := ValidateImageParams(req)
		for _, err := range subErrors {
			errors = append(errors, ValidationError{
				Field:   fmt.Sprintf("requests[%d].%s", i, err.Field),
				Message: err.Message,
			})
		}
	}
	return errors
}
