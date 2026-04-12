# RCA 004: Batch API Function Key Authentication Failure

- **Status:** Resolved
- **Date:** 2026-02-27
- **Severity:** Medium
- **Author:** Victoria Cheng
- **Related Commits:** `e454449`

## Summary

Batch generation and job status calls failed after Azure Functions endpoints required function-key authentication. The Next.js BFF routes proxied requests to Azure Functions but did not forward the `x-functions-key` header.

## Impact

- **User Impact:** Batch image generation or job status polling could fail through the frontend.
- **System Impact:** The BFF-to-Azure Functions integration was missing required authentication.
- **Duration:** Unknown. The authentication fix was committed on 2026-02-27.

## Timeline

- **2026-02-27:** Batch endpoint authentication failure identified.
- **2026-02-27:** `AZURE_FUNCTION_KEY` added to frontend proxy utilities.
- **2026-02-27:** `x-functions-key` header forwarded for batch generation and job status calls.
- **2026-02-27:** Tests updated for authenticated proxy behavior.

## Root Cause Analysis

The frontend used a Backend-for-Frontend pattern, where app routes call Azure Functions on behalf of the browser. Once the Azure Functions endpoints required function-key authentication, direct BFF fetch calls without `x-functions-key` no longer satisfied the service boundary.

The missing header was an integration contract gap between the frontend proxy layer and the secured Azure Functions API.

## Resolution

The proxy utilities now read `AZURE_FUNCTION_KEY` from environment variables and send it in the `x-functions-key` header for `generateImages` and `getJobStatus` requests.

## Lessons Learned

- **What went well:** The fix kept the secret on the server side of the BFF and avoided exposing it to the browser.
- **What went wrong:** The auth requirement changed without a matching integration test for BFF-to-function calls.
- **What was lucky:** The fix did not require changing the public frontend API shape.

## Action Items

- [x] **Fix:** Forward `x-functions-key` from BFF proxy utilities.
- [x] **Prevention:** Update unit tests for authenticated proxy requests.
- [x] **Process:** Document required environment variables for secured Azure Functions calls.

## Verification

- [x] **Manual Check:** Trigger batch generation and poll job status through the frontend.
- [x] **Automated Tests:** Proxy utility tests updated in the fix commit.
- [x] **Deployment Check:** Confirm deployed frontend has `AZURE_FUNCTION_KEY` configured.
