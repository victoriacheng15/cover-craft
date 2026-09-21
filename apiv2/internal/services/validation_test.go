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

func TestGenerateCompliantTextColor(t *testing.T) {
	bgColors := []string{"#000000", "#FFFFFF", "#374151", "#1E3A8A", "#F9FAFB", "#F59E0B"}
	for _, bg := range bgColors {
		textColor, err := GenerateCompliantTextColor(bg)
		if err != nil {
			t.Fatalf("unexpected error generating text color for %s: %v", bg, err)
		}
		if !HexColorRegex.MatchString(textColor) {
			t.Errorf("expected valid hex color for %s, got %s", bg, textColor)
		}
		ratio, err := GetContrastRatio(bg, textColor)
		if err != nil {
			t.Fatalf("failed to calculate contrast ratio for %s vs %s: %v", bg, textColor, err)
		}
		if ratio < WcagAaThreshold {
			t.Errorf("contrast ratio for %s vs %s is %.2f, want >= %.1f", bg, textColor, ratio, WcagAaThreshold)
		}
	}

	_, err := GenerateCompliantTextColor("invalid-hex")
	if err == nil {
		t.Error("expected error for invalid hex color format")
	}
}

func TestValidateGifParams(t *testing.T) {
	subGood := "Valid Subtitle"
	subTooLong := makeStringOfLength(100)
	titleTooLong := makeStringOfLength(50)
	goodTextColor := "#FFFFFF"
	poorTextColor := "#404040" // Poor contrast against #374151
	invalidHexColor := "not-a-color"

	validSlide1 := GifSlideParams{
		Title: "Slide One",
		Font:  GifSlideParamsFontMontserrat,
	}
	validSlide2 := GifSlideParams{
		Title:     "Slide Two",
		Subtitle:  &subGood,
		Font:      GifSlideParamsFontRoboto,
		TextColor: &goodTextColor,
	}

	delay1000 := GifParamsDelayMs(1000)
	delay9999 := GifParamsDelayMs(9999)

	tests := []struct {
		name        string
		params      GifParams
		expectError bool
		errorField  string
	}{
		{
			name: "Valid 2-slide GIF succeeds",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				DelayMs:         &delay1000,
				Slides:          []GifSlideParams{validSlide1, validSlide2},
			},
			expectError: false,
		},
		{
			name: "Less than 2 slides fails",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				Slides:          []GifSlideParams{validSlide1},
			},
			expectError: true,
			errorField:  "slides",
		},
		{
			name: "Invalid width fails",
			params: GifParams{
				Width:           0,
				Height:          627,
				BackgroundColor: "#374151",
				Slides:          []GifSlideParams{validSlide1, validSlide2},
			},
			expectError: true,
			errorField:  "width",
		},
		{
			name: "Invalid height fails",
			params: GifParams{
				Width:           1200,
				Height:          1500,
				BackgroundColor: "#374151",
				Slides:          []GifSlideParams{validSlide1, validSlide2},
			},
			expectError: true,
			errorField:  "height",
		},
		{
			name: "Invalid background color fails",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "invalid",
				Slides:          []GifSlideParams{validSlide1, validSlide2},
			},
			expectError: true,
			errorField:  "backgroundColor",
		},
		{
			name: "Invalid delay fails",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				DelayMs:         &delay9999,
				Slides:          []GifSlideParams{validSlide1, validSlide2},
			},
			expectError: true,
			errorField:  "delayMs",
		},
		{
			name: "Empty slide title fails",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				Slides: []GifSlideParams{
					{Title: "   ", Font: GifSlideParamsFontMontserrat},
					validSlide2,
				},
			},
			expectError: true,
			errorField:  "slides[0].title",
		},
		{
			name: "Title too long fails",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				Slides: []GifSlideParams{
					{Title: titleTooLong, Font: GifSlideParamsFontMontserrat},
					validSlide2,
				},
			},
			expectError: true,
			errorField:  "slides[0].title",
		},
		{
			name: "Subtitle too long fails",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				Slides: []GifSlideParams{
					validSlide1,
					{Title: "Valid", Subtitle: &subTooLong, Font: GifSlideParamsFontRoboto},
				},
			},
			expectError: true,
			errorField:  "slides[1].subtitle",
		},
		{
			name: "Invalid slide font fails",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				Slides: []GifSlideParams{
					{Title: "Valid", Font: "Comic Sans"},
					validSlide2,
				},
			},
			expectError: true,
			errorField:  "slides[0].font",
		},
		{
			name: "Invalid text color format fails",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				Slides: []GifSlideParams{
					{Title: "Valid", Font: GifSlideParamsFontMontserrat, TextColor: &invalidHexColor},
					validSlide2,
				},
			},
			expectError: true,
			errorField:  "slides[0].textColor",
		},
		{
			name: "Poor contrast text color fails WCAG AA check",
			params: GifParams{
				Width:           1200,
				Height:          627,
				BackgroundColor: "#374151",
				Slides: []GifSlideParams{
					{Title: "Valid", Font: GifSlideParamsFontMontserrat, TextColor: &poorTextColor},
					validSlide2,
				},
			},
			expectError: true,
			errorField:  "slides[0].contrast",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateGifParams(tt.params)
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

func TestValidateCarouselParams(t *testing.T) {
	validSlide1 := CarouselSlideParams{
		Title: "Slide 1 Title",
	}
	validSlide2 := CarouselSlideParams{
		Title: "Slide 2 Title",
	}

	validSubtitle := "This is a valid subtitle commentary."
	tooLongSubtitle := makeStringOfLength(121)

	validList := []string{"First key point", "Second key point", "Third key point"}
	tooFewList := []string{"Only one item"}
	tooManyList := []string{"Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6"}
	emptyItemInList := []string{"Item 1", "   ", "Item 3"}
	tooLongItemInList := []string{"Item 1", makeStringOfLength(71)}

	validAuthor := "@engineer"
	tooLongAuthor := makeStringOfLength(31)

	invalidBorderStyle := CarouselParamsBorderStyle("dotted")
	validBorderStyle := Single
	invalidAuthorPos := CarouselParamsAuthorHandlePosition("middle")
	invalidSlideNumPos := CarouselParamsSlideNumberPosition("center")
	invalidAlign := CarouselSlideParamsTextAlign("justify")
	invalidVAlign := CarouselSlideParamsVerticalAlign("middle")

	invalidColor := "not-hex"
	poorTextColor := "#384151" // against #374151

	baseValidParams := CarouselParams{
		Width:           1080,
		Height:          1350,
		BackgroundColor: "#0F172A",
		TextColor:       "#F8FAFC",
		Font:            CarouselParamsFontMontserrat,
		BorderStyle:     &validBorderStyle,
		AuthorHandle:    &validAuthor,
		Slides:          []CarouselSlideParams{validSlide1, validSlide2},
	}

	tests := []struct {
		name        string
		params      CarouselParams
		expectError bool
		errorField  string
	}{
		{
			name:        "Valid carousel parameters succeed",
			params:      baseValidParams,
			expectError: false,
		},
		{
			name: "Width 1400 is accepted",
			params: func() CarouselParams {
				p := baseValidParams
				p.Width = 1400
				return p
			}(),
			expectError: false,
		},
		{
			name: "Width 1401 fails boundary",
			params: func() CarouselParams {
				p := baseValidParams
				p.Width = 1401
				return p
			}(),
			expectError: true,
			errorField:  "width",
		},
		{
			name: "Width 0 fails boundary",
			params: func() CarouselParams {
				p := baseValidParams
				p.Width = 0
				return p
			}(),
			expectError: true,
			errorField:  "width",
		},
		{
			name: "Height 1400 is accepted",
			params: func() CarouselParams {
				p := baseValidParams
				p.Height = 1400
				return p
			}(),
			expectError: false,
		},
		{
			name: "Height 1401 fails boundary",
			params: func() CarouselParams {
				p := baseValidParams
				p.Height = 1401
				return p
			}(),
			expectError: true,
			errorField:  "height",
		},
		{
			name: "Invalid background color fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.BackgroundColor = invalidColor
				return p
			}(),
			expectError: true,
			errorField:  "backgroundColor",
		},
		{
			name: "Invalid text color fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.TextColor = invalidColor
				return p
			}(),
			expectError: true,
			errorField:  "textColor",
		},
		{
			name: "Poor deck contrast fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.BackgroundColor = "#374151"
				p.TextColor = "#384151"
				return p
			}(),
			expectError: true,
			errorField:  "contrast",
		},
		{
			name: "Invalid font fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Font = "Comic Sans"
				return p
			}(),
			expectError: true,
			errorField:  "font",
		},
		{
			name: "Invalid borderStyle fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.BorderStyle = &invalidBorderStyle
				return p
			}(),
			expectError: true,
			errorField:  "borderStyle",
		},
		{
			name: "AuthorHandle too long fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.AuthorHandle = &tooLongAuthor
				return p
			}(),
			expectError: true,
			errorField:  "authorHandle",
		},
		{
			name: "Invalid AuthorHandlePosition fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.AuthorHandlePosition = &invalidAuthorPos
				return p
			}(),
			expectError: true,
			errorField:  "authorHandlePosition",
		},
		{
			name: "Invalid SlideNumberPosition fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.SlideNumberPosition = &invalidSlideNumPos
				return p
			}(),
			expectError: true,
			errorField:  "slideNumberPosition",
		},
		{
			name: "Less than 2 slides fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{validSlide1}
				return p
			}(),
			expectError: true,
			errorField:  "slides",
		},
		{
			name: "More than 10 slides fails",
			params: func() CarouselParams {
				p := baseValidParams
				slides := make([]CarouselSlideParams, 11)
				for i := range slides {
					slides[i] = CarouselSlideParams{Title: "Slide"}
				}
				p.Slides = slides
				return p
			}(),
			expectError: true,
			errorField:  "slides",
		},
		{
			name: "Slide title empty fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "   "}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].title",
		},
		{
			name: "Slide title too long (>50) fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: makeStringOfLength(51)}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].title",
		},
		{
			name: "Slide subtitle too long (>120) fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "Valid", Subtitle: &tooLongSubtitle}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].subtitle",
		},
		{
			name: "Slide list items too few (<2) fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "Valid", ListItems: &tooFewList}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].listItems",
		},
		{
			name: "Slide list items too many (>5) fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "Valid", ListItems: &tooManyList}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].listItems",
		},
		{
			name: "Slide list items empty item fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "Valid", ListItems: &emptyItemInList}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].listItems[1]",
		},
		{
			name: "Slide list items item too long (>70) fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "Valid", ListItems: &tooLongItemInList}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].listItems[1]",
		},
		{
			name: "Slide with valid list items succeeds",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{
					{Title: "Valid", ListItems: &validList},
					{Title: "Valid 2", Subtitle: &validSubtitle},
				}
				return p
			}(),
			expectError: false,
		},
		{
			name: "Slide textAlign invalid fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "Valid", TextAlign: &invalidAlign}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].textAlign",
		},
		{
			name: "Slide verticalAlign invalid fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "Valid", VerticalAlign: &invalidVAlign}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].verticalAlign",
		},
		{
			name: "Slide textColor override invalid fails",
			params: func() CarouselParams {
				p := baseValidParams
				p.Slides = []CarouselSlideParams{{Title: "Valid", TextColor: &invalidColor}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].textColor",
		},
		{
			name: "Slide contrast override fail",
			params: func() CarouselParams {
				p := baseValidParams
				p.BackgroundColor = "#374151"
				p.Slides = []CarouselSlideParams{{Title: "Valid", TextColor: &poorTextColor}, validSlide2}
				return p
			}(),
			expectError: true,
			errorField:  "slides[0].contrast",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := ValidateCarouselParams(tt.params)
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
