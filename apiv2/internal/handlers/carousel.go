package handlers

import (
	"log/slog"
	"net/http"
)

// GenerateCarouselHandler is a placeholder stub handler for carousel document generation (POST /api/generateCarousel).
//
// Purpose:
// It serves as the architectural scaffolding for the upcoming multi-slide LinkedIn Carousel generation feature.
// In subsequent milestones, this handler will:
//  1. Validate incoming CarouselParams (slide count, dimensions, WCAG AA contrast compliance).
//  2. Persist an initial job record to MongoDB tracking the generation state.
//  3. Enqueue a job payload to Azure Storage Queue for asynchronous background processing.
//  4. Return HTTP 202 (Accepted) with the Job ID for client status polling.
//
// Current Behavior:
// During this initial scaffolding phase, the handler validates that the HTTP method is POST and returns
// HTTP 501 (Not Implemented) with a descriptive JSON error response. Non-POST methods receive HTTP 405 (Method Not Allowed).
func GenerateCarouselHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		slog.WarnContext(r.Context(), "Invalid HTTP method for generateCarousel", slog.String("method", r.Method))
		writeJSONError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	slog.InfoContext(r.Context(), "Carousel generation endpoint stub called (not yet implemented)")
	writeJSONError(w, "Carousel generation endpoint is not yet implemented", http.StatusNotImplemented)
}
