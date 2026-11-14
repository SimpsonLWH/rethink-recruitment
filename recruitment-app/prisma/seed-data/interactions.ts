import type {
  SeedAssessmentAttempt,
  SeedCandidateInterest,
  SeedInvitation,
  SeedMatch,
  SeedOutcome,
  SeedPriorityIntro,
} from "./types";

export const seedAssessmentAttempts: SeedAssessmentAttempt[] = [
  { candidateSlug: "aino-vikstrom", assessmentSlug: "backend-design-v1-advanced", score: 84, submittedHoursAgo: 2 },
  { candidateSlug: "noor-salmi", assessmentSlug: "backend-design-v1-advanced", score: 78, submittedHoursAgo: 30 },
  { candidateSlug: "marcus-oyelaran", assessmentSlug: "backend-design-v1-advanced", score: 88, submittedHoursAgo: 48 },
  { candidateSlug: "marcus-oyelaran", assessmentSlug: "algorithms-v1-medium", score: 70, submittedHoursAgo: 72 },
  { candidateSlug: "priya-raman", assessmentSlug: "algorithms-v1-medium", score: 72, submittedHoursAgo: 20 },
  { candidateSlug: "tomas-kask", assessmentSlug: "algorithms-v1-medium", score: 86, submittedHoursAgo: 50 },
  { candidateSlug: "mei-laine", assessmentSlug: "backend-design-v1-advanced", score: 74, submittedHoursAgo: 26 },
  { candidateSlug: "daniel-achebe", assessmentSlug: "backend-design-v1-advanced", score: 62, submittedHoursAgo: 40 },
  { candidateSlug: "nadia-petrescu", assessmentSlug: "backend-design-v1-advanced", score: 58, submittedHoursAgo: 12 },
];

export const seedCandidateInterests: SeedCandidateInterest[] = [
  { candidateSlug: "mei-laine", roleSlug: "northwind-product-engineer", hoursAgo: 9 },
  { candidateSlug: "daniel-achebe", roleSlug: "northwind-product-engineer", hoursAgo: 11 },
];

export const seedMatches: SeedMatch[] = [
  {
    candidateSlug: "marcus-oyelaran",
    roleSlug: "saari-backend-engineer",
    stage: "EVENT_MEETING",
    messages: [
      {
        sender: "candidate",
        body: "I like that your post says you don't want a hero on call. How does that show up in the week?",
        minutesAgo: 3280,
      },
      {
        sender: "employer",
        body: "It shows up in the rota. Everyone does one week in six, and we pay for the handover. We'd rather fix the alert than praise the firefighter.",
        minutesAgo: 3210,
      },
      {
        sender: "candidate",
        body: "That's a better answer than most. I'd like to hear how you handle migrations.",
        minutesAgo: 3185,
      },
    ],
  },
  {
    candidateSlug: "priya-raman",
    roleSlug: "polar-data-analyst",
    stage: "INTRO_CALL",
    messages: [
      {
        sender: "employer",
        body: "Your shared-metric story is exactly the fight we have every quarter. How do you get teams to agree on the definition?",
        minutesAgo: 2510,
      },
      {
        sender: "candidate",
        body: "I make the disagreement visible first. Two definitions on one page, the same event data underneath. Then it's a decision, not a vibe.",
        minutesAgo: 2450,
      },
    ],
  },
  {
    candidateSlug: "tomas-kask",
    roleSlug: "northwind-ml-engineer",
    stage: "INTERVIEW",
    messages: [
      {
        sender: "employer",
        body: "Your abstention work is the part of this role most people underestimate. What would you test first on our case-worker assistant?",
        minutesAgo: 1420,
      },
      {
        sender: "candidate",
        body: "I'd start with the questions people ask when they're worried they'll get someone in trouble. Those are the ones a confident wrong answer hurts most.",
        minutesAgo: 1375,
      },
      {
        sender: "employer",
        body: "We have a list. Let's compare it.",
        minutesAgo: 1330,
      },
    ],
  },
  {
    candidateSlug: "mei-laine",
    roleSlug: "metsa-qa-specialist",
    stage: "INTRO_CALL",
    messages: [
      {
        sender: "candidate",
        body: "I noticed the role includes accessibility. Is that in the release gate or a nice-to-have?",
        minutesAgo: 3500,
      },
      {
        sender: "employer",
        body: "Release gate. We learned that the hard way when a booking form locked out screen-reader users. We'd rather catch it earlier.",
        minutesAgo: 3440,
      },
    ],
  },
  {
    candidateSlug: "noor-salmi",
    roleSlug: "common-ground-frontend-engineer",
    stage: "INTRO_CALL",
    messages: [
      {
        sender: "employer",
        body: "Your invoice-matching rebuild is the closest thing we've seen to the daylight phone problem. What did the analysts teach you?",
        minutesAgo: 980,
      },
      {
        sender: "candidate",
        body: "That the eight-minute wait was mostly hunting, not thinking. One screen with an audit trail removed the hunt, and the corrections fell with it.",
        minutesAgo: 925,
      },
    ],
  },
];

export const seedPriorityIntros: SeedPriorityIntro[] = [
  {
    candidateSlug: "aino-vikstrom",
    roleSlug: "common-ground-frontend-engineer",
    sender: "employer",
    reason: "Your returns-flow story is the kind of craft this role exists for.",
    hoursAgo: 3,
  },
  {
    candidateSlug: "sofia-berg",
    roleSlug: "northwind-product-engineer",
    sender: "candidate",
    reason: "I want to work where support conversations change the product, not just the ticket queue.",
    hoursAgo: 5,
  },
];

export const seedInvitations: SeedInvitation[] = [
  {
    candidateSlug: "aino-vikstrom",
    roleSlug: "saari-backend-engineer",
    message:
      "Your Backend design (Advanced) result is strong, and your returns-flow work matches the reliability problems we own. Would you consider the Backend Engineer role?",
    citedAssessmentSlug: "backend-design-v1-advanced",
    status: "PENDING",
    hoursAgo: 4,
  },
  {
    candidateSlug: "noor-salmi",
    roleSlug: "northwind-product-engineer",
    message:
      "You scored well on Backend design (Advanced). Your finance workspace project is the kind of product judgment we need on the consent flow. Would you take a look?",
    citedAssessmentSlug: "backend-design-v1-advanced",
    status: "PENDING",
    hoursAgo: 6,
  },
  {
    candidateSlug: "mei-laine",
    roleSlug: "common-ground-frontend-engineer",
    message:
      "Your Backend design result and accessibility work stood out. We are a small team, and the release-gate habit matters here.",
    citedAssessmentSlug: "backend-design-v1-advanced",
    status: "DECLINED",
    hoursAgo: 28,
  },
];

export const seedOutcomes: SeedOutcome[] = [
  {
    candidateSlug: "aino-vikstrom",
    roleSlug: "polar-data-analyst",
    kind: "NOT_SELECTED",
    message:
      "Thanks for your interest in Data Analyst at Polar Signal. The team is not taking this further at this stage. Nothing about this closes other roles at the event.",
    hoursAgo: 18,
  },
];
