# Implementation Notes - Upsell Test

## How the Popup is Triggered
The upsell logic lives within a self-contained, vanilla JavaScript IIFE in `upsell.js`.

The script handles Single Page Application (SPA) navigation using Event Delegation. A click event listener attached to the `document.body` intercepts clicks on elements corresponding to base plan options. Specifically:
- Clicking `Medication Only` triggers a modal recommending the `Monthly Auto-Refill` plan.
- Clicking `Monthly Auto-Refill` triggers a modal recommending the `3-Month Supply` plan.

When a triggered plan is clicked, the default navigation or selection behavior is prevented, and a dynamically generated HTML modal is injected into the DOM, containing precisely styled CSS that overrides no global rules and encapsulates the exact Figma design metrics.

## How Plan Selection is Handled
Plan selections are temporarily suspended while the user engages with the upsell modal:

- **Accepting the Upsell**: If the user clicks **"UPGRADE MY PLAN"**, the script updates `localStorage` with the upgraded target plan details and automatically proceeds with the checkout flow.
- **Declining the Upsell**: If the user clicks **"I'll Stick To The Higher Monthly Rate"** (or clicks the background to exit), the modal is destroyed, and their *originally* selected plan is saved to `localStorage` before continuing the checkout flow.
- **Checkout Handoff**: The script seamlessly updates the URL parameters and persists the selection (both legacy and new IDs) to `localStorage`. `test1_checkout.html` then reliably pulls the user's ultimate plan choice and updates the UI accordingly.

## Assumptions & Technical Choices
- **Dynamic CSS Injection**: To keep the implementation entirely standalone without external CSS dependencies, all the styling (including typography, pixel-perfect layouts, responsive grid behaviors, and SVG background icons) is dynamically injected directly into the `<head>` tag.
- **SPA Resilience**: Because of the SPA nature of the app, persistent event listeners and a lightweight `MutationObserver` were favored to ensure that navigating backward and forward preserves the state and layout cleanly.
- **Asset Availability**: It is assumed that images (such as `tick.png`, `product_img.png`, and specific SVGs) will be hosted relative to the index page in the exact locations defined within the injected CSS rules.
- **Exact Figma Fidelity**: The CSS precisely matches the provided Figma developer mode properties, explicitly overriding any inherited styles to ensure `DM Sans` typography, `90%` opacity blacks, calculated flex-ordering on mobile views, and diagonal red slashes match 1:1 with expectations.
