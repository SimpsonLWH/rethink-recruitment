import type {
  SeedAssessmentAttempt,
  SeedCandidate,
  SeedCandidateInterest,
  SeedEmployer,
  SeedInvitation,
  SeedMatch,
  SeedRoleCard,
} from "./types";

/**
 * Expanded synthetic cohort: two fictional quant firms, two product teams and
 * eight more candidates. Every name, firm, score and message is invented.
 */

export const moreEmployers: SeedEmployer[] = [
  {
    slug: "kallio-capital",
    name: "Kallio Capital",
    tagline: "Systematic trading with the maths written down.",
    about:
      "A 34-person systematic trading firm in Helsinki. Researchers and developers sit together, every model has a written rationale, and nobody is paid to be a hero on a bad day.",
    industry: "Quantitative trading",
    teamSize: "34 people",
    location: "Helsinki · on-site 4 days",
    logoMark: "KC",
    palette: "blue",
    order: 9,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "Your research gets a real test: it either survives a year of live data or we write down why it didn't. Both outcomes count as work.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Our signal decay estimates disagree across two desks. We need someone who can design the experiment that settles it.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer:
          "You have reproduced one existing signal from scratch, found one thing we got wrong, and presented it to the research meeting.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "kallio-quant-researcher",
        title: "Quantitative Researcher (Graduate)",
        employmentType: "Full-time",
        workMode: "On-site · Helsinki",
        location: "Helsinki",
        summary:
          "Design, test and write up systematic trading signals. Probability and statistics first, code second, storytelling third.",
        whyJoin:
          "Small research group, senior mentors, and a publication-style review process for every idea that goes live.",
        problemNow:
          "Two desks estimate signal decay differently and both are confident. We need a clean experiment, not a louder opinion.",
        first90:
          "Reproduce one live signal, quantify its decay with a proper confidence interval, and present the result.",
        skills: ["Probability", "Statistics", "Python", "Research"],
        order: 1,
      },
      {
        slug: "kallio-quant-developer",
        title: "Quant Developer",
        employmentType: "Full-time",
        workMode: "On-site · Helsinki",
        location: "Helsinki",
        summary:
          "Build the research platform and the execution path. Fast enough to matter, simple enough to audit.",
        whyJoin:
          "You own code that researchers use every day and that trades real money. We value boring, tested systems.",
        problemNow:
          "Backtests and live trading compute fills differently. We need one tested implementation both sides trust.",
        first90:
          "Unify the fill model, add property tests, and remove one class of backtest-versus-live surprises.",
        skills: ["C++", "Python", "Time series", "Testing"],
        order: 2,
      },
    ],
  },
  {
    slug: "tapiola-markets",
    name: "Tapiola Markets",
    tagline: "Nordic options market making, one careful quote at a time.",
    about:
      "A 22-person market maker in Espoo quoting Nordic equity options and ETFs. Traders and developers rotate desks in their first year.",
    industry: "Market making",
    teamSize: "22 people",
    location: "Espoo · hybrid",
    logoMark: "TM",
    palette: "sage",
    order: 10,
    prompts: [
      {
        prompt: "Why join us",
        answer:
          "You'll learn trading from people who explain their reasoning. Mistakes are reviewed as a team, never by blame.",
        order: 1,
      },
      {
        prompt: "A problem our team is solving right now",
        answer:
          "Our quotes widen too slowly when volatility jumps. We need faster judgement and better tooling around it.",
        order: 2,
      },
      {
        prompt: "What good looks like in 90 days",
        answer: "You quote one product under supervision and can explain every adjustment you made in a day.",
        order: 3,
      },
    ],
    roles: [
      {
        slug: "tapiola-junior-trader",
        title: "Junior Trader (Options)",
        employmentType: "Full-time",
        workMode: "Hybrid · Espoo desk",
        location: "Espoo",
        summary:
          "Make markets in Nordic options under a senior trader. Quick, calm arithmetic and honest probability matter more than a finance degree.",
        whyJoin:
          "Structured first year with desk rotations and a weekly review of your own trades.",
        problemNow:
          "Volatility jumps catch our quotes flat-footed. We want traders who notice early and say so.",
        first90:
          "Pass the desk simulator, shadow a senior trader, then quote one product with supervision.",
        skills: ["Mental arithmetic", "Probability", "Options", "Communication"],
        order: 1,
      },
      {
        slug: "tapiola-risk-analyst",
        title: "Risk Analyst",
        employmentType: "Full-time",
        workMode: "Hybrid · Espoo",
        location: "Espoo",
        summary: "Own the daily risk report and the limits behind it. Statistics, SQL and the courage to flag a number.",
        whyJoin: "Your report is read every morning by the people who can act on it.",
        problemNow: "Our stress tests use correlations from calm markets. We need someone to test them against bad days.",
        first90: "Rebuild one stress scenario with tested data and present what changed.",
        skills: ["Statistics", "SQL", "Risk", "Communication"],
        order: 2,
      },
    ],
  },
  {
    slug: "revontuli-games",
    name: "Revontuli Games",
    tagline: "Small cosy games, shipped carefully.",
    about:
      "An 18-person game studio in Espoo making browser and mobile puzzle games. Engineers own features from prototype to live ops.",
    industry: "Games",
    teamSize: "18 people",
    location: "Espoo · hybrid",
    logoMark: "RG",
    palette: "plum",
    order: 11,
    prompts: [
      { prompt: "Why join us", answer: "You'll ship to players every two weeks and see the numbers the next morning.", order: 1 },
      {
        prompt: "A problem our team is solving right now",
        answer: "Our level parser chokes on community levels. We need a robust, well-tested parser.",
        order: 2,
      },
      { prompt: "What good looks like in 90 days", answer: "You've shipped one feature end to end and fixed one parser bug class for good.", order: 3 },
    ],
    roles: [
      {
        slug: "revontuli-gameplay-engineer",
        title: "Gameplay Engineer (TypeScript)",
        employmentType: "Full-time",
        workMode: "Hybrid · Espoo",
        location: "Espoo",
        summary: "Build puzzle mechanics and the level tools behind them in TypeScript.",
        whyJoin: "Fast feedback, a calm crunch-free schedule and players who write in.",
        problemNow: "Community-made levels break our parser. We want a robust one with property tests.",
        first90: "Ship one mechanic and replace the level parser with a tested version.",
        skills: ["TypeScript", "Parsing", "Algorithms", "Game design"],
        order: 1,
      },
    ],
  },
  {
    slug: "sisu-mobility",
    name: "Sisu Mobility",
    tagline: "Routing for people who can't wait for the next bus.",
    about:
      "A 40-person mobility company in Espoo building on-demand transit routing for municipalities.",
    industry: "Mobility",
    teamSize: "40 people",
    location: "Espoo · hybrid",
    logoMark: "SM",
    palette: "ochre",
    order: 12,
    prompts: [
      { prompt: "Why join us", answer: "Your algorithm decides whether someone gets to work on time.", order: 1 },
      { prompt: "A problem our team is solving right now", answer: "Route planning slows down sharply at peak demand.", order: 2 },
      { prompt: "What good looks like in 90 days", answer: "You've made one planner hot path measurably faster with tests to prove it.", order: 3 },
    ],
    roles: [
      {
        slug: "sisu-routing-engineer",
        title: "Backend Engineer (Routing)",
        employmentType: "Full-time",
        workMode: "Hybrid · Espoo",
        location: "Espoo",
        summary: "Work on the route planner: graphs, dynamic programming and the database behind them.",
        whyJoin: "Hard algorithmic problems with a visible public benefit.",
        problemNow: "Peak-hour planning is too slow. We need someone who can profile and fix the core loop.",
        first90: "Profile the planner, ship one measurable speed-up, and document the trade-off.",
        skills: ["Algorithms", "Node.js", "PostgreSQL", "Graphs"],
        order: 1,
      },
    ],
  },
];

