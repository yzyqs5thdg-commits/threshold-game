# Deploying on Render

The repo contains a Render Blueprint (`render.yaml`) that creates one web service with a 1 GB persistent disk, where the two SQLite databases live. Render serves it over HTTPS automatically.

**Cost.** Persistent disks are only available on paid instances. The Blueprint uses the Starter plan (about $7/month) plus the disk ($0.25/GB/month). The free plan would lose the database on every deploy or restart, so it is not suitable for data collection.

## One-click: Blueprint from the dashboard

1. Sign in at <https://dashboard.render.com> and connect your GitHub account to the `yzyqs5thdg-commits/threshold-game` repository when prompted.
2. Go to **Blueprints → New Blueprint Instance**, choose the repository, and choose the branch that contains `render.yaml` (currently `claude/build-threshold-game`; use `master` after merging and update the `branch:` line in `render.yaml`).
3. Render reads `render.yaml` and asks for one value: `FOLLOWUP_FORM_URL`, the Google Form link shown after submission. Leave it blank to hide the link for now.
4. Click **Apply**. The first deploy takes 2–3 minutes. The service URL looks like `https://threshold-xxxx.onrender.com`.
5. Open the service → **Environment** tab and copy `ADMIN_TOKEN` (study team) and `CONSENT_TOKEN` (PI only). Render generated them. Store them in a password manager; they are the only way into `/admin` and the exports.
6. Visit `https://<your-service>/healthz` (should return `{"ok":true}`), then `/` to play, then `/admin` with the token.

## From the command line (API key)

If you prefer, create an API key at <https://dashboard.render.com/u/settings#api-keys> and run:

```bash
RENDER_API_KEY=rnd_xxx ./scripts/render-create-service.sh claude/build-threshold-game "https://forms.gle/your-form"
```

The script prints the service URL and the generated tokens once. The repository still has to be connected to your Render account first (step 1 above).

## After deploying

- **Custom domain** (optional): service → Settings → Custom Domains. Render issues the certificate.
- **Pilot first**: run 5–10 sessions, download the export from `/admin`, check the columns against the analysis script, then **delete the pilot data** before recruitment: service → Shell, then `rm /var/data/*.db*` and restart the service.
- **Nightly export** to the PI's Columbia Google Drive: download from `/admin` (sessions CSV with the admin token; consent log separately with the PI token), or run `npm run export -- --consent` from the service's Shell tab and copy the files out.
- **Closing the study**: set `STUDY_CLOSED=true` in the Environment tab. Export, copy to Columbia storage, then delete the service and disk.
- **Logs**: Render's own HTTP logs include request IPs. The application never stores them, but Render retains its logs for a limited period (7 days on Starter). Mention this in the data-protection section if the IRB asks about hosting-platform identifiers.
- **Changing text or settings**: push to the deployed branch; `autoDeploy` redeploys automatically. Environment changes also trigger a redeploy. The database on the disk survives both.
