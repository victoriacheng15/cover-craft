# ADR 005: Randomize Colors Feature

- **Status:** Proposed
- **Date:** 2026-01-27
- **Author:** Victoria Cheng

## Context and Problem Statement

Users currently have to manually select both background and text colors when creating a cover image. This process can be tedious if the user doesn't have a specific design in mind, or it can be difficult to find a starting point for a color scheme. Users need a way to quickly generate random color combinations to facilitate inspiration and speed up the creation process, while maintaining the ability to fine-tune the selection manually.

## Decision Outcome

We will implement a "Randomize Colors" feature within the existing frontend architecture, prioritizing "Accessibility by Design."

- **Logic Location:** The randomization logic will be centralized in the `useForm` hook (`frontend/src/hooks/useForm.ts`) to maintain state management consistency.
- **Algorithmic Accessibility:** Instead of purely random generation, the logic will include a validation loop. It will generate color pairs until a combination meets or exceeds the WCAG AA contrast threshold (4.5:1). This ensures that the user is never presented with an inaccessible starting point.
- **State Management:** The feature will update both `backgroundColor` and `textColor` simultaneously in the `formData` state once a valid pair is found.
- **UI Integration:** A "Randomize Colors" button will be added to `CoverFormControls` (`frontend/src/components/form/CoverFormControls.tsx`), positioned near the color inputs for optimal UX.

## Consequences

- **Positive:**
  - **Enhanced UX:** Users can quickly generate ideas without manual effort.
  - **Accessibility First:** By embedding compliance into the algorithm, we eliminate the risk of generating "broken" or unreadable designs.
  - **Seamless Integration:** Reuses existing state management and contrast calculation logic.
  - **Flexibility:** Does not lock the user into the random selection; manual overrides remain available.

- **Negative/Trade-offs:**
  - **Computational Overhead:** A validation loop introduces a theoretical risk of multiple iterations before finding a match. However, given the vast color space, a valid pair is typically found in under 1ms, making the impact on UI performance negligible.

## Verification

- [ ] **Manual Check:** Click "Randomize Colors" in the UI and verify that the resulting pair always displays a "Good" contrast status.
- [ ] **Automated Tests:** Unit tests in `frontend/src/hooks/useForm.test.ts` to verify `handleRandomizeColors` always produces pairs that meet the WCAG AA threshold.
