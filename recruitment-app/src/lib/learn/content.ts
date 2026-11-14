import type { AssessmentDifficulty, OaProblem } from "@/lib/assessments";

/**
 * Prepare: lessons and practice challenges. Practice is unlimited, every test
 * is visible, and nothing here is stored as assessment evidence. Practice
 * problems are deliberately different from the assessment problem bank.
 */

export interface LessonSection {
  heading?: string;
  paragraphs: string[];
  code?: string;
  points?: string[];
}

export interface Lesson {
  kind: "lesson";
  slug: string;
  title: string;
  minutes: number;
  summary: string;
  sections: LessonSection[];
}

export interface Practice {
  kind: "practice";
  slug: string;
  title: string;
  difficulty: AssessmentDifficulty;
  summary: string;
  hint?: string;
  /** Shown after a correct answer (choice/numeric) or once all tests pass (code). */
  explanation?: string;
  problem: OaProblem;
}

export type LearnItem = Lesson | Practice;

export interface Track {
  slug: string;
  title: string;
  blurb: string;
  /** Assessment family this track prepares for, if any. */
  prepares: string | null;
  items: LearnItem[];
}

function codeProblem(input: {
  id: string;
  title: string;
  difficulty: AssessmentDifficulty;
  statement: string;
  functionName: string;
  starterCode: string;
  tests: Array<[unknown[], unknown]>;
}): OaProblem {
  return {
    id: input.id,
    kind: "code",
    title: input.title,
    difficulty: input.difficulty,
    statement: input.statement,
    functionName: input.functionName,
    starterCode: input.starterCode,
    testCases: input.tests.map(([args, expected], index) => ({
      id: input.id + "-t" + (index + 1),
      args,
      expected,
      hidden: false,
    })),
  };
}

function choiceProblem(id: string, title: string, difficulty: AssessmentDifficulty, statement: string, options: string[], answer: number): OaProblem {
  return {
    id,
    kind: "choice",
    title,
    difficulty,
    statement,
    functionName: "",
    starterCode: "",
    options,
    testCases: [{ id: id + "-key", args: [], expected: answer, hidden: true }],
  };
}

function numericProblem(id: string, title: string, difficulty: AssessmentDifficulty, statement: string, answer: number, tolerance = 1e-4): OaProblem {
  return {
    id,
    kind: "numeric",
    title,
    difficulty,
    statement,
    functionName: "",
    starterCode: "",
    tolerance,
    testCases: [{ id: id + "-key", args: [], expected: answer, hidden: true }],
  };
}

