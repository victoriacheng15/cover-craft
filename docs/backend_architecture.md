
# Backend Architecture

## Overview

The backend is a modular, serverless API built on Azure Functions. It provides endpoints for health checks and dynamic cover image generation, with robust validation and extensibility.

## Key Principles

- **Modular Components**: Extraction, validation, rendering, and response building are separated for maintainability.
- **Server-side Validation**: All inputs are validated on the backend for security and reliability, including WCAG AA contrast checking.
- **Accessibility First**: Color contrast validation ensures all generated images meet accessibility standards.
- **Extensible Design**: Adding new sizes, fonts, or validation rules requires minimal changes.
- **Direct PNG Output**: Images are returned as binary PNG buffers for immediate use.

## Main Endpoints

- `POST /api/generateCoverImage`: Generate a PNG cover image with custom text, colors, font, and size.
- `GET /api/healthCheck`: Check API health and availability.

## Data Flow

1. **Extraction**: Parse and extract parameters from the request.
2. **Validation**: Validate all parameters (size, colors, font, text length) against rules.
3. **Rendering**: Generate the image using validated parameters.
4. **Response**: Return PNG image or error details.

## Core Data Structures

```mermaid
classDiagram
    class ImageParams {
        +number width
        +number height
        +string backgroundColor
        +string textColor
        +string font
        +string title
        +string subtitle
        +string filename
    }

    class DefaultSizes {
        +SizePreset post
        +SizePreset square
    }

    class SizePreset {
        +number width
        +number height
    }

    class ImageResponse {
        +Buffer imageBuffer
        +string contentType
        +number statusCode
        +object metadata
    }

    class ErrorResponse {
        +string message
        +number statusCode
        +object details
    }

    class ValidationRules {
        +SizeRange sizeRange
        +string[] allowedFonts
        +number maxTitleLength
        +number maxSubtitleLength
        +string colorFormat
    }

    class SizeRange {
        +number minWidth
        +number maxWidth
        +number minHeight
        +number maxHeight
    }

    DefaultSizes --> SizePreset : contains
    ValidationRules --> SizeRange : uses
    ImageParams --> ValidationRules : validated against
```

## Functional Architecture

```mermaid
classDiagram
    class GenerateCoverImage {
        +generateCoverImage(request, context): HttpResponseInit
    }

    class Extraction {
        +extractParams(request): ImageParams
    }

    class Validation {
        +validateSize(width, height): ValidationError[]
        +validateColors(bgColor, textColor): ValidationError[]
        +validateFont(font): ValidationError[]
        +validateTextLength(title, subtitle): ValidationError[]
        +validateFilename(filename): ValidationError[]
        +validateParams(params): ValidationError[]
    }

    class Rendering {
        +generatePNG(params): Buffer
        +calculateFontSizes(height): FontSizes
    }

    class FontSizes {
        +number headingFontSize
        +number subheadingFontSize
        +number lineSpacing
    }

    class ValidationError {
        +field: string
        +message: string
    }

    GenerateCoverImage --> Extraction : uses
    GenerateCoverImage --> Validation : uses
    GenerateCoverImage --> Rendering : uses
    Extraction --> ImageParams
    Validation --> ValidationError : returns
    Rendering --> ImageParams : consumes
    Rendering --> FontSizes : calculates
```

## Sequence Flow

```mermaid
sequenceDiagram
    actor Client
    participant Handler as generateCoverImage
    participant Extractor as extractParams
    participant Validator as validateParams
    participant Renderer as generatePNG

    Client->>Handler: HTTP POST/GET (request with params)
    Handler->>Extractor: extract(request)
    Extractor-->>Handler: ImageParams
    
    Handler->>Validator: validate(ImageParams)
    alt Validation Success
        Validator-->>Handler: ValidationError[] (empty)
        Handler->>Renderer: generatePNG(ImageParams)
        Renderer-->>Handler: Buffer (PNG)
        Handler-->>Client: 200 OK (PNG image)
    else Validation Failure
        Validator-->>Handler: ValidationError[] (errors)
        Handler-->>Client: 400 Bad Request (error details)
    end
```

## Deployment Overview

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser["🌐 Web Browser / Client"]
    end
    
    subgraph Frontend["Frontend - Vercel"]
        FE["Next.js / React App"]
    end
    
    subgraph Backend["Backend - Azure"]
        FA["Azure Function App<br/>(generateCoverImage)"]
    end
    
    subgraph Storage["Azure Storage"]
        Blob["Blob Storage<br/>(optional)"]
    end
    
    Browser -->|HTTPS| FE
    FE -->|HTTP/REST| FA
    FA -->|Read/Write| Blob
    FA -->|Image Buffer| FE
    FE -->|PNG Download| Browser
```

## Font Size Calculations

The backend uses responsive font sizing based on canvas height to ensure optimal readability across different image dimensions.

### Formula (Solution #2)

- **Heading**: `Math.max(32, Math.round(height * 0.09))` - 9% of canvas height with minimum 32px
- **Subheading**: `Math.max(24, Math.round(height * 0.07))` - 7% of canvas height with minimum 24px
- **Line Spacing**: `headingFontSize * 1.2` - Space between heading and subheading

### Size Presets

| Preset | Dimensions | Heading | Subheading |
|--------|-----------|---------|-----------|
| Post | 1200 × 627 | 56px | 44px |
| Square | 1080 × 1080 | 97px | 75px |

This ensures text is:

- Large enough for readability on all presets
- Responsive to different canvas dimensions
- Consistently scaled between backend rendering and frontend preview

## Color Contrast Validation

The backend validates color contrast using the WCAG formula to ensure generated images are accessible.

### Validation Rule

- **WCAG AA Standard**: Contrast ratio ≥ 4.5:1 for normal text
- All generated images must meet this threshold
- Backend rejects requests with insufficient contrast

### Implementation

**Contrast Calculation Process:**

1. Parse hex colors to RGB components: `hexToRgb(color: string)`
2. Calculate relative luminance for each color: `getRelativeLuminance(rgb)`
   - Apply gamma correction using WCAG formula
   - Returns normalized value (0-1 range)
3. Compute contrast ratio: `getContrastRatio(color1, color2)`
   - Formula: `(lighter luminance + 0.05) / (darker luminance + 0.05)`
   - Returns ratio on 1-21 scale
4. Validate against threshold: `validateContrast(bgColor, textColor)`
   - Compares ratio to WCAG AA minimum (4.5:1)
   - Returns validation error if threshold not met

**Error Response Example:**

```json
{
  "status": 400,
  "error": "Validation failed",
  "details": [
    {
      "field": "contrast",
      "message": "Color contrast ratio 2.45:1 does not meet WCAG AA standard (4.5:1). Please choose colors with better contrast."
    }
  ]
}
```

### Testing

**Test Cases:**

- Good contrast: `#000000` (black) on `#ffffff` (white) = 21:1 ✓
- Poor contrast: `#ffff00` (yellow) on `#ffffff` (white) = 1.07:1 ✗
- Boundary: Colors with ratio exactly 4.5:1 ✓
- Edge cases: Dark colors on dark backgrounds, light on light

**Example curl command to trigger validation error:**

```bash
curl -X POST "http://localhost:7071/api/generateCoverImage" \
  -H "Content-Type: application/json" \
  -d '{
    "width": 1200,
    "height": 627,
    "backgroundColor": "#ffffff",
    "textColor": "#ffff00",
    "font": "Montserrat",
    "title": "Poor Contrast Example",
    "subtitle": "This will fail validation!",
    "filename": "test-contrast-fail"
  }'
```
