# Browser verification — 2026-09-09

The first delivery's HTTP/API checks did not exercise client navigation. That
was insufficient: the deployed `next/link` shim threw on click and prefetch,
leaving users on the current page. This was reproduced in the in-app browser.
Directly opening a URL returned 200 and did not detect the defect.

## Corrections

- Native document links replace the failing client router path across the app.
- Category navigation starts with the requested category and fresh state.
- Landing search immediately produces a shortlist for the submitted intent.
- Circle links open a setup dialog. Product vote links retain the chosen product.
- The preview keeps loading feedback until its first rendered frame and prevents
  premature captures. Browser-only loading avoids an aborted server Suspense boundary.
- Reset restores orbit/zoom as well as placement. Fullscreen has an exit action.
- Preview errors fall back to photography. Camera requests can be canceled and
  stale asynchronous camera operations cannot update a newer session.
- Preview framing accounts for narrow viewports; icon controls have names.

## Browser checks performed

On the local development build and the compiled production Worker:

- Landing preview link reaches the fashion scene; model visibly renders.
- Landing search submits intent and automatically shows three recommendations.
- Header Home and Gadgets navigation changes the displayed product collection.
- Product-card preview links reach their matching product scenes.
- Compare selects two products and opens a populated, dismissible dialog.
- Fashion finish selection changes both the rendered finish and bag variant.
- Dragging changes the view; Reset restores its starting orientation.
- Private snapshot capture produces a local image and download action.
- Adding a variant opens a persistent bag; review opens a dialog; confirming a
  local sample selection visibly saves it without placing an order.
- Gadget tutorial steps change captions; Pause changes to Play; a fold question
  selects the folding tutorial.
- Home rotation and placement sliders respond to keyboard input.
- Expand enters fullscreen; Exit fullscreen restores the page.
- Circle entry opens setup; creation displays an invitation link; adding the
  labeled demo member, voting, and `@cosmic` chat visibly update the circle.
- Phone-size landing and preview layouts have no horizontal document overflow.
- Server-rendered AR output has no aborted Suspense recovery boundary after the fix.

These were interaction and rendered-state checks, not merely HTTP status checks.
They establish the tested Chromium behavior; there is no visual-regression
baseline or completed cross-browser/device matrix. Actual camera access was
explicitly skipped at the user's request. Camera hardware, pose accuracy, and
Safari/device-specific behavior remain unverified.

Before any future release, repeat the landing → shortlist → product → preview
and circle-entry clicks against the actual deployed production bundle. A passing
build or direct route request must never substitute for those browser checks.
