(function () {
  const KEY = 'threshold.admin.token';
  const form = document.getElementById('token-form');
  const tokenInput = document.getElementById('token');
  const errorBox = document.getElementById('error');
  const dash = document.getElementById('dash');
  let token = '';
  try { token = sessionStorage.getItem(KEY) || ''; } catch { /* ignore */ }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const showError = (msg) => { errorBox.textContent = msg; errorBox.hidden = false; };

  async function authed(path) {
    const res = await fetch(path, { headers: { Authorization: 'Bearer ' + token }, cache: 'no-store' });
    if (res.status === 401) throw new Error('That token was not accepted.');
    if (!res.ok) throw new Error('Request failed (' + res.status + ').');
    return res;
  }

  async function load() {
    const s = await (await authed('/api/admin/summary')).json();
    const conds = ['A', 'B', 'C', 'D'];
    const names = { A: 'Epistemic · Gain', B: 'Epistemic · Loss', C: 'Aleatory · Gain', D: 'Aleatory · Loss' };
    const rows = conds.map((c) => {
      const r = s.byCondition[c];
      const total = r.started + r.submitted + r.withdrawn;
      return `<tr><td>${c} — ${names[c]}</td><td>${r.submitted}</td><td>${r.started}</td><td>${r.withdrawn}</td><td>${total}</td></tr>`;
    }).join('');
    const t = s.totals;
    document.getElementById('table').innerHTML = `
      <thead><tr><th>Condition</th><th>Submitted</th><th>Started</th><th>Withdrawn</th><th>All</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td>Total</td><td>${t.submitted}</td><td>${t.started}</td><td>${t.withdrawn}</td><td>${t.submitted + t.started + t.withdrawn}</td></tr></tfoot>`;
    document.getElementById('meta').textContent =
      `Consent log entries: ${s.consentCount}. Randomisation: ${s.config.randomisation}. Immediate debrief: ${s.config.immediateDebrief ? 'on' : 'off'}. Study closed: ${s.config.studyClosed ? 'yes' : 'no'}. Instrument ${s.versions.instrument}; consent ${s.versions.consent}.`;
    dash.hidden = false;
    form.closest('.card').hidden = true;
  }

  async function download(path) {
    try {
      const res = await authed(path);
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const name = (cd.match(/filename="([^"]+)"/) || [])[1] || 'export.csv';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } catch (e) {
      alert(e.message);
    }
  }

  document.getElementById('dl-sessions').addEventListener('click', () => download('/api/admin/export/sessions.csv'));
  document.getElementById('dl-submitted').addEventListener('click', () => download('/api/admin/export/sessions.csv?status=submitted'));
  document.getElementById('dl-consent').addEventListener('click', () => download('/api/admin/export/consent.csv'));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    token = tokenInput.value.trim();
    errorBox.hidden = true;
    try {
      await load();
      try { sessionStorage.setItem(KEY, token); } catch { /* ignore */ }
    } catch (err) {
      showError(err.message);
    }
  });

  if (token) load().catch(() => { token = ''; });
})();
