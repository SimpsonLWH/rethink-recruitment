import type { SeedCandidate } from "./types";
import { moreCandidates } from "./more-people";

const coreCandidates: SeedCandidate[] = [
  {
    slug: "aino-vikstrom",
    name: "Aino Vikström",
    headline: "Product-minded frontend engineer",
    location: "Espoo, Finland",
    bio: "I like the messy middle between a user's problem and a shipped interface. Currently freelancing, looking for a product team that cares how things feel.",
    monogram: "AV",
    palette: "plum",
    tags: ["Frontend", "Accessibility", "Design systems"],
    order: 1,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "At Lumen Retail, I rebuilt the returns flow so a first-time shopper could finish it without contacting support. Completion went from 61% to 84% in six weeks.",
        skillTags: ["Product engineering", "Accessibility", "Research"],
        meta: {
          module: "PROJECT",
          title: "Returns flow rebuild",
          organisation: "Lumen Retail",
          outcome: "A first-time shopper can finish without contacting support; completion increased from 61% to 84% in six weeks.",
          image: "/demo/returns-flow.svg",
          start: "2024-03",
          end: "2025-09",
          skills: ["Accessibility", "Research"],
          domain: ["retail"],
        },
        evidenceUrl: "https://example.com/?evidence=aino-returns",
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "Our design system had fourteen shades of grey and no owner. I wrote the contribution rules, ran weekly reviews, and cut hard-coded colours in the storefront by 90%.",
        skillTags: ["Design systems", "Frontend", "Collaboration"],
        meta: {
          module: "ACHIEVEMENT",
          stat: "90%",
          context: "fewer hard-coded colours in the storefront after a design-system audit",
        },
        evidenceUrl: "https://evidence.invalid/design-system-audit",
      },
      {
        prompt: "My ideal team",
        claim:
          "People who argue about the problem before the solution, write down what they learned, and don't treat accessibility as a phase-two ticket.",
        skillTags: ["Teamwork", "Accessibility"],
      },
      {
        prompt: "A small thing I care about",
        claim:
          "I prototype with real copy before real components. It catches more bad assumptions than another Figma round.",
        skillTags: ["Prototyping", "Product thinking"],
      },
      {
        prompt: "Work history · employer-confirmed",
        claim:
          "Contract frontend engineer on Lumen Retail's returns and checkout flows, 2024–2025, building with React and TypeScript.",
        skillTags: ["Contract", "Retail", "React", "TypeScript"],
        meta: {
          module: "ROLE",
          title: "Contract frontend engineer",
          organisation: "Lumen Retail",
          start: "2024-03",
          end: "2025-09",
          skills: ["React", "TypeScript", "Accessibility"],
          domain: ["retail"],
        },
        provenance: "EMPLOYER_CONFIRMED",
        confirmedByEmployerSlug: "lumen-retail",
      },
    ],
  },
  {
    slug: "noor-salmi",
    name: "Noor Salmi",
    headline: "Finance frontend engineer",
    location: "Espoo, Finland",
    bio: "I build calm interfaces for people who work with numbers all day. The best finance tool is the one that lets an analyst close the laptop on time.",
    monogram: "NS",
    palette: "sage",
    tags: ["Finance", "Frontend", "React", "TypeScript"],
    order: 2,
    facts: [
      {
        prompt: "A result I'm proud of",
        claim:
          "At Fenno Finance, I rebuilt the invoice-matching screen used by 40 analysts. Matching an invoice went from nine minutes to 90 seconds, and the manual correction queue dropped by 38%.",
        skillTags: ["React", "TypeScript", "Finance"],
        meta: {
          module: "ACHIEVEMENT",
          stat: "9 min → 90 sec",
          context: "invoice matching for 40 analysts; manual corrections down 38%",
          domain: ["finance"],
        },
        evidenceUrl: "https://example.com/?evidence=noor-matching",
      },
      {
        prompt: "A project I'm proud of",
        claim:
          "I rebuilt the invoice-matching flow as a React and TypeScript workspace: one screen, keyboard-first review, and a clear audit trail. It replaced a spreadsheet and two internal tools.",
        skillTags: ["React", "TypeScript", "Design systems"],
        meta: {
          module: "PROJECT",
          title: "Invoice-matching workspace",
          organisation: "Fenno Finance",
          outcome: "One screen replaced a spreadsheet and two internal tools, with a clear audit trail.",
          image: "/demo/invoice-matching.svg",
          start: "2023-02",
          end: "2024-03",
          skills: ["React", "TypeScript"],
          domain: ["finance"],
        },
        evidenceUrl: "https://example.com/?evidence=noor-workspace",
      },
      {
        prompt: "Work history",
        claim:
          "Frontend engineer at Fenno Finance, 2021–2024, building React and TypeScript tools for finance analysts.",
        skillTags: ["React", "TypeScript", "Finance"],
        meta: {
          module: "ROLE",
          title: "Frontend engineer",
          organisation: "Fenno Finance",
          start: "2021-03",
          end: "2024-03",
          skills: ["React", "TypeScript"],
          domain: ["finance"],
        },
      },
      {
        prompt: "My ideal team",
        claim:
          "Analysts who will show me the messy spreadsheet before the polished spec. I like building with the people who have to use the thing.",
        skillTags: ["Teamwork", "Finance"],
      },
      {
        prompt: "A qualification",
        claim:
          "BSc in Computer Science from a fictional Finnish university, 2017–2020.",
        skillTags: ["Computer science"],
        meta: {
          module: "QUALIFICATION",
          title: "BSc Computer Science",
          organisation: "Fictional Finnish university",
          start: "2017-08",
          end: "2020-06",
          skills: ["Computer science"],
        },
      },
    ],
  },
  {
    slug: "marcus-oyelaran",
    name: "Marcus Oyelaran",
    headline: "Platform engineer who likes boring systems",
    location: "Helsinki, Finland",
    bio: "I build backends that make the on-call rota less interesting. Happiest when the logs tell the truth and the migration is reversible.",
    monogram: "MO",
    palette: "slate",
    tags: ["Backend", "Node.js", "PostgreSQL", "Observability"],
    order: 3,
    facts: [
      {
        prompt: "The hardest problem I've solved",
        claim:
          "When our order worker retried forever, I rebuilt the job pipeline with idempotency keys and a dead-letter queue. Duplicate orders dropped to zero over the next month.",
        skillTags: ["Backend", "Reliability", "PostgreSQL"],
        evidenceUrl: "https://example.com/?evidence=marcus-pipeline",
      },
      {
        prompt: "A project I'm proud of",
        claim:
          "I wrote the internal service template our six teams now start from: health checks, tracing, migrations, and a rollback path that actually gets used.",
        skillTags: ["Platform engineering", "Observability", "Node.js"],
      },
      {
        prompt: "My ideal team",
        claim:
          "Small, senior-ish, writes down decisions. I like teams that treat on-call as a design input, not a punishment.",
        skillTags: ["Teamwork", "Reliability"],
      },
    ],
  },
  {
    slug: "priya-raman",
    name: "Priya Raman",
    headline: "Data analyst who translates",
    location: "Espoo, Finland",
    bio: "I turn messy operational questions into a number and a sentence a busy person can use. I care more about the decision than the dashboard.",
    monogram: "PR",
    palette: "ochre",
    tags: ["Analytics", "SQL", "Experimentation", "Communication"],
    order: 4,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I rebuilt the weekly retention report as a tested dataset, then wrote a one-page narrative for the leadership team. Questions at the Monday review dropped by half.",
        skillTags: ["Analytics", "SQL", "Communication"],
        evidenceUrl: "https://example.com/?evidence=priya-retention",
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "Two teams disagreed about what active user meant. I mapped both definitions to the same events, showed the gap, and we shipped one shared metric.",
        skillTags: ["Experimentation", "Stakeholders", "Analytics"],
      },
      {
        prompt: "My ideal team",
        claim:
          "People who want the number and the story. I'd rather explain a messy result than hide it behind a dashboard.",
        skillTags: ["Communication", "Teamwork"],
      },
    ],
  },
  {
    slug: "elias-nieminen",
    name: "Elias Nieminen",
    headline: "Retail supervisor, team builder",
    location: "Vantaa, Finland",
    bio: "I run store floors. The job is mostly small routines, honest handovers, and knowing when someone needs a break before the customer does.",
    monogram: "EN",
    palette: "sage",
    tags: ["Retail", "Team leadership", "Operations"],
    order: 5,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I took over a store floor with 40% staff turnover. I changed the opening routine, started ten-minute handovers, and we kept the same team through the Christmas rush.",
        skillTags: ["Team leadership", "Operations", "Retail"],
        meta: {
          module: "RESULT",
          title: "A team that stayed",
          stat: "40% turnover",
          context: "the starting point; the same team stayed through the Christmas rush after a new handover routine",
        },
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "A delivery went missing on Black Friday. I rebuilt the count process with the stockroom team, and we haven't lost a pallet since.",
        skillTags: ["Operations", "Problem solving", "Retail"],
        meta: {
          module: "RESPONSIBILITY",
          title: "Rebuilt the stock count",
        },
      },
      {
        prompt: "My ideal team",
        claim:
          "People who tell you when something isn't working before it becomes a fire. I try to be that person too.",
        skillTags: ["Teamwork", "Retail"],
        meta: {
          module: "FACT",
          title: "How they work",
        },
      },
      {
        prompt: "What I'm looking for",
        claim:
          "A supervisor role where I can coach a team and own the boring details that make a shop run.",
        skillTags: ["Team leadership", "Operations"],
        meta: {
          module: "AVAILABILITY",
          title: "Looking for",
        },
      },
    ],
  },
  {
    slug: "sofia-berg",
    name: "Sofia Berg",
    headline: "Customer support lead",
    location: "Espoo, Finland",
    bio: "I've spent seven years turning angry queues into clear processes. I still answer the occasional customer email because it keeps me honest.",
    monogram: "SB",
    palette: "clay",
    tags: ["Customer support", "Escalation", "Coaching", "Process"],
    order: 6,
    facts: [
      {
        prompt: "The hardest problem I've solved",
        claim:
          "Our refund queue hit 900 tickets after a billing migration. I split triage by root cause, wrote 14 macros, and got median response under a day in two weeks.",
        skillTags: ["Customer support", "Process", "Escalation"],
        meta: {
          module: "RESULT",
          title: "Refund queue reset",
          stat: "900 tickets",
          context: "after a billing migration; median response under a day in two weeks",
        },
      },
      {
        prompt: "A project I'm proud of",
        claim:
          "I started a weekly 20-minute coaching slot for new support agents. Six months later, first-contact resolution was up nine points.",
        skillTags: ["Coaching", "Customer support"],
        meta: {
          module: "ACHIEVEMENT",
          stat: "+9 pts",
          context: "first-contact resolution after a weekly 20-minute coaching slot",
        },
      },
      {
        prompt: "My ideal team",
        claim:
          "Kind, direct, and allergic to blaming the customer. We can fix the product and the conversation.",
        skillTags: ["Teamwork", "Customer support"],
        meta: {
          module: "FACT",
          title: "How they work",
        },
      },
    ],
  },
  {
    slug: "tomas-kask",
    name: "Tomas Kask",
    headline: "ML engineer who starts with evaluation",
    location: "Espoo, Finland",
    bio: "I build small, observable machine-learning systems and the tests that tell you when they are making things worse.",
    monogram: "TK",
    palette: "blue",
    tags: ["Machine learning", "Evaluation", "Python", "Product"],
    order: 7,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I built an offline eval harness for a resume-ranking feature that exposed a 12-point gap between our demo and production data. We delayed the launch and fixed the data.",
        skillTags: ["Evaluation", "Machine learning", "Python"],
        evidenceUrl: "https://example.com/?evidence=tomas-eval",
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "A model kept confidently answering questions outside its source docs. I added abstention tests and a refusal path; unsupported answers fell from 18% to 4% on our labelled set.",
        skillTags: ["Evaluation", "Safety", "Machine learning"],
        evidenceUrl: "https://evidence.invalid/abstention-tests",
      },
      {
        prompt: "My ideal team",
        claim:
          "People who want to measure the thing before polishing it. I like being the person who asks what would change our mind.",
        skillTags: ["Teamwork", "Evaluation"],
      },
    ],
  },
  {
    slug: "nadia-petrescu",
    name: "Nadia Petrescu",
    headline: "Product designer",
    location: "Helsinki, Finland",
    bio: "I design tools for people who are already busy. The best compliment is that something felt obvious.",
    monogram: "NP",
    palette: "plum",
    tags: ["Product design", "Research", "Design systems"],
    order: 8,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I redesigned a school timetable tool around the teacher's five-minute break, not the admin's dashboard. Usability test completion went from 7/12 to 11/12.",
        skillTags: ["Product design", "Research", "Accessibility"],
        meta: {
          module: "ACHIEVEMENT",
          title: "Timetable redesign",
          stat: "11/12",
          context: "teachers completed the timetable task, up from 7/12",
        },
        evidenceUrl: "https://example.com/?evidence=nadia-timetable",
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "The team had 40 components and no source of truth. I ran a three-week audit, killed 17, and documented the rest with contribution rules.",
        skillTags: ["Design systems", "Collaboration"],
        meta: {
          module: "RESULT",
          title: "Design system audit",
          stat: "17 components",
          context: "removed from 40 during a three-week audit, with contribution rules for the rest",
        },
      },
      {
        prompt: "Before design systems",
        claim:
          "Before moving into product design, I built Vue dashboards for a regional logistics operator from 2019 to 2022.",
        skillTags: ["Vue", "Frontend", "Logistics"],
        meta: {
          module: "ROLE",
          title: "Frontend developer",
          organisation: "Regional logistics operator",
          start: "2019-01",
          end: "2022-01",
          skills: ["Vue", "JavaScript"],
          domain: ["logistics"],
        },
      },
      {
        prompt: "My ideal team",
        claim:
          "Engineers who want to be in the research session and product people who can say no.",
        skillTags: ["Teamwork", "Product design"],
      },
    ],
  },
  {
    slug: "juhani-salo",
    name: "Juhani Salo",
    headline: "Logistics coordinator",
    location: "Espoo, Finland",
    bio: "I keep the day moving when the plan stops working. Spreadsheets, phone calls, and a whiteboard are still allowed.",
    monogram: "JS",
    palette: "ochre",
    tags: ["Logistics", "Routing", "Vendor operations", "Excel"],
    order: 9,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I rerouted three Espoo delivery zones after a road closure and kept 96% of same-day orders on time through the week.",
        skillTags: ["Logistics", "Routing", "Operations"],
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "Our returns were piling up because drivers and the warehouse used different labels. I got both teams in a room, standardised the label, and the backlog cleared in a month.",
        skillTags: ["Operations", "Vendor operations", "Problem solving"],
      },
      {
        prompt: "My ideal team",
        claim:
          "People who answer the phone when operations is on fire. I'll do the same for them.",
        skillTags: ["Teamwork", "Logistics"],
      },
    ],
  },
  {
    slug: "mei-laine",
    name: "Mei Laine",
    headline: "QA engineer, no public portfolio needed",
    location: "Espoo, Finland",
    bio: "I find the edge before a user does. Most of my best work lives in test plans, bug reports, and arguments that happen before code review.",
    monogram: "ML",
    palette: "sage",
    tags: ["QA", "Test strategy", "Accessibility testing", "React"],
    order: 10,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I turned a 600-step release checklist into a risk-based test plan. We caught two accessibility regressions before launch and cut release prep from three days to one.",
        skillTags: ["QA", "Accessibility testing", "Test strategy"],
        meta: {
          module: "ACHIEVEMENT",
          stat: "3 days → 1 day",
          context: "release prep after a risk-based test plan; two accessibility regressions caught before launch",
        },
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "A bug only appeared on older Android devices. I built a small device matrix, reproduced it, and wrote fix notes so support could explain it to users.",
        skillTags: ["QA", "Mobile", "Debugging"],
        meta: {
          module: "RESPONSIBILITY",
          title: "Older-device matrix",
        },
      },
      {
        prompt: "A tool I rely on",
        claim:
          "I keep a small React test harness for the booking form's edge cases, so a regression is reproducible before it reaches a release.",
        skillTags: ["QA", "React"],
        meta: {
          module: "RESPONSIBILITY",
          title: "A reproducible regression harness",
        },
      },
      {
        prompt: "My ideal team",
        claim:
          "People who treat QA as part of the design conversation, not the last gate before a deadline.",
        skillTags: ["Teamwork", "QA"],
      },
      {
        prompt: "Work history · employer-confirmed",
        claim:
          "Completed a fixed-term QA contract with Metsä Health's booking team in 2025.",
        skillTags: ["QA", "Healthcare"],
        meta: {
          module: "ROLE",
          title: "QA contract",
          organisation: "Metsä Health",
          start: "2025-01",
          end: "2025-12",
          skills: ["QA"],
          domain: ["healthcare"],
        },
        provenance: "EMPLOYER_CONFIRMED",
        confirmedByEmployerSlug: "metsa-health",
      },
    ],
  },
  {
    slug: "omar-haddad",
    name: "Omar Haddad",
    headline: "Community and marketing manager",
    location: "Espoo, Finland",
    bio: "I make rooms where people want to come back. That usually means better introductions, clearer invitations, and fewer slides.",
    monogram: "OH",
    palette: "clay",
    tags: ["Community", "Events", "Partnerships", "Content"],
    order: 11,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I started a monthly meetup for newcomer founders at a borrowed café. We went from 8 people to a waiting list, and three teams found their first hire there.",
        skillTags: ["Community", "Events", "Partnerships"],
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "Our volunteer programme was losing half its people after one event. I interviewed 20 former volunteers, changed the onboarding, and retention doubled.",
        skillTags: ["Community", "Research", "Operations"],
      },
      {
        prompt: "My ideal team",
        claim:
          "People who care about the room, not just the slide deck. I'm happiest when I can introduce two people who should know each other.",
        skillTags: ["Teamwork", "Community"],
      },
    ],
  },
  {
    slug: "liisa-korpi",
    name: "Liisa Korpi",
    headline: "Operations associate",
    location: "Espoo, Finland",
    bio: "I make the week run. Scheduling, onboarding, and the small systems that stop five people from asking the same question.",
    monogram: "LK",
    palette: "sand",
    tags: ["Operations", "Scheduling", "Onboarding", "Process"],
    order: 12,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I built a simple onboarding board for our 12-person studio. New freelancers stopped asking the same five questions, and the studio lead got their first week back.",
        skillTags: ["Onboarding", "Operations", "Process"],
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "We had three project tools and no one trusted any of them. I mapped the work, asked what each team actually needed, and we consolidated to one.",
        skillTags: ["Process", "Stakeholders", "Operations"],
      },
      {
        prompt: "My ideal team",
        claim:
          "Calm, specific, and good at writing things down. I like being the person who makes the week run.",
        skillTags: ["Teamwork", "Operations"],
      },
    ],
  },
  {
    slug: "daniel-achebe",
    name: "Daniel Achebe",
    headline: "Full-stack developer",
    location: "Espoo, Finland",
    bio: "I build small products end to end. I like the part where the database, the interface, and a real person's day have to agree.",
    monogram: "DA",
    palette: "blue",
    tags: ["TypeScript", "React", "Node.js", "PostgreSQL"],
    order: 13,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I shipped a volunteer shift planner in React, used by 300 people across the city. The hard part was making the schedule understandable on a cheap phone in bright daylight.",
        skillTags: ["Full-stack", "React", "Accessibility"],
        meta: {
          module: "PROJECT",
          title: "Volunteer shift planner",
          organisation: "Fictional city volunteer network",
          outcome: "Used by 300 people; readable on a cheap phone in bright daylight.",
          image: "/demo/shift-planner.svg",
          start: "2025-01",
          end: "2025-12",
          skills: ["React", "TypeScript"],
          domain: ["community"],
        },
        evidenceUrl: "https://example.com/?evidence=daniel-shift-planner",
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "Our database migrations took 40 minutes and blocked deploys. I split them into small reversible steps and got the team to stop fearing Friday releases.",
        skillTags: ["PostgreSQL", "Backend", "Reliability"],
        meta: {
          module: "RESULT",
          title: "Reversible migrations",
          stat: "40 minutes",
          context: "the old migration path, split into small reversible steps that no longer block deploys",
        },
        evidenceUrl: "https://evidence.invalid/migration-notes",
      },
      {
        prompt: "My ideal team",
        claim:
          "People who pair when it's hard and leave good notes when it's easy.",
        skillTags: ["Teamwork", "Full-stack"],
      },
    ],
  },
];

export const seedCandidates: SeedCandidate[] = [...coreCandidates, ...moreCandidates];
