// Study instrument text. Source: Stand-Alone Research Protocol v1.3 (28 Sept 2026),
// Appendix B (study instrument) and Appendix C (closing screen). Text is reproduced
// verbatim; the only edit is a typo fix in Scenario 3, condition D ("due non-compliance"
// -> "due to non-compliance"), noted in docs/BUILD_DECISIONS.md.
//
// Everything that varies by condition is kept here, server-side, and is only ever sent
// to a participant for the condition they were assigned.

export const INSTRUMENT_VERSION = 'protocol-v1.3-appendixB';
export const CONSENT_VERSION = 'consent-draft-2026-09-28';

export const CONDITIONS = {
  A: { uncertainty: 'epistemic', framing: 'gain' },
  B: { uncertainty: 'epistemic', framing: 'loss' },
  C: { uncertainty: 'aleatory', framing: 'gain' },
  D: { uncertainty: 'aleatory', framing: 'loss' },
};

export const ORGANISATION = {
  name: 'Meridian Group',
  role: 'Chief Risk Officer',
  analyst: 'Dr. Vale',
  analystTitle: 'Strategy Analyst, Meridian Group',
};

// ---------------------------------------------------------------------------
// Screen 2: CRO profile (onboarding items). Gender, age and country are not collected.
// ---------------------------------------------------------------------------
export const PROFILE_ITEMS = [
  {
    id: 'education',
    label: 'Highest education completed',
    options: ['High school', "Bachelor's", "Master's", 'Doctorate', 'Other / Prefer not to say'],
  },
  {
    id: 'job_function',
    label: 'Job function',
    options: [
      'ERM',
      'Operational risk',
      'Financial risk',
      'Credit or market risk',
      'Compliance',
      'Internal audit',
      'Internal controls',
      'IT or cyber risk',
      'Business continuity',
      'GRC',
      'Other',
      'Prefer not to say',
    ],
  },
  {
    id: 'years_experience',
    label: 'Years of professional work experience',
    options: ['2–4', '5–9', '10–14', '15+', 'Prefer not to say'],
  },
  {
    id: 'seniority',
    label: 'Seniority',
    options: [
      'Analyst or associate',
      'Manager',
      'Senior manager or director',
      'Executive',
      'Other',
      'Prefer not to say',
    ],
  },
  {
    id: 'industry',
    label: 'Industry',
    options: [
      'Financial services',
      'Consulting',
      'Technology',
      'Manufacturing',
      'Energy',
      'Healthcare',
      'Government or non-profit',
      'Other / Prefer not to say',
    ],
  },
];

// ---------------------------------------------------------------------------
// Screen 3: Decision-making style (risk propensity; DOSPERT-adapted, 1–5).
// Items 2 and 3 are reverse-scored at analysis time.
// ---------------------------------------------------------------------------
export const STYLE_HEADING = 'Decision-making style';
export const STYLE_INSTRUCTION = 'Rate your agreement with each statement (1 = strongly disagree, 5 = strongly agree).';
export const STYLE_ITEMS = [
  { id: 'rp_1', text: 'I generally enjoy taking calculated risks.', reverse: false },
  { id: 'rp_2', text: 'I prefer certainty over chasing upside.', reverse: true },
  { id: 'rp_3', text: 'I tend to avoid situations with unclear outcomes.', reverse: true },
];

// ---------------------------------------------------------------------------
// Screen 4: Analyst briefing (varies by uncertainty condition only).
// ---------------------------------------------------------------------------
export const BRIEFING = {
  epistemic:
    'Welcome to your first day. I’ll be direct: the crises you are about to face are the kind where our analysts cannot put a reliable number on the odds. The data we have is thin, the situations are new, and the honest answer to ‘how likely is this?’ is that we do not yet know.',
  aleatory:
    'Welcome to your first day. I’ll be direct: for the crises you are about to face, our analysts have good historical data and can estimate the odds. But these are situations driven by chance — more monitoring will not change the number, and the outcome could still go either way.',
};

// ---------------------------------------------------------------------------
// Screen 5: Crisis scenarios. Context is identical across conditions; the framing
// paragraph varies by condition (A–D). Presentation order is fixed (1–4) with the
// data-quality item between scenarios 2 and 3.
// ---------------------------------------------------------------------------
export const DECISION_OPTIONS = [
  { value: 'increase', label: 'Increase risk exposure', score: 1 },
  { value: 'maintain', label: 'Maintain current level', score: 0 },
  { value: 'decrease', label: 'Decrease risk exposure', score: -1 },
];

export const CONFIDENCE_QUESTION = 'How confident are you in this decision?';
export const CONFIDENCE_ANCHORS = { low: 'Not at all confident', high: 'Very confident' };