export const moreEmployerContacts: Record<string, string> = {
  "kallio-capital": "Lea Kallio",
  "tapiola-markets": "Aleksi Tapio",
  "revontuli-games": "Noora Aalto",
  "sisu-mobility": "Pekka Sisula",
};

export const moreRoleCards: SeedRoleCard[] = [
  {
    roleSlug: "kallio-quant-researcher",
    roleFamily: "Quantitative finance",
    assessmentSlug: "quant-v1-probability",
    requiredScore: 75,
    additionalRequirements: [{ assessmentSlug: "quant-v1-statistics", requiredScore: 60 }],
    reviewOwnerName: "Lea Kallio",
    signals: [
      { id: "kq-prob", kind: "SKILL", label: "Probability", value: "Probability" },
      { id: "kq-python", kind: "SKILL", label: "Python", value: "Python" },
      { id: "kq-markets", kind: "DOMAIN", label: "Markets or trading context", value: "markets" },
    ],
  },
  {
    roleSlug: "kallio-quant-developer",
    roleFamily: "Quantitative finance",
    assessmentSlug: "quant-v1-coding",
    requiredScore: 75,
    additionalRequirements: [{ assessmentSlug: "algorithms-v1-dp", requiredScore: 60 }],
    reviewOwnerName: "Lea Kallio",
    signals: [
      { id: "kd-cpp", kind: "SKILL", label: "C++", value: "C++" },
      { id: "kd-ts", kind: "SKILL", label: "Time series", value: "Time series" },
      { id: "kd-latency", kind: "DOMAIN", label: "Performance or low-latency work", value: "performance" },
    ],
  },
  {
    roleSlug: "tapiola-junior-trader",
    roleFamily: "Quantitative finance",
    assessmentSlug: "quant-v1-mental-math",
    requiredScore: 75,
    additionalRequirements: [{ assessmentSlug: "quant-v1-probability", requiredScore: 70 }],
    reviewOwnerName: "Aleksi Tapio",
    signals: [
      { id: "tj-prob", kind: "SKILL", label: "Probability", value: "Probability" },
      { id: "tj-options", kind: "SKILL", label: "Options", value: "Options" },
      { id: "tj-markets", kind: "DOMAIN", label: "Markets or trading context", value: "markets" },
    ],
  },
  {
    roleSlug: "tapiola-risk-analyst",
    roleFamily: "Quantitative finance",
    assessmentSlug: "quant-v1-statistics",
    requiredScore: 60,
    reviewOwnerName: "Aleksi Tapio",
    signals: [
      { id: "tr-sql", kind: "SKILL", label: "SQL", value: "SQL" },
      { id: "tr-stats", kind: "SKILL", label: "Statistics", value: "Statistics" },
      { id: "tr-risk", kind: "DOMAIN", label: "Risk or finance", value: "risk" },
    ],
  },
  {
    roleSlug: "revontuli-gameplay-engineer",
    roleFamily: "Software engineering",
    assessmentSlug: "javascript-v1-strings",
    requiredScore: 70,
    additionalRequirements: [{ assessmentSlug: "algorithms-v1-stacks", requiredScore: 60 }],
    reviewOwnerName: "Noora Aalto",
    signals: [
      { id: "rg-ts", kind: "SKILL", label: "TypeScript", value: "TypeScript" },
      { id: "rg-parse", kind: "SKILL", label: "Parsing", value: "Parsing" },
      { id: "rg-games", kind: "DOMAIN", label: "Games or interactive media", value: "games" },
    ],
  },
  {
    roleSlug: "sisu-routing-engineer",
    roleFamily: "Software engineering",
    assessmentSlug: "algorithms-v1-dp",
    requiredScore: 65,
    reviewOwnerName: "Pekka Sisula",
    signals: [
      { id: "sr-node", kind: "SKILL", label: "Node.js", value: "Node.js" },
      { id: "sr-graphs", kind: "SKILL", label: "Graphs", value: "Graphs" },
      { id: "sr-transit", kind: "DOMAIN", label: "Transport or public services", value: "transport" },
    ],
  },
];

