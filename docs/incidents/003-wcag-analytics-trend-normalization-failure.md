# RCA 003: WCAG Analytics Trend Normalization Failure

- **Status:** Resolved
- **Date:** 2026-02-05
- **Severity:** Low
- **Author:** Victoria Cheng
- **Related Commits:** `46fbbcc`

## Summary

The accessibility analytics chart could omit WCAG levels when the aggregation payload did not contain every expected level. This made trend data appear incomplete or inconsistent even when the underlying query completed successfully.

## Impact

- **User Impact:** Analytics could visually underreport or hide WCAG `AAA` or `AA` trends.
- **System Impact:** The API returned sparse aggregation data that pushed normalization responsibility into the UI.
- **Duration:** Unknown. The normalization fix was committed on 2026-02-05.

## Timeline

- **2026-02-05:** Missing WCAG level rendering identified in accessibility analytics.
- **2026-02-05:** API aggregation updated to always include `AAA` and `AA` counts.
- **2026-02-05:** Frontend chart rendering updated to render known WCAG lines consistently.

## Root Cause Analysis

MongoDB aggregation returned only WCAG levels present in the matching metric data. The frontend then derived chart lines from the keys in the first trend record. If a level was absent in that record or absent from the result set, the corresponding line could disappear from the chart.

The API and UI did not share a stable response contract for sparse analytics data.

## Resolution

The analytics query now normalizes WCAG distribution and trend records to include `AAA` and `AA` with zero values when missing. The chart renders the known WCAG levels directly instead of deriving series from object keys.

## Lessons Learned

- **What went well:** The fix clarified the API contract and simplified chart rendering.
- **What went wrong:** Sparse aggregation output leaked into the presentation layer.
- **What was lucky:** The issue affected reporting clarity, not the stored metric records.

## Action Items

- [x] **Fix:** Normalize WCAG distribution and trend payloads in the API.
- [x] **Fix:** Render explicit `AAA` and `AA` chart lines in the frontend.
- [x] **Prevention:** Add analytics contract tests for empty and sparse datasets.
- [x] **Process:** Document that analytics endpoints should return stable shape payloads.

## Verification

- [x] **Manual Check:** View analytics with sparse data and confirm both WCAG lines render.
- [x] **Automated Tests:** Add sparse dataset tests for accessibility analytics.
- [x] **Deployment Check:** Confirm production analytics dashboard renders normalized trends.