export const SCENARIOS = [
  {
    id: 1,
    key: 'data_breach',
    title: 'Data Breach Exposure',
    domain: 'Cybersecurity',
    context:
      'Your organization stores significant customer and financial data across distributed systems.',
    framing: {
      A: 'Security analysts cannot determine the precise breach probability — threat patterns are evolving rapidly and historical data is insufficient. Maintaining current practices may enable faster digital product rollout and first-mover advantage if a breach does not occur.',
      B: 'Security analysts cannot determine the precise breach probability — threat patterns are evolving rapidly and historical data is insufficient. If a breach occurs, the organization could face material regulatory fines and lasting reputational harm.',
      C: 'Industry-wide data places the annual breach probability at approximately 12%, driven by unpredictable adversarial behavior that cannot be controlled. If no breach occurs this year, the organization will retain a strong competitive position in digital services.',
      D: 'Industry-wide data places the annual breach probability at approximately 12%, driven by unpredictable adversarial behavior that cannot be controlled. If a breach occurs, the organization could face material regulatory fines and lasting reputational harm.',
    },
  },
  {
    id: 2,
    key: 'supplier_concentration',
    title: 'Supplier Concentration Risk',
    domain: 'Supply chain',
    context: 'Over 60% of critical components are sourced from a single geographic region.',
    framing: {
      A: 'Analysts cannot model the probability of a major supply disruption — geopolitical signals are mixed and macroeconomic forecasts diverge. Maintaining this concentration preserves strong unit economics and preferred supplier pricing that are difficult to replicate.',
      B: 'Analysts cannot model the probability of a major supply disruption — geopolitical signals are mixed and macroeconomic forecasts diverge. A disruption could halt production for 6+ months and result in material contract penalties.',
      C: 'Historical data suggests a 10% annual probability of significant regional disruption, driven by random weather, political, and logistical events outside the firm’s control. If no disruption occurs, the concentrated model yields superior margins and faster time-to-market.',
      D: 'Historical data suggests a 10% annual probability of significant regional disruption, driven by random weather, political, and logistical events outside the firm’s control. A disruption could halt production for 6+ months and result in material contract penalties.',
    },
  },
  {
    id: 3,
    key: 'compliance_gap',
    title: 'Compliance Gap in Emerging Regulation',
    domain: 'Regulatory',
    context:
      'A new regulatory framework is being finalized that may affect core operations. Legal counsel has identified a compliance gap that would take 18 months to close.',
    framing: {
      A: 'Regulators have not clarified enforcement priorities, and the probability of formal action is unknown. Delaying investment in compliance frees capital for higher-return initiatives if enforcement remains lenient.',
      B: 'Regulators have not clarified enforcement priorities, and the probability of formal action is unknown. If an enforcement action is taken due to non-compliance, penalties and operational restrictions could severely impact business continuity.',
      C: 'Enforcement data across peer firms places the probability of regulatory action at 18% over 24 months, driven by unpredictable regulatory cycles independent of the firm’s actual compliance posture. If no action is taken, delayed investment in compliance could be redeployed into higher-return initiatives.',
      D: 'Enforcement data across peer firms places the probability of action at 18% over 24 months, driven by unpredictable regulatory cycles independent of the firm’s actual compliance posture. If an enforcement action is taken due to non-compliance, penalties and operational restrictions could severely impact business continuity.',
    },
  },
  {
    id: 4,
    key: 'political_instability',
    title: 'Political Instability in Operational Regions',
    domain: 'Geopolitical',
    context:
      'Significant operational and commercial exposure exists in three emerging-market countries currently experiencing political tension.',
    framing: {
      A: 'Political analysts cannot assign reliable probabilities to escalation scenarios — government behavior is unpredictable and intelligence is incomplete. Maintaining regional presence preserves first-mover advantage and hard-to-replicate local relationships.',
      B: 'Political analysts cannot assign reliable probabilities to escalation scenarios — government behavior is unpredictable and intelligence is incomplete. Escalation could result in asset seizure, forced exit, or operational shutdown with limited legal recourse.',
      C: 'Country risk models estimate a 16% annual disruption probability based on historical base rates for similar regimes — a figure that cannot meaningfully be reduced through monitoring. If stability holds, regional revenues are projected to grow at above average rates this year.',
      D: 'Country risk models estimate a 16% annual disruption probability based on historical base rates for similar regimes — a figure that cannot meaningfully be reduced through monitoring. Escalation could result in asset seizure or operational shutdown with limited legal recourse.',
    },
  },
];

// Data quality item (attention check). Shown between scenarios 2 and 3, all conditions.
// Styled identically to a scenario. Not scored. Correct response: "maintain".
export const ATTENTION_CHECK = {
  key: 'internal_review',
  title: 'Internal Review',
  domain: 'Internal audit',
  context:
    'The internal audit team has completed its routine quarterly review. No material findings were identified and all controls operate as designed.',
  framing: 'For this item, please select “Maintain current level.”',
  correct: 'maintain',
};

