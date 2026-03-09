// src/utils/domainGuard.js

const CS_IT_KEYWORDS = [
  // programming / software
  "programming",
  "coding",
  "code",
  "algorithm",
  "algorithms",
  "data structure",
  "data structures",
  "oop",
  "object oriented",
  "java",
  "python",
  "javascript",
  "typescript",
  "compiler",
  "debug",
  "recursion",
  "array",
  "linked list",
  "stack",
  "queue",
  "tree",
  "graph",
  "hash",
  "sorting",
  "searching",
  "binary search",
  "dynamic programming",
  "time complexity",
  "space complexity",
  "big o",

  // software engineering
  "software engineering",
  "uml",
  "use case",
  "class diagram",
  "sequence diagram",
  "design pattern",
  "requirements",
  "testing",
  "unit test",
  "integration test",
  "agile",
  "scrum",
  "sdlc",
  "architecture",
  "microservices",
  "monolith",
  "api",
  "rest api",
  "jwt",
  "authentication",
  "authorization",

  // databases
  "database",
  "dbms",
  "sql",
  "mysql",
  "mongodb",
  "normalization",
  "er diagram",
  "transaction",
  "acid",
  "indexing",
  "join",
  "query",

  // networks / systems
  "computer networks",
  "network",
  "tcp",
  "udp",
  "ip",
  "dns",
  "http",
  "https",
  "osi",
  "routing",
  "socket",
  "bandwidth",
  "latency",
  "operating system",
  "process",
  "thread",
  "deadlock",
  "synchronization",
  "memory management",
  "paging",
  "cpu scheduling",

  // web / cloud / distributed / ai in IT context
  "react",
  "node",
  "express",
  "spring boot",
  "docker",
  "kubernetes",
  "distributed systems",
  "cloud computing",
  "aws",
  "azure",
  "firebase",
  "devops",
  "ci/cd",
  "machine learning",
  "neural network",
  "classification",
  "regression",
  "dataset",
  "model training",

  // academic context words
  "exam",
  "assignment",
  "lecture",
  "tutorial",
  "syllabus",
  "lab",
  "Computer Science",
  "Software Engineering",
  "Information Technology",
];

const ACADEMIC_INTENT_HINTS = [
  "explain",
  "define",
  "compare",
  "difference",
  "what is",
  "how does",
  "summary",
  "notes",
  "concept",
  "example",
  "advantages",
  "disadvantages",
];

/* ---------------------------
   Strong everyday-topic blocks
---------------------------- */
const NON_ACADEMIC_WORDS = [
  // fruits / foods
  "apple",
  "mango",
  "banana",
  "orange",
  "grape",
  "papaya",
  "pineapple",
  "watermelon",
  "rice",
  "pizza",
  "burger",
  "chicken",
  "recipe",
  "cook",
  "cooking",
  "food",

  // entertainment / lifestyle
  "movie",
  "film",
  "song",
  "lyrics",
  "actor",
  "actress",
  "celebrity",
  "love",
  "relationship",
  "romantic",
  "boyfriend",
  "girlfriend",
  "joke",
  "funny",
  "horoscope",
  "zodiac",
  "astrology",

  // sports / commerce / generic
  "cricket",
  "football",
  "match score",
  "ipl",
  "bitcoin",
  "stock price",
  "hotel",
  "travel",
  "visa",
  "shopping",
  "fashion",
];

const STRONG_NON_ACADEMIC_PATTERNS = [
  /\b(weather|forecast)\b/i,
  /\brecipe|cooking|how to cook\b/i,
  /\bmovie|film|song|lyrics\b/i,
  /\bcricket|football score|ipl\b/i,
  /\bjoke|funny\b/i,
  /\brelationship|love advice\b/i,
  /\bhoroscope|astrology\b/i,
  /\bbitcoin price|stock price\b/i,
  /\btravel plan|hotel booking\b/i,
  /\b(capital of|population of)\b/i,
  /\b(animal|wildlife|zoo)\b/i,
  /\b(dog|cat|lion|tiger|elephant)\b/i,
  /\b(photosynthesis|dna|cell structure)\b/i,
  /\b(weather|climate change)\b/i,
  /\b(country|continent|river|mountain)\b/i,

  // fruits comparisons/questions
  /\b(compare|difference between)\s+(mango|apple|banana|orange|grape)\b/i,
  /\b(mango|apple|banana|orange|grape)\s+(and|vs)\s+(mango|apple|banana|orange|grape)\b/i,
];

function normalizeText(text = "") {
  return String(text).toLowerCase().replace(/\s+/g, " ").trim();
}

function scoreKeywords(text, words) {
  let score = 0;
  for (const w of words) {
    if (text.includes(w.toLowerCase())) score += 1;
  }
  return score;
}

function containsAny(text, words) {
  return words.some((w) => text.includes(w.toLowerCase()));
}

export function evaluateAcademicScope(message = "") {
  const text = normalizeText(message);

  if (!text) {
    return {
      allowed: false,
      status: "empty",
      reason: "Empty question",
      confidence: 1,
    };
  }

  // 1) Hard block obvious patterns
  for (const rx of STRONG_NON_ACADEMIC_PATTERNS) {
    if (rx.test(text)) {
      return {
        allowed: false,
        status: "blocked_non_academic",
        reason: "Matched strong non-academic pattern",
        confidence: 0.99,
      };
    }
  }

  const domainScore = scoreKeywords(text, CS_IT_KEYWORDS);
  const intentScore = scoreKeywords(text, ACADEMIC_INTENT_HINTS);
  const hasNonAcademicWords = containsAny(text, NON_ACADEMIC_WORDS);

  // 2) If non-academic words appear and no strong CS signal => block
  if (hasNonAcademicWords && domainScore === 0) {
    return {
      allowed: false,
      status: "blocked_non_academic",
      reason: "Contains everyday/non-academic topic words without CS context",
      confidence: 0.95,
    };
  }

  // 3) Strong allow
  if (domainScore >= 1 && intentScore >= 1) {
    return {
      allowed: true,
      status: "allowed",
      reason: "Detected CS/IT academic topic with academic intent",
      confidence: 0.9,
    };
  }

  // 4) Allow if strong domain signal
  if (domainScore >= 2) {
    return {
      allowed: true,
      status: "allowed",
      reason: "Strong CS/IT keyword match",
      confidence: 0.88,
    };
  }

  // 5) Ambiguous -> classifier fallback
  return {
    allowed: null,
    status: "ambiguous",
    reason: "Not enough rule-based signal",
    confidence: 0.4,
  };
}

export function buildOutOfScopeMessage(userMessage = "") {
  return {
    type: "out_of_scope",
    title: "Out of MVEG Academic Scope",
    message:
      "This question is not related to Computer Science / Software Engineering / IT academic learning. MVEG is a syllabus-focused explanation tool.",
    suggestions: [
      "Ask about a CS/SE/IT concept (e.g., OOP, DBMS, OS, Networks, Algorithms).",
      "Use academic verbs like explain, compare, define, summarize.",
      "Include course-specific keywords for better detection.",
    ],
    examples: [
      "Compare TCP and UDP",
      "Explain polymorphism in Java",
      "What is normalization in DBMS?",
      "Explain time complexity with examples",
    ],
    userQuestion: userMessage,
  };
}
