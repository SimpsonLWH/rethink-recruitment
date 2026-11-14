import type { SeedEmployer } from "./types";

export const seedEmployers: SeedEmployer[] = [
  {
    slug: "northwind-labs",
    name: "Northwind Labs",
    tagline: "Practical AI tools for public services.",
    about:
      "A 24-person studio in Espoo. We build decision-support tools with municipalities, then stay for the unglamorous maintenance. Small teams, long relationships, no growth-at-all-costs.",
    industry: "Civic technology",
    teamSize: "24 people",
    location: "Espoo · hybrid",
    logoMark: "NL",
    palette: "slate",
    order: 1,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "You'll work with a team that has to explain its systems to the people using them. The work is slow sometimes, but the feedback is real.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Case workers spend hours re-entering the same family information across three systems. We're building a consent-first way to stop that.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "You've shipped something small to a real user, asked them what confused them, and changed it. Twice.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "northwind-product-engineer",
        title: "Product Engineer",
        employmentType: "Full-time",
        workMode: "Hybrid · 2 days in Espoo",
        location: "Espoo",
        summary:
          "Work across React and lightweight Node services with a designer and a domain expert. You'll own a slice of the case-worker product, not just tickets.",
        whyJoin:
          "Our best product engineers spend time with the people using the thing. You'll have room to ask why, not just how.",
        problemNow:
          "The consent flow is technically finished but reads like a legal form. We need to make it understandable to a stressed parent.",
        first90:
          "Ship a clearer consent screen with a real case worker, then help us instrument where people still hesitate.",
        skills: ["TypeScript", "React", "Product thinking", "Accessibility"],
        portfolioRequired: false,
        order: 1,
      },
      {
        slug: "northwind-ml-engineer",
        title: "ML Engineer",
        employmentType: "Full-time",
        workMode: "Hybrid · 2 days in Espoo",
        location: "Espoo",
        summary:
          "Build small, evaluated machine-learning features that assist civil servants. The job is as much refusal design as model selection.",
        whyJoin:
          "We don't ship a model without a clear story for when it should say 'I don't know'. You'll own that story with the team.",
        problemNow:
          "Our assistant is confidently wrong on questions outside the case file. We need abstention that case workers can understand and trust.",
        first90:
          "Run a fresh evaluation on the assistant, identify the worst failure mode, and ship one guardrail with a visible explanation.",
        skills: ["Machine learning", "Evaluation", "Python", "Safety"],
        portfolioRequired: false,
        order: 2,
      },
    ],
  },
  {
    slug: "saari-systems",
    name: "Saari Systems",
    tagline: "Backend systems for cities that can't afford to fail.",
    about:
      "A lean infrastructure team of nine. We run the boring services behind permit systems and public booking tools. We measure success in quiet weeks.",
    industry: "Public infrastructure",
    teamSize: "9 people",
    location: "Helsinki · hybrid",
    logoMark: "SS",
    palette: "blue",
    order: 2,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "You'll see your work in a city service that people depend on. We keep the team small so the person who designed the system is still around when it breaks.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Permit data lives in four systems, and a case can be reopened with no record of why. We're adding an audit trail without asking staff to change tools.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "You've made one deploy safer, documented the rollback, and helped someone else on the team understand the system better.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "saari-backend-engineer",
        title: "Backend Engineer",
        employmentType: "Full-time",
        workMode: "Hybrid · 1 day in Helsinki",
        location: "Helsinki",
        summary:
          "Own a PostgreSQL-backed service used by three cities. Improve reliability, migrations, and the ergonomics of being on call.",
        whyJoin:
          "We don't want a hero on call. We want someone who makes the next incident less likely and the handover less painful.",
        problemNow:
          "Our oldest service has a 40-minute migration path and a habit of surprising us on Fridays. We need to make it boring.",
        first90:
          "Split the riskiest migration into reversible steps, add a real health signal, and write the runbook you wish existed.",
        skills: ["PostgreSQL", "Node.js", "Reliability", "Migrations"],
        portfolioRequired: false,
        order: 1,
      },
    ],
  },
  {
    slug: "kide-studio",
    name: "Kide Studio",
    tagline: "Learning experiences that don't feel like school.",
    about:
      "A studio of eleven designers and producers working with schools, museums, and libraries. We prototype with real teachers and real rooms before we polish.",
    industry: "Learning design",
    teamSize: "11 people",
    location: "Espoo · studio-first",
    logoMark: "KS",
    palette: "ochre",
    order: 3,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "Our projects start in a classroom or a library, not a trends deck. You'll see people use the thing before it's finished and have time to change it.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Teachers plan in five-minute gaps between lessons. Our timetable tool still assumes they have an uninterrupted afternoon.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "You've tested a rough idea with two real teachers, thrown one assumption away, and left the project clearer than you found it.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "kide-product-designer",
        title: "Product Designer",
        employmentType: "Full-time",
        workMode: "Studio-first · Espoo",
        location: "Espoo",
        summary:
          "Lead design on a timetable and planning tool used by teachers. Research, prototype, and work closely with one engineer and an education lead.",
        whyJoin:
          "The team ships in small loops and brings teachers into the room. You'll hear the word 'obvious' as a compliment.",
        problemNow:
          "The planning flow asks teachers to think like a scheduler. We need it to fit the actual shape of a school day.",
        first90:
          "Run four teacher sessions, redraw the planning moment, and get one new flow into a pilot school.",
        skills: ["Product design", "Research", "Prototyping", "Design systems"],
        portfolioRequired: false,
        order: 1,
      },
      {
        slug: "kide-ops-coordinator",
        title: "Ops Coordinator",
        employmentType: "Part-time · 30h",
        workMode: "Studio-first · Espoo",
        location: "Espoo",
        summary:
          "Keep a small studio calm: onboarding freelancers, scheduling research visits, and protecting the week from avoidable chaos.",
        whyJoin:
          "This is a real operations seat with ownership. You'll make the studio run better, not just keep a calendar tidy.",
        problemNow:
          "Every new freelancer asks the same five questions in week one, and the answers live in three different heads.",
        first90:
          "Own a simple onboarding board, simplify one recurring ritual, and leave a handover that a new producer can use.",
        skills: ["Operations", "Onboarding", "Scheduling", "Process"],
        portfolioRequired: false,
        order: 2,
      },
    ],
  },
  {
    slug: "fjord-logistics",
    name: "Fjord Logistics",
    tagline: "The last mile, handled like the first.",
    about:
      "A 140-person delivery company working across the capital region. We are trying to make operations humane at the scale where things usually stop being humane.",
    industry: "Logistics",
    teamSize: "140 people",
    location: "Espoo · on-site",
    logoMark: "FL",
    palette: "sage",
    order: 4,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "Operations is a team sport here. Drivers, warehouse, and support share the same daily huddle and the same problems.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Returns take too long because drivers and the warehouse use different labels. We're fixing the handoff, not buying another dashboard.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "You've spent a full shift with a driver, found one handoff that makes no sense, and fixed it with the people doing the work.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "fjord-logistics-associate",
        title: "Logistics Ops Associate",
        employmentType: "Full-time",
        workMode: "On-site · Espoo",
        location: "Espoo",
        summary:
          "Coordinate routes, returns, and vendor handoffs for the Espoo zone. A practical role for someone who likes solving the day as it happens.",
        whyJoin:
          "You'll be close to the work. The ops lead still answers the phone during peak, and the whiteboard is not decoration.",
        problemNow:
          "A returns backlog is building because the warehouse and drivers label parcels differently. We need a shared process that survives a busy day.",
        first90:
          "Spend a shift with two drivers, map the returns handoff, and ship one standard that actually gets used.",
        skills: ["Logistics", "Routing", "Vendor operations", "Excel"],
        portfolioRequired: false,
        order: 1,
      },
      {
        slug: "fjord-support-specialist",
        title: "Customer Support Specialist",
        employmentType: "Full-time",
        workMode: "Hybrid · 2 days in Espoo",
        location: "Espoo",
        summary:
          "Own customer conversations for delivery and returns. You'll have real authority to fix the process behind recurring complaints.",
        whyJoin:
          "Support is not a script factory. If you can show the queue, you can change it.",
        problemNow:
          "A recent routing change created a new class of late-delivery complaint. We need someone to separate the one-off from the pattern.",
        first90:
          "Learn the top five contact reasons, fix one cause in the product or process, and document the change for the next person.",
        skills: ["Customer support", "Escalation", "Process", "Communication"],
        portfolioRequired: false,
        order: 2,
      },
    ],
  },
  {
    slug: "lumen-retail",
    name: "Lumen Retail",
    tagline: "A small Finnish retail chain with a long memory.",
    about:
      "Thirty-four stores, no venture funding, and a habit of promoting from the floor. We care about stores that feel staffed by people who know the products.",
    industry: "Retail",
    teamSize: "34 stores",
    location: "Espoo · on-site",
    logoMark: "LR",
    palette: "rose",
    order: 5,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "Store teams are trusted to run the store. Area leads are there to help, not to surprise you with a new dashboard every month.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Seasonal turnover is too high because handovers are inconsistent. We're testing a simple opening routine across three stores.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "Your team can explain the opening routine without looking it up, and a new hire has a useful first week.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "lumen-store-supervisor",
        title: "Store Supervisor",
        employmentType: "Full-time",
        workMode: "On-site · Espoo",
        location: "Espoo",
        summary:
          "Run the floor of a busy Espoo store. Coach a team of 12, own the daily rhythm, and make the small decisions that keep a shop feeling calm.",
        whyJoin:
          "You'll have real ownership of the floor plan, the rota, and the opening routine. No head-office theatre.",
        problemNow:
          "Staff turnover is high and new starters are learning the job from whoever is free. We need a handover that works on a busy Tuesday.",
        first90:
          "Run a ten-minute daily handover, stabilise the opening routine, and help two new starters feel at home.",
        skills: ["Retail", "Team leadership", "Operations", "Coaching"],
        portfolioRequired: false,
        order: 1,
      },
      {
        slug: "lumen-retail-associate",
        title: "Retail Associate",
        employmentType: "Part-time · 20-30h",
        workMode: "On-site · Espoo",
        location: "Espoo",
        summary:
          "Work on the floor with customers who have real questions. Learn the products properly and help keep the store running.",
        whyJoin:
          "We train on the products, not just the till. You'll be trusted to solve the customer's actual problem.",
        problemNow:
          "Online returns are creating extra in-store work with no clear owner. We need a simple routine that doesn't eat the afternoon.",
        first90:
          "Learn the returns flow, suggest one improvement from the floor, and become the person new starters can ask.",
        skills: ["Retail", "Customer service", "Operations"],
        portfolioRequired: false,
        order: 2,
      },
    ],
  },
  {
    slug: "polar-signal",
    name: "Polar Signal",
    tagline: "Making climate data usable by people who aren't data people.",
    about:
      "A 16-person analytics company working with cities and energy cooperatives. We publish our methods and have a strong opinion about charts that need a legend.",
    industry: "Climate analytics",
    teamSize: "16 people",
    location: "Helsinki · hybrid",
    logoMark: "PS",
    palette: "slate",
    order: 6,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "You'll work on climate decisions where the number has to survive a public meeting. We care about legibility as much as accuracy.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Three teams define 'building emissions' differently. Our dashboard is technically correct and practically useless.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "You've helped one client make a decision with your analysis, and you can explain the caveat without hiding behind it.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "polar-data-analyst",
        title: "Data Analyst",
        employmentType: "Full-time",
        workMode: "Hybrid · 2 days in Helsinki",
        location: "Helsinki",
        summary:
          "Own the analysis behind one climate dashboard and the story that makes it useful. Work with city analysts, not just other data people.",
        whyJoin:
          "Our analysts present to the people who make the decision. You'll see the consequence of the number, not just the query.",
        problemNow:
          "A shared metric is blocking a client decision because three teams define it differently. We need someone to make the disagreement legible.",
        first90:
          "Rebuild one core metric with tests, write a one-page explainer, and present it to the client team.",
        skills: ["Analytics", "SQL", "Communication", "Data quality"],
        portfolioRequired: false,
        order: 1,
      },
      {
        slug: "polar-growth-marketer",
        title: "Growth Marketer",
        employmentType: "Full-time",
        workMode: "Hybrid · Helsinki or remote",
        location: "Helsinki",
        summary:
          "Help climate teams find Polar Signal without turning the brand into a growth-hacking case study. Content, partnerships, and a careful funnel.",
        whyJoin:
          "You'll market a product that has to be trusted by public institutions. No dark patterns, no fake urgency.",
        problemNow:
          "The best conversations come from word of mouth, but we have no repeatable way to start them. We need a small, honest engine.",
        first90:
          "Ship one valuable piece for city analysts, set up a simple pipeline, and learn which channel deserves more time.",
        skills: ["Growth", "Content", "Partnerships", "Analytics"],
        portfolioRequired: false,
        order: 2,
      },
    ],
  },
  {
    slug: "metsa-health",
    name: "Metsä Health",
    tagline: "Care coordination that leaves room for the human.",
    about:
      "A 60-person home-care coordination team. We build the scheduling and support tools our own coordinators use, and we test them with the people receiving care.",
    industry: "Health services",
    teamSize: "60 people",
    location: "Espoo · hybrid",
    logoMark: "MH",
    palette: "sage",
    order: 7,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "You'll work with coordinators who are on the phone all day. If a feature adds a click without removing a worry, we don't ship it.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Our booking form still locks out some screen-reader users. We're fixing the form and changing the release gate that let it through.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "You've sat with a coordinator, fixed one daily friction, and helped the team test with someone who actually uses assistive tech.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "metsa-support-lead",
        title: "Support Lead",
        employmentType: "Full-time",
        workMode: "Hybrid · 2 days in Espoo",
        location: "Espoo",
        summary:
          "Lead a support team that helps families navigate home-care bookings. Coach the team, own escalation, and fix the process behind repeat contacts.",
        whyJoin:
          "This is a support lead role with authority to change the product. You'll work next to the coordinators and the engineering team.",
        problemNow:
          "A recent form change created a spike in booking calls. We need to separate the accessibility issue from the general confusion.",
        first90:
          "Map the top contact reasons, fix one with the product team, and build a coaching rhythm for the team.",
        skills: ["Customer support", "Coaching", "Escalation", "Process"],
        portfolioRequired: false,
        order: 1,
      },
      {
        slug: "metsa-qa-specialist",
        title: "QA Specialist",
        employmentType: "Fixed-term · 12 months",
        workMode: "Hybrid · Espoo",
        location: "Espoo",
        summary:
          "Own risk-based testing for a booking product used by families. Accessibility is part of the release gate, not a separate project.",
        whyJoin:
          "QA sits in the design review here. You'll hear about a risky flow before it's built, not after.",
        problemNow:
          "The booking form passed our tests but failed a real screen-reader user. We need to fix both the form and the test plan.",
        first90:
          "Rework the release checklist around risk, add an accessibility pass, and test with a real assistive-tech user.",
        skills: ["QA", "Test strategy", "Accessibility testing", "Mobile"],
        portfolioRequired: false,
        order: 2,
      },
    ],
  },
  {
    slug: "common-ground",
    name: "Common Ground",
    tagline: "Civic spaces, digital and physical, built with the neighbours.",
    about:
      "A 13-person nonprofit studio running three community spaces and a small digital team. We build tools with the people who use them, not for an abstract audience.",
    industry: "Civic community",
    teamSize: "13 people",
    location: "Espoo · hybrid",
    logoMark: "CG",
    palette: "clay",
    order: 8,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "You'll know the names of the people using what you make. We work slowly enough to be accountable and quickly enough to stay useful.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "The community wants a weeknight place to work that isn't a bar. We have the room and the people, but not the rhythm yet.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "You've hosted something small, learned who didn't show up, and changed the invitation. Twice.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "common-ground-community-manager",
        title: "Community Manager",
        employmentType: "Full-time",
        workMode: "Hybrid · 3 days in Espoo",
        location: "Espoo",
        summary:
          "Build the weeknight rhythm of a neighbourhood space. Run events, make introductions, and turn regulars into hosts.",
        whyJoin:
          "The room already exists and the neighbours are curious. You'll be trusted to shape the programme, not just promote it.",
        problemNow:
          "A weeknight work space sounds good in a survey but nobody has shown up twice. We need the invitation to match the actual evening.",
        first90:
          "Host six small sessions, interview attendees and non-attendees, and change the format based on what you hear.",
        skills: ["Community", "Events", "Partnerships", "Content"],
        portfolioRequired: false,
        order: 1,
      },
      {
        slug: "common-ground-frontend-engineer",
        title: "Frontend Engineer",
        employmentType: "Full-time",
        workMode: "Hybrid · Espoo",
        location: "Espoo",
        summary:
          "Build small civic tools with a community manager and a designer. React, accessible forms, and a strong bias toward real devices.",
        whyJoin:
          "The tools get used by neighbours on cheap phones in bright rooms. You'll test in the room, not just in a browser.",
        problemNow:
          "Our volunteer shift planner is technically working but hard to read on a phone in daylight. We need to make it usable before the next community day.",
        first90:
          "Test the planner with five real volunteers, fix the two worst moments, and make the form work with a screen reader.",
        skills: ["React", "TypeScript", "Accessibility", "Product thinking"],
        portfolioRequired: false,
        order: 2,
      },
    ],
  },
];