export const moreCandidates: SeedCandidate[] = [
  {
    slug: "ville-hakala",
    name: "Ville Hakala",
    headline: "Maths student who prices options for fun",
    location: "Espoo, Finland",
    bio: "Final-year applied maths. I like probability puzzles, honest error bars and explaining a result in one sentence.",
    monogram: "VH",
    palette: "blue",
    tags: ["Probability", "Python", "Statistics", "Options", "Markets"],
    order: 14,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim:
          "I built a Monte Carlo pricer for Asian options in Python and checked it against the closed-form geometric case. The error stayed under 0.5% at 100k paths.",
        skillTags: ["Python", "Probability", "Options"],
        evidenceUrl: "https://example.com/?evidence=ville-pricer",
      },
      {
        prompt: "The hardest problem I've solved",
        claim:
          "Our student trading club's backtest looked brilliant until I found look-ahead bias in the rebalancing date. Fixing it halved the Sharpe ratio, and we kept the honest number.",
        skillTags: ["Statistics", "Markets", "Research"],
      },
      {
        prompt: "My ideal team",
        claim: "People who argue with data and then buy each other coffee.",
        skillTags: ["Teamwork"],
      },
    ],
  },
  {
    slug: "ananya-iyer",
    name: "Ananya Iyer",
    headline: "Physics PhD moving into quantitative research",
    location: "Helsinki, Finland",
    bio: "Five years of noisy experimental data taught me to distrust a clean result. I want to apply that to markets.",
    monogram: "AI",
    palette: "sage",
    tags: ["Statistics", "Python", "Time series", "Research", "Probability"],
    order: 15,
    facts: [
      {
        prompt: "The hardest problem I've solved",
        claim:
          "I separated a 0.3% signal from detector drift in eight months of time-series data using a state-space model, and the result replicated on a second instrument.",
        skillTags: ["Time series", "Statistics", "Research"],
        evidenceUrl: "https://example.com/?evidence=ananya-drift",
      },
      {
        prompt: "A project I'm proud of",
        claim: "I wrote the group's analysis library in Python with tests; three later PhD students built on it.",
        skillTags: ["Python", "Testing"],
      },
      {
        prompt: "My ideal team",
        claim: "A research group that writes down its failed ideas as carefully as its successes.",
        skillTags: ["Research", "Teamwork"],
      },
    ],
  },
  {
    slug: "lukas-brandt",
    name: "Lukas Brandt",
    headline: "C++ developer for trading systems",
    location: "Tampere, Finland",
    bio: "I make order paths faster and, more importantly, predictable. Benchmarks or it didn't happen.",
    monogram: "LB",
    palette: "slate",
    tags: ["C++", "Python", "Time series", "Performance", "Markets"],
    order: 16,
    facts: [
      {
        prompt: "The hardest problem I've solved",
        claim:
          "I cut 99th-percentile order latency from 180µs to 40µs by removing allocations from the hot path, with a benchmark suite in CI to keep it there.",
        skillTags: ["C++", "Performance"],
        evidenceUrl: "https://example.com/?evidence=lukas-latency",
      },
      {
        prompt: "A project I'm proud of",
        claim: "I wrote a replay tool that rebuilds a full trading day from market-data captures, used for every incident review since.",
        skillTags: ["Time series", "Testing", "Markets"],
      },
      { prompt: "My ideal team", claim: "Developers and traders who share one incident channel.", skillTags: ["Teamwork"] },
    ],
  },
  {
    slug: "hanna-virtanen",
    name: "Hanna Virtanen",
    headline: "Competitive programmer and probability nerd",
    location: "Espoo, Finland",
    bio: "Algorithm contests taught me speed; card games taught me expected value. I want a job that needs both.",
    monogram: "HV",
    palette: "plum",
    tags: ["Algorithms", "Probability", "TypeScript", "Options"],
    order: 17,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim: "I placed in the top 3% of a national programming contest and now help run the Espoo practice group.",
        skillTags: ["Algorithms"],
        evidenceUrl: "https://example.com/?evidence=hanna-contest",
      },
      {
        prompt: "The hardest problem I've solved",
        claim: "I built an expected-value trainer for card-game decisions in TypeScript that 200 club members use weekly.",
        skillTags: ["TypeScript", "Probability"],
      },
      { prompt: "My ideal team", claim: "Fast, kind and willing to be wrong out loud.", skillTags: ["Teamwork"] },
    ],
  },
  {
    slug: "kenji-sato",
    name: "Kenji Sato",
    headline: "Bank risk analyst who reads the footnotes",
    location: "Helsinki, Finland",
    bio: "Three years producing daily risk reports. I want to work where the report changes a decision.",
    monogram: "KS",
    palette: "clay",
    tags: ["Risk", "SQL", "Statistics", "Communication"],
    order: 18,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim: "I rebuilt our VaR backtest in SQL with documented exceptions; audit findings dropped from five to zero.",
        skillTags: ["SQL", "Risk", "Statistics"],
      },
      {
        prompt: "The hardest problem I've solved",
        claim: "I showed our stress correlations came from a calm two-year window and proposed a crisis-weighted alternative.",
        skillTags: ["Statistics", "Risk"],
      },
      { prompt: "My ideal team", claim: "One that wants the bad number early.", skillTags: ["Communication"] },
    ],
  },
  {
    slug: "amara-okafor",
    name: "Amara Okafor",
    headline: "Data engineer who likes market data",
    location: "Vantaa, Finland",
    bio: "I build pipelines that people trust at 7am. Recently: tick data, corporate actions and a lot of time zones.",
    monogram: "AO",
    palette: "ochre",
    tags: ["Python", "SQL", "Time series", "Markets"],
    order: 19,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim: "I moved a market-data pipeline to idempotent daily partitions; reruns went from a day of manual fixes to one command.",
        skillTags: ["Python", "SQL", "Time series"],
        evidenceUrl: "https://example.com/?evidence=amara-pipeline",
      },
      {
        prompt: "The hardest problem I've solved",
        claim: "I traced a P&L break to a stock split applied twice and added a check that catches it on ingest.",
        skillTags: ["Markets", "Testing"],
      },
      { prompt: "My ideal team", claim: "People who say 'show me the query'.", skillTags: ["Teamwork"] },
    ],
  },
  {
    slug: "emil-lindqvist",
    name: "Emil Lindqvist",
    headline: "Gameplay programmer with a parser habit",
    location: "Espoo, Finland",
    bio: "I make puzzle mechanics feel good and level tools that don't crash on creative players.",
    monogram: "EL",
    palette: "sand",
    tags: ["TypeScript", "Parsing", "Games", "Algorithms"],
    order: 20,
    facts: [
      {
        prompt: "A project I'm proud of",
        claim: "I wrote a level-format parser with fuzz tests for a jam game; players shared 1,200 levels without a crash.",
        skillTags: ["TypeScript", "Parsing", "Testing"],
        evidenceUrl: "https://example.com/?evidence=emil-levels",
      },
      {
        prompt: "The hardest problem I've solved",
        claim: "I made undo/redo work across a 40-step puzzle with a command stack instead of snapshots, cutting memory by 90%.",
        skillTags: ["Algorithms", "Games"],
      },
      { prompt: "My ideal team", claim: "Designers and engineers in the same playtest.", skillTags: ["Teamwork"] },
    ],
  },
  {
    slug: "sara-niemi",
    name: "Sara Niemi",
    headline: "Backend engineer for maps and routing",
    location: "Espoo, Finland",
    bio: "Graphs, PostgreSQL and the patience to profile before optimising.",
    monogram: "SN",
    palette: "sage",
    tags: ["Node.js", "Graphs", "PostgreSQL", "Algorithms"],
    order: 21,
    facts: [
      {
        prompt: "The hardest problem I've solved",
        claim: "I replaced a nightly route-matrix job with an incremental Dijkstra update; runtime fell from 3 hours to 11 minutes.",
        skillTags: ["Graphs", "Algorithms", "Node.js"],
        evidenceUrl: "https://example.com/?evidence=sara-routing",
      },
      {
        prompt: "A project I'm proud of",
        claim: "I added PostGIS indexes and query plans to our on-call guide; slow-query pages dropped by two thirds.",
        skillTags: ["PostgreSQL"],
      },
      { prompt: "My ideal team", claim: "One that measures before it argues.", skillTags: ["Teamwork"] },
    ],
  },
];

