import type { SeedAssessment } from "./types";

/**
 * Synthetic assessment catalogue for the Espoo demo.
 *
 * Two assessments are playable end to end. The rest are clearly labelled
 * catalogue entries so the demo can show breadth without pretending that
 * every assessment is implemented or validated.
 */
export const seedAssessments: SeedAssessment[] = [
  {
    slug: "backend-design-v1-easy",
    title: "Backend design — Foundations",
    roleFamily: "Software engineering",
    family: "Backend design",
    version: "v1",
    difficulty: "EASY",
    description: "Foundational service and data-boundary choices. Catalogue-only in this demo.",
    playable: false,
    order: 1,
    questions: [],
  },
  {
    slug: "backend-design-v1-medium",
    title: "Backend design — Service design",
    roleFamily: "Software engineering",
    family: "Backend design",
    version: "v1",
    difficulty: "MEDIUM",
    description: "API contracts, failure handling and data ownership. Catalogue-only in this demo.",
    playable: false,
    order: 2,
    questions: [],
  },
  {
    slug: "backend-design-v1-advanced",
    title: "Backend design — Production systems",
    roleFamily: "Software engineering",
    family: "Backend design",
    version: "v1",
    difficulty: "ADVANCED",
    description:
      "Eight scenario questions about reliability, migrations, idempotency and failure modes. Four are drawn per sitting.",
    playable: true,
    retakeLimit: 1,
    cooldownHours: 24,
    order: 3,
    questions: [
      {
        id: "bd1-q1",
        prompt:
          "A payment client retries a request after a timeout. The first request may still have succeeded. What is the most reliable server-side protection?",
        options: [
          { id: "a", label: "Increase the client timeout" },
          { id: "b", label: "Require an idempotency key and persist its result" },
          { id: "c", label: "Log the retry and alert the on-call engineer" },
          { id: "d", label: "Disable retries for payment endpoints" },
        ],
        correctOptionId: "b",
        explanation:
          "An idempotency key lets the server return the original result instead of charging twice, even when the first response was lost.",
      },
      {
        id: "bd1-q2",
        prompt:
          "You need to rename a column on a live table with zero downtime. Which sequence is safest?",
        options: [
          { id: "a", label: "Rename it in one migration and deploy immediately" },
          { id: "b", label: "Add the new column, dual-write, backfill, switch reads, then remove the old column" },
          { id: "c", label: "Take the service offline for the migration" },
          { id: "d", label: "Create a second table and stop using the first one" },
        ],
        correctOptionId: "b",
        explanation:
          "Expand/contract removes the moment where old and new code disagree about the schema.",
      },
      {
        id: "bd1-q3",
        prompt:
          "A downstream service is slow, so every request retries three times. What is the likely effect under load?",
        options: [
          { id: "a", label: "Latency falls because more attempts succeed" },
          { id: "b", label: "Load multiplies and the slow service is pushed further down" },
          { id: "c", label: "Retries have no effect on the downstream service" },
          { id: "d", label: "The database automatically reduces retries" },
        ],
        correctOptionId: "b",
        explanation:
          "Retry amplification is a common outage pattern. Timeouts, budgets and jittered backoff limit the blast radius.",
      },
      {
        id: "bd1-q4",
        prompt:
          "A service must update its database and publish an event, but cannot do both atomically. Which pattern keeps them consistent?",
        options: [
          { id: "a", label: "Publish first and hope the database write succeeds" },
          { id: "b", label: "Use a transactional outbox and publish from it" },
          { id: "c", label: "Write to both in parallel with no coordination" },
          { id: "d", label: "Store the event only in the application log" },
        ],
        correctOptionId: "b",
        explanation:
          "The outbox is written in the same transaction as the state change; a separate publisher retries from the outbox.",
      },
      {
        id: "bd1-q5",
        prompt:
          "An API reads from a replica that can lag by several seconds. A user updates their profile and immediately reloads. What should the API do?",
        options: [
          { id: "a", label: "Read from the replica and accept stale data silently" },
          { id: "b", label: "Read the user's own recent write from the primary or return a version token" },
          { id: "c", label: "Block all reads until the replica catches up" },
          { id: "d", label: "Add a longer client-side cache" },
        ],
        correctOptionId: "b",
        explanation:
          "Read-your-writes is a user-facing consistency requirement; route that read to the primary or carry a token.",
      },
      {
        id: "bd1-q6",
        prompt:
          "A queue consumer repeatedly fails on one malformed message. What is the safest way to keep the queue moving without losing the message?",
        options: [
          { id: "a", label: "Retry forever in the main queue" },
          { id: "b", label: "Delete the message and move on" },
          { id: "c", label: "Move it to a dead-letter queue after bounded retries and inspect it" },
          { id: "d", label: "Increase the consumer memory limit" },
        ],
        correctOptionId: "c",
        explanation:
          "A dead-letter queue isolates poison messages while preserving them for diagnosis and replay.",
      },
      {
        id: "bd1-q7",
        prompt:
          "Traffic spikes beyond what a service can process. Which response protects the system best?",
        options: [
          { id: "a", label: "Accept every request and let memory grow" },
          { id: "b", label: "Apply backpressure, shed low-priority work and return a clear retry signal" },
          { id: "c", label: "Turn off monitoring so the alerts stop" },
          { id: "d", label: "Retry each request locally until it succeeds" },
        ],
        correctOptionId: "b",
        explanation:
          "Explicit backpressure and load shedding keep the service inside its capacity envelope.",
      },
      {
        id: "bd1-q8",
        prompt:
          "An audit log must show who changed a record and what changed. Which design is most defensible?",
        options: [
          { id: "a", label: "Overwrite the previous state and keep only the latest row" },
          { id: "b", label: "Append immutable entries with actor, timestamp and before/after values" },
          { id: "c", label: "Emit a free-text console line" },
          { id: "d", label: "Store the audit trail in the same mutable row" },
        ],
        correctOptionId: "b",
        explanation:
          "Append-only records preserve history and support later investigation without rewriting the past.",
      },
    ],
  },
  {
    slug: "backend-design-v2-advanced",
    title: "Backend design — Production systems (v2)",
    roleFamily: "Software engineering",
    family: "Backend design",
    version: "v2",
    difficulty: "ADVANCED",
    description:
      "A revised catalogue entry. Scores here are not interchangeable with v1. Catalogue-only in this demo.",
    playable: false,
    order: 4,
    questions: [],
  },
  {
    slug: "algorithms-v1-easy",
    title: "Algorithms — Fundamentals",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "EASY",
    description: "Complexity and basic data-structure choices. Catalogue-only in this demo.",
    playable: false,
    order: 5,
    questions: [],
  },
  {
    slug: "algorithms-v1-medium",
    title: "Algorithms — Problem solving",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "MEDIUM",
    description:
      "Eight applied questions about data structures, graph search and complexity. Four are drawn per sitting.",
    playable: true,
    retakeLimit: 1,
    cooldownHours: 24,
    order: 6,
    questions: [
      {
        id: "al1-q1",
        prompt:
          "You need to find two numbers in an unsorted list that add to a target. What is the standard O(n) approach?",
        options: [
          { id: "a", label: "Sort the list and scan every pair" },
          { id: "b", label: "Store seen values in a hash set and look for target minus the current value" },
          { id: "c", label: "Sort the list and use binary search for every element" },
          { id: "d", label: "Use a stack and pop until the sum matches" },
        ],
        correctOptionId: "b",
        explanation:
          "A hash set gives constant-time membership checks, so one pass is enough.",
      },
      {
        id: "al1-q2",
        prompt:
          "Which algorithm finds the shortest path in an unweighted graph?",
        options: [
          { id: "a", label: "Depth-first search" },
          { id: "b", label: "Breadth-first search" },
          { id: "c", label: "Binary search" },
          { id: "d", label: "Insertion sort" },
        ],
        correctOptionId: "b",
        explanation:
          "BFS explores by distance from the source, so the first time it reaches a node is a shortest path in an unweighted graph.",
      },
      {
        id: "al1-q3",
        prompt:
          "What is the time complexity of binary search on a sorted array of n elements?",
        options: [
          { id: "a", label: "O(1)" },
          { id: "b", label: "O(log n)" },
          { id: "c", label: "O(n)" },
          { id: "d", label: "O(n log n)" },
        ],
        correctOptionId: "b",
        explanation:
          "Each comparison halves the remaining search space.",
      },
      {
        id: "al1-q4",
        prompt:
          "You need the k largest values from a stream too large to store. Which structure is the usual fit?",
        options: [
          { id: "a", label: "A min-heap of size k" },
          { id: "b", label: "A max-heap of size n" },
          { id: "c", label: "A linked list of every value" },
          { id: "d", label: "A binary search tree of every value" },
        ],
        correctOptionId: "a",
        explanation:
          "A min-heap of size k keeps the current top k; each new value replaces the smallest if it is larger.",
      },
      {
        id: "al1-q5",
        prompt:
          "How do you detect a cycle in a directed graph during depth-first search?",
        options: [
          { id: "a", label: "Count the number of edges" },
          { id: "b", label: "Track nodes in the current recursion stack" },
          { id: "c", label: "Sort the adjacency lists" },
          { id: "d", label: "Use a queue instead of a stack" },
        ],
        correctOptionId: "b",
        explanation:
          "A back edge to a node already on the current recursion stack indicates a directed cycle.",
      },
      {
        id: "al1-q6",
        prompt:
          "Which property makes a problem a good fit for dynamic programming?",
        options: [
          { id: "a", label: "The input is always sorted" },
          { id: "b", label: "Overlapping subproblems and an optimal substructure" },
          { id: "c", label: "The answer is always a single number" },
          { id: "d", label: "The graph is always a tree" },
        ],
        correctOptionId: "b",
        explanation:
          "Reusing solved subproblems is what separates dynamic programming from plain recursion.",
      },
      {
        id: "al1-q7",
        prompt:
          "A sorting algorithm is stable. What does that mean?",
        options: [
          { id: "a", label: "It never uses extra memory" },
          { id: "b", label: "Equal keys keep their relative input order" },
          { id: "c", label: "It always runs in O(n log n)" },
          { id: "d", label: "It works only on numbers" },
        ],
        correctOptionId: "b",
        explanation:
          "Stability matters when records have equal sort keys but a meaningful original order.",
      },
      {
        id: "al1-q8",
        prompt:
          "Appending to a dynamic array is usually described as amortised O(1). Why?",
        options: [
          { id: "a", label: "Every append is exactly one operation" },
          { id: "b", label: "Occasional resizes cost O(n), but their cost spread over many appends is constant" },
          { id: "c", label: "The array never resizes" },
          { id: "d", label: "Appends are always O(log n)" },
        ],
        correctOptionId: "b",
        explanation:
          "Doubling capacity makes the total resize work linear across n appends, so the average is constant.",
      },
    ],
  },
  {
    slug: "algorithms-v1-hard",
    title: "Algorithms — Complex systems",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "ADVANCED",
    description: "Advanced algorithm design. Catalogue-only in this demo.",
    playable: false,
    order: 7,
    questions: [],
  },
  {
    slug: "linux-infra-v1-easy",
    title: "Linux & infrastructure — Essentials",
    roleFamily: "Platform engineering",
    family: "Linux / Infra",
    version: "v1",
    difficulty: "EASY",
    description: "Filesystems, processes and permissions. Catalogue-only in this demo.",
    playable: false,
    order: 8,
    questions: [],
  },
  {
    slug: "linux-infra-v1-medium",
    title: "Linux & infrastructure — Operations",
    roleFamily: "Platform engineering",
    family: "Linux / Infra",
    version: "v1",
    difficulty: "MEDIUM",
    description: "Service operations, logs and networking. Catalogue-only in this demo.",
    playable: false,
    order: 9,
    questions: [],
  },
  {
    slug: "linux-infra-v1-advanced",
    title: "Linux & infrastructure — Reliability",
    roleFamily: "Platform engineering",
    family: "Linux / Infra",
    version: "v1",
    difficulty: "ADVANCED",
    description: "Incident response and platform reliability. Catalogue-only in this demo.",
    playable: false,
    order: 10,
    questions: [],
  },
];
