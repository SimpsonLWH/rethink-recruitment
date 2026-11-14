import type { SeedAssessment } from "./types";

/**
 * Synthetic assessment catalogue for the Espoo demo.
 *
 * Four entries have playable coding problems. The rest stay clearly labelled
 * catalogue entries, so the demo does not pretend every challenge is built.
 * Marking is server-side against hidden tests. There is one attempt per
 * candidate per assessment per recruiting cycle and no retake.
 */
export const seedAssessments: SeedAssessment[] = [
  {
    slug: "backend-design-v1-easy",
    title: "Backend design - Foundations",
    roleFamily: "Software engineering",
    family: "Backend design",
    version: "v1",
    difficulty: "EASY",
    description: "Foundational service and data-boundary choices. Catalogue-only in this demo: no coding problems are attached.",
    playable: false,
    order: 1,
    problems: [],
  },
  {
    slug: "backend-design-v1-medium",
    title: "Backend design - Service design",
    roleFamily: "Software engineering",
    family: "Backend design",
    version: "v1",
    difficulty: "MEDIUM",
    description: "API contracts, failure handling and data ownership. Catalogue-only in this demo: no coding problems are attached.",
    playable: false,
    order: 2,
    problems: [],
  },
  {
    slug: "backend-design-v1-advanced",
    title: "Backend design - Production systems",
    roleFamily: "Software engineering",
    family: "Backend design",
    version: "v1",
    difficulty: "ADVANCED",
    description:
      "Two short coding problems about idempotency and request routing, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 3,
    problems: [
      {
        id: "bd1-p1",
        title: "First-seen request IDs",
        difficulty: "EASY",
        statement:
          "A retry can deliver the same request twice. Given an array of request records, return the id of the first occurrence of each id, in the order those ids first appear.\n\nArguments:\n- records: an array of objects with an id string and a route string.\n\nReturn an array of id strings. Do not mutate the input.",
        functionName: "dedupeById",
        starterCode: "function dedupeById(records) {\n  // Return first-seen ids in input order.\n}\n",
        solution:
          "function dedupeById(records) {\n  const seen = new Set();\n  const out = [];\n  for (const record of records) {\n    if (!seen.has(record.id)) {\n      seen.add(record.id);\n      out.push(record.id);\n    }\n  }\n  return out;\n}\n",
        testCases: [
          {
            id: "bd1-p1-t1",
            args: [[{ id: "a", route: "/orders" }, { id: "b", route: "/users" }, { id: "a", route: "/orders" }]],
            expected: ["a", "b"],
            hidden: false,
          },
          {
            id: "bd1-p1-t2",
            args: [[{ id: "x", route: "/x" }, { id: "y", route: "/y" }, { id: "z", route: "/z" }]],
            expected: ["x", "y", "z"],
          },
          {
            id: "bd1-p1-t3",
            args: [[]],
            expected: [],
          },
          {
            id: "bd1-p1-t4",
            args: [[{ id: "a", route: "/one" }, { id: "b", route: "/two" }, { id: "c", route: "/three" }, { id: "b", route: "/two" }]],
            expected: ["a", "b", "c"],
          },
          {
            id: "bd1-p1-t5",
            args: [[{ id: "same", route: "/a" }, { id: "same", route: "/b" }, { id: "same", route: "/c" }]],
            expected: ["same"],
          },
        ],
      },
      {
        id: "bd1-p2",
        title: "Busiest routes",
        difficulty: "MEDIUM",
        statement:
          "An observability job groups requests by route. Given an array of route paths and a limit, return the busiest routes as an array of [path, count] pairs.\n\nSort by count descending. If two routes have the same count, sort by path ascending. Return at most limit pairs. If limit is zero, return an empty array.\n\nArguments:\n- paths: an array of route strings.\n- limit: a non-negative integer.\n\nReturn an array of [path, count] pairs. Do not mutate the input.",
        functionName: "topRoutes",
        starterCode: "function topRoutes(paths, limit) {\n  // Return the most frequent routes as [path, count] pairs.\n}\n",
        solution:
          "function topRoutes(paths, limit) {\n  const counts = new Map();\n  for (const path of paths) counts.set(path, (counts.get(path) || 0) + 1);\n  return Array.from(counts.entries()).sort((left, right) => {\n    if (right[1] !== left[1]) return right[1] - left[1];\n    return left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0;\n  }).slice(0, Math.max(0, limit));\n}\n",
        testCases: [
          {
            id: "bd1-p2-t1",
            args: [["/a", "/b", "/a", "/c", "/a", "/b"], 2],
            expected: [["/a", 3], ["/b", 2]],
            hidden: false,
          },
          {
            id: "bd1-p2-t2",
            args: [["/a", "/b", "/c", "/a", "/b", "/c"], 3],
            expected: [["/a", 2], ["/b", 2], ["/c", 2]],
          },
          {
            id: "bd1-p2-t3",
            args: [["/health", "/health", "/orders", "/orders", "/orders"], 1],
            expected: [["/orders", 3]],
          },
          {
            id: "bd1-p2-t4",
            args: [[], 3],
            expected: [],
          },
          {
            id: "bd1-p2-t5",
            args: [["/z", "/y", "/x", "/z"], 0],
            expected: [],
          },
        ],
      },
    ],
  },
  {
    slug: "backend-design-v2-advanced",
    title: "Backend design - Production systems (v2)",
    roleFamily: "Software engineering",
    family: "Backend design",
    version: "v2",
    difficulty: "ADVANCED",
    description:
      "A revised catalogue entry. Scores here are not interchangeable with v1. Catalogue-only in this demo: no coding problems are attached.",
    playable: false,
    order: 4,
    problems: [],
  },
  {
    slug: "algorithms-v1-easy",
    title: "Algorithms - Fundamentals",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "EASY",
    description:
      "Two short coding problems on array and string basics, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 5,
    problems: [
      {
        id: "al1-e1",
        title: "Sum the even values",
        difficulty: "EASY",
        statement:
          "Given an array of integers, return the sum of the even values. Zero is even. An empty array returns 0.\n\nArguments:\n- numbers: an array of integers.\n\nReturn an integer.",
        functionName: "sumEven",
        starterCode: "function sumEven(numbers) {\n  // Return the sum of the even numbers.\n}\n",
        solution:
          "function sumEven(numbers) {\n  return numbers.filter((value) => value % 2 === 0).reduce((total, value) => total + value, 0);\n}\n",
        testCases: [
          { id: "al1-e1-t1", args: [[1, 2, 3, 4]], expected: 6, hidden: false },
          { id: "al1-e1-t2", args: [[]], expected: 0 },
          { id: "al1-e1-t3", args: [[-2, 5, 8]], expected: 6 },
          { id: "al1-e1-t4", args: [[1, 3, 5]], expected: 0 },
          { id: "al1-e1-t5", args: [[0, -4, 7, 10]], expected: 6 },
        ],
      },
      {
        id: "al1-e2",
        title: "Reverse the words",
        difficulty: "EASY",
        statement:
          "Given a sentence, reverse the order of its words and join them with a single space. Words are separated by one or more spaces. Leading and trailing spaces are ignored. An empty or whitespace-only sentence returns an empty string.\n\nArguments:\n- sentence: a string.\n\nReturn a string.",
        functionName: "reverseWords",
        starterCode: "function reverseWords(sentence) {\n  // Reverse the words, not the characters.\n}\n",
        solution:
          "function reverseWords(sentence) {\n  const words = sentence.trim().split(/\\s+/).filter(Boolean);\n  return words.reverse().join(' ');\n}\n",
        testCases: [
          { id: "al1-e2-t1", args: ["one two three"], expected: "three two one", hidden: false },
          { id: "al1-e2-t2", args: ["hello"], expected: "hello" },
          { id: "al1-e2-t3", args: [""], expected: "" },
          { id: "al1-e2-t4", args: ["  a   b  c  "], expected: "c b a" },
          { id: "al1-e2-t5", args: ["  "], expected: "" },
        ],
      },
    ],
  },
  {
    slug: "algorithms-v1-medium",
    title: "Algorithms - Problem solving",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "MEDIUM",
    description:
      "Two short coding problems on hash maps and sliding windows, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 6,
    problems: [
      {
        id: "al1-m1",
        title: "Two numbers, one target",
        difficulty: "EASY",
        statement:
          "Given an array of integers and a target sum, return the indices [i, j] of two different values that add up to the target. Exactly one solution exists. Return i before j, with i < j. Do not use the same element twice.\n\nArguments:\n- numbers: an array of integers.\n- target: an integer.\n\nReturn an array of two indices.",
        functionName: "twoSum",
        starterCode: "function twoSum(numbers, target) {\n  // Return [i, j] with numbers[i] + numbers[j] === target.\n}\n",
        solution:
          "function twoSum(numbers, target) {\n  const seen = new Map();\n  for (let index = 0; index < numbers.length; index += 1) {\n    const need = target - numbers[index];\n    if (seen.has(need)) return [seen.get(need), index];\n    seen.set(numbers[index], index);\n  }\n  return [];\n}\n",
        testCases: [
          { id: "al1-m1-t1", args: [[2, 7, 11, 15], 9], expected: [0, 1], hidden: false },
          { id: "al1-m1-t2", args: [[3, 2, 4], 6], expected: [1, 2] },
          { id: "al1-m1-t3", args: [[3, 3], 6], expected: [0, 1] },
          { id: "al1-m1-t4", args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
          { id: "al1-m1-t5", args: [[0, 4, 3, 0], 0], expected: [0, 3] },
        ],
      },
      {
        id: "al1-m2",
        title: "Longest unique run",
        difficulty: "MEDIUM",
        statement:
          "Given a string, return the length of the longest substring that contains no repeated characters. The empty string returns 0.\n\nArguments:\n- text: a string of printable characters.\n\nReturn an integer. Aim for linear time.",
        functionName: "longestUniqueRun",
        starterCode: "function longestUniqueRun(text) {\n  // Return the length of the longest substring without repeated characters.\n}\n",
        solution:
          "function longestUniqueRun(text) {\n  const last = new Map();\n  let start = 0;\n  let best = 0;\n  for (let index = 0; index < text.length; index += 1) {\n    const character = text[index];\n    if (last.has(character) && last.get(character) >= start) start = last.get(character) + 1;\n    last.set(character, index);\n    best = Math.max(best, index - start + 1);\n  }\n  return best;\n}\n",
        testCases: [
          { id: "al1-m2-t1", args: ["abcabcbb"], expected: 3, hidden: false },
          { id: "al1-m2-t2", args: ["bbbbb"], expected: 1 },
          { id: "al1-m2-t3", args: [""], expected: 0 },
          { id: "al1-m2-t4", args: ["pwwkew"], expected: 3 },
          { id: "al1-m2-t5", args: ["dvdf"], expected: 3 },
        ],
      },
    ],
  },
  {
    slug: "algorithms-v1-hard",
    title: "Algorithms - Complex systems",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "ADVANCED",
    description: "Advanced algorithm design. Catalogue-only in this demo: no coding problems are attached.",
    playable: false,
    order: 7,
    problems: [],
  },
  {
    slug: "linux-infra-v1-easy",
    title: "Linux & infrastructure - Essentials",
    roleFamily: "Platform engineering",
    family: "Linux / Infra",
    version: "v1",
    difficulty: "EASY",
    description:
      "One short coding problem on parsing operations logs, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 8,
    problems: [
      {
        id: "li1-p1",
        title: "Count log levels",
        difficulty: "EASY",
        statement:
          "Given an array of log lines, count how many start with each level. Only INFO, WARN and ERROR count, and the level must be the first token on the line. Return an object with all three keys, even when a count is zero. Treat matching as case-sensitive.\n\nArguments:\n- lines: an array of strings.\n\nReturn an object such as { INFO: 2, WARN: 0, ERROR: 1 }.",
        functionName: "countByLevel",
        starterCode: "function countByLevel(lines) {\n  // Count INFO, WARN and ERROR lines. Always return all three keys.\n}\n",
        solution:
          "function countByLevel(lines) {\n  const counts = { INFO: 0, WARN: 0, ERROR: 0 };\n  for (const line of lines) {\n    const level = String(line).trim().split(/\\s+/)[0];\n    if (Object.prototype.hasOwnProperty.call(counts, level)) counts[level] += 1;\n  }\n  return counts;\n}\n",
        testCases: [
          {
            id: "li1-p1-t1",
            args: [["INFO started", "ERROR boom", "INFO again"]],
            expected: { INFO: 2, WARN: 0, ERROR: 1 },
            hidden: false,
          },
          {
            id: "li1-p1-t2",
            args: [[]],
            expected: { INFO: 0, WARN: 0, ERROR: 0 },
          },
          {
            id: "li1-p1-t3",
            args: [["WARN slow", "WARN slower", "ERROR timeout", "DEBUG ignored"]],
            expected: { INFO: 0, WARN: 2, ERROR: 1 },
          },
          {
            id: "li1-p1-t4",
            args: [["info lowercase", "INFOOK not a level", "ERROR ok"]],
            expected: { INFO: 0, WARN: 0, ERROR: 1 },
          },
          {
            id: "li1-p1-t5",
            args: [["   INFO indented", "WARN fine"]],
            expected: { INFO: 1, WARN: 1, ERROR: 0 },
          },
        ],
      },
    ],
  },
  {
    slug: "linux-infra-v1-medium",
    title: "Linux & infrastructure - Operations",
    roleFamily: "Platform engineering",
    family: "Linux / Infra",
    version: "v1",
    difficulty: "MEDIUM",
    description: "Service operations, logs and networking. Catalogue-only in this demo: no coding problems are attached.",
    playable: false,
    order: 9,
    problems: [],
  },
  {
    slug: "linux-infra-v1-advanced",
    title: "Linux & infrastructure - Reliability",
    roleFamily: "Platform engineering",
    family: "Linux / Infra",
    version: "v1",
    difficulty: "ADVANCED",
    description: "Incident response and platform reliability. Catalogue-only in this demo: no coding problems are attached.",
    playable: false,
    order: 10,
    problems: [],
  },
];
