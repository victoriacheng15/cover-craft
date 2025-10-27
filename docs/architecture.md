# Architecture

> **Draft Version**: This architecture document is in draft state and subject to revision as the project evolves.

## Highlights

- **Modular Design**: The system is divided into clear, single-responsibility components (extraction, validation, rendering, response building)
- **Server-side Validation First**: All inputs are validated on the backend to ensure system safety, regardless of frontend validation
- **Flexible Sizing**: Supports both predefined size presets (e.g., `post: 1200x627`, `square: 1080x1080`) and custom dimensions within acceptable ranges
- **Custom Image Naming**: Generated images include a user-provided name with timestamp suffix (e.g., `my-awesome-post-1729003305.png`) for easy organization and collision avoidance
- **Clean Data Flow**: Request parameters flow through extraction → validation → rendering → response, with error handling at each stage
- **Extensible Architecture**: Easy to add new sizes, fonts, or validation rules without modifying core logic
- **PNG Image Output**: Direct binary PNG response allows clients to download or display images without additional processing

## Use Cases

```mermaid
graph LR
    Client["👤 Client"]
    Health["Health check"]
    Gen["Generate cover image"]
    Retrieve["Retrieve/download image"]
    
    Client -->|uses| Health
    Client -->|uses| Gen
    Client -->|uses| Retrieve
```

The system serves a single **Client** actor (any user or external service) with three primary capabilities:

- **Health check**: Verify system availability and status
- **Generate cover image**: Create a PNG image with custom text and styling
- **Retrieve/download image**: Access the generated image buffer

## Default Sizes

The system supports predefined size presets to ensure consistency and easy expansion:

```ts
const defaultSizes = {
    post: { width: 1200, height: 627 },
    square: { width: 1080, height: 1080 }
    // Future sizes can be added here:
    // banner: { width: 1600, height: 400 }
};
```

- **post**: Standard social media post size (1200x627)
- **square**: Square format commonly used for profile pictures and social media tiles (1080x1080)
- Easily extensible for future formats (e.g., banner, story, thumbnail)

## Data Model

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

## Functional Flow

```mermaid
classDiagram
    class GenerateCoverImage {
        +handle(request): HttpResponseInit
    }

    class ImageParamsExtractor {
        +extract(request): ImageParams
    }

    class Validator {
        -ValidationRules rules
        +validateSize(width, height): boolean
        +validateColors(bg, text): boolean
        +validateFont(font): boolean
        +validateTextLength(heading, subheading): boolean
        +validate(params): ValidationResult
    }

    class ImageRenderer {
        +render(params): Buffer
    }

    class ResponseBuilder {
        +buildImageResponse(buffer): ImageResponse
        +buildErrorResponse(error): ErrorResponse
    }

    class ValidationResult {
        +boolean isValid
        +string[] errors
    }

    GenerateCoverImage --> ImageParamsExtractor : uses
    GenerateCoverImage --> ImageRenderer : uses
    GenerateCoverImage --> ResponseBuilder : uses
    ImageParamsExtractor --> ImageParams
    ImageParams --> Validator : validated by
    Validator --> ValidationResult : returns
    ImageRenderer --> ValidationResult : checks
    ImageRenderer --> ImageParams : consumes
```

## generateCoverImage Sequence Diagram

```mermaid
sequenceDiagram
    actor Client
    participant GCI as generateCoverImage
    participant Extractor as ImageParamsExtractor
    participant Validator
    participant Renderer as ImageRenderer
    participant Builder as ResponseBuilder

    Client->>GCI: HTTP POST (request with params)
    GCI->>Extractor: extract(request)
    Extractor-->>GCI: ImageParams
    
    GCI->>Validator: validate(ImageParams)
    alt Validation Success
        Validator-->>GCI: ValidationResult {isValid: true}
        GCI->>Renderer: render(ImageParams)
        Renderer-->>GCI: Buffer (PNG image)
        GCI->>Builder: buildImageResponse(buffer)
        Builder-->>GCI: ImageResponse {status: 200, image}
        GCI-->>Client: HTTP 200 (PNG image)
    else Validation Failure
        Validator-->>GCI: ValidationResult {isValid: false, errors}
        GCI->>Builder: buildErrorResponse(errors)
        Builder-->>GCI: ErrorResponse {status: 400, errors}
        GCI-->>Client: HTTP 400 (error details)
    end
```

## Deployment Architecture

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

**Deployment targets:**

- **Frontend**: Vercel (React/Next.js application)
- **Backend API**: Azure Function App (serverless, handles `generateCoverImage` and `healthCheck`)
- **Storage** (optional): Azure Blob Storage for image caching or archival
