# Frontend Wireframe

> **Draft Version**: This wirerame document is in draft state and subject to revision as the project evolves.

## Overview

A simple, clean layout for generating custom cover images with real-time preview.

---

## Layout Structure

```text
┌─────────────────────────────────────────────────────────────┐
│                          HEADER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Cover Craft 🎨 (centered)               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                           MAIN                              │
│                                                             │
│  ┌────────────────────────┐  ┌──────────────────────────┐   │
│  │                        │  │                          │   │
│  │   FORM SECTION (50%)   │  │  PREVIEW SECTION (50%)   │   │
│  │                        │  │                          │   │
│  │  ┌──────────────────┐  │  │  ┌────────────────────┐  │   │
│  │  │Size Preset       │  │  │  │                    │  │   │
│  │  └──────────────────┘  │  │  │   LIVE PREVIEW     │  │   │
│  │                        │  │  │                    │  │   │
│  │  ┌──────────────────┐  │  │  │  [Canvas Preview]  │  │   │
│  │  │Image Name        │  │  │  │                    │  │   │
│  │  └──────────────────┘  │  │  │  Updates real-time │  │   │
│  │                        │  │  │                    │  │   │
│  │  ┌──────────────────┐  │  │  │  Displays heading, │  │   │
│  │  │Title             │  │  │  │  subheading, with  │  │   │
│  │  └──────────────────┘  │  │  │  selected colors   │  │   │
│  │                        │  │  │  and font          │  │   │
│  │  ┌──────────────────┐  │  │  │                    │  │   │
│  │  │Subtitle          │  │  │  └────────────────────┘  │   │
│  │  └──────────────────┘  │  │                          │   │
│  │                        │  └──────────────────────────┘   │
│  │  ┌─────────┬─────────┐│                                 │
│  │  │BG Color │TX Color ││  Mobile: Stacked vertically     │
│  │  └─────────┴─────────┘│  - Form at top (full width)     │
│  │                        │  - Preview below (full width)   │
│  │  ┌──────────────────┐  │                                 │
│  │  │Font              │  │                                 │
│  │  └──────────────────┘  │                                 │
│  │                        │                                 │
│  │      ┌──────────┐      │                                 │
│  │      │Generate  │      │                                 │
│  │      │(centered)│      │                                 │
│  │      └──────────┘      │                                 │
│  │                        │                                 │
│  └────────────────────────┘                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                          FOOTER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     © 2025 Victoria Cheng | GitHub (centered)        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Header

- **Logo/Title**: "Cover Craft 🎨" centered
- **Styling**: Sticky header, minimal design, centered text
- **Layout**: 90% width with max-width of 7xl, centered with margin auto

### Main Section

#### Left: Form Section (50% width)

**Form Fields (matching ImageParams from architecture):**

1. **Size Preset Dropdown**
   - Options:
     - "Post (1200 × 627)" - Standard social media post
     - "Square (1080 × 1080)" - Square format for social tiles
   - Default: "Post (1200 × 627)"
   - Maps to: `width` and `height` params

2. **Image Name Input**
   - Text input for filename
   - Placeholder: "my-awesome-cover"
   - Maps to: `imageName` param
   - Note: Timestamp will be auto-appended (e.g., "my-awesome-cover-1729003305.png")

3. **Heading Input**
   - Text input for main title
   - Max length: defined by backend validation
   - Placeholder: "Enter your cover title..."
   - Maps to: `heading` param

4. **Subheading Input**
   - Text input for subtitle
   - Max length: defined by backend validation
   - Placeholder: "Subtitle or author name..."
   - Maps to: `subheading` param

5. **Background Color Picker**
   - Color picker input
   - Default: `#374151` (gray-700 - Charcoal)
   - Maps to: `backgroundColor` param

6. **Text Color Picker**
   - Color picker input
   - Default: `#F9FAFB` (gray-50 - Soft white)
   - Maps to: `textColor` param