// ---------------------------------------------------------------------------
// Screen 6: Manipulation check, embedded in the closing narrative.
// The two framing sentences below are the only text on this screen that is not in
// Appendix B; they exist to keep the items inside the game's narrative.
// ---------------------------------------------------------------------------
export const MANIPULATION_CHECK = {
  heading: 'End of day one',
  intro:
    'Before you leave, Dr. Vale asks for a quick read on how today’s briefings came across to you.',
  items: [
    {
      id: 'mc_uncertainty',
      question: 'In the crises you faced, how would you describe the nature of the uncertainty?',
      options: [
        { value: 1, label: 'The probability was unknown or could not be estimated' },
        { value: 2, label: 'The probability was estimated from data, but the outcomes were inherently random' },
        { value: 3, label: 'Not sure' },
      ],
    },
    {
      id: 'mc_framing',
      question: 'How were the potential outcomes described?',
      options: [
        { value: 1, label: 'As opportunities / upside' },
        { value: 2, label: 'As threats / downside' },
        { value: 3, label: 'About equally both ways' },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Screen 7: Closing screen (Appendix C.1) and optional immediate debrief (C.2).
// ---------------------------------------------------------------------------
export const CLOSING = {
  paragraphs: [
    'Thank you for playing THRESHOLD and for taking part in this research.',
    'Meridian Group and the situations in the game are fictional, though based on situations risk professionals commonly face. Your decisions have no effect on you or anyone else, and there were no right or wrong answers.',
    'As explained in the consent form, some details of what we are studying were not described during the study. We will explain the study in full in the summary of findings once the study is complete. If you would like early access to that summary, you can leave your email on the next screen.',
    'Because other people may still take part, please do not discuss the game or your choices with others until the study is complete. Thank you for helping keep the results accurate.',
  ],
  decision:
    'Please choose whether we may use your responses. Your responses are stored under a random code and are not linked to your name. If you choose “Withdraw my responses,” they will be deleted and not used. Because your responses are not linked to your name, we cannot remove them after you leave this page.',
  submitLabel: 'Submit my responses',
  withdrawLabel: 'Withdraw my responses',
  contact:
    'Questions about the study: Jana Chamsi Bacha and Meher Jain at CU_ERM_Research@columbia.edu. Questions about your rights as a research participant: Columbia University Institutional Review Board, askirb@columbia.edu or (212) 851-7040.',
  followupPrompt:
    'Want early access to the findings? Leave your email here and we will send you a summary of the results, including a full explanation of the study, once it is complete. This form is not connected to your game responses.',
};

// Appendix C.2: used only when IMMEDIATE_DEBRIEF=true (if the IRB requires it).
export const IMMEDIATE_DEBRIEF = {
  heading: 'About this study',
  paragraphs: [
    'Thank you again for taking part in THRESHOLD. Here is the full picture.',
    'This study looked at how the wording of risk information affects decisions. Every participant saw the same four business situations, but there were four versions of the game, and each participant was assigned to one of them at random. The versions differed in two ways: (1) whether the uncertainty was described as something nobody could put a number on, or as a known probability driven by chance; and (2) whether what was at stake was described as a possible gain or a possible loss. We did not describe this during the study because knowing it could have changed how people answered.',
    'If you have any questions, please contact Jana Chamsi Bacha (jc6471@columbia.edu) or Meher Jain (mj3266@columbia.edu). Questions about your rights as a research participant may be directed to the Columbia University Institutional Review Board at askirb@columbia.edu or (212) 851-7040.',
  ],
};

/** Materials for one assigned condition: the only condition-specific text a client ever receives. */
export function materialsFor(condition) {
  const spec = CONDITIONS[condition];
  if (!spec) throw new Error(`Unknown condition ${condition}`);
  return {
    organisation: ORGANISATION,
    briefing: BRIEFING[spec.uncertainty],
    scenarios: SCENARIOS.map((s) => ({
      id: s.id,
      key: s.key,
      title: s.title,
      domain: s.domain,
      context: s.context,
      framing: s.framing[condition],
    })),
    attentionCheck: {
      key: ATTENTION_CHECK.key,
      title: ATTENTION_CHECK.title,
      domain: ATTENTION_CHECK.domain,
      context: ATTENTION_CHECK.context,
      framing: ATTENTION_CHECK.framing,
    },
    decisionOptions: DECISION_OPTIONS.map(({ value, label }) => ({ value, label })),
    confidence: { question: CONFIDENCE_QUESTION, anchors: CONFIDENCE_ANCHORS },
    manipulationCheck: MANIPULATION_CHECK,
    closing: CLOSING,
  };
}

/** Condition-independent materials, safe to send before assignment. */
export function publicMaterials() {
  return {
    organisation: ORGANISATION,
    profileItems: PROFILE_ITEMS,
    style: { heading: STYLE_HEADING, instruction: STYLE_INSTRUCTION, items: STYLE_ITEMS.map(({ id, text }) => ({ id, text })) },
  };
}
