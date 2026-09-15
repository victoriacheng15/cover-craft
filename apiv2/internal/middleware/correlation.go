package middleware

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log/slog"
	"net/http"
	"time"
)

type contextKey string

const (
	// CorrelationIDHeader is the canonical HTTP header name for correlation tracking.
	CorrelationIDHeader            = "X-Correlation-ID"
	correlationIDKey    contextKey = "correlationID"
)

// GenerateCorrelationID generates a secure random 16-byte hex correlation ID.
func GenerateCorrelationID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}

// WithCorrelationID returns a derived context with the correlation ID attached.
func WithCorrelationID(ctx context.Context, correlationID string) context.Context {
	return context.WithValue(ctx, correlationIDKey, correlationID)
}

// GetCorrelationID retrieves the correlation ID from context, or an empty string if not found.
func GetCorrelationID(ctx context.Context) string {
	if ctx == nil {
		return ""
	}
	if val, ok := ctx.Value(correlationIDKey).(string); ok {
		return val
	}
	return ""
}

// CorrelationID is an HTTP middleware that extracts X-Correlation-ID or generates one,
// propagating it into the request context and response headers.
func CorrelationID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		corrID := r.Header.Get(CorrelationIDHeader)
		if corrID == "" {
			corrID = GenerateCorrelationID()
		}
		ctx := WithCorrelationID(r.Context(), corrID)
		w.Header().Set(CorrelationIDHeader, corrID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ContextHandler wraps an slog.Handler to automatically attach correlation_id
// from context.Context to log records if present.
type ContextHandler struct {
	slog.Handler
}

// NewContextHandler creates a ContextHandler wrapping an existing slog.Handler.
func NewContextHandler(h slog.Handler) *ContextHandler {
	return &ContextHandler{Handler: h}
}

// Handle appends the correlation_id attribute if found in ctx.
func (h *ContextHandler) Handle(ctx context.Context, r slog.Record) error {
	if corrID := GetCorrelationID(ctx); corrID != "" {
		r.AddAttrs(slog.String("correlation_id", corrID))
	}
	return h.Handler.Handle(ctx, r)
}

// WithAttrs returns a new ContextHandler with the given attributes added.
func (h *ContextHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	return &ContextHandler{Handler: h.Handler.WithAttrs(attrs)}
}

// WithGroup returns a new ContextHandler with the given group name applied.
func (h *ContextHandler) WithGroup(name string) slog.Handler {
	return &ContextHandler{Handler: h.Handler.WithGroup(name)}
}