export const moreAttempts: SeedAssessmentAttempt[] = [
  { candidateSlug: "ville-hakala", assessmentSlug: "quant-v1-probability", score: 88, submittedHoursAgo: 14, minutesUsed: 21 },
  {
    candidateSlug: "ville-hakala",
    assessmentSlug: "quant-v1-statistics",
    score: 75,
    submittedHoursAgo: 13,
    minutesUsed: 28,
    integrityEvents: [{ type: "window_blur", atMinute: 12 }],
  },
  { candidateSlug: "ville-hakala", assessmentSlug: "quant-v1-mental-math", score: 100, submittedHoursAgo: 15, minutesUsed: 7 },
  { candidateSlug: "ananya-iyer", assessmentSlug: "quant-v1-statistics", score: 88, submittedHoursAgo: 22, minutesUsed: 24 },
  {
    candidateSlug: "ananya-iyer",
    assessmentSlug: "quant-v1-probability",
    score: 75,
    submittedHoursAgo: 21,
    minutesUsed: 23,
    integrityEvents: [{ type: "tab_hidden", atMinute: 15 }],
  },
  { candidateSlug: "ananya-iyer", assessmentSlug: "quant-v1-coding", score: 100, submittedHoursAgo: 20, minutesUsed: 31 },
  { candidateSlug: "lukas-brandt", assessmentSlug: "quant-v1-coding", score: 100, submittedHoursAgo: 30, minutesUsed: 22 },
  { candidateSlug: "lukas-brandt", assessmentSlug: "algorithms-v1-dp", score: 87, submittedHoursAgo: 29, minutesUsed: 48 },
  { candidateSlug: "lukas-brandt", assessmentSlug: "algorithms-v1-advanced", score: 90, submittedHoursAgo: 60 },
  { candidateSlug: "hanna-virtanen", assessmentSlug: "quant-v1-probability", score: 100, submittedHoursAgo: 8, minutesUsed: 16 },
  { candidateSlug: "hanna-virtanen", assessmentSlug: "quant-v1-mental-math", score: 88, submittedHoursAgo: 9, minutesUsed: 8 },
  {
    candidateSlug: "hanna-virtanen",
    assessmentSlug: "algorithms-v1-stacks",
    score: 100,
    submittedHoursAgo: 40,
    minutesUsed: 25,
    integrityEvents: [{ type: "paste_blocked", atMinute: 3 }],
  },
  { candidateSlug: "kenji-sato", assessmentSlug: "quant-v1-statistics", score: 63, submittedHoursAgo: 18, minutesUsed: 30 },
  { candidateSlug: "kenji-sato", assessmentSlug: "javascript-v1-medium", score: 60, submittedHoursAgo: 70 },
  {
    candidateSlug: "amara-okafor",
    assessmentSlug: "quant-v1-coding",
    score: 75,
    submittedHoursAgo: 26,
    minutesUsed: 40,
    integrityEvents: [
      { type: "tab_hidden", atMinute: 11 },
      { type: "tab_hidden", atMinute: 27 },
    ],
  },
  { candidateSlug: "amara-okafor", assessmentSlug: "javascript-v1-strings", score: 87, submittedHoursAgo: 50, minutesUsed: 38 },
  { candidateSlug: "emil-lindqvist", assessmentSlug: "javascript-v1-strings", score: 100, submittedHoursAgo: 6, minutesUsed: 30 },
  { candidateSlug: "emil-lindqvist", assessmentSlug: "algorithms-v1-stacks", score: 67, submittedHoursAgo: 7, minutesUsed: 39 },
  { candidateSlug: "sara-niemi", assessmentSlug: "algorithms-v1-dp", score: 73, submittedHoursAgo: 33, minutesUsed: 55 },
  { candidateSlug: "sara-niemi", assessmentSlug: "algorithms-v1-advanced", score: 80, submittedHoursAgo: 80 },
  { candidateSlug: "marcus-oyelaran", assessmentSlug: "algorithms-v1-dp", score: 80, submittedHoursAgo: 44, minutesUsed: 51 },
  { candidateSlug: "priya-raman", assessmentSlug: "quant-v1-statistics", score: 50, submittedHoursAgo: 19, minutesUsed: 30 },
  { candidateSlug: "tomas-kask", assessmentSlug: "quant-v1-coding", score: 90, submittedHoursAgo: 36, minutesUsed: 33 },
];

