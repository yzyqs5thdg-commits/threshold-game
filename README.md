# THRESHOLD

Browser-based decision simulation for the Columbia University SPS study **Decision-Making in Organizational Risk Scenarios** (Project THRESHOLD, IRB-ACYY3579). It delivers the 2 × 2 between-subjects experiment described in the Stand-Alone Research Protocol v1.3: uncertainty type (epistemic vs. aleatory) × outcome framing (gain vs. loss).

Participants play the newly appointed Chief Risk Officer of Meridian Group, receive a briefing from Dr. Vale, make four risk-exposure decisions with confidence ratings, pass through one data-quality item and two manipulation-check items, and choose on the closing screen whether to submit or withdraw their responses.

All instrument text comes verbatim from Protocol v1.3, Appendix B and C. Build choices that the protocol left open are listed, with the reasoning, in [`docs/BUILD_DECISIONS.md`](docs/BUILD_DECISIONS.md). Export columns are documented in [`docs/DATA_DICTIONARY.md`](docs/DATA_DICTIONARY.md).

## What is in the box

| Path | Purpose |
| --- | --- |
| `server/content.js` | Every participant-facing study text: profile items, risk-propensity items, both briefings, all 16 scenario variants, data-quality item, manipulation checks, closing screen, Appendix C.2 debrief. |
| `server/consent.js` | Consent form text (draft, see below). Served in-app and as a printable page at `/consent`. |
| `server/index.js` | HTTP server and API. Zero dependencies (Node built-ins only). |
| `server/db.js` | Storage: two separate SQLite files, `study.db` (responses) and `consent.db` (consent log). |
| `server/randomise.js` | Condition assignment (simple or permuted-block). |
| `server/validate.js` | Server-side validation of every submitted value. |
| `server/export.js` | Derived variables and CSV export. |
| `public/` | The game (plain HTML/CSS/JS, no build step) and the study-team page at `/admin`. |
| `test/` | Unit and API tests (`npm test`). |

## Running it

Requires Node.js 22.13 or later (it uses the SQLite module built into Node, so there is nothing to compile and nothing to install).

```bash
cp .env.example .env        # then edit: at minimum set ADMIN_TOKEN
set -a; . ./.env; set +a    # or export the variables another way
npm start                   # http://localhost:3000
```

- Game: `http://localhost:3000/`
- Printable consent form: `/consent`
- Study team dashboard and exports: `/admin` (needs `ADMIN_TOKEN`)
- Health check: `/healthz`

Tests: `npm test`. Export from the command line without the server running: `npm run export` (add `-- --consent` to also write the consent log; keep that file separate).

### Configuration (environment variables)

| Variable | Default | Meaning |
| --- | --- | --- |
| `PORT` | `3000` | Listening port. |
| `DATA_DIR` | `./data` | Where `study.db` and `consent.db` live. Must be on persistent storage in production. |
| `ADMIN_TOKEN` | *(none)* | Secret for `/admin` and the session export. Admin is disabled until this is set. |
| `CONSENT_TOKEN` | = `ADMIN_TOKEN` | Separate secret for the consent-log export, so only the PI needs to hold it. |
| `RANDOMISATION` | `simple` | `simple` = independent 25 % draw per participant. `block` = permuted blocks of four (equal cell sizes). |
| `CONSENT_TIMESTAMP_PRECISION` | `exact` | `exact`, `minute` or `hour` for the consent-log timestamp. |
| `FOLLOWUP_FORM_URL` | *(none)* | Link to the separate Google Form for early access to findings, shown after submit. |
| `IMMEDIATE_DEBRIEF` | `false` | `true` shows the Appendix C.2 explanation on the closing screen (only if the IRB requires it). |
| `STUDY_CLOSED` | `false` | `true` stops new sessions and shows a "study closed" notice. |

## Deploying

The server needs a persistent disk for `DATA_DIR` and must sit behind HTTPS. Any host that runs a Node process with a volume works (Render, Railway, Fly.io, a Columbia-managed VM, Docker anywhere). Serverless platforms (Vercel, Netlify functions) will not work because they have no persistent local disk.

Docker:

```bash
docker build -t threshold .
docker run -p 3000:3000 -v threshold-data:/data -e ADMIN_TOKEN=... threshold
```

Before go-live:

1. Replace the draft consent text in `server/consent.js` with the IRB-approved wording and update `CONSENT_VERSION` in `server/content.js`.
2. Set `FOLLOWUP_FORM_URL` to the Google Form.
3. Decide `RANDOMISATION` (see `docs/BUILD_DECISIONS.md`) and record the choice in the pre-registration.
4. Run a 5–10 session pilot, export, and check the columns against the pre-registered analysis script. Delete pilot data (`DATA_DIR`) before recruitment.
5. Confirm the hosting platform's own access logs are either disabled or retained separately and briefly: the application never records IP addresses or user agents, but a reverse proxy might.

Nightly export to the PI's Columbia Google Drive: schedule `npm run export` (or download from `/admin`) and copy the CSV. Export the consent log separately with `CONSENT_TOKEN` and store it in a different folder with different access.

## Privacy properties of this build

- Responses are stored under a random v4 UUID created by the server after consent. No name, email, IP address, user agent, referrer or cookie is read, logged or stored by the application.
- The consent log (typed name, date, timestamp) is in a different database file from the responses, contains no session ID, and is exported by a separate endpoint and token.
- Nothing beyond the session's existence and condition is written until the participant selects **Submit my responses**. **Withdraw my responses** records only that the session was withdrawn.
- A participant only ever receives the text of the condition they were assigned; the other three versions are never sent to the browser.
- The page loads no third-party resources (no fonts, analytics or CDNs), so no third party sees participant traffic.
- Session state lives in the tab's `sessionStorage` so an accidental refresh resumes where the participant was; closing the tab discards it.

## Status of the instrument text

| Element | Source | Status |
| --- | --- | --- |
| Profile items, risk-propensity items, both briefings, 16 scenario variants, data-quality item, manipulation checks, closing screen, C.2 debrief | Protocol v1.3, Appendices B and C | Verbatim (one typo corrected, see build decisions) |
| Manipulation-check framing lines ("End of day one" heading and one intro sentence) | This build | Added so the items sit inside the narrative, as §6 requires |
| Onboarding and briefing framing lines (headings, "Begin the day", one orienting sentence) | This build | Neutral scaffolding, identical across conditions |
| Consent form | Drafted from Protocol §§7, 11–13 | **Draft: replace with the IRB-approved form** |
