# ADR 005: Randomize Colors Feature

- **Status:** Accepted
- **Date:** 2026-01-27
- **Author:** Victoria Cheng

## Context and Problem Statement

Users currently have to manually select both background and text colors when creating a cover image. This process can be tedious if the user doesn't have a specific design in mind, or it can be difficult to find a starting point for a color scheme. Users need a way to quickly generate random color combinations to facilitate inspiration and speed up the creation process, while maintaining the ability to fine-tune the selection manually.

## Decision Outcome

We will implement a "Randomize Colors" feature within the existing frontend architecture, prioritizing "Accessibility by Design."

- **Logic Location:** The randomization logic will be centralized in the `useForm` hook (`frontend/src/hooks/useForm.ts`) to maintain state management consistency.
- **Algorithmic Accessibility:** The logic uses a validation loop that generates color pairs until a combination meets or exceeds a contrast threshold of **6.0:1** (exceeding the WCAG AA 4.5:1 requirement). This ensures immediate readability and high-quality starting points.
- **Performance Safety:** The loop is guarded by a maximum attempt limit (though benchmarks show valid pairs are typically found in <1ms) and uses `performance.now()` for precise monitoring.
- **State Management:** The feature updates both `backgroundColor` and `textColor` simultaneously in the `formData` state once a valid pair is found.
- **UI Integration:** A "Randomize Colors" button is added to `CoverFormControls` (`frontend/src/components/form/CoverFormControls.tsx`), positioned near the color inputs for optimal UX.

## Consequences

- **Positive:**
  - **Enhanced UX:** Users can quickly generate ideas without manual effort.
  - **Accessibility First:** By embedding compliance into the algorithm, we eliminate the risk of generating "broken" or unreadable designs.
  - **Seamless Integration:** Reuses existing state management and contrast calculation logic.
  - **Flexibility:** Does not lock the user into the random selection; manual overrides remain available.

- **Negative/Trade-offs:**
  - **Computational Overhead:** A validation loop introduces a theoretical risk of multiple iterations. Benchmarks confirm this is negligible (avg ~0.03ms per generation) and does not impact UI responsiveness.

## Verification

- [x] **Manual Check:** Click "Randomize Colors" in the UI and verify that the resulting pair always displays a "Good" contrast status.
- [x] **Automated Tests:** Unit tests in `frontend/src/hooks/useForm.test.ts` verify `handleRandomizeColors` always produces pairs that meet the WCAG AA threshold.

## Benchmark Evidence

To validate the "Negative/Trade-off" regarding computational overhead, the following benchmark script was executed to measure the performance of the randomization loop.

```javascript
import { getContrastRatio } from "./shared/dist/index.js";

// Use high-resolution timer
const now = (typeof performance !== 'undefined' && performance.now) 
  ? () => performance.now() 
  : () => Date.now();

const randomColor = () =>
    `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")}`;

const results = [];

function benchmark(threshold, iterations = 100) {
 let totalAttempts = 0;
 let totalTime = 0;
 let maxAttempts = 0;

 for (let i = 0; i < iterations; i++) {
  let ratio = null;
  let count = 0;
  const startTime = now();

  do {
   ratio = getContrastRatio(randomColor(), randomColor());
   count++;
  } while (ratio === null || ratio < threshold);

  const duration = now() - startTime;
  totalAttempts += count;
  totalTime += duration;
  if (count > maxAttempts) maxAttempts = count;
 }

 results.push({
  Threshold: threshold.toFixed(1),
  "Avg Attempts": Math.round(totalAttempts / iterations),
  "Max Attempts": maxAttempts,
  "Avg Time (ms)": (totalTime / iterations).toFixed(4),
 });
}

console.log("\nBenchmarking Color Randomization Performance:");
benchmark(4.5);
benchmark(6.0);
benchmark(7.0);
benchmark(10.0);
benchmark(15.0);
console.table(results);
```

### Results (100 iterations per threshold)

| Threshold | Avg Attempts | Max Attempts | Avg Time (ms) |
| :--- | :--- | :--- | :--- |
| 4.5 | 8 | 41 | 0.0360 |
| **6.0** | **18** | **103** | **0.0314** |
| 7.0 | 29 | 155 | 0.0439 |
| 10.0 | 120 | 563 | 0.1772 |
| 15.0 | 3732 | 27212 | 4.5170 |

These results confirm that the "Accessibility by Design" validation loop is safe for production use. Even at our 6.0 target, the impact on UI responsiveness is negligible (well under the 16ms frame budget).
