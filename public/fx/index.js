// Visual effects registry. Every module here is purely decorative: it never receives any
// information about the participant's condition or decisions, and renders identically for everyone.
//
// In the standalone (no-server) build this file is replaced by generated code; keep the export
// names in sync with scripts/build-standalone.js.

import * as cyber from './cyber.js';
import * as supply from './supply.js';
import * as audit from './audit.js';
import * as regulatory from './regulatory.js';
import * as geo from './geo.js';
import { mountAmbient } from './ambient.js';
import { renderHudExtras, renderIncomingBanner, scanSweep, decodeReveal, badgeActivate, lockIn, stampIn } from './effects.js';

/** Animated banner per incident domain (keys match the `domain` field in server/content.js). */
export const VIGNETTES = {
  Cybersecurity: cyber,
  'Supply chain': supply,
  'Internal audit': audit,
  Regulatory: regulatory,
  Geopolitical: geo,
};

export { mountAmbient, renderHudExtras, renderIncomingBanner, scanSweep, decodeReveal, badgeActivate, lockIn, stampIn };
