import type { CriterionRating, ClaimCheckStatus, ScreeningDecision } from "../../src/lib/screening";

export interface SeedScreeningRun {
  roleSlug: string;
  candidateSlug: string;
  stage: "EVIDENCE" | "VERIFY" | "KIT" | "DECISION";
  status: "OPEN" | ScreeningDecision;
  openedHoursAgo: number;
  claimChecks?: Array<{
    factIndex: number;
    status: ClaimCheckStatus;
    note?: string;
    hoursAgo?: number;
  }>;
  criterionChecks?: Array<{
    criterionId: string;
    rating: CriterionRating;
    note?: string;
  }>;
  notes?: Array<{
    body: string;
    hoursAgo: number;
  }>;
  decision?: {
    reason: string;
    basis: string;
    decidedHoursAgo: number;
  };
}

/**
 * Synthetic pre-screen records. Each one is a human's partial work, not a
 * model output: a few claims checked, a scorecard, sometimes a decision.
 */
export const seedScreeningRuns: SeedScreeningRun[] = [
  {
    roleSlug: "northwind-product-engineer",
    candidateSlug: "aino-vikstrom",
    stage: "VERIFY",
    status: "OPEN",
    openedHoursAgo: 26,
    claimChecks: [
      {
        factIndex: 0,
        status: "VERIFIED",
        note: "Opened the returns-flow case study. The 61% → 84% figure and the six-week window match.",
        hoursAgo: 4,
      },
      {
        factIndex: 1,
        status: "NEEDS_CONVERSATION",
        note: "The design-system link does not load. Ask her to walk through the audit and what she owned.",
        hoursAgo: 3,
      },
      {
        factIndex: 3,
        status: "NEEDS_CONVERSATION",
        note: "A working habit, not a result. Ask for one concrete example.",
        hoursAgo: 3,
      },
    ],
    criterionChecks: [
      { criterionId: "assessment:assess-javascript-v1-medium", rating: "MEETS", note: "80/100 against the 70 bar. One sitting." },
      { criterionId: "signal:np-typescript", rating: "MEETS", note: "Employer-confirmed contract at Lumen Retail." },
      { criterionId: "signal:np-react", rating: "MEETS" },
    ],
    notes: [
      {
        body: "Strong work sample. The returns rebuild is close to our checkout work. One link is dead and her prototyping claim has no artifact, so those go into the conversation.",
        hoursAgo: 2,
      },
    ],
  },
  {
    roleSlug: "northwind-product-engineer",
    candidateSlug: "noor-salmi",
    stage: "EVIDENCE",
    status: "OPEN",
    openedHoursAgo: 3,
  },
  {
    roleSlug: "northwind-product-engineer",
    candidateSlug: "priya-raman",
    stage: "DECISION",
    status: "DECLINE",
    openedHoursAgo: 32,
    claimChecks: [
      { factIndex: 0, status: "VERIFIED", note: "Retention report artifact opens; the decision-support framing is clear.", hoursAgo: 20 },
    ],
    criterionChecks: [
      { criterionId: "assessment:assess-javascript-v1-medium", rating: "MEETS", note: "80/100, above the bar." },
      { criterionId: "signal:np-typescript", rating: "NOT_YET", note: "No TypeScript anywhere on the record." },
      { criterionId: "signal:np-react", rating: "NOT_YET" },
      { criterionId: "signal:np-civic", rating: "NOT_YET" },
    ],
    notes: [
      {
        body: "The assessment is strong, but the record is analytics, not product frontend. Better fit for the Polar data role. Told her about it in the event chat.",
        hoursAgo: 8,
      },
    ],
    decision: {
      reason:
        "The assessment bar is met, but the role's React and TypeScript product work is not evidenced anywhere on the record, and her own direction is analytics. Not moving forward for this role; pointed her to Polar Data Analyst instead.",
      basis:
        "JavaScript: Data handling — Meets it; TypeScript, 2+ years — Not yet; React — Not yet; Public-sector or civic context — Not yet",
      decidedHoursAgo: 7,
    },
  },
  {
    roleSlug: "northwind-product-engineer",
    candidateSlug: "daniel-achebe",
    stage: "DECISION",
    status: "HOLD",
    openedHoursAgo: 30,
    claimChecks: [
      { factIndex: 0, status: "NEEDS_CONVERSATION", note: "The project is interesting but has no link. Ask for a walkthrough.", hoursAgo: 22 },
    ],
    criterionChecks: [
      { criterionId: "assessment:assess-javascript-v1-medium", rating: "PARTLY", note: "60/100, below the stated bar of 70." },
      { criterionId: "signal:np-typescript", rating: "NOT_ASSESSED" },
      { criterionId: "signal:np-react", rating: "MEETS" },
    ],
    notes: [
      {
        body: "Below the bar, so no auto-advance. The record still shows real React work. Holding until we see a second artifact rather than closing the door on one test.",
        hoursAgo: 6,
      },
    ],
    decision: {
      reason:
        "The assessment is below the stated bar, but the React evidence is real and the role is still open. Holding for one more artifact instead of closing on a single score.",
      basis: "JavaScript: Data handling — Partly; React — Meets it; TypeScript, 2+ years — Not assessed",
      decidedHoursAgo: 5,
    },
  },
  {
    roleSlug: "northwind-product-engineer",
    candidateSlug: "mei-laine",
    stage: "DECISION",
    status: "ADVANCE",
    openedHoursAgo: 28,
    claimChecks: [
      { factIndex: 0, status: "VERIFIED", note: "The 3 days → 1 day figure is in the attached checklist export.", hoursAgo: 12 },
      { factIndex: 2, status: "VERIFIED", note: "The test harness repository opens; the booking-form cases are there.", hoursAgo: 11 },
    ],
    criterionChecks: [
      { criterionId: "assessment:assess-javascript-v1-medium", rating: "MEETS", note: "75/100 against the 70 bar." },
      { criterionId: "signal:np-typescript", rating: "PARTLY", note: "QA-authored TypeScript in the harness, not product work." },
      { criterionId: "signal:np-react", rating: "MEETS" },
      { criterionId: "conversation:how-they-work", rating: "MEETS", note: "Clear about wanting QA-shaped product work; that is useful on this team." },
    ],
    decision: {
      reason:
        "Assessment met the bar, two artifacts checked out, and the conversation confirmed the QA-shaped product work this team needs. Moving to a working session with the frontend pair.",
      basis:
        "JavaScript: Data handling — Meets it; React — Meets it; TypeScript, 2+ years — Partly; How they work — Meets it",
      decidedHoursAgo: 9,
    },
  },
  {
    roleSlug: "northwind-product-engineer",
    candidateSlug: "nadia-petrescu",
    stage: "VERIFY",
    status: "OPEN",
    openedHoursAgo: 10,
    claimChecks: [
      { factIndex: 0, status: "VERIFIED", note: "The timetable case study opens; the 7/12 → 11/12 result matches.", hoursAgo: 2 },
      { factIndex: 2, status: "LINK_ONLY", note: "No artifact for the older Vue work. Not fatal for a design-led application.", hoursAgo: 2 },
    ],
    notes: [
      {
        body: "Designer with real frontend history, 50/100 on the assessment. Do not close on the score: ask what she wants to do now and whether the Vue work is still current.",
        hoursAgo: 1,
      },
    ],
  },
  {
    roleSlug: "saari-backend-engineer",
    candidateSlug: "marcus-oyelaran",
    stage: "DECISION",
    status: "ADVANCE",
    openedHoursAgo: 20,
    claimChecks: [
      { factIndex: 0, status: "VERIFIED", note: "Pipeline write-up opens; duplicate-order result matches.", hoursAgo: 8 },
      { factIndex: 1, status: "LINK_ONLY", note: "Service template is internal, so only the description is available.", hoursAgo: 8 },
    ],
    criterionChecks: [
      { criterionId: "assessment:assess-algorithms-v1-advanced", rating: "MEETS", note: "90/100 against the 70 bar." },
      { criterionId: "signal:sb-postgres", rating: "MEETS" },
      { criterionId: "signal:sb-node", rating: "MEETS" },
      { criterionId: "signal:sb-infra", rating: "MEETS" },
    ],
    decision: {
      reason:
        "The reliability work sample is the closest thing to our on-call problem, the assessment is well above the bar, and the pipeline write-up checked out. Moving to a system-design conversation.",
      basis:
        "Algorithms: Advanced — Meets it; PostgreSQL — Meets it; Node.js — Meets it; Infrastructure or reliability — Meets it",
      decidedHoursAgo: 6,
    },
  },
];