export const TRACKS: Track[] = [
  {
    slug: "javascript",
    title: "JavaScript essentials",
    blurb: "The array, object and string tools that show up in almost every coding OA.",
    prepares: "JavaScript",
    items: [
      {
        kind: "lesson",
        slug: "array-methods",
        title: "Array methods you will use in every OA",
        minutes: 6,
        summary: "map, filter and reduce, plus the sort and mutation traps that cost hidden tests.",
        sections: [
          {
            paragraphs: [
              "Most coding problems are a loop over an array with one of three intentions: transform every item, keep some items, or fold everything into one value. JavaScript names those intentions map, filter and reduce.",
            ],
            code: "const prices = [12, 7, 30, 4];\nconst withTax = prices.map((p) => p * 1.24);\nconst cheap = prices.filter((p) => p < 10);      // [7, 4]\nconst total = prices.reduce((sum, p) => sum + p, 0); // 53",
          },
          {
            heading: "Always give reduce a starting value",
            paragraphs: [
              "Without the second argument, reduce uses the first item as the start and throws on an empty array. Hidden tests love empty arrays.",
            ],
          },
          {
            heading: "sort() compares strings by default",
            paragraphs: [
              "[10, 9, 1].sort() returns [1, 10, 9] because the numbers are compared as text. Pass a comparator for numbers, and remember sort mutates the array in place.",
            ],
            code: "const sorted = values.slice().sort((a, b) => a - b); // copy, then sort numerically",
          },
          {
            heading: "Checklist before you submit",
            paragraphs: [],
            points: [
              "Did you handle the empty input?",
              "Did you mutate an argument the statement said to leave alone?",
              "Does a tie need a second sort key?",
            ],
          },
        ],
      },
      {
        kind: "lesson",
        slug: "lookups",
        title: "Objects, Map and Set as lookups",
        minutes: 5,
        summary: "Turn an O(n²) search into O(n) by remembering what you have seen.",
        sections: [
          {
            paragraphs: [
              "If your solution has a loop inside a loop that searches for something, a lookup table usually removes the inner loop. Set answers 'have I seen this?'; Map answers 'what did I store for this?'.",
            ],
            code: "function hasDuplicate(values) {\n  const seen = new Set();\n  for (const value of values) {\n    if (seen.has(value)) return true;\n    seen.add(value);\n  }\n  return false;\n}",
          },
          {
            heading: "Map or plain object?",
            paragraphs: [
              "Plain objects turn every key into a string, so 1 and \"1\" collide. Map keeps key types and insertion order. Use an object when the output must be a plain object; use Map for working state.",
            ],
          },
        ],
      },
      {
        kind: "practice",
        slug: "count-vowels",
        title: "Count the vowels",
        difficulty: "EASY",
        summary: "A warm-up on strings and loops.",
        hint: "Lower-case the text first, then test each character against a Set of vowels.",
        explanation: "One pass over the string with a Set lookup is O(n). A regex such as /[aeiou]/gi also works: (text.match(re) || []).length.",
        problem: codeProblem({
          id: "lp-js-vowels",
          title: "Count the vowels",
          difficulty: "EASY",
          statement: "Return how many vowels (a, e, i, o, u, in either case) the text contains.\n\nArguments:\n- text: a string.\n\nReturn an integer.",
          functionName: "countVowels",
          starterCode: "function countVowels(text) {\n  \n}\n",
          tests: [[["Espoo"], 3], [[""], 0], [["rhythm"], 0], [["AEIOU aeiou"], 10]],
        }),
      },
      {
        kind: "practice",
        slug: "chunk",
        title: "Chunk an array",
        difficulty: "EASY",
        summary: "Split a list into fixed-size pieces.",
        hint: "Step through the array size items at a time and use slice.",
        explanation: "for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size)); slice never reads past the end, so the last chunk is short automatically.",
        problem: codeProblem({
          id: "lp-js-chunk",
          title: "Chunk an array",
          difficulty: "EASY",
          statement: "Split items into arrays of length size. The last chunk may be shorter. Do not mutate the input.\n\nArguments:\n- items: an array.\n- size: a positive integer.\n\nReturn an array of arrays.",
          functionName: "chunk",
          starterCode: "function chunk(items, size) {\n  \n}\n",
          tests: [[[[1, 2, 3, 4, 5], 2], [[1, 2], [3, 4], [5]]], [[[], 3], []], [[[1, 2, 3], 5], [[1, 2, 3]]], [[["a", "b"], 1], [["a"], ["b"]]]],
        }),
      },
      {
        kind: "practice",
        slug: "top-word",
        title: "Most frequent word",
        difficulty: "MEDIUM",
        summary: "Counting with a Map and breaking ties.",
        hint: "Split on anything that is not a letter, count with a Map, then pick the max with an alphabetical tie-break.",
        explanation: "Normalise first (lower-case, split on /[^a-z]+/), count, then scan the counts once. The tie-break is where most submissions lose a hidden test.",
        problem: codeProblem({
          id: "lp-js-topword",
          title: "Most frequent word",
          difficulty: "MEDIUM",
          statement: "Return the most frequent word, lower-cased. Words are runs of letters a-z (ignore case; everything else separates words). If several words tie, return the alphabetically first. Return an empty string if there are no words.\n\nArguments:\n- text: a string.\n\nReturn a string.",
          functionName: "topWord",
          starterCode: "function topWord(text) {\n  \n}\n",
          tests: [[["the cat and the hat"], "the"], [[""], ""], [["b a B a"], "a"], [["Data, data; DATA! info"], "data"], [["123 456"], ""]],
        }),
      },
      {
        kind: "practice",
        slug: "sort-default",
        title: "What does sort() return?",
        difficulty: "EASY",
        summary: "A one-question check on a classic trap.",
        explanation: "Without a comparator, sort converts values to strings and compares them as text: \"1\" < \"10\" < \"9\". So [10, 9, 1].sort() is [1, 10, 9].",
        problem: choiceProblem("lp-js-sort", "What does sort() return?", "EASY", "What does [10, 9, 1].sort() return in JavaScript?", ["[1, 9, 10]", "[1, 10, 9]", "[10, 9, 1]", "[10, 1, 9]"], 1),
      },
    ],
  },
  {
    slug: "algorithms",
    title: "Algorithms and data structures",
    blurb: "Big-O, two pointers, stacks and dynamic programming, with practice for each pattern.",
    prepares: "Algorithms",
    items: [
      {
        kind: "lesson",
        slug: "big-o",
        title: "Big-O without the maths",
        minutes: 5,
        summary: "How to tell whether your solution will time out before the hidden tests do.",
        sections: [
          {
            paragraphs: [
              "Big-O counts how the work grows with the input. One loop over n items is O(n). A loop inside a loop is O(n²). Halving the search space each step is O(log n).",
            ],
            points: [
              "n up to 10⁵ or 10⁶: aim for O(n) or O(n log n).",
              "n up to a few thousand: O(n²) is usually fine.",
              "n under 20: exponential search can pass.",
            ],
          },
          {
            heading: "The usual upgrade",
            paragraphs: [
              "When the statement says 'aim for linear time', the fix is almost always a hash map, two pointers or a stack instead of a nested loop.",
            ],
          },
        ],
      },
      {
        kind: "lesson",
        slug: "two-pointers",
        title: "Two pointers and sliding windows",
        minutes: 7,
        summary: "Walk two indices through an array instead of trying every pair.",
        sections: [
          {
            paragraphs: [
              "A sliding window keeps a start and an end index. Move the end forward to grow the window; move the start forward when the window breaks a rule. Each index moves at most n times, so the whole pass is O(n).",
            ],
            code: "// Longest run with at most k distinct values\nlet start = 0;\nfor (let end = 0; end < values.length; end++) {\n  add(values[end]);\n  while (distinct() > k) remove(values[start++]);\n  best = Math.max(best, end - start + 1);\n}",
          },
        ],
      },
      {
        kind: "lesson",
        slug: "stacks",
        title: "Stacks for anything that nests",
        minutes: 5,
        summary: "Brackets, undo, 'next greater' and expression evaluation are all stack problems.",
        sections: [
          {
            paragraphs: [
              "A stack remembers the most recent unfinished thing. When something closes, it must match the top of the stack. In JavaScript, an array with push and pop is a stack.",
            ],
            code: "const stack = [];\nfor (const ch of text) {\n  if (ch === '(') stack.push(ch);\n  else if (ch === ')' && stack.pop() !== '(') return false;\n}\nreturn stack.length === 0;",
          },
          {
            heading: "Monotonic stacks",
            paragraphs: [
              "Keep indices on the stack in decreasing order of value. When a bigger value arrives, pop everything smaller: you have just found their next greater element. Each index is pushed and popped once, so it is O(n).",
            ],
          },
        ],
      },
      {
        kind: "lesson",
        slug: "dynamic-programming",
        title: "Dynamic programming: remember, don't recompute",
        minutes: 8,
        summary: "Write the recurrence, then store answers to sub-problems in a table.",
        sections: [
          {
            paragraphs: [
              "Dynamic programming is recursion plus memory. First write the answer for n in terms of smaller answers. Then fill a table from the smallest case up, so each sub-problem is solved once.",
            ],
            code: "// ways(n) = ways(n - 1) + ways(n - 2)\nconst ways = [1, 1];\nfor (let i = 2; i <= n; i++) ways[i] = ways[i - 1] + ways[i - 2];",
          },
          {
            heading: "Three questions to ask",
            paragraphs: [],
            points: [
              "What is the state? (an index, an amount, two indices)",
              "What is the transition? (which smaller states feed this one)",
              "What are the base cases? (n = 0, empty string, amount 0)",
            ],
          },
        ],
      },
      {
        kind: "practice",
        slug: "binary-search",
        title: "Binary search",
        difficulty: "EASY",
        summary: "Find a value in a sorted array in O(log n).",
        hint: "Keep low and high bounds; compare the middle and discard half each time.",
        explanation: "Loop while low <= high, compute mid = (low + high) >> 1, and move low or high past mid. Off-by-one errors are the main risk; test a one-item array.",
        problem: codeProblem({
          id: "lp-al-bsearch",
          title: "Binary search",
          difficulty: "EASY",
          statement: "Return the index of target in a sorted array of distinct integers, or -1 if it is absent.\n\nArguments:\n- sorted: an ascending array of distinct integers.\n- target: an integer.\n\nReturn an integer.",
          functionName: "binarySearch",
          starterCode: "function binarySearch(sorted, target) {\n  \n}\n",
          tests: [[[[1, 3, 5, 7, 9], 7], 3], [[[1, 3, 5], 4], -1], [[[], 1], -1], [[[2], 2], 0], [[[-5, 0, 5], -5], 0]],
        }),
      },
      {
        kind: "practice",
        slug: "anagram",
        title: "Valid anagram",
        difficulty: "EASY",
        summary: "Compare letter counts.",
        hint: "Count letters of the first string up and the second string down.",
        explanation: "A count map is O(n). Sorting both strings and comparing also works in O(n log n).",
        problem: codeProblem({
          id: "lp-al-anagram",
          title: "Valid anagram",
          difficulty: "EASY",
          statement: "Return true if right is a rearrangement of exactly the same characters as left. Case matters.\n\nArguments:\n- left: a string.\n- right: a string.\n\nReturn a boolean.",
          functionName: "isAnagram",
          starterCode: "function isAnagram(left, right) {\n  \n}\n",
          tests: [[["listen", "silent"], true], [["rat", "car"], false], [["", ""], true], [["aab", "abb"], false], [["Ab", "ab"], false]],
        }),
      },
      {
        kind: "practice",
        slug: "max-subarray",
        title: "Maximum subarray",
        difficulty: "MEDIUM",
        summary: "Kadane's algorithm in one pass.",
        hint: "At each index, either extend the previous run or start fresh here.",
        explanation: "Kadane: current = max(value, current + value); best = max(best, current). Initialise both with the first value so an all-negative array works.",
        problem: codeProblem({
          id: "lp-al-kadane",
          title: "Maximum subarray",
          difficulty: "MEDIUM",
          statement: "Return the largest sum of any non-empty contiguous subarray.\n\nArguments:\n- values: a non-empty array of integers.\n\nReturn an integer.",
          functionName: "maxSubarray",
          starterCode: "function maxSubarray(values) {\n  \n}\n",
          tests: [[[[-2, 1, -3, 4, -1, 2, 1, -5, 4]], 6], [[[-3, -1, -2]], -1], [[[5]], 5], [[[2, -1, 2]], 3]],
        }),
      },
      {
        kind: "practice",
        slug: "binary-search-complexity",
        title: "Binary search complexity",
        difficulty: "EASY",
        summary: "One question on growth rates.",
        explanation: "Each step halves the remaining range, so a million items need about 20 comparisons: O(log n).",
        problem: choiceProblem("lp-al-logn", "Binary search complexity", "EASY", "What is the worst-case time complexity of binary search on a sorted array of n items?", ["O(1)", "O(log n)", "O(n)", "O(n log n)"], 1),
      },
    ],
  },
  {
    slug: "quant",
    title: "Quant foundations",
    blurb: "Expected value, Bayes, volatility and the mental maths that timed quant tests expect.",
    prepares: "Quant",
    items: [
      {
        kind: "lesson",
        slug: "expected-value",
        title: "Expected value: the idea behind every trading question",
        minutes: 6,
        summary: "Weight each outcome by its probability and add them up.",
        sections: [
          {
            paragraphs: [
              "The expected value of a bet is Σ probability × payoff. A fair die pays (1+2+3+4+5+6)/6 = 3.5 on average. Quant interviews use EV to ask: would you take this bet, and at what price?",
            ],
          },
          {
            heading: "Linearity is your shortcut",
            paragraphs: [
              "E[X + Y] = E[X] + E[Y] even when X and Y depend on each other. The expected sum of two dice is 3.5 + 3.5 = 7, with no table needed.",
            ],
          },
          {
            heading: "Options to stop are worth something",
            paragraphs: [
              "If you may reroll a die once, reroll whenever the first roll is below the EV of a fresh roll (3.5). Keeping 4, 5 or 6 and rerolling 1, 2 or 3 gives 0.5 × 5 + 0.5 × 3.5 = 4.25.",
            ],
          },
        ],
      },
      {
        kind: "lesson",
        slug: "bayes",
        title: "Conditional probability and Bayes",
        minutes: 7,
        summary: "Update a belief with evidence, and avoid the base-rate trap.",
        sections: [
          {
            paragraphs: [
              "P(A | B) = P(B | A) × P(A) / P(B). The denominator is every way B can happen: P(B) = P(B | A)P(A) + P(B | not A)P(not A).",
            ],
          },
          {
            heading: "Count people, not percentages",
            paragraphs: [
              "Imagine 10,000 people. With 1% prevalence, 100 are sick and 99 test positive. Of the 9,900 healthy people, 5% (495) also test positive. A positive result means sick with probability 99 / (99 + 495) ≈ 16.7%.",
            ],
          },
        ],
      },
      {
        kind: "lesson",
        slug: "volatility",
        title: "Variance, volatility and the square-root rule",
        minutes: 6,
        summary: "Why risk scales with √time and why diversification works.",
        sections: [
          {
            paragraphs: [
              "Variances of independent returns add, so over T periods the variance is T × σ² and the volatility is σ√T. Annual 20% volatility over 252 trading days is 20% / √252 ≈ 1.26% a day.",
            ],
          },
          {
            heading: "Two assets",
            paragraphs: [
              "Var(wA·A + wB·B) = wA²σA² + wB²σB² + 2·wA·wB·ρ·σA·σB. With 50/50 weights, equal 10% volatility and zero correlation, the portfolio volatility is √(0.25·100 + 0.25·100) ≈ 7.07%.",
            ],
          },
          {
            heading: "Sharpe ratio",
            paragraphs: ["(return − risk-free rate) / volatility. 12% return, 2% risk-free and 20% volatility give 0.5."],
          },
        ],
      },
      {
        kind: "lesson",
        slug: "mental-math",
        title: "Mental maths for timed tests",
        minutes: 5,
        summary: "Five tricks that save seconds on every arithmetic question.",
        sections: [
          {
            paragraphs: [],
            points: [
              "Difference of squares: 48 × 52 = 50² − 2² = 2496.",
              "Near round numbers: 999 × 7 = 7000 − 7.",
              "Split percentages: 15% = 10% + 5%.",
              "Know your sixteenths: 1/16 = 0.0625, so 7/16 = 0.4375.",
              "Up then down is never flat: +10% then −10% is 1.1 × 0.9 = 0.99, a 1% loss.",
            ],
          },
        ],
      },
      {
        kind: "practice",
        slug: "bayes-test",
        title: "A positive test",
        difficulty: "MEDIUM",
        summary: "Bayes with a low base rate.",
        hint: "Imagine 10,000 people and count the true and false positives.",
        explanation: "True positives 0.01 × 0.99 = 0.0099; false positives 0.99 × 0.05 = 0.0495. P(sick | positive) = 0.0099 / 0.0594 ≈ 0.167.",
        problem: numericProblem(
          "lp-q-bayes",
          "A positive test",
          "MEDIUM",
          "A disease affects 1% of people. A test detects it 99% of the time and gives a false positive 5% of the time. You test positive. What is the probability you have the disease? Answer as a decimal to two places or more.",
          0.0099 / 0.0594,
          0.005,
        ),
      },
      {
        kind: "practice",
        slug: "game-ev",
        title: "Should you play?",
        difficulty: "EASY",
        summary: "Expected value of a simple bet.",
        explanation: "0.3 × 10 − 0.7 × 4 = 3 − 2.8 = 0.2 euros per play. Positive, so in the long run you would take it.",
        problem: numericProblem(
          "lp-q-game",
          "Should you play?",
          "EASY",
          "A game pays €10 with probability 0.3; otherwise you lose €4. What is the expected value of one play, in euros?",
          0.2,
          0.001,
        ),
      },
      {
        kind: "practice",
        slug: "difference-of-squares",
        title: "Quick product",
        difficulty: "EASY",
        summary: "Mental maths with a pattern.",
        explanation: "48 × 52 = (50 − 2)(50 + 2) = 2500 − 4 = 2496.",
        problem: numericProblem("lp-q-squares", "Quick product", "EASY", "Without a calculator: what is 48 × 52?", 2496),
      },
      {
        kind: "practice",
        slug: "cumulative-return",
        title: "Compound the returns",
        difficulty: "EASY",
        summary: "Code: chain period returns.",
        hint: "Multiply (1 + r) for every period, subtract 1, then round.",
        explanation: "Returns compound multiplicatively, so +10% then −10% is 1.1 × 0.9 − 1 = −1%, not 0%.",
        problem: codeProblem({
          id: "lp-q-cumret",
          title: "Compound the returns",
          difficulty: "EASY",
          statement: "Given period returns as decimals (0.1 means +10%), return the total compounded return, rounded to four decimals with Math.round(value * 10000) / 10000. An empty list returns 0.\n\nArguments:\n- returns: an array of numbers.\n\nReturn a number.",
          functionName: "cumulativeReturn",
          starterCode: "function cumulativeReturn(returns) {\n  \n}\n",
          tests: [[[[0.1, -0.1]], -0.01], [[[]], 0], [[[0.5]], 0.5], [[[0.1, 0.1, 0.1]], 0.331]],
        }),
      },
      {
        kind: "practice",
        slug: "correlation",
        title: "Diversification",
        difficulty: "MEDIUM",
        summary: "Which correlation helps most?",
        explanation: "The cross term 2·w·w·ρ·σ·σ is smallest when ρ is most negative, so ρ = −1 gives the lowest portfolio volatility (zero, for equal weights and volatilities).",
        problem: choiceProblem(
          "lp-q-corr",
          "Diversification",
          "MEDIUM",
          "Two assets have the same volatility and you hold them 50/50. Which correlation gives the lowest portfolio volatility?",
          ["+1", "+0.5", "0", "−1"],
          3,
        ),
      },
    ],
  },
  {
    slug: "strategy",
    title: "OA strategy",
    blurb: "How timed, proctored and lockdown tests work here, and how to make your one sitting count.",
    prepares: null,
    items: [
      {
        kind: "lesson",
        slug: "timed-tests",
        title: "How to take a timed online assessment",
        minutes: 4,
        summary: "Budget the clock, bank easy marks, and never leave a question blank.",
        sections: [
          {
            paragraphs: [
              "Every question here carries equal weight, so a quick multiple-choice question is worth as much as a long coding problem. Skim them all first and answer the fast ones.",
            ],
            points: [
              "Divide the time by the number of questions and set yourself a checkpoint.",
              "Run the sample cases early: a wrong function name scores zero.",
              "At five minutes left the timer turns red. Fill every blank with your best guess.",
              "At zero, your current answers submit automatically.",
            ],
          },
        ],
      },
      {
        kind: "lesson",
        slug: "proctoring",
        title: "Proctored and lockdown tests: what is recorded",
        minutes: 3,
        summary: "Exactly which browser events are logged, and what employers see.",
        sections: [
          {
            heading: "Proctored",
            paragraphs: [
              "We log when you leave the test tab, when the window loses focus and when you try to paste, each with a time. Nothing is blocked.",
            ],
          },
          {
            heading: "Browser lockdown",
            paragraphs: [
              "The test runs in fullscreen. Copy, cut, paste, drag-and-drop and the right-click menu are disabled. Leaving fullscreen or the tab pauses the questions and counts as a warning; the third warning submits your answers.",
            ],
          },
          {
            heading: "What is never recorded",
            paragraphs: [
              "No camera, microphone, screen recording, keystrokes or other tabs' content. Employers see a one-line summary such as 'Lockdown · 18 of 25 min · no events flagged'. It is context for a human, never an automatic rejection.",
            ],
          },
        ],
      },
      {
        kind: "lesson",
        slug: "read-like-a-tester",
        title: "Read the statement like a tester",
        minutes: 4,
        summary: "Hidden tests are mostly edge cases the statement already told you about.",
        sections: [
          {
            paragraphs: ["Before writing code, list the inputs the statement mentions and write one sample for each."],
            points: [
              "Empty input: [], \"\", 0.",
              "One item, and all items equal.",
              "Negative numbers and zero.",
              "Ties, and the rule that breaks them.",
              "'Do not mutate the input': copy before sorting.",
            ],
          },
        ],
      },
    ],
  },
];

export function findTrack(slug: string) {
  return TRACKS.find((track) => track.slug === slug) ?? null;
}

export function findItem(trackSlug: string, itemSlug: string) {
  const track = findTrack(trackSlug);
  const item = track?.items.find((entry) => entry.slug === itemSlug) ?? null;
  return track && item ? { track, item } : null;
}

export function findPracticeByProblemId(problemId: string): Practice | null {
  for (const track of TRACKS) {
    for (const item of track.items) {
      if (item.kind === "practice" && item.problem.id === problemId) return item;
    }
  }
  return null;
}

export function itemKey(trackSlug: string, itemSlug: string) {
  return trackSlug + "/" + itemSlug;
}
