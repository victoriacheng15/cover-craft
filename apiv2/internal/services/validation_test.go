package services

import (
	"testing"
)

func TestValidateImageParams(t *testing.T) {
	subGood := "This is a good subtitle"
	subTooLong := makeStringOfLength(151)

	tests := []struct {
		name        string
		params      ImageParams
		expectError bool
		errorField  string
	}{
		{
			name: "Valid parameters succeed",
			params: ImageParams{
				Width:           800,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "Valid Title",
				Subtitle:        &subGood,
			},
			expectError: false,
		},
		{
			name: "Width too small fails",
			params: ImageParams{
				Width:           0,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "Valid Title",
			},
			expectError: true,
			errorField:  "width",
		},
		{
			name: "Width too large fails",
			params: ImageParams{
				Width:           3000,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "Valid Title",
			},
			expectError: true,
			errorField:  "width",
		},
		{
			name: "Height too small fails",
			params: ImageParams{
				Width:           800,
				Height:          0,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "Valid Title",
			},
			expectError: true,
			errorField:  "height",
		},
		{
			name: "Height too large fails",
			params: ImageParams{
				Width:           800,
				Height:          3000,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "Valid Title",
			},
			expectError: true,
			errorField:  "height",
		},
		{
			name: "Title too short fails",
			params: ImageParams{
				Width:           800,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "   ",
			},
			expectError: true,
			errorField:  "title",
		},
		{
			name: "Title too long fails",
			params: ImageParams{
				Width:           800,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           makeStringOfLength(101),
			},
			expectError: true,
			errorField:  "title",
		},
		{
			name: "Subtitle too long fails",
			params: ImageParams{
				Width:           800,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "Valid Title",
				Subtitle:        &subTooLong,
			},
			expectError: true,
			errorField:  "subtitle",
		},
		{
			name: "Invalid background color fails",
			params: ImageParams{
				Width:           800,
				Height:          600,
				BackgroundColor: "invalid-color",
				TextColor:       "#000000",
				Font:            "Montserrat",
				Title:           "Valid Title",
			},
			expectError: true,
			errorField:  "backgroundColor",
		},
		{
			name: "Invalid text color fails",
			params: ImageParams{
				Width:           800,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "invalid-color",
				Font:            "Montserrat",
				Title:           "Valid Title",
			},
			expectError: true,
			errorField:  "textColor",
		},
		{
			name: "Unsupported font fails",
			params: ImageParams{
				Width:           800,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "#000000",
				Font:            "Comic Sans",
				Title:           "Valid Title",
			},
			expectError: true,
			errorField:  "font",
		},
		{
			name: "Poor contrast ratio warning succeeds but flags contrast",
			params: ImageParams{
				Width:           800,
				Height:          600,
				BackgroundColor: "#ffffff",
				TextColor:       "#ffff00", // Yellow text on white background (poor contrast)
				Font:            "Montserrat",
				Title:           "Poor Contrast",
			},
			expectError: true,
			errorField:  "contrast",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateImageParams(tt.params)
			if tt.expectError {
				if len(errs) == 0 {
					t.Fatalf("expected validation errors, got 0")
				}
				found := false
				for _, err := range errs {
					if err.Field == tt.errorField {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("expected error field %q, but got errors: %+v", tt.errorField, errs)
				}
			} else {
				if len(errs) > 0 {
					t.Errorf("expected 0 errors, got %d: %+v", len(errs), errs)
				}
			}
		})
	}
}

func TestValidateBatchRequest(t *testing.T) {
	validItem := ImageParams{
		Width:           800,
		Height:          600,
		BackgroundColor: "#ffffff",
		TextColor:       "#000000",
		Font:            "Montserrat",
		Title:           "Valid Item",
	}

	invalidItem := ImageParams{
		Width:           0, // Invalid width
		Height:          600,
		BackgroundColor: "#ffffff",
		TextColor:       "#000000",
		Font:            "Montserrat",
		Title:           "Invalid Item",
	}

	tests := []struct {
		name        string
		requests    []ImageParams
		expectError bool
		errorField  string
	}{
		{
			name:        "Valid batch request succeeds",
			requests:    []ImageParams{validItem, validItem},
			expectError: false,
		},
		{
			name:        "Empty batch fails",
			requests:    []ImageParams{},
			expectError: true,
			errorField:  "requests",
		},
		{
			name:        "Batch too large (> 5 items) fails",
			requests:    []ImageParams{validItem, validItem, validItem, validItem, validItem, validItem},
			expectError: true,
			errorField:  "requests",
		},
		{
			name:        "Batch with nested validation errors fails",
			requests:    []ImageParams{validItem, invalidItem},
			expectError: true,
			errorField:  "requests[1].width",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateBatchRequest(tt.requests)
			if tt.expectError {
				if len(errs) == 0 {
					t.Fatalf("expected validation errors, got 0")
				}
				found := false
				for _, err := range errs {
					if err.Field == tt.errorField {
						found = true
						break
					}
				}
				if !found {
					t.Errorf("expected error field %q, but got errors: %+v", tt.errorField, errs)
				}
			} else {
				if len(errs) > 0 {
					t.Errorf("expected 0 errors, got %d: %+v", len(errs), errs)
				}
			}
		})
	}
}

func makeStringOfLength(length int) string {
	runes := make([]rune, length)
	for i := range runes {
		runes[i] = 'a'
	}
	return string(runes)
}

func TestGetWCAGLevel(t *testing.T) {
	tests := []struct {
		ratio float64
		want  string
	}{
		{ratio: 7.5, want: "AAA"},
		{ratio: 5.0, want: "AA"},
		{ratio: 3.0, want: "FAIL"},
	}
	for _, tt := range tests {
		got := GetWCAGLevel(tt.ratio)
		if got != tt.want {
			t.Errorf("GetWCAGLevel(%f) = %q, want %q", tt.ratio, got, tt.want)
		}
	}
}

func TestHexToRGB_Errors(t *testing.T) {
	_, err := HexToRGB("invalid")
	if err == nil {
		t.Error("expected error for invalid hex color format")
	}
}
