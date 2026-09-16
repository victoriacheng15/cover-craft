package services

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/draw"
	"image/gif"
	"math"
	"strings"
)

// GenerateGIF renders a sequence of slides as an animated GIF in pure Go
func GenerateGIF(params GifParams) ([]byte, error) {
	if len(params.Slides) < 2 {
		return nil, fmt.Errorf("gif generation requires at least 2 slides")
	}

	delayMs := 1500
	if params.DelayMs != nil {
		delayMs = int(*params.DelayMs)
	}
	// GIF delay is measured in 100ths of a second (10ms units)
	delay := delayMs / 10
	if delay < 1 {
		delay = 100
	}

	outGif := &gif.GIF{
		Image:     make([]*image.Paletted, 0, len(params.Slides)),
		Delay:     make([]int, 0, len(params.Slides)),
		LoopCount: 0, // Loop forever
	}

	for i, slide := range params.Slides {
		textColor := ""
		if slide.TextColor != nil && strings.TrimSpace(*slide.TextColor) != "" {
			textColor = *slide.TextColor
		} else {
			generatedColor, err := GenerateCompliantTextColor(params.BackgroundColor)
			if err != nil {
				return nil, fmt.Errorf("failed to generate compliant text color for slide %d: %w", i, err)
			}
			textColor = generatedColor
		}

		hasBorder := slide.HasBorder != nil && *slide.HasBorder

		frameImg, err := RenderFrame(
			params.Width,
			params.Height,
			params.BackgroundColor,
			textColor,
			string(slide.Font),
			slide.Title,
			slide.Subtitle,
			hasBorder,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to render frame %d: %w", i, err)
		}

		paletted := quantizeToPaletted(frameImg, params.BackgroundColor, textColor)
		outGif.Image = append(outGif.Image, paletted)
		outGif.Delay = append(outGif.Delay, delay)
	}

	var buf bytes.Buffer
	if err := gif.EncodeAll(&buf, outGif); err != nil {
		return nil, fmt.Errorf("failed to encode gif: %w", err)
	}

	return buf.Bytes(), nil
}

// quantizeToPaletted converts an image to a paletted image optimized for text contrast
func quantizeToPaletted(img image.Image, bgColorHex, textColorHex string) *image.Paletted {
	bounds := img.Bounds()

	uniqueMap := make(map[color.RGBA]struct{})
	var uniqueColors []color.Color

	rgba, ok := img.(*image.RGBA)
	if ok {
		for i := 0; i < len(rgba.Pix); i += 4 {
			c := color.RGBA{R: rgba.Pix[i], G: rgba.Pix[i+1], B: rgba.Pix[i+2], A: rgba.Pix[i+3]}
			if _, exists := uniqueMap[c]; !exists {
				uniqueMap[c] = struct{}{}
				uniqueColors = append(uniqueColors, c)
				if len(uniqueColors) > 256 {
					break
				}
			}
		}
	} else {
		for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
			for x := bounds.Min.X; x < bounds.Max.X; x++ {
				r, g, b, a := img.At(x, y).RGBA()
				c := color.RGBA{R: uint8(r >> 8), G: uint8(g >> 8), B: uint8(b >> 8), A: uint8(a >> 8)}
				if _, exists := uniqueMap[c]; !exists {
					uniqueMap[c] = struct{}{}
					uniqueColors = append(uniqueColors, c)
					if len(uniqueColors) > 256 {
						break
					}
				}
			}
			if len(uniqueColors) > 256 {
				break
			}
		}
	}

	var pal color.Palette
	if len(uniqueColors) <= 256 && len(uniqueColors) > 0 {
		pal = uniqueColors
	} else {
		bgRGB, _ := HexToRGB(bgColorHex)
		textRGB, _ := HexToRGB(textColorHex)
		pal = make(color.Palette, 256)
		for i := 0; i < 256; i++ {
			t := float64(i) / 255.0
			var r, g, b uint8
			if bgRGB != nil && textRGB != nil {
				r = uint8(math.Round((1.0-t)*bgRGB.R + t*textRGB.R))
				g = uint8(math.Round((1.0-t)*bgRGB.G + t*textRGB.G))
				b = uint8(math.Round((1.0-t)*bgRGB.B + t*textRGB.B))
			}
			pal[i] = color.RGBA{R: r, G: g, B: b, A: 255}
		}
	}

	paletted := image.NewPaletted(bounds, pal)
	draw.Draw(paletted, bounds, img, bounds.Min, draw.Src)
	return paletted
}