7. **Font Selection**
   - Dropdown for font families
   - Options: defined by backend validation
   - Maps to: `font` param

8. **Generate Button**
   - Primary CTA
   - Centered in the form
   - Triggers API call to Azure Function with all params
   - Disabled until all required fields are filled

#### Right: Preview Section (50% width)

**Preview Canvas:**

- **Before Generate**: Shows "Live Preview"
  - Real-time preview as user types
  - Canvas element with selected dimensions
  - Scaled to fit viewport
  - Shows all customizations live (heading, subheading, colors, font)

- **After Generate**: Shows "Generated Cover Image" or "Your Cover Image"
  - Displays the final high-quality image from API
  - Canvas updates with generated image buffer

**Download Button:**

- Appears/activates after successful generation
- Downloads as PNG with user-specified filename
  - Format: `{imageName}-{timestamp}.png`
  - Example: `my-awesome-cover-1729003305.png`

### Footer

- **Copyright**: Dynamic year with your name - `© {new Date().getFullYear()} Victoria Cheng`
- **GitHub Link**: Link to repository
- **Styling**: Simple, centered, minimal design
- **Layout**: 90% width with max-width of 7xl, centered with margin auto

---

## Responsive Behavior

### Desktop (> 768px)

- Two-column layout (form | preview) with equal 50/50 split
- Preview on the right
- Both sections use flex-1 for equal width distribution

### Tablet/Mobile (< 768px)

- Single column, stacked layout
- Form section at top (full width)
- Preview section below (full width, fixed height of 400px)

---

## Key Features to Implement

1. **Real-time Preview**: Update canvas as user types
2. **Client-side Rendering**: Use HTML Canvas API for preview
3. **Server-side Generation**: Final high-quality image via Azure Function
4. **Accessibility**: Proper labels, keyboard navigation, ARIA attributes

---

## User Flow

1. User lands on page → sees empty canvas and form
2. User enters title → preview updates immediately
3. User customizes colors, fonts, etc. → preview updates
4. User clicks "Generate" → API call to Azure Function
5. Server returns high-quality image
6. User downloads or copies image

---

## Technical Notes

### Frontend Stack

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS**
- **Canvas API** for client-side preview
- **HTML-to-image** or **canvas-to-blob** for downloads

### State Management

- React `useState` for form inputs
- `useEffect` for real-time preview updates
- Optional: Zustand or Context for complex state

### API Integration

- Fetch to Azure Function endpoint
- Handle loading states
- Error handling for failed generations

---

## Color Scheme

### App UI Color Scheme

**Light Theme:**

- Background: `bg-emerald-100` - `#D1FAE5` (mint tint)
- Card/Form: `bg-gray-50` - `#F9FAFB` (soft white)
- Text: `text-gray-900` - `#111827` (soft black)
- Accent: `bg-emerald-500` - `#10B981` (mint green)

**Component Usage:**

- MainLayout: `bg-emerald-100`, `text-gray-900`
- Card: `border-emerald-500`, `bg-gray-50`
- Header: `bg-emerald-200`, `text-gray-900`
- Footer: `bg-emerald-200`, `text-gray-900`, `hover:text-emerald-500`
- FormField: `text-gray-900`, `text-gray-500`, `text-red-500`
- SectionTitle: `text-gray-900`
- Input: `border-gray-900`, `bg-gray-50`, `placeholder:text-muted-foreground`, `focus-visible:ring-ring`
- Select: `border-gray-900`, `bg-gray-50`, `focus-visible:ring-ring`
- Button: `focus:ring-emerald-400`
- CanvasPreview: `border-gray-300`

---

## Potential Future Ideas

These are possible enhancements that may or may not be implemented after MVP:

- Template presets (Blog, Social Media, YouTube, etc.)
- Save/load designs
- Additional canvas sizes beyond post and square
- Advanced text styling (shadows, outlines, gradients)
- Image upload for custom backgrounds
- Export history
- Gradient backgrounds
