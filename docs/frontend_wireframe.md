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
│  │  Cover Craft 🎨           [Dark Mode Toggle] [GitHub]│   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                           MAIN                              │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────────────────────┐  │
│  │                  │  │                                 │  │
│  │   FORM SECTION   │  │      PREVIEW SECTION            │  │
│  │                  │  │                                 │  │
│  │  ┌────────────┐  │  │  ┌───────────────────────────┐  │  │
│  │  │Size Preset │  │  │  │                           │  │  │
│  │  │Dropdown    │  │  │  │    LIVE PREVIEW           │  │  │
│  │  └────────────┘  │  │  │                           │  │  │
│  │                  │  │  │    [Canvas: 1200x627]     │  │  │
│  │  ┌────────────┐  │  │  │                           │  │  │
│  │  │Image Name  │  │  │  │    Updates in real-time   │  │  │
│  │  │Input       │  │  │  │                           │  │  │
│  │  └────────────┘  │  │  │    (becomes "Generated    │  │  │
│  │                  │  │  │     Cover Image" after    │  │  │
│  │  ┌────────────┐  │  │  │     clicking Generate)    │  │  │
│  │  │Heading     │  │  │  │                           │  │  │
│  │  │Input       │  │  │  └───────────────────────────┘  │  │
│  │  └────────────┘  │  │                                 │  │
│  │                  │  │  ┌────────────────────────┐     │  │
│  │  ┌────────────┐  │  │  │ [Download PNG]         │     │  │
│  │  │Subheading  │  │  │  │ (active after generate)│     │  │
│  │  │Input       │  │  │  └────────────────────────┘     │  │
│  │  └────────────┘  │  │                                 │  │
│  │                  │  │                                 │  │
│  │  ┌────────────┐  │  │                                 │  │
│  │  │Background  │  │  │                                 │  │
│  │  │Color Picker│  │  │                                 │  │
│  │  └────────────┘  │  │                                 │  │
│  │                  │  │                                 │  │
│  │  ┌────────────┐  │  │                                 │  │
│  │  │Text Color  │  │  │                                 │  │
│  │  │Picker      │  │  │                                 │  │
│  │  └────────────┘  │  │                                 │  │
│  │                  │  │                                 │  │
│  │  ┌────────────┐  │  │                                 │  │
│  │  │Font        │  │  │                                 │  │
│  │  │Selection   │  │  │                                 │  │
│  │  └────────────┘  │  │                                 │  │
│  │                  │  │                                 │  │
│  │  ┌────────────┐  │  │                                 │  │
│  │  │[Generate]  │  │  │                                 │  │
│  │  └────────────┘  │  │                                 │  │
│  │                  │  │                                 │  │
│  └──────────────────┘  └─────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                          FOOTER                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         © 2025 Victoria Cheng | GitHub               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### Header

- **Logo/Title**: "Cover Craft" with icon
- **Navigation**:
  - Dark mode toggle
  - GitHub repository link
- **Styling**: Sticky header, minimal design

### Main Section

#### Left: Form Section (~40% width)

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
   - Triggers API call to Azure Function with all params
   - Disabled until all required fields are filled

#### Right: Preview Section (~60% width)

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

---

## Responsive Behavior

### Desktop (> 768px)

- Two-column layout (form | preview)
- Preview on the right

### Tablet/Mobile (< 768px)

- Single column, stacked layout
- Form section at top
- Preview section below (sticky or collapsible)
- Preview might be smaller or scrollable

---

## Key Features to Implement

1. **Real-time Preview**: Update canvas as user types
2. **Client-side Rendering**: Use HTML Canvas API for preview
3. **Server-side Generation**: Final high-quality image via Azure Function
4. **Accessibility**: Proper labels, keyboard navigation, ARIA attributes
5. **Dark Mode**: Already have Tailwind dark mode classes

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
- **Tailwind CSS** (with dark mode)
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

### Cover Image Default Theme: Charcoal + Mint Green

**Primary Colors:**

- **Background (Charcoal)**: `bg-gray-700` - `#374151`
- **Text (Soft White)**: `text-gray-50` - `#F9FAFB`
- **Accent (Mint Green)**: `bg-emerald-500` - `#10B981`

**Additional Shades:**

```text
Charcoal Variations:
- Lighter (hover, cards):    bg-gray-600  - #4B5563
- Default (main bg):         bg-gray-700  - #374151
- Darker (emphasis):         bg-gray-800  - #1F2937

Mint Green Variations:
- Light (subtle accents):    bg-emerald-100 - #D1FAE5
- Default (main accent):     bg-emerald-500 - #10B981
- Dark (hover, active):      bg-emerald-600 - #059669
```

**Usage Examples:**

```tsx
// Cover background
className="bg-gray-700"

// Title text
className="text-gray-50 text-4xl font-bold"

// Subtitle/accent text
className="text-emerald-500"

// Buttons/CTAs
className="bg-emerald-500 hover:bg-emerald-600 text-gray-50"

// Borders/dividers
className="border-emerald-500"
```

### App UI Color Scheme (Light/Dark Modes)

**Light Mode:**

- Background: `bg-gray-50` - `#F9FAFB` (soft white)
- Card/Form: `bg-gray-100` - `#F3F4F6` (very light gray)
- Text: `text-gray-900` - `#111827` (soft black)
- Accent: `bg-emerald-500` (mint green)

**Dark Mode:**

- Background: `dark:bg-gray-900` - `#111827` (soft black)
- Card/Form: `dark:bg-gray-800` - `#1F2937` (charcoal)
- Text: `dark:text-gray-50` - `#F9FAFB` (soft white)
- Accent: `dark:bg-emerald-400` (lighter mint for dark mode)

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
