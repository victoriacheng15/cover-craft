
# Backend Architecture

## Overview

The backend is a modular, serverless API built on Azure Functions. It provides endpoints for health checks and dynamic cover image generation, with robust validation and extensibility.

## Key Principles

- **Modular Components**: Extraction, validation, rendering, and response building are separated for maintainability.
- **Server-side Validation**: All inputs are validated on the backend for security and reliability.
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
        +string heading
        +string subheading
        +string imageName
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
        +number maxHeadingLength
        +number maxSubheadingLength
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
        +validateTextLength(heading, subheading): ValidationError[]
        +validateImageName(imageName): ValidationError[]
        +validateParams(params): ValidationError[]
    }

    class Rendering {
        +generatePNG(params): Buffer
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
