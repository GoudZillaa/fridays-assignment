# Join Fridays: Upsell A/B Test Implementation

Hey there! 👋 Welcome to my implementation of the **Join Fridays A/B Test Assignment**. 

This repository contains the front-end logic for a dynamic upsell experience that intercepts a user's plan selection during the onboarding flow, presenting them with a beautifully styled, responsive modal to encourage an upgrade to a higher-tier plan (like shifting from "Medication Only" to "Monthly Auto-Refill" or jumping up to a "3-Month Supply").

## 🚀 Features & Highlights

- **Pixel-Perfect UI:** The styling exactly matches the provided Figma developer handoff, including specific `DM Sans` typography rules, gradients, precise spacing, and custom SVG backgrounds (like the new checkmarks and refresh icons).
- **Fully Responsive:** Uses modern CSS Grid and Flexbox injected dynamically to elegantly shift from a side-by-side desktop view to a vertically optimized, bordered mobile card view.
- **SPA Resilient:** Because this runs within a Single Page Application (SPA), the script utilizes Event Delegation to handle clicks without losing bindings when the DOM re-renders.
- **State Persistence:** Captures the user's ultimate plan decision (whether they upgraded or declined) and passes it through `localStorage` and URL parameters to perfectly update the final `test1_checkout.html` summary.
- **Self-Contained Architecture:** The entire logic is wrapped in a Vanilla JavaScript IIFE (Immediately Invoked Function Expression). This means no global namespace pollution, and it handles its own CSS injection—making it dead-simple to drop into Google Tag Manager or VWO.

## 🛠️ How It Works

1. **The Trigger:** On `test1.html`, when a user clicks on specific baseline plans (e.g., "Medication Only"), the script intercepts the click and prevents the default selection.
2. **The Upsell:** A dynamic modal is injected into the DOM, populated with the data corresponding to the recommended upgrade path. 
3. **The Decision:** 
   - Clicking **"UPGRADE MY PLAN"** saves the upgraded plan ID and automatically proceeds to the checkout page.
   - Clicking **"I'll Stick To The Higher Monthly Rate"** (or closing the modal) gracefully falls back to the user's original selection.
4. **The Checkout:** On `test1_checkout.html`, the script reads the saved state and updates the static DOM (via MutationObservers) so the receipt accurately reflects the final price and supply choice.

## 🏃‍♂️ How to Run

1. Clone this repository to your local machine.
2. Open `test1.html` in your favorite web browser.
3. Click on the **Medication Only** or **Monthly Auto-Refill** cards to trigger the upsell modals.
4. Make a selection (Accept or Decline) and watch it seamlessly carry over your choice to the `test1_checkout.html` receipt!

## 📝 Deliverables

- `upsell.js` — The core logic containing the state management, DOM manipulation, and dynamic CSS.
- `implementation_notes.md` — A brief rundown of triggers, assumptions, and architectural choices.
- `images/` — Contains the necessary SVG and PNG assets used in the modals.

---
*Built with Vanilla JS and a sharp eye for design details!*
