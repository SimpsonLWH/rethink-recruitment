import type { SeedMatch, SeedPriorityIntro } from "./types";

export const seedMatches: SeedMatch[] = [
  {
    candidateSlug: "aino-vikstrom",
    roleSlug: "northwind-product-engineer",
    messages: [
      {
        sender: "employer",
        body: "Aino, your returns-flow story is the closest thing I've seen to the work we're doing. What made you stay with the problem after the first fix?",
        minutesAgo: 1840,
      },
      {
        sender: "candidate",
        body: "Honestly, the support calls. The first fix moved the drop-off, not the confusion. I sat in on two calls and rewrote the copy with a support agent.",
        minutesAgo: 1785,
      },
      {
        sender: "employer",
        body: "That's the job. We're trying to make the first version good enough to learn from. Coffee at the event?",
        minutesAgo: 1740,
      },
    ],
  },
  {
    candidateSlug: "marcus-oyelaran",
    roleSlug: "saari-backend-engineer",
    messages: [
      {
        sender: "candidate",
        body: "I like that your post says you don't want a hero on call. How does that actually show up in the week?",
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
      {
        sender: "employer",
        body: "Good. We'd probably ask you to do that with our emissions dashboard in week two.",
        minutesAgo: 2405,
      },
    ],
  },
  {
    candidateSlug: "elias-nieminen",
    roleSlug: "lumen-store-supervisor",
    messages: [
      {
        sender: "employer",
        body: "You kept a team through Christmas with 40% turnover coming in. What did you change first?",
        minutesAgo: 1990,
      },
      {
        sender: "candidate",
        body: "The handover. Ten minutes, standing up, same three questions. People stopped discovering problems at 17:59.",
        minutesAgo: 1930,
      },
      {
        sender: "employer",
        body: "We could use that in two of our stores. Would you be open to walking the Espoo store with our area lead?",
        minutesAgo: 1880,
      },
    ],
  },
  {
    candidateSlug: "sofia-berg",
    roleSlug: "fjord-support-specialist",
    messages: [
      {
        sender: "candidate",
        body: "The role says support has authority to fix the process. What does that look like in practice?",
        minutesAgo: 4120,
      },
      {
        sender: "employer",
        body: "If you can show the queue, you can change it. Our last lead killed a two-step refund and saved 300 hours a year.",
        minutesAgo: 4075,
      },
      {
        sender: "candidate",
        body: "I have a queue I'd like to kill. Happy to compare notes.",
        minutesAgo: 4010,
      },
    ],
  },
  {
    candidateSlug: "tomas-kask",
    roleSlug: "northwind-ml-engineer",
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
    candidateSlug: "nadia-petrescu",
    roleSlug: "kide-product-designer",
    messages: [
      {
        sender: "employer",
        body: "The timetable tool story made our education lead stop scrolling. What did the teachers do that the admin dashboard missed?",
        minutesAgo: 2860,
      },
      {
        sender: "candidate",
        body: "They planned around a five-minute break. The old flow asked them to think like a scheduler. I asked them to show me their actual day.",
        minutesAgo: 2810,
      },
      {
        sender: "employer",
        body: "We'd love to set up a session with two teachers next week.",
        minutesAgo: 2765,
      },
    ],
  },
  {
    candidateSlug: "juhani-salo",
    roleSlug: "fjord-logistics-associate",
    messages: [
      {
        sender: "candidate",
        body: "The zone reroute was seat-of-pants but it worked. Do you use a routing tool now or still a whiteboard?",
        minutesAgo: 720,
      },
      {
        sender: "employer",
        body: "Both. The whiteboard is faster when the day goes wrong. The tool is faster when it doesn't. We're trying to make the handoff less painful.",
        minutesAgo: 680,
      },
      {
        sender: "candidate",
        body: "Then I have opinions about your handoff.",
        minutesAgo: 620,
      },
    ],
  },
  {
    candidateSlug: "mei-laine",
    roleSlug: "metsa-qa-specialist",
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
      {
        sender: "candidate",
        body: "Good. I'd want to sit in on the first design review, not the last.",
        minutesAgo: 3380,
      },
    ],
  },
  {
    candidateSlug: "omar-haddad",
    roleSlug: "common-ground-community-manager",
    messages: [
      {
        sender: "candidate",
        body: "The newcomer meetup was the best part of my last job. What's the community actually asking for right now?",
        minutesAgo: 2200,
      },
      {
        sender: "employer",
        body: "A place to work on weeknights that isn't a bar, and someone who remembers their name. We have the room; we don't have the rhythm yet.",
        minutesAgo: 2150,
      },
      {
        sender: "candidate",
        body: "I can bring the rhythm. Can I see the space before the event?",
        minutesAgo: 2090,
      },
    ],
  },
  {
    candidateSlug: "liisa-korpi",
    roleSlug: "kide-ops-coordinator",
    messages: [
      {
        sender: "employer",
        body: "Your onboarding board story is very close to a problem we have. What did you put on the board first?",
        minutesAgo: 600,
      },
      {
        sender: "candidate",
        body: "The five questions every new freelancer asked in their first week. I wrote the answers on the board and made someone own each one.",
        minutesAgo: 540,
      },
      {
        sender: "employer",
        body: "We could use a version of that for our studio. Fancy a coffee?",
        minutesAgo: 500,
      },
    ],
  },
  {
    candidateSlug: "daniel-achebe",
    roleSlug: "common-ground-frontend-engineer",
    messages: [
      {
        sender: "employer",
        body: "The shift planner is a real product, not a demo. What was the hardest constraint?",
        minutesAgo: 1650,
      },
      {
        sender: "candidate",
        body: "Bright sunlight and cheap phones. I tested it outside the community centre and immediately threw away half my colour palette.",
        minutesAgo: 1595,
      },
      {
        sender: "employer",
        body: "That's the kind of testing we need. Could you show us the planner before the event?",
        minutesAgo: 1540,
      },
    ],
  },
  {
    candidateSlug: "noor-salmi",
    roleSlug: "common-ground-frontend-engineer",
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
      {
        sender: "employer",
        body: "That's the kind of constraint we like. Could you walk our volunteer team through the before-and-after?",
        minutesAgo: 880,
      },
    ],
  },
];

