import type { SeedAssessment } from "./types";

/**
 * JavaScript-only online assessments for the Espoo demo.
 *
 * Every entry is playable and is marked on the server against hidden tests.
 * Linux, infrastructure and design-only catalogue entries were removed: they
 * did not produce meaningful JavaScript coding evidence.
 */
export const seedAssessments: SeedAssessment[] = [
  {
    slug: "algorithms-v1-easy",
    title: "Algorithms - Fundamentals",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "EASY",
    description:
      "Two short JavaScript problems on arrays and strings, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 1,
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
      "Two short JavaScript problems on hash maps and sliding windows, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 2,
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
    slug: "algorithms-v1-advanced",
    title: "Algorithms - Advanced",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "ADVANCED",
    description:
      "Two harder JavaScript problems on interval merging and grid traversal, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 3,
    problems: [
      {
        id: "al1-a1",
        title: "Merge the intervals",
        difficulty: "MEDIUM",
        statement:
          "Given an array of intervals where each interval is [start, end], merge every pair that overlaps or touches at an endpoint. Return the merged intervals sorted by start. Do not mutate the input.\n\nArguments:\n- intervals: an array of [start, end] integer pairs.\n\nReturn an array of [start, end] pairs.",
        functionName: "mergeIntervals",
        starterCode: "function mergeIntervals(intervals) {\n  // Merge overlapping intervals and return them sorted by start.\n}\n",
        solution:
          "function mergeIntervals(intervals) {\n  const sorted = intervals.map((interval) => [interval[0], interval[1]]).sort((left, right) => left[0] - right[0]);\n  const merged = [];\n  for (const interval of sorted) {\n    const last = merged[merged.length - 1];\n    if (last && interval[0] <= last[1]) {\n      last[1] = Math.max(last[1], interval[1]);\n    } else {\n      merged.push(interval);\n    }\n  }\n  return merged;\n}\n",
        testCases: [
          {
            id: "al1-a1-t1",
            args: [[[1, 3], [2, 6], [8, 10], [15, 18]]],
            expected: [[1, 6], [8, 10], [15, 18]],
            hidden: false,
          },
          { id: "al1-a1-t2", args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
          { id: "al1-a1-t3", args: [[[5, 6], [1, 2]]], expected: [[1, 2], [5, 6]] },
          { id: "al1-a1-t4", args: [[[1, 10], [2, 3], [4, 5]]], expected: [[1, 10]] },
          { id: "al1-a1-t5", args: [[]], expected: [] },
        ],
      },
      {
        id: "al1-a2",
        title: "Count the islands",
        difficulty: "MEDIUM",
        statement:
          "Given a grid of 0s and 1s, count the islands. An island is a group of 1s connected horizontally or vertically. Do not connect diagonals, and do not wrap around the grid edges. You may mutate the grid.\n\nArguments:\n- grid: an array of equal-length arrays of 0 and 1 integers.\n\nReturn an integer.",
        functionName: "countIslands",
        starterCode: "function countIslands(grid) {\n  // Count groups of connected 1s using four directions.\n}\n",
        solution:
          "function countIslands(grid) {\n  const rows = grid.length;\n  const cols = rows > 0 ? grid[0].length : 0;\n  let count = 0;\n  function visit(row, col) {\n    if (row < 0 || col < 0 || row >= rows || col >= cols || grid[row][col] !== 1) return;\n    grid[row][col] = 0;\n    visit(row + 1, col);\n    visit(row - 1, col);\n    visit(row, col + 1);\n    visit(row, col - 1);\n  }\n  for (let row = 0; row < rows; row += 1) {\n    for (let col = 0; col < cols; col += 1) {\n      if (grid[row][col] === 1) {\n        count += 1;\n        visit(row, col);\n      }\n    }\n  }\n  return count;\n}\n",
        testCases: [
          {
            id: "al1-a2-t1",
            args: [[[1, 1, 0], [0, 1, 0], [1, 0, 1]]],
            expected: 3,
            hidden: false,
          },
          { id: "al1-a2-t2", args: [[[1, 1, 1], [1, 1, 1], [1, 1, 1]]], expected: 1 },
          { id: "al1-a2-t3", args: [[[0, 0], [0, 0]]], expected: 0 },
          { id: "al1-a2-t4", args: [[]], expected: 0 },
          {
            id: "al1-a2-t5",
            args: [[[1, 0, 0, 1], [0, 1, 0, 0], [0, 0, 1, 0], [1, 0, 0, 1]]],
            expected: 6,
          },
        ],
      },
    ],
  },
  {
    slug: "javascript-v1-easy",
    title: "JavaScript - Essentials",
    roleFamily: "Software engineering",
    family: "JavaScript",
    version: "v1",
    difficulty: "EASY",
    description:
      "Two short JavaScript problems on arrays and built-in methods, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 4,
    problems: [
      {
        id: "js1-e1",
        title: "Unique values, original order",
        difficulty: "EASY",
        statement:
          "Given an array of primitive values, return a new array containing each value once, in the order its first occurrence appears. Do not mutate the input. Values of different types are different, so 1 and \"1\" are both kept.\n\nArguments:\n- values: an array of strings, numbers or booleans.\n\nReturn an array.",
        functionName: "uniqueValues",
        starterCode: "function uniqueValues(values) {\n  // Return each value once, in first-seen order.\n}\n",
        solution: "function uniqueValues(values) {\n  return Array.from(new Set(values));\n}\n",
        testCases: [
          { id: "js1-e1-t1", args: [[1, 2, 1, 3, 2]], expected: [1, 2, 3], hidden: false },
          { id: "js1-e1-t2", args: [["a", "b", "a", "c", "b"]], expected: ["a", "b", "c"] },
          { id: "js1-e1-t3", args: [[]], expected: [] },
          { id: "js1-e1-t4", args: [[true, false, true]], expected: [true, false] },
          { id: "js1-e1-t5", args: [[1, "1", 1, "1"]], expected: [1, "1"] },
        ],
      },
      {
        id: "js1-e2",
        title: "Flatten one level",
        difficulty: "EASY",
        statement:
          "Given an array that may contain nested arrays, return a new array with one level of nesting removed. Do not flatten deeper levels recursively and do not mutate the input.\n\nArguments:\n- items: an array of values and arrays.\n\nReturn an array.",
        functionName: "flattenOnce",
        starterCode: "function flattenOnce(items) {\n  // Remove one level of nesting.\n}\n",
        solution: "function flattenOnce(items) {\n  return items.flat(1);\n}\n",
        testCases: [
          { id: "js1-e2-t1", args: [[1, [2, 3], 4]], expected: [1, 2, 3, 4], hidden: false },
          { id: "js1-e2-t2", args: [[[], [1], 2]], expected: [1, 2] },
          { id: "js1-e2-t3", args: [[1, 2, 3]], expected: [1, 2, 3] },
          { id: "js1-e2-t4", args: [[[[1]], 2]], expected: [[1], 2] },
          { id: "js1-e2-t5", args: [[]], expected: [] },
        ],
      },
    ],
  },
  {
    slug: "javascript-v1-medium",
    title: "JavaScript - Data handling",
    roleFamily: "Software engineering",
    family: "JavaScript",
    version: "v1",
    difficulty: "MEDIUM",
    description:
      "Two short JavaScript problems on grouping and sorting records, marked against hidden tests. One attempt per recruiting cycle.",
    playable: true,
    order: 5,
    problems: [
      {
        id: "js1-m1",
        title: "Group names by category",
        difficulty: "MEDIUM",
        statement:
          "Given an array of records with name and category strings, return an object mapping each category to an array of names in input order. Do not sort anything and do not mutate the input.\n\nArguments:\n- records: an array of objects with name and category.\n\nReturn an object of category to array of names.",
        functionName: "groupByCategory",
        starterCode: "function groupByCategory(records) {\n  // Group names by their category.\n}\n",
        solution:
          "function groupByCategory(records) {\n  const grouped = {};\n  for (const record of records) {\n    if (!grouped[record.category]) grouped[record.category] = [];\n    grouped[record.category].push(record.name);\n  }\n  return grouped;\n}\n",
        testCases: [
          {
            id: "js1-m1-t1",
            args: [[{ name: "A", category: "tools" }, { name: "B", category: "books" }, { name: "C", category: "tools" }]],
            expected: { tools: ["A", "C"], books: ["B"] },
            hidden: false,
          },
          { id: "js1-m1-t2", args: [[]], expected: {} },
          { id: "js1-m1-t3", args: [[{ name: "Only", category: "one" }]], expected: { one: ["Only"] } },
          {
            id: "js1-m1-t4",
            args: [[{ name: "Z", category: "x" }, { name: "Y", category: "x" }, { name: "X", category: "y" }]],
            expected: { x: ["Z", "Y"], y: ["X"] },
          },
          {
            id: "js1-m1-t5",
            args: [[{ name: "A", category: "c" }, { name: "B", category: "b" }, { name: "C", category: "c" }]],
            expected: { c: ["A", "C"], b: ["B"] },
          },
        ],
      },
      {
        id: "js1-m2",
        title: "Sort records by score",
        difficulty: "MEDIUM",
        statement:
          "Given records with a name and a numeric score, return an array of names sorted by score descending. If two scores tie, sort those names ascending. Do not mutate the input.\n\nArguments:\n- records: an array of objects with name and score.\n\nReturn an array of names.",
        functionName: "sortRecords",
        starterCode: "function sortRecords(records) {\n  // Sort by score descending, then by name ascending.\n}\n",
        solution:
          "function sortRecords(records) {\n  return records.slice().sort((left, right) => {\n    if (right.score !== left.score) return right.score - left.score;\n    return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;\n  }).map((record) => record.name);\n}\n",
        testCases: [
          {
            id: "js1-m2-t1",
            args: [[{ name: "A", score: 90 }, { name: "B", score: 80 }, { name: "C", score: 90 }]],
            expected: ["A", "C", "B"],
            hidden: false,
          },
          { id: "js1-m2-t2", args: [[]], expected: [] },
          { id: "js1-m2-t3", args: [[{ name: "Z", score: 50 }, { name: "A", score: 50 }]], expected: ["A", "Z"] },
          {
            id: "js1-m2-t4",
            args: [[{ name: "A", score: 10 }, { name: "B", score: 20 }, { name: "C", score: 30 }]],
            expected: ["C", "B", "A"],
          },
          {
            id: "js1-m2-t5",
            args: [[{ name: "C", score: 5 }, { name: "A", score: 5 }, { name: "B", score: 5 }]],
            expected: ["A", "B", "C"],
          },
        ],
      },
    ],
  },
];