export const moreInterests: SeedCandidateInterest[] = [
  { candidateSlug: "ananya-iyer", roleSlug: "kallio-quant-researcher", hoursAgo: 6 },
  { candidateSlug: "lukas-brandt", roleSlug: "kallio-quant-developer", hoursAgo: 10 },
  { candidateSlug: "amara-okafor", roleSlug: "kallio-quant-developer", hoursAgo: 12 },
  { candidateSlug: "kenji-sato", roleSlug: "tapiola-risk-analyst", hoursAgo: 16 },
  { candidateSlug: "emil-lindqvist", roleSlug: "revontuli-gameplay-engineer", hoursAgo: 4 },
  { candidateSlug: "sara-niemi", roleSlug: "sisu-routing-engineer", hoursAgo: 9 },
];

export const moreMatches: SeedMatch[] = [
  {
    candidateSlug: "ville-hakala",
    roleSlug: "kallio-quant-researcher",
    stage: "INTERVIEW",
    messages: [
      {
        sender: "employer",
        body: "Your look-ahead bias story is exactly the habit we hire for. Could you walk us through how you found it?",
        minutesAgo: 2100,
      },
      {
        sender: "candidate",
        body: "Gladly. The short version: the rebalancing date used the close we were trying to predict. I'll bring the notebook.",
        minutesAgo: 2040,
      },
      { sender: "employer", body: "Perfect. Thursday at 14:00 with two researchers?", minutesAgo: 1990 },
    ],
  },
  {
    candidateSlug: "hanna-virtanen",
    roleSlug: "tapiola-junior-trader",
    stage: "INTRO_CALL",
    messages: [
      {
        sender: "candidate",
        body: "The desk-rotation year sounds great. How much of the first month is simulator time?",
        minutesAgo: 600,
      },
      {
        sender: "employer",
        body: "About half. The rest is shadowing a senior trader and the daily review.",
        minutesAgo: 560,
      },
    ],
  },
];

export const moreInvitations: SeedInvitation[] = [
  {
    candidateSlug: "lukas-brandt",
    roleSlug: "kallio-quant-researcher",
    message: "Your coding score and replay tool stood out. Would you also consider our research track?",
    citedAssessmentSlug: "quant-v1-coding",
    status: "PENDING",
    hoursAgo: 5,
  },
  {
    candidateSlug: "aino-vikstrom",
    roleSlug: "revontuli-gameplay-engineer",
    message: "Your data-handling score and accessibility work caught our eye. Interested in building puzzle tools with us?",
    citedAssessmentSlug: "javascript-v1-medium",
    status: "PENDING",
    hoursAgo: 3,
  },
  {
    candidateSlug: "ananya-iyer",
    roleSlug: "tapiola-risk-analyst",
    message: "Your statistics result is well above our bar. Would a risk role interest you?",
    citedAssessmentSlug: "quant-v1-statistics",
    status: "DECLINED",
    hoursAgo: 20,
  },
];