// Exactly one inbound priority intro per candidate and per employer, with curated reasons.
// No pair here overlaps with an existing match or with a reciprocal priority intro.
export const seedPriorityIntros: SeedPriorityIntro[] = [
  {
    candidateSlug: "aino-vikstrom",
    roleSlug: "common-ground-frontend-engineer",
    sender: "employer",
    reason: "Your note on accessible forms is the kind of craft this role exists for.",
    hoursAgo: 3,
  },
  {
    candidateSlug: "marcus-oyelaran",
    roleSlug: "northwind-product-engineer",
    sender: "employer",
    reason: "You write about systems like someone who has been on call. We want that in the room.",
    hoursAgo: 6,
  },
  {
    candidateSlug: "priya-raman",
    roleSlug: "northwind-product-engineer",
    sender: "employer",
    reason: "Your 'show the disagreement' approach is how we want to use data here.",
    hoursAgo: 8,
  },
  {
    candidateSlug: "elias-nieminen",
    roleSlug: "kide-ops-coordinator",
    sender: "employer",
    reason: "You made the boring handover feel like the most important part of the job. That's our studio.",
    hoursAgo: 2,
  },
  {
    candidateSlug: "sofia-berg",
    roleSlug: "metsa-support-lead",
    sender: "employer",
    reason: "You've done the queue work and still sound like you like people. That's rare.",
    hoursAgo: 11,
  },
  {
    candidateSlug: "tomas-kask",
    roleSlug: "polar-data-analyst",
    sender: "employer",
    reason: "Your abstention tests are the most practical ML writing we've read this week.",
    hoursAgo: 5,
  },
  {
    candidateSlug: "nadia-petrescu",
    roleSlug: "common-ground-frontend-engineer",
    sender: "employer",
    reason: "The five-minute break detail is exactly the kind of research we need more of.",
    hoursAgo: 9,
  },
  {
    candidateSlug: "juhani-salo",
    roleSlug: "lumen-store-supervisor",
    sender: "employer",
    reason: "You kept 96% on time through a road closure and didn't make it sound heroic. We like that.",
    hoursAgo: 4,
  },
  {
    candidateSlug: "mei-laine",
    roleSlug: "fjord-support-specialist",
    sender: "employer",
    reason: "You test for the person on the older phone. Our support team would benefit from that instinct.",
    hoursAgo: 7,
  },
  {
    candidateSlug: "omar-haddad",
    roleSlug: "kide-product-designer",
    sender: "employer",
    reason: "You build rooms people want to come back to. We're trying to do that with learning.",
    hoursAgo: 10,
  },
  {
    candidateSlug: "liisa-korpi",
    roleSlug: "lumen-retail-associate",
    sender: "employer",
    reason: "Your onboarding board sounds like a store that runs itself. We're listening.",
    hoursAgo: 13,
  },
  {
    candidateSlug: "daniel-achebe",
    roleSlug: "saari-backend-engineer",
    sender: "employer",
    reason: "Your migration notes read like someone who has been on call. We want that in the room.",
    hoursAgo: 1,
  },
  {
    candidateSlug: "noor-salmi",
    roleSlug: "polar-data-analyst",
    sender: "employer",
    reason: "You made an invoice screen legible to 40 analysts. That's the finance translation we need.",
    hoursAgo: 2,
  },
  {
    candidateSlug: "daniel-achebe",
    roleSlug: "northwind-product-engineer",
    sender: "candidate",
    reason: "The consent-first re-entry problem is the first job description this month I read twice.",
    hoursAgo: 2,
  },
  {
    candidateSlug: "tomas-kask",
    roleSlug: "saari-backend-engineer",
    sender: "candidate",
    reason: "You don't want a hero on call. I want to work somewhere that means it.",
    hoursAgo: 5,
  },
  {
    candidateSlug: "aino-vikstrom",
    roleSlug: "kide-product-designer",
    sender: "candidate",
    reason: "The teacher's five-minute break is exactly the kind of detail I chase in frontend work.",
    hoursAgo: 4,
  },
  {
    candidateSlug: "elias-nieminen",
    roleSlug: "fjord-logistics-associate",
    sender: "candidate",
    reason: "Your role says operations is a team sport. I've run a floor; I'd like to see how you run a route.",
    hoursAgo: 6,
  },
  {
    candidateSlug: "sofia-berg",
    roleSlug: "lumen-store-supervisor",
    sender: "candidate",
    reason: "You kept a team through Christmas. I'd like to work with someone who thinks that's the job.",
    hoursAgo: 7,
  },
  {
    candidateSlug: "sofia-berg",
    roleSlug: "common-ground-community-manager",
    sender: "candidate",
    reason: "The weeknight room idea is the first community job I've seen that isn't just a newsletter.",
    hoursAgo: 8,
  },
  {
    candidateSlug: "omar-haddad",
    roleSlug: "polar-data-analyst",
    sender: "candidate",
    reason: "You make climate data legible. I make rooms legible. There might be a trade here.",
    hoursAgo: 9,
  },
  {
    candidateSlug: "liisa-korpi",
    roleSlug: "metsa-support-lead",
    sender: "candidate",
    reason: "Your release-gate accessibility line made me stop scrolling. I'd like to support a team that means it.",
    hoursAgo: 12,
  },
];
