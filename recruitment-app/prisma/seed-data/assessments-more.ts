import type { SeedAssessment } from "./types";

/**
 * The expanded catalogue: more JavaScript and algorithms sittings plus a
 * quantitative track. Timed sittings show a countdown and submit at zero.
 * PROCTORED sittings log browser events for the reviewer; LOCKDOWN sittings
 * also require fullscreen and block copy/paste. No camera is used.
 */
export const moreAssessments: SeedAssessment[] = [
  {
    slug: "javascript-v1-strings",
    title: "JavaScript - Strings and parsing",
    roleFamily: "Software engineering",
    family: "JavaScript",
    version: "v1",
    difficulty: "MEDIUM",
    description:
      "Three JavaScript problems on cleaning, compressing and parsing text. 45 minutes. Marked against hidden tests.",
    playable: true,
    order: 6,
    durationMinutes: 45,
    proctoring: "NONE",
    topics: ["Strings", "Parsing", "Regex"],
    problems: [
      {
        id: "js1-s1",
        title: "Readable palindrome",
        difficulty: "EASY",
        statement:
          "Return true if the text reads the same forwards and backwards after you lower-case it and remove every character that is not a letter a-z or a digit 0-9. An empty result counts as a palindrome.\n\nArguments:\n- text: a string.\n\nReturn a boolean.",
        functionName: "isPalindrome",
        starterCode: "function isPalindrome(text) {\n  // Ignore case and anything that is not a-z or 0-9.\n}\n",
        solution:
          "function isPalindrome(text) {\n  const clean = text.toLowerCase().replace(/[^a-z0-9]/g, '');\n  return clean === clean.split('').reverse().join('');\n}\n",
        testCases: [
          { id: "js1-s1-t1", args: ["A man, a plan, a canal: Panama"], expected: true, hidden: false },
          { id: "js1-s1-t2", args: ["race a car"], expected: false },
          { id: "js1-s1-t3", args: [""], expected: true },
          { id: "js1-s1-t4", args: ["No 'x' in Nixon"], expected: true },
          { id: "js1-s1-t5", args: ["12a21"], expected: true },
        ],
      },
      {
        id: "js1-s2",
        title: "Run-length encoding",
        difficulty: "EASY",
        statement:
          "Compress a string by replacing each run of the same character with the character followed by the run length. Single characters still get a count of 1. The empty string returns an empty string.\n\nExample: \"aaabcc\" becomes \"a3b1c2\".\n\nArguments:\n- text: a string.\n\nReturn a string.",
        functionName: "runLength",
        starterCode: "function runLength(text) {\n  // \"aaabcc\" -> \"a3b1c2\"\n}\n",
        solution:
          "function runLength(text) {\n  let out = '';\n  for (let i = 0; i < text.length; ) {\n    let j = i;\n    while (j < text.length && text[j] === text[i]) j += 1;\n    out += text[i] + (j - i);\n    i = j;\n  }\n  return out;\n}\n",
        testCases: [
          { id: "js1-s2-t1", args: ["aaabcc"], expected: "a3b1c2", hidden: false },
          { id: "js1-s2-t2", args: [""], expected: "" },
          { id: "js1-s2-t3", args: ["abc"], expected: "a1b1c1" },
          { id: "js1-s2-t4", args: ["zzzzzzzzzzzz"], expected: "z12" },
          { id: "js1-s2-t5", args: ["aabbaa"], expected: "a2b2a2" },
        ],
      },
      {
        id: "js1-s3",
        title: "Parse a query string",
        difficulty: "MEDIUM",
        statement:
          "Parse a URL query string into an object. Ignore one leading \"?\". Pairs are separated by \"&\"; skip empty pairs. A key without \"=\" maps to an empty string. Replace \"+\" with a space, then decode keys and values with decodeURIComponent. If a key repeats, the last value wins.\n\nArguments:\n- query: a string.\n\nReturn an object of string keys to string values.",
        functionName: "parseQuery",
        starterCode: "function parseQuery(query) {\n  // \"?a=1&b=two\" -> { a: \"1\", b: \"two\" }\n}\n",
        solution:
          "function parseQuery(query) {\n  const out = {};\n  const body = query.startsWith('?') ? query.slice(1) : query;\n  for (const pair of body.split('&')) {\n    if (!pair) continue;\n    const at = pair.indexOf('=');\n    const rawKey = at === -1 ? pair : pair.slice(0, at);\n    const rawValue = at === -1 ? '' : pair.slice(at + 1);\n    const decode = (value) => decodeURIComponent(value.replace(/\\+/g, ' '));\n    out[decode(rawKey)] = decode(rawValue);\n  }\n  return out;\n}\n",
        testCases: [
          { id: "js1-s3-t1", args: ["?a=1&b=two"], expected: { a: "1", b: "two" }, hidden: false },
          { id: "js1-s3-t2", args: [""], expected: {} },
          { id: "js1-s3-t3", args: ["name=Aino+V&city=Espoo"], expected: { name: "Aino V", city: "Espoo" } },
          { id: "js1-s3-t4", args: ["flag&x=1&&x=2"], expected: { flag: "", x: "2" } },
          { id: "js1-s3-t5", args: ["q=caf%C3%A9%20au%20lait"], expected: { q: "café au lait" } },
        ],
      },
    ],
  },
  {
    slug: "algorithms-v1-stacks",
    title: "Algorithms - Stacks and queues",
    roleFamily: "Software engineering",
    family: "Algorithms",
    version: "v1",
    difficulty: "MEDIUM",
    description:
      "Three problems that reward a stack. 40 minutes, proctored: tab switches and focus loss are logged for the reviewer.",
    playable: true,
    order: 7,
    durationMinutes: 40,
    proctoring: "PROCTORED",
    topics: ["Stacks", "Monotonic stack", "Parsing"],
    problems: [
      {
        id: "al1-s1",
        title: "Balanced brackets",
        difficulty: "EASY",
        statement:
          "Return true if every bracket in the text is closed by the matching bracket in the right order. Only (), [] and {} count; ignore every other character.\n\nArguments:\n- text: a string.\n\nReturn a boolean.",
        functionName: "isBalanced",
        starterCode: "function isBalanced(text) {\n  // (), [] and {} must nest correctly.\n}\n",
        solution:
          "function isBalanced(text) {\n  const pairs = { ')': '(', ']': '[', '}': '{' };\n  const stack = [];\n  for (const ch of text) {\n    if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);\n    else if (pairs[ch]) {\n      if (stack.pop() !== pairs[ch]) return false;\n    }\n  }\n  return stack.length === 0;\n}\n",
        testCases: [
          { id: "al1-s1-t1", args: ["([]{})"], expected: true, hidden: false },
          { id: "al1-s1-t2", args: ["([)]"], expected: false },
          { id: "al1-s1-t3", args: [""], expected: true },
          { id: "al1-s1-t4", args: ["f(x[0]) + {y}"], expected: true },
          { id: "al1-s1-t5", args: ["(("], expected: false },
        ],
      },
      {
        id: "al1-s2",
        title: "Next greater value",
        difficulty: "MEDIUM",
        statement:
          "For each value, find the first value to its right that is strictly greater. Use -1 when there is none.\n\nExample: [2, 1, 3] returns [3, 3, -1].\n\nArguments:\n- values: an array of integers.\n\nReturn an array of integers the same length. Aim for linear time.",
        functionName: "nextGreater",
        starterCode: "function nextGreater(values) {\n  // [2, 1, 3] -> [3, 3, -1]\n}\n",
        solution:
          "function nextGreater(values) {\n  const out = values.map(() => -1);\n  const stack = [];\n  for (let i = 0; i < values.length; i += 1) {\n    while (stack.length && values[stack[stack.length - 1]] < values[i]) out[stack.pop()] = values[i];\n    stack.push(i);\n  }\n  return out;\n}\n",
        testCases: [
          { id: "al1-s2-t1", args: [[2, 1, 3]], expected: [3, 3, -1], hidden: false },
          { id: "al1-s2-t2", args: [[]], expected: [] },
          { id: "al1-s2-t3", args: [[5, 4, 3]], expected: [-1, -1, -1] },
          { id: "al1-s2-t4", args: [[1, 3, 2, 4]], expected: [3, 4, 4, -1] },
          { id: "al1-s2-t5", args: [[2, 2, 3]], expected: [3, 3, -1] },
        ],
      },
      {
        id: "al1-s3",
        title: "Reverse Polish calculator",
        difficulty: "MEDIUM",
        statement:
          "Evaluate an expression in Reverse Polish notation. Tokens are integers or one of + - * /. Division truncates toward zero. The input is always valid.\n\nExample: [\"2\", \"1\", \"+\", \"3\", \"*\"] is (2 + 1) * 3 = 9.\n\nArguments:\n- tokens: an array of strings.\n\nReturn an integer.",
        functionName: "evalRpn",
        starterCode: "function evalRpn(tokens) {\n  // [\"2\", \"1\", \"+\", \"3\", \"*\"] -> 9\n}\n",
        solution:
          "function evalRpn(tokens) {\n  const stack = [];\n  for (const token of tokens) {\n    if (['+', '-', '*', '/'].includes(token)) {\n      const b = stack.pop();\n      const a = stack.pop();\n      if (token === '+') stack.push(a + b);\n      else if (token === '-') stack.push(a - b);\n      else if (token === '*') stack.push(a * b);\n      else stack.push(Math.trunc(a / b));\n    } else stack.push(Number(token));\n  }\n  return stack[0];\n}\n",
        testCases: [
          { id: "al1-s3-t1", args: [["2", "1", "+", "3", "*"]], expected: 9, hidden: false },
          { id: "al1-s3-t2", args: [["4", "13", "5", "/", "+"]], expected: 6 },
          { id: "al1-s3-t3", args: [["7"]], expected: 7 },
          { id: "al1-s3-t4", args: [["-7", "2", "/"]], expected: -3 },
          { id: "al1-s3-t5", args: [["3", "4", "-", "5", "*"]], expected: -5 },
        ],
      },
    ],
  },
  {
    slug: "algorithms-v1-dp",
    title: "Algorithms - Dynamic programming",
    roleFamily: "Data / ML",
    family: "Algorithms",
    version: "v1",
    difficulty: "ADVANCED",
    description:
      "Three dynamic-programming problems from counting to sequences. 60 minutes, proctored. Marked against hidden tests.",
    playable: true,
    order: 8,
    durationMinutes: 60,
    proctoring: "PROCTORED",
    topics: ["Dynamic programming", "Memoisation"],
    problems: [
      {
        id: "al1-d1",
        title: "Climbing stairs",
        difficulty: "EASY",
        statement:
          "You can climb 1 or 2 steps at a time. Return the number of distinct ways to climb exactly n steps. n = 0 has one way: do nothing.\n\nArguments:\n- n: an integer from 0 to 60.\n\nReturn an integer.",
        functionName: "countWays",
        starterCode: "function countWays(n) {\n  // Ways to climb n steps with 1- or 2-step moves.\n}\n",
        solution:
          "function countWays(n) {\n  let a = 1;\n  let b = 1;\n  for (let i = 2; i <= n; i += 1) [a, b] = [b, a + b];\n  return n === 0 ? 1 : b;\n}\n",
        testCases: [
          { id: "al1-d1-t1", args: [3], expected: 3, hidden: false },
          { id: "al1-d1-t2", args: [0], expected: 1 },
          { id: "al1-d1-t3", args: [1], expected: 1 },
          { id: "al1-d1-t4", args: [10], expected: 89 },
          { id: "al1-d1-t5", args: [45], expected: 1836311903 },
        ],
      },
      {
        id: "al1-d2",
        title: "Fewest coins",
        difficulty: "MEDIUM",
        statement:
          "Given coin values and a target amount, return the fewest coins that add up to the amount. You have unlimited coins of each value. Return -1 if the amount cannot be made. Amount 0 needs 0 coins.\n\nArguments:\n- coins: an array of positive integers.\n- amount: an integer from 0 to 10000.\n\nReturn an integer.",
        functionName: "minCoins",
        starterCode: "function minCoins(coins, amount) {\n  // Fewest coins to make amount, or -1.\n}\n",
        solution:
          "function minCoins(coins, amount) {\n  const best = new Array(amount + 1).fill(Infinity);\n  best[0] = 0;\n  for (let total = 1; total <= amount; total += 1) {\n    for (const coin of coins) {\n      if (coin <= total && best[total - coin] + 1 < best[total]) best[total] = best[total - coin] + 1;\n    }\n  }\n  return best[amount] === Infinity ? -1 : best[amount];\n}\n",
        testCases: [
          { id: "al1-d2-t1", args: [[1, 2, 5], 11], expected: 3, hidden: false },
          { id: "al1-d2-t2", args: [[2], 3], expected: -1 },
          { id: "al1-d2-t3", args: [[1], 0], expected: 0 },
          { id: "al1-d2-t4", args: [[1, 3, 4], 6], expected: 2 },
          { id: "al1-d2-t5", args: [[5, 10, 25], 9990], expected: 401 },
        ],
      },
      {
        id: "al1-d3",
        title: "Longest common subsequence",
        difficulty: "ADVANCED",
        statement:
          "Return the length of the longest subsequence that appears in both strings. A subsequence keeps the order of characters but may skip some.\n\nArguments:\n- left: a string up to 1000 characters.\n- right: a string up to 1000 characters.\n\nReturn an integer.",
        functionName: "lcsLength",
        starterCode: "function lcsLength(left, right) {\n  // \"abcde\", \"ace\" -> 3\n}\n",
        solution:
          "function lcsLength(left, right) {\n  let prev = new Array(right.length + 1).fill(0);\n  for (let i = 1; i <= left.length; i += 1) {\n    const row = new Array(right.length + 1).fill(0);\n    for (let j = 1; j <= right.length; j += 1) {\n      row[j] = left[i - 1] === right[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], row[j - 1]);\n    }\n    prev = row;\n  }\n  return prev[right.length];\n}\n",
        testCases: [
          { id: "al1-d3-t1", args: ["abcde", "ace"], expected: 3, hidden: false },
          { id: "al1-d3-t2", args: ["abc", "def"], expected: 0 },
          { id: "al1-d3-t3", args: ["", "abc"], expected: 0 },
          { id: "al1-d3-t4", args: ["AGGTAB", "GXTXAYB"], expected: 4 },
          { id: "al1-d3-t5", args: ["espoo", "helsinki"], expected: 2 },
        ],
      },
    ],
  },
  {
    slug: "quant-v1-mental-math",
    title: "Quant - Mental arithmetic",
    roleFamily: "Quantitative finance",
    family: "Quant",
    version: "v1",
    difficulty: "EASY",
    description:
      "Eight quick arithmetic questions, no calculator. 8 minutes in browser lockdown: fullscreen required, copy and paste blocked.",
    playable: true,
    order: 9,
    durationMinutes: 8,
    proctoring: "LOCKDOWN",
    topics: ["Mental math", "Percentages", "Fractions"],
    problems: [
      { kind: "numeric", id: "qm1-1", title: "Two-digit product", difficulty: "EASY", statement: "What is 47 × 23?", answer: 1081 },
      { kind: "numeric", id: "qm1-2", title: "Percentage", difficulty: "EASY", statement: "What is 15% of 640?", answer: 96 },
      { kind: "numeric", id: "qm1-3", title: "Fraction to decimal", difficulty: "EASY", statement: "Write 7/16 as a decimal.", answer: 0.4375 },
      { kind: "numeric", id: "qm1-4", title: "Decimal product", difficulty: "EASY", statement: "What is 3.6 × 2.5?", answer: 9 },
      { kind: "numeric", id: "qm1-5", title: "Near a round number", difficulty: "EASY", statement: "What is 999 × 7?", answer: 6993 },
      { kind: "numeric", id: "qm1-6", title: "Power of two", difficulty: "EASY", statement: "What is 2 to the power 12?", answer: 4096 },
      {
        kind: "numeric",
        id: "qm1-7",
        title: "Compound move",
        difficulty: "MEDIUM",
        statement: "A price rises 10% and then falls 10%. What is the net change in percent? Answer as a number, for example -2 for a 2% fall.",
        answer: -1,
      },
      { kind: "numeric", id: "qm1-8", title: "Square", difficulty: "EASY", statement: "What is 65 squared?", answer: 4225 },
    ],
  },
  {
    slug: "quant-v1-probability",
    title: "Quant - Probability and expected value",
    roleFamily: "Quantitative finance",
    family: "Quant",
    version: "v1",
    difficulty: "MEDIUM",
    description:
      "Eight probability and expected-value questions, multiple choice and numeric. 25 minutes in browser lockdown.",
    playable: true,
    order: 10,
    durationMinutes: 25,
    proctoring: "LOCKDOWN",
    topics: ["Probability", "Expected value", "Combinatorics"],
    problems: [
      {
        kind: "numeric",
        id: "qp1-1",
        title: "Two dice",
        difficulty: "EASY",
        statement: "Two fair six-sided dice are rolled. What is the probability that the sum is 7? Answer as a decimal or a fraction.",
        answer: 1 / 6,
        tolerance: 0.001,
      },
      {
        kind: "numeric",
        id: "qp1-2",
        title: "At least one head",
        difficulty: "EASY",
        statement: "Three fair coins are flipped. What is the probability of at least one head?",
        answer: 0.875,
        tolerance: 0.001,
      },
      {
        kind: "choice",
        id: "qp1-3",
        title: "Three doors",
        difficulty: "MEDIUM",
        statement:
          "A prize is behind one of three doors. You pick door 1. The host, who knows where the prize is, opens a different door with no prize and offers a switch. If you always switch, what is your chance of winning?",
        options: ["1/3", "1/2", "2/3", "3/4"],
        answer: 2,
      },
      {
        kind: "numeric",
        id: "qp1-4",
        title: "Two aces",
        difficulty: "MEDIUM",
        statement:
          "Two cards are drawn from a shuffled 52-card deck without replacement. What is the probability both are aces? Answer to at least four decimal places or as a fraction.",
        answer: 1 / 221,
        tolerance: 0.0001,
      },
      {
        kind: "numeric",
        id: "qp1-5",
        title: "Waiting for a head",
        difficulty: "EASY",
        statement: "You flip a fair coin until the first head. What is the expected number of flips, including the head?",
        answer: 2,
      },
      {
        kind: "choice",
        id: "qp1-6",
        title: "One reroll",
        difficulty: "MEDIUM",
        statement:
          "You roll a fair die and are paid its face value in euros. After seeing the first roll you may reroll once, but then you must take the second roll. With the best strategy, what is the expected payout?",
        options: ["€3.50", "€4.00", "€4.25", "€4.50"],
        answer: 2,
      },
      {
        kind: "numeric",
        id: "qp1-7",
        title: "One of each",
        difficulty: "MEDIUM",
        statement: "A bag holds 3 red and 2 blue balls. Two are drawn without replacement. What is the probability of one red and one blue?",
        answer: 0.6,
        tolerance: 0.001,
      },
      {
        kind: "choice",
        id: "qp1-8",
        title: "Shared birthdays",
        difficulty: "EASY",
        statement:
          "In a room of 23 people with birthdays spread evenly over 365 days, roughly how likely is it that at least two share a birthday?",
        options: ["About 10%", "About 25%", "About 50%", "About 90%"],
        answer: 2,
      },
    ],
  },
  {
    slug: "quant-v1-statistics",
    title: "Quant - Statistics and markets",
    roleFamily: "Quantitative finance",
    family: "Quant",
    version: "v1",
    difficulty: "ADVANCED",
    description:
      "Eight questions on variance, correlation, volatility and pricing identities. 30 minutes in browser lockdown.",
    playable: true,
    order: 11,
    durationMinutes: 30,
    proctoring: "LOCKDOWN",
    topics: ["Variance", "Volatility", "Options", "Sharpe ratio"],
    problems: [
      {
        kind: "numeric",
        id: "qs1-1",
        title: "Variance of a die",
        difficulty: "MEDIUM",
        statement: "What is the variance of one roll of a fair six-sided die? Answer to three decimal places or as a fraction.",
        answer: 35 / 12,
        tolerance: 0.001,
      },
      {
        kind: "numeric",
        id: "qs1-2",
        title: "Linear combination",
        difficulty: "MEDIUM",
        statement: "X and Y are independent with Var(X) = 4 and Var(Y) = 9. What is Var(2X − Y)?",
        answer: 25,
      },
      {
        kind: "choice",
        id: "qs1-3",
        title: "Perfect correlation",
        difficulty: "EASY",
        statement: "X has positive variance and Y = −2X + 3. What is the correlation between X and Y?",
        options: ["−1", "−0.5", "0", "1"],
        answer: 0,
      },
      {
        kind: "numeric",
        id: "qs1-4",
        title: "Daily volatility",
        difficulty: "MEDIUM",
        statement:
          "A stock has 20% annualised volatility. Using 252 trading days and the square-root-of-time rule, what is its daily volatility in percent? Two decimal places.",
        answer: 20 / Math.sqrt(252),
        tolerance: 0.01,
      },
      {
        kind: "numeric",
        id: "qs1-5",
        title: "Two-asset portfolio",
        difficulty: "ADVANCED",
        statement:
          "A portfolio is 50% in asset A and 50% in asset B. Each has 10% volatility and their correlation is 0. What is the portfolio volatility in percent? Two decimal places.",
        answer: Math.sqrt(50),
        tolerance: 0.01,
      },
      {
        kind: "choice",
        id: "qs1-6",
        title: "Put-call parity",
        difficulty: "MEDIUM",
        statement:
          "For European options on a non-dividend stock with price S, strike K, rate r and maturity T, what does C − P equal?",
        options: ["S − K·e^(−rT)", "K − S", "S + K·e^(−rT)", "K·e^(rT) − S"],
        answer: 0,
      },
      {
        kind: "numeric",
        id: "qs1-7",
        title: "Sharpe ratio",
        difficulty: "EASY",
        statement: "A strategy returns 12% a year with 20% volatility. The risk-free rate is 2%. What is its Sharpe ratio?",
        answer: 0.5,
        tolerance: 0.001,
      },
      {
        kind: "choice",
        id: "qs1-8",
        title: "Standard error",
        difficulty: "EASY",
        statement: "You average n independent draws, each with standard deviation σ. What is the standard deviation of the average?",
        options: ["σ / n", "σ / √n", "σ · √n", "σ² / n"],
        answer: 1,
      },
    ],
  },
  {
    slug: "quant-v1-coding",
    title: "Quant - Coding for markets",
    roleFamily: "Quantitative finance",
    family: "Quant",
    version: "v1",
    difficulty: "MEDIUM",
    description:
      "Four JavaScript problems on price series: best trade, moving average, VWAP and drawdown. 45 minutes, proctored.",
    playable: true,
    order: 12,
    durationMinutes: 45,
    proctoring: "PROCTORED",
    topics: ["Time series", "Arrays", "Market data"],
    problems: [
      {
        id: "qc1-1",
        title: "Best single trade",
        difficulty: "EASY",
        statement:
          "Given daily prices, return the largest profit from buying on one day and selling on a later day. Return 0 if no trade makes money.\n\nArguments:\n- prices: an array of positive integers.\n\nReturn an integer.",
        functionName: "maxProfit",
        starterCode: "function maxProfit(prices) {\n  // Buy once, sell once, later.\n}\n",
        solution:
          "function maxProfit(prices) {\n  let low = Infinity;\n  let best = 0;\n  for (const price of prices) {\n    low = Math.min(low, price);\n    best = Math.max(best, price - low);\n  }\n  return best;\n}\n",
        testCases: [
          { id: "qc1-1-t1", args: [[7, 1, 5, 3, 6, 4]], expected: 5, hidden: false },
          { id: "qc1-1-t2", args: [[7, 6, 4, 3, 1]], expected: 0 },
          { id: "qc1-1-t3", args: [[]], expected: 0 },
          { id: "qc1-1-t4", args: [[2, 4, 1, 9]], expected: 8 },
          { id: "qc1-1-t5", args: [[3, 3, 3]], expected: 0 },
        ],
      },
      {
        id: "qc1-2",
        title: "Simple moving average",
        difficulty: "EASY",
        statement:
          "Return the simple moving average for each full window, in order. The result has values.length − window + 1 entries, or is empty if the window is longer than the series.\n\nArguments:\n- values: an array of integers.\n- window: a positive integer.\n\nReturn an array of numbers.",
        functionName: "movingAverage",
        starterCode: "function movingAverage(values, window) {\n  // [1, 2, 3, 4], 2 -> [1.5, 2.5, 3.5]\n}\n",
        solution:
          "function movingAverage(values, window) {\n  const out = [];\n  let sum = 0;\n  for (let i = 0; i < values.length; i += 1) {\n    sum += values[i];\n    if (i >= window) sum -= values[i - window];\n    if (i >= window - 1) out.push(sum / window);\n  }\n  return out;\n}\n",
        testCases: [
          { id: "qc1-2-t1", args: [[1, 2, 3, 4], 2], expected: [1.5, 2.5, 3.5], hidden: false },
          { id: "qc1-2-t2", args: [[5, 5, 5], 3], expected: [5] },
          { id: "qc1-2-t3", args: [[1, 2], 3], expected: [] },
          { id: "qc1-2-t4", args: [[10, 20, 30, 40, 50], 1], expected: [10, 20, 30, 40, 50] },
          { id: "qc1-2-t5", args: [[2, 4, 6, 8, 10], 4], expected: [5, 7] },
        ],
      },
      {
        id: "qc1-3",
        title: "Volume-weighted average price",
        difficulty: "MEDIUM",
        statement:
          "Each trade is an object with price and quantity. Return the volume-weighted average price, sum(price × quantity) / sum(quantity), rounded to two decimals with Math.round(value * 100) / 100. Return 0 when there are no trades.\n\nArguments:\n- trades: an array of { price, quantity } with integer values.\n\nReturn a number.",
        functionName: "vwap",
        starterCode: "function vwap(trades) {\n  // sum(price * quantity) / sum(quantity), rounded to 2 decimals.\n}\n",
        solution:
          "function vwap(trades) {\n  let notional = 0;\n  let volume = 0;\n  for (const trade of trades) {\n    notional += trade.price * trade.quantity;\n    volume += trade.quantity;\n  }\n  return volume === 0 ? 0 : Math.round((notional / volume) * 100) / 100;\n}\n",
        testCases: [
          { id: "qc1-3-t1", args: [[{ price: 10, quantity: 100 }, { price: 12, quantity: 300 }]], expected: 11.5, hidden: false },
          { id: "qc1-3-t2", args: [[]], expected: 0 },
          { id: "qc1-3-t3", args: [[{ price: 101, quantity: 7 }]], expected: 101 },
          { id: "qc1-3-t4", args: [[{ price: 100, quantity: 1 }, { price: 101, quantity: 2 }]], expected: 100.67 },
          { id: "qc1-3-t5", args: [[{ price: 50, quantity: 3 }, { price: 52, quantity: 3 }, { price: 49, quantity: 4 }]], expected: 50.2 },
        ],
      },
      {
        id: "qc1-4",
        title: "Maximum drawdown",
        difficulty: "MEDIUM",
        statement:
          "Given an equity curve, return the largest drop from a running peak to a later value, in the same units. Return 0 if the curve never falls.\n\nArguments:\n- equity: an array of integers.\n\nReturn an integer.",
        functionName: "maxDrawdown",
        starterCode: "function maxDrawdown(equity) {\n  // Largest peak-to-later-trough drop.\n}\n",
        solution:
          "function maxDrawdown(equity) {\n  let peak = -Infinity;\n  let worst = 0;\n  for (const value of equity) {\n    peak = Math.max(peak, value);\n    worst = Math.max(worst, peak - value);\n  }\n  return worst;\n}\n",
        testCases: [
          { id: "qc1-4-t1", args: [[100, 120, 90, 130, 80]], expected: 50, hidden: false },
          { id: "qc1-4-t2", args: [[1, 2, 3]], expected: 0 },
          { id: "qc1-4-t3", args: [[]], expected: 0 },
          { id: "qc1-4-t4", args: [[50, 40, 45, 30, 60]], expected: 20 },
          { id: "qc1-4-t5", args: [[10, 10, 10]], expected: 0 },
        ],
      },
    ],
  },
];
