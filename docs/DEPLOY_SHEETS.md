# Deploying with Google Sheets (no server)

This option runs the game as a static site on GitHub Pages and stores responses in the study's Google Sheet through a small Google Apps Script web app bound to that sheet. There is nothing to pay for and no server to maintain. The data path still follows the protocol: a random session code is created at consent, responses are written only when the participant presses Submit, the consent log lives in a **separate** spreadsheet with no session identifier, and the script never sees the participant's IP address or device details (Apps Script does not expose them).

Where the spreadsheet lives matters: create it (or move it) in the Columbia Google Workspace account that the protocol names as the study's storage, share it only with the PI and co-investigators, and deploy the script from that account.

## If your Google Workspace blocks "Anyone" web apps (Columbia does)

Columbia's LionMail accounts can only publish Apps Script web apps to other LionMail users, so external participants cannot reach a script deployed there. Keep the data in the Columbia sheet but run the script elsewhere:

1. Share the Columbia sessions spreadsheet (and the consent-log spreadsheet) with a personal Gmail account as **Editor**. Copy each spreadsheet's id from its URL (`/spreadsheets/d/<id>/edit`).
2. Signed in as that Gmail account, go to <https://script.google.com> → **New project**, paste `dist/gas/Code.gs`, and add the script properties `SESSIONS_SPREADSHEET_ID` and `CONSENT_SPREADSHEET_ID` with those ids (plus `ADMIN_TOKEN`).
3. Run `setup` once, approve permissions, then deploy as a web app with **Who has access: Anyone**.

The script executes under the Gmail account but reads and writes only the Columbia-owned spreadsheets; no study data is stored in the Gmail account. Record this arrangement in the data-security section for the IRB.

## 1. Build the script

From the repository:

```bash
npm run build:gas          # writes dist/gas/Code.gs
```

The generated file embeds the study instrument, the validation rules and the derived-variable rules, so the sheet columns match `docs/DATA_DICTIONARY.md` exactly. Rebuild it whenever `server/content.js`, `server/validate.js` or `server/export.js` change, and redeploy (step 3).

## 2. Install it in the sheet

1. Open the sessions spreadsheet → **Extensions → Apps Script**.
2. Replace the contents of `Code.gs` with `dist/gas/Code.gs`. Save.
3. **Project Settings (gear) → Script properties → Add**:
   - `ADMIN_TOKEN`: a long random string (used only by the study team to read counts).
   - `CONSENT_SPREADSHEET_ID` (recommended): the id of a second spreadsheet for the consent log, shared with the PI only. If you leave it out, the script creates "THRESHOLD consent log (PI only)" in the deploying account's Drive on first use.
   - Optional: `RANDOMISATION` (`simple` or `block`), `STUDY_CLOSED` (`true` to stop), `CONSENT_TIMESTAMP_PRECISION` (`exact`, `minute`, `hour`), `RATE_SESSIONS_PER_MIN`.
4. In the editor, select the function `setup` and press **Run** once. Approve the permissions (the script needs access to spreadsheets). This creates the `sessions` tab with its headers and the consent-log sheet.

## 3. Deploy the web app

1. **Deploy → New deployment → Select type: Web app.**
2. Description: `THRESHOLD`. **Execute as: Me.** **Who has access: Anyone.** (Participants are anonymous; "Anyone" means the game can call the script without a Google sign-in. It does not expose the sheet.)
3. **Deploy**, then copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`).
4. Verify it from any machine with Node 22:

   ```bash
   node scripts/verify-deployment.mjs --gas "https://script.google.com/macros/s/…/exec" "<ADMIN_TOKEN>"
   ```

   All checks must pass. The run leaves one withdrawn session and one consent-log line named "DEPLOYMENT TEST".

After any later change to the script, use **Deploy → Manage deployments → Edit → Version: New version → Deploy** so the same URL serves the new code.

## 4. Point the game at it

In the GitHub repository: **Settings → Secrets and variables → Actions → Variables → New repository variable**:

- `THRESHOLD_GAS_ENDPOINT` = the Web app URL from step 3.
- `THRESHOLD_FOLLOWUP_FORM_URL` = the Google Form link for early access to the findings (optional).

Then run the "Publish site to GitHub Pages" workflow (Actions → select it → Run workflow), or push any change. The site root `https://yzyqs5thdg-commits.github.io/threshold-game/` becomes the participant build; the researcher preview moves to `/preview/`. The participant page carries no researcher controls, and its last screen says thank you.

Give participants the root link only.

## Operating the study

- **Counts**: the `sessions` tab is the live dataset (one row per session, `status` = started / submitted / withdrawn). Rows with `status = submitted` are the analysis file; the derived columns (`risk_taking_score`, `attn_pass`, `excl_*`, `analysis_sample`, …) are already filled in.
- **Backups**: File → Version history keeps every change; also download a CSV copy on a schedule to the PI's Drive folder as the protocol describes.
- **Pilot**: run 5–10 sessions, check the columns against the analysis script, then delete the pilot rows (and the matching consent-log lines) before recruitment.
- **Closing**: set the script property `STUDY_CLOSED` to `true`. New visitors see a "study closed" notice; sessions already in progress can still submit.
- **Limits**: Apps Script allows roughly 20,000 web-app calls per day on a consumer account and more on Workspace; a session makes two or three calls. Each call takes one to three seconds, which the game shows as a short "Starting…" or "Submitting…" state.

## What differs from the Node server

| | Node server (Render) | Google Sheets (Apps Script) |
| --- | --- | --- |
| Hosting cost | about $7/month | none |
| Where responses live | SQLite on the server disk, nightly export to Drive | directly in the Google Sheet |
| Consent log | separate database file | separate spreadsheet |
| Condition text | sent only for the assigned condition | sent only for the assigned condition (the script holds the text) |
| Admin page | `/admin` with exports | the sheet itself; `summary` action for counts |
| Study-closed switch | `STUDY_CLOSED` env var | `STUDY_CLOSED` script property |
| IP addresses | never read by the app; host logs may hold them briefly | not available to the script at all |
