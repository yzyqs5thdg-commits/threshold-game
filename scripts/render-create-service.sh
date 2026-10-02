#!/usr/bin/env bash
# Creates the THRESHOLD web service on Render through the API (same shape as render.yaml).
# Needs: RENDER_API_KEY (https://dashboard.render.com/u/settings#api-keys) and the GitHub repo
# connected to your Render account (Render asks for this the first time you create a service).
#
#   RENDER_API_KEY=... ./scripts/render-create-service.sh [branch] [followup_form_url]
#
# Prints the service URL and the generated ADMIN_TOKEN / CONSENT_TOKEN once. Store them safely.
set -euo pipefail

BRANCH="${1:-claude/build-threshold-game}"
FOLLOWUP_FORM_URL="${2:-}"
REPO="https://github.com/yzyqs5thdg-commits/threshold-game"
API="https://api.render.com/v1"
: "${RENDER_API_KEY:?set RENDER_API_KEY}"

auth=(-H "Authorization: Bearer ${RENDER_API_KEY}" -H "Content-Type: application/json" -H "Accept: application/json")

OWNER_ID="${RENDER_OWNER_ID:-$(curl -sS "${auth[@]}" "${API}/owners?limit=20" | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const o=JSON.parse(s);
  const pick=o.find(x=>x.owner.type==="team")||o[0]; if(!pick){console.error("no owner found");process.exit(1)} console.log(pick.owner.id)})')}"

ADMIN_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"
CONSENT_TOKEN="$(node -e 'console.log(require("crypto").randomBytes(32).toString("hex"))')"

payload="$(node -e '
const [owner, repo, branch, admin, consent, form] = process.argv.slice(1);
console.log(JSON.stringify({
  type: "web_service", name: "threshold", ownerId: owner, repo, branch, autoDeploy: "yes",
  serviceDetails: {
    env: "node", plan: "starter", region: "ohio", healthCheckPath: "/healthz",
    envSpecificDetails: { buildCommand: "echo no build step", startCommand: "npm start" },
    disk: { name: "threshold-data", mountPath: "/var/data", sizeGB: 1 },
  },
  envVars: [
    { key: "NODE_VERSION", value: "22.14.0" },
    { key: "DATA_DIR", value: "/var/data" },
    { key: "ADMIN_TOKEN", value: admin },
    { key: "CONSENT_TOKEN", value: consent },
    { key: "RANDOMISATION", value: "simple" },
    { key: "CONSENT_TIMESTAMP_PRECISION", value: "exact" },
    { key: "FOLLOWUP_FORM_URL", value: form },
    { key: "IMMEDIATE_DEBRIEF", value: "false" },
    { key: "STUDY_CLOSED", value: "false" },
  ],
}))' "$OWNER_ID" "$REPO" "$BRANCH" "$ADMIN_TOKEN" "$CONSENT_TOKEN" "$FOLLOWUP_FORM_URL")"

resp="$(curl -sS "${auth[@]}" -X POST "${API}/services" -d "$payload")"
url="$(printf '%s' "$resp" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=JSON.parse(s);if(!r.service){console.error(s);process.exit(1)}console.log(r.service.serviceDetails.url)})')"

echo "Service created. Render is now building and deploying it (2–3 minutes)."
echo "URL:            ${url}"
echo "Admin page:     ${url}/admin"
echo "ADMIN_TOKEN:    ${ADMIN_TOKEN}"
echo "CONSENT_TOKEN:  ${CONSENT_TOKEN}   (PI only)"
