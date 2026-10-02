// Electronic informed consent form shown on Screen 1.
//
// DRAFT. The protocol (v1.3, §7) describes the content of the consent form and states that
// the approved form is "attached separately" to the IRB submission. That attachment was not
// available when this build was made, so the text below was drafted from Protocol §§7, 11,
// 12, 13 and the September 2026 working draft. Replace it with the IRB-approved wording
// before data collection and bump CONSENT_VERSION in content.js when you do.
//
// Served (a) inside the app on the consent screen and (b) as a printable page at /consent.

export const CONSENT_TITLE = 'Decision-Making in Organizational Risk Scenarios';
export const CONSENT_SUBTITLE = 'Informed consent to take part in a research study';

export const CONSENT_SECTIONS = [
  {
    heading: 'Who is doing this study',
    body: [
      'This research is conducted by Jana Chamsi Bacha and Meher Jain, M.S. in Enterprise Risk Management, Columbia University School of Professional Studies, under the supervision of Principal Investigator Richard J. Lauria. Columbia University IRB protocol IRB-ACYY3579.',
    ],
  },
  {
    heading: 'Why we are doing this study',
    body: [
      'We are studying how people with work experience make decisions about business risks. The results will help us understand how risk information is used in organizations and how it might be communicated better.',
    ],
  },
  {
    heading: 'What you will do',
    body: [
      'You will play THRESHOLD, a short online decision simulation. You will take the role of the Chief Risk Officer of a fictional company and respond to four short business scenarios, choosing one of three actions for each and rating how confident you are. You will also answer a few short questions about your professional background and your general approach to decisions, and two brief questions at the end. The session takes about 6–10 minutes and is completed in one sitting. There are no right or wrong answers.',
    ],
  },
  {
    heading: 'Important information about the design of this study',
    body: [
      'For scientific reasons, this form does not describe every detail of what is being studied, and those details will not be described during the study. Nothing you are told during the session is untrue. The study will be explained in full in the summary of findings provided once the study is complete, which you can choose to receive by email.',
    ],
  },
  {
    heading: 'What we record',
    body: [
      'We record your answers, the decisions you make, how confident you are in each decision, and how long you take to make each decision. We do not record your name, email address, employer, IP address or any device identifier with your responses. Your responses are stored under a randomly generated session code.',
    ],
  },
  {
    heading: 'Risks and benefits',
    body: [
      'This study involves no more than minimal risk. The scenarios are fictional and have no consequences for you. Some people may find making decisions in hypothetical risk situations mildly stressful; you may stop at any time by closing the browser. The main residual risk is a breach of confidentiality, which we minimize by collecting no identifiers with your responses and by restricting access to the study team.',
      'There is no direct benefit to you from taking part. If you choose, you will receive early access to a plain-language summary of the findings, including a full explanation of the study, before it is published. Participation is voluntary and unpaid.',
    ],
  },
  {
    heading: 'Confidentiality',
    body: [
      'Your typed name and the date on this form are stored in a separate consent log that contains no link to your responses, so your responses cannot be traced back to you, including by the investigators. Data are transmitted over an encrypted connection and stored in an access-controlled database available only to the Principal Investigator and the two co-investigators. Anonymous response data (without the consent log) may be shared publicly on the Open Science Framework and used in future research. Records are retained for at least three years after the study closes.',
    ],
  },
  {
    heading: 'Your participation is voluntary',
    body: [
      'You may stop at any time by closing the browser; incomplete sessions are not used. At the end of the session you will choose whether to submit or withdraw your responses. Because your responses are not linked to your name, they cannot be withdrawn after you leave that final screen.',
      'If you were invited by someone at Columbia University, your decision to take part or not has no effect on your grades, student status, employment or your relationship with Columbia or with anyone who invited you.',
    ],
  },
  {
    heading: 'Questions',
    body: [
      'Questions about the study: Jana Chamsi Bacha and Meher Jain, CU_ERM_Research@columbia.edu. Questions about your rights as a research participant: Columbia University Institutional Review Board, askirb@columbia.edu or (212) 851-7040.',
    ],
  },
];

export const CONSENT_STATEMENT =
  'By typing my full name and the date below and selecting “I agree,” I confirm that I am 18 years of age or older, that I have read this consent form, that my questions (if any) have been answered, and that I agree to take part in this study. I understand that some details of the study are not described here and will be explained in the summary of findings.';

export const CONSENT_AGREE_LABEL = 'I agree';
export const CONSENT_DECLINE_LABEL = 'I do not agree';

const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Consent as a JSON-serialisable object for the app. */
export function consentPayload() {
  return {
    title: CONSENT_TITLE,
    subtitle: CONSENT_SUBTITLE,
    sections: CONSENT_SECTIONS,
    statement: CONSENT_STATEMENT,
    agreeLabel: CONSENT_AGREE_LABEL,
    declineLabel: CONSENT_DECLINE_LABEL,
  };
}

/** Stand-alone printable HTML page for /consent. */
export function consentPrintHtml(version) {
  const sections = CONSENT_SECTIONS.map(
    (s) => `<h2>${esc(s.heading)}</h2>${s.body.map((p) => `<p>${esc(p)}</p>`).join('')}`,
  ).join('');
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(CONSENT_TITLE)} — Consent form</title>
<style>
body{font-family:Georgia,"Times New Roman",serif;max-width:46rem;margin:2rem auto;padding:0 1rem;line-height:1.55;color:#111}
h1{font-size:1.5rem;margin-bottom:.25rem}h2{font-size:1.05rem;margin:1.4rem 0 .3rem}
.sub{color:#444;margin-top:0}.stmt{border-top:1px solid #999;margin-top:2rem;padding-top:1rem}
.sig{margin-top:1.5rem}.sig div{margin:.8rem 0}.line{display:inline-block;border-bottom:1px solid #000;min-width:18rem}
.ver{color:#666;font-size:.8rem;margin-top:2rem}
@media print{button{display:none}}
</style></head><body>
<button onclick="window.print()">Print or save as PDF</button>
<h1>${esc(CONSENT_TITLE)}</h1>
<p class="sub">${esc(CONSENT_SUBTITLE)} · Columbia University IRB-ACYY3579</p>
${sections}
<div class="stmt"><p>${esc(CONSENT_STATEMENT)}</p></div>
<div class="sig"><div>Full name: <span class="line"></span></div><div>Date: <span class="line"></span></div></div>
<p class="ver">Consent form version ${esc(version)}</p>
</body></html>`;
}
