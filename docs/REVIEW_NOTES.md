# Review notes for the animated game layer

An adversarial review (five independent lenses, each finding re-tested by two refuters) was run on the animated game layer before it was adopted. This file records what was found, what was changed, and the measurements that back the statements in `docs/BUILD_DECISIONS.md`. Keep it with the IRB file: it is the evidence that the visuals are inert as an experimental factor.

## Confirmed and fixed

| Lens | Finding | Fix |
| --- | --- | --- |
| Validity | The scene (200 px) and the incoming strip (48 px) above the incident text pushed the three decision options below the fold at 1280×720 and 1366×768, so `lat_n` would have included a scroll; on phones the framing sentence itself was partly below the fold at paint. | The scene is now a backdrop band behind the card header, the incoming strip is a chip inside the header row, and on cards 640 px or wider the three options sit in one row. Measured after the change (all four conditions, all five items): at 1280×720 and 1366×768 the whole situation report and all three options are on screen at render (worst-case bottom edge 642 px). At 390×844 the whole situation report is on screen at render (worst case 713 px) and the options are one scroll below, as they were before the game layer. At 360×740 the two longest framings extend 69 px past the fold. |
| Validity | The card faded in over ~400 ms and the scan sweep crossed the text, so the situation report was not fully legible at the instant the latency clock started; reduced-motion participants had neither. | Timed screens have no entrance animation and no sweep. `itemShownAt` is now taken at the first frame painted after render (double `requestAnimationFrame`), and option clicks use the input event's own timestamp, so main-thread load cannot delay either end of the measurement. |
| Visual | Sticky HUD rail taller than short viewports clipped the consent link and, on 650 px screens, the timeline. | HUD extras hide below 880 px viewport height; the rail scrolls if it must and becomes static below 700 px. |
| Visual | On phones the portrait became a full-width 475 px block above the briefing. | Side-by-side layout with a 96 px portrait at phone width. |
| Visual | Onboarding form squeezed to ~334 px at 860–1000 px viewports. | Single column (badge first) up to 1040 px. |
| A11y | Incoming strip's non-wrapping text widened the page at 320 px; incident title and consent e-mail could do the same. | Page columns are `minmax(0, 1fr)`, long strings wrap, the strip wraps or truncates on narrow widths. |
| A11y | Tertiary text (`--ink-3`) at 4.3–4.5:1 on the lighter panel gradient. | Token lightened to `#8593b1` (about 5:1). |
| A11y | Boot splash dismissable only by click; cosmetic clock announced by screen readers on every screen. | Any key dismisses the splash; the clock is no longer a live region. |
| Validity (low) | The boot-splash flag survived a completed session, so the next participant in the same tab skipped the splash. | Cleared with the session on submit, withdraw and decline. |
| Code (low) | Decision and profile submit handlers could re-enter during the lock-in / badge effect; inputs stayed editable after their values were captured. | One-shot guards; inputs disabled for the duration of the effect. |
| Code (low) | `audit.js` declared a helper named `document`, shadowing the global. | Renamed. |
| Code (low) | The standalone bundler had no parse check, so a stray `export` form would ship a blank page. | The build now parses the assembled module and fails loudly. |
| Perf | Server build took ~18 s to first screen on slow 3G: 20 uncompressed requests over serial round trips. | Static assets are gzip-compressed (the client script drops from 37 KB to 11 KB) and the effects modules are `modulepreload`ed. Hosts that terminate HTTP/2 (Render does) remove the connection limit as well. |
| Perf | HUD telemetry ran 22 infinite animations, one of them a transform-animated blurred group; the globe scene blurred moving elements and ran 34 SMIL animators. | Blur removed from anything that moves (replaced by wide low-opacity strokes and radial gradients); glyph and dot pulses animate opacity only; SMIL load reduced. |

## Refuted

- "The ambient canvas is the dominant CPU cost and saturates a throttled phone." Both refuters found the attribution did not hold once the scene costs were separated; the canvas is capped at 30 fps, pauses when hidden, and draws one static frame under reduced motion.
- "Dozens of individually animated SVG elements keep incident screens at 25–33 fps." Not reproducible as stated after the per-scene optimisations; residual cost is acceptable for this product.

## Accepted as is

- The Internal Review scene shows abstract check marks and a seal. It is thematic dressing for an item whose text states that no findings were identified; the item is a pre-registered attention check whose instruction is explicit. Recorded in `docs/BUILD_DECISIONS.md`.
- The standalone preview bundle is unminified (about 280 KB). It is a preview, not the data-collection build.
- On phones the three options sit one scroll below the situation report, as in the pre-game build; the stimulus itself is fully visible at render on a 390×844 screen.
