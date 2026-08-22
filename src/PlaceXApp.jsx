import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Home as HomeIcon, Compass, Bookmark, Target, Calendar, GraduationCap,
  Code2, GitCompare, BarChart3, Settings as SettingsIcon, Sun, Moon,
  Sparkles, ArrowUpRight, X, ChevronRight, Menu, User, Check, AlertCircle,
  Search as SearchIcon, ArrowLeft, Play, RotateCcw, CheckCircle2, Info,
  TrendingUp, Building2, MapPin, Loader2, Mail, Gamepad2, Trophy, Timer, Shuffle, Grid3x3
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

/* ============================================================
   CANONICAL DATA — single source of truth for the whole app.
   companies starts empty until real Bluebook data is imported.
   Branches/roles are the real taxonomy from the import script.
   ============================================================ */
const CANONICAL_BRANCHES = [
  "Aerospace Engineering","Applied Mechanics","Biological Engineering","Biological Sciences",
  "Bio-Technology","Chemical Engineering","Civil Engineering","Computer Science and Engineering",
  "Data Science and AI","Electrical Engineering","Engineering Design","Engineering Physics",
  "Humanities and Social Sciences","Industrial Mathematics and Scientific Computing",
  "Management Studies","Mechanical Engineering","Metallurgical and Materials Engineering",
  "Naval Architecture and Ocean Engineering","Physics","Quantitative Finance","Robotics",
];
const ROLE_CATEGORIES = ["Software / SDE","Data Scientist","Data Analyst","AI / ML","Finance / Quant","Consulting","Product","Core Engineering","Research","Business Analyst","Other"];
const SUPPORTED_YEARS = ["2024-25","2025-26","2026-27"];
const DEGREE_LEVELS = ["B.Tech","Dual Degree (BTech+MTech)","M.Tech","MS by Research","M.A.","Ph.D"];

/* Real, source-backed records extracted from the two IIT Madras SDC
   Bluebooks (Revised 25-26 + Non-Core 2026-27) by the import-bluebooks.py
   script. Every field traces back to a specific Bluebook page
   (see each record's sourcePage) — nothing here is invented. */
import BLUEBOOK_DATA from "./placex-bluebook-data.json";
import INTERNSHIP_DATA from "./placex-internship-data.json";

/* Normalizes an internship record into the same shape placement
   records use, so the SAME Explore/Compare/Analytics/detail pages can
   render either dataset — this is what makes the top-level Placements /
   Internships switch work without duplicating every page. Nothing here
   invents data: fields that don't exist for internships (placementDay,
   a numeric LPA package) stay null/absent, and `isInternship` +
   `internshipType` flag it so the UI shows the right labels (stipend
   text vs LPA, Regular/IDDD badge) instead of pretending it's a package.
*/
function normalizeInternship(entry) {
  return {
    id: entry.id,
    company: entry.company,
    profile: entry.profile,
    location: entry.location,
    placementYear: entry.internshipYear,
    placementDay: null,
    book: entry.sourceBook,
    sourcePage: entry.sourcePageStart,
    sourcePageEnd: entry.sourcePageEnd,
    eligibleAllBranches: entry.eligibleAllBranches,
    eligibleBranches: entry.eligibleBranches,
    cgpa: entry.cgpa,
    compensation: {}, // internships report stipend, not an LPA package — see stipendLabel
    stipendLabel: entry.stipend?.raw || null,
    offers: entry.offers,
    jobDescription: entry.jobDescription,
    testAndInterview: entry.testAndInterview,
    preparationMaterials: entry.preparationMaterials,
    suggestions: entry.suggestions,
    gd: entry.gd,
    about: entry.about,
    isInternship: true,
    internshipType: entry.type, // "regular" | "iddd" — never merged/blurred
  };
}
function internshipDatasetFor(subType) {
  const all = INTERNSHIP_DATA.entries.map(normalizeInternship);
  if (!subType) return all;
  return all.filter((c) => c.internshipType === subType);
}

const PLACEX_DATA = {
  generatedAt: new Date().toISOString(),
  source: BLUEBOOK_DATA.source,
  generatedFrom: BLUEBOOK_DATA.generatedFrom,
  supportedYears: SUPPORTED_YEARS,
  branches: CANONICAL_BRANCHES,
  roles: ROLE_CATEGORIES,
  companies: BLUEBOOK_DATA.entries,
};

const PREP_DOMAINS = [
  { id: "dsa", name: "DSA", blurb: "Arrays through graphs and DP, in order.", roles: ["Software / SDE", "Core Engineering"] },
  { id: "python", name: "Python", blurb: "Core language fundamentals for interviews.", roles: ["Software / SDE", "Data Scientist", "Data Analyst", "AI / ML"] },
  { id: "oop", name: "OOP", blurb: "Design principles asked across companies.", roles: ["Software / SDE"] },
  { id: "sql", name: "SQL", blurb: "Queries, joins, and schema reasoning.", roles: ["Data Analyst", "Data Scientist", "Software / SDE"] },
  { id: "databases", name: "Databases", blurb: "DBMS internals and transactions.", roles: ["Software / SDE", "Data Analyst"] },
  { id: "ml", name: "Machine Learning", blurb: "Core ML concepts and applied problems.", roles: ["AI / ML", "Research"] },
  { id: "deep-learning", name: "Deep Learning", blurb: "Neural nets, training, and architectures.", roles: ["AI / ML", "Research"] },
  { id: "system-design", name: "System Design", blurb: "Scalable systems fundamentals.", roles: ["Software / SDE", "Core Engineering"] },
  { id: "data-analytics", name: "Data Analytics", blurb: "Working with real datasets to answer business questions.", roles: ["Data Analyst", "Data Scientist"] },
  { id: "os", name: "Operating Systems", blurb: "Processes, memory, concurrency — classic SDE rounds.", roles: ["Software / SDE", "Core Engineering"] },
  { id: "cn", name: "Computer Networks", blurb: "OSI layers, TCP/IP, and how the internet actually works.", roles: ["Software / SDE", "Core Engineering"] },
  { id: "statistics", name: "Statistics", blurb: "Probability and inference for data and ML roles.", roles: ["Data Scientist", "Data Analyst", "AI / ML", "Research"] },
  { id: "java", name: "Java", blurb: "JVM fundamentals, collections, and OOP in practice.", roles: ["Software / SDE", "Core Engineering"] },
  { id: "cpp", name: "C++", blurb: "Memory management, STL, and performance-critical code.", roles: ["Software / SDE", "Core Engineering"] },
  { id: "cloud", name: "Cloud", blurb: "AWS/Azure/GCP basics for deploying and scaling systems.", roles: ["Software / SDE", "Core Engineering"] },
  { id: "interview-prep", name: "Interview Preparation", blurb: "Resume, behavioral, and communication.", roles: ["Software / SDE", "Data Scientist", "Data Analyst", "AI / ML", "Product", "Research", "Core Engineering", "Business Analyst", "Finance / Quant", "Consulting", "Other"] },
];

/* Real, well-known resource links — official docs or long-established
   practice platforms. Only included where I'm confident the URL is
   correct and stable; no invented links. */
const DOMAIN_RESOURCES = {
  dsa: [
    { label: "Striver A2Z Sheet", url: "https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z" },
    { label: "Striver — YouTube", url: "https://www.youtube.com/@takeUforward" },
    { label: "NeetCode — YouTube", url: "https://www.youtube.com/@NeetCode" },
    { label: "LeetCode", url: "https://leetcode.com/problemset/" },
    { label: "NeetCode Roadmap", url: "https://neetcode.io/roadmap" },
  ],
  python: [
    { label: "Official Python Docs", url: "https://docs.python.org/3/tutorial/" },
    { label: "freeCodeCamp Python", url: "https://www.freecodecamp.org/learn/scientific-computing-with-python/" },
    { label: "freeCodeCamp — YouTube", url: "https://www.youtube.com/@freecodecamp" },
  ],
  oop: [
    { label: "Refactoring Guru - OOP", url: "https://refactoring.guru/design-patterns/what-is-pattern" },
  ],
  sql: [
    { label: "Mode SQL Tutorial", url: "https://mode.com/sql-tutorial/" },
    { label: "LeetCode SQL 50", url: "https://leetcode.com/studyplan/top-sql-50/" },
  ],
  databases: [
    { label: "PostgreSQL Docs", url: "https://www.postgresql.org/docs/current/tutorial.html" },
  ],
  ml: [
    { label: "Google ML Crash Course", url: "https://developers.google.com/machine-learning/crash-course" },
    { label: "Krish Naik — YouTube", url: "https://www.youtube.com/@krishnaik06" },
    { label: "Kaggle Learn", url: "https://www.kaggle.com/learn" },
  ],
  "deep-learning": [
    { label: "PyTorch Tutorials", url: "https://pytorch.org/tutorials/" },
    { label: "Krish Naik — YouTube", url: "https://www.youtube.com/@krishnaik06" },
  ],
  "system-design": [
    { label: "System Design Primer (GitHub)", url: "https://github.com/donnemartin/system-design-primer" },
  ],
  "data-analytics": [
    { label: "Kaggle Learn", url: "https://www.kaggle.com/learn" },
  ],
  os: [
    { label: "OSTEP (free textbook)", url: "https://pages.cs.wisc.edu/~remzi/OSTEP/" },
  ],
  cn: [
    { label: "MDN - How the Web Works", url: "https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work" },
  ],
  statistics: [
    { label: "Khan Academy Statistics", url: "https://www.khanacademy.org/math/statistics-probability" },
  ],
  java: [
    { label: "Official Java Docs", url: "https://docs.oracle.com/en/java/javase/17/docs/api/index.html" },
  ],
  cpp: [
    { label: "cppreference.com", url: "https://en.cppreference.com/w/" },
    { label: "LearnCpp.com", url: "https://www.learncpp.com/" },
  ],
  cloud: [
    { label: "AWS Free Tier Docs", url: "https://aws.amazon.com/free/" },
  ],
  "interview-prep": [
    { label: "Pramp (mock interviews)", url: "https://www.pramp.com/" },
  ],
};

const DSA_PHASES = [
  "Basics","Arrays","Binary Search","Strings","Linked Lists","Stacks & Queues",
  "Recursion","Bit Manipulation","Greedy","Trees","Graphs","Dynamic Programming",
];

/* A curated, verified subset of real LeetCode problems, organized in the
   same order as Striver's A2Z sheet (takeuforward.org/dsa/strivers-a2z-sheet).
   This is NOT the complete ~450-problem sheet — that would require
   verifying several hundred individual URLs, which wasn't done here. Each
   slug below was checked against a real, live LeetCode problem page.
   Problem statements are not reproduced — only title, topic, difficulty,
   and a link to practice the real thing. */
const DSA_PROBLEMS = [
  { id: "two-sum", title: "Two Sum", topic: "Arrays", difficulty: "Easy", url: "https://leetcode.com/problems/two-sum/" },
  { id: "best-time-to-buy-and-sell-stock", title: "Best Time to Buy and Sell Stock", topic: "Arrays", difficulty: "Easy", url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
  { id: "contains-duplicate", title: "Contains Duplicate", topic: "Arrays", difficulty: "Easy", url: "https://leetcode.com/problems/contains-duplicate/" },
  { id: "product-of-array-except-self", title: "Product of Array Except Self", topic: "Arrays", difficulty: "Medium", url: "https://leetcode.com/problems/product-of-array-except-self/" },
  { id: "maximum-subarray", title: "Maximum Subarray", topic: "Arrays", difficulty: "Medium", url: "https://leetcode.com/problems/maximum-subarray/" },
  { id: "merge-intervals", title: "Merge Intervals", topic: "Arrays", difficulty: "Medium", url: "https://leetcode.com/problems/merge-intervals/" },
  { id: "3sum", title: "3Sum", topic: "Arrays", difficulty: "Medium", url: "https://leetcode.com/problems/3sum/" },
  { id: "binary-search", title: "Binary Search", topic: "Binary Search", difficulty: "Easy", url: "https://leetcode.com/problems/binary-search/" },
  { id: "search-in-rotated-sorted-array", title: "Search in Rotated Sorted Array", topic: "Binary Search", difficulty: "Medium", url: "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
  { id: "find-minimum-in-rotated-sorted-array", title: "Find Minimum in Rotated Sorted Array", topic: "Binary Search", difficulty: "Medium", url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" },
  { id: "koko-eating-bananas", title: "Koko Eating Bananas", topic: "Binary Search", difficulty: "Medium", url: "https://leetcode.com/problems/koko-eating-bananas/" },
  { id: "valid-anagram", title: "Valid Anagram", topic: "Strings", difficulty: "Easy", url: "https://leetcode.com/problems/valid-anagram/" },
  { id: "group-anagrams", title: "Group Anagrams", topic: "Strings", difficulty: "Medium", url: "https://leetcode.com/problems/group-anagrams/" },
  { id: "longest-substring-without-repeating-characters", title: "Longest Substring Without Repeating Characters", topic: "Strings", difficulty: "Medium", url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
  { id: "longest-palindromic-substring", title: "Longest Palindromic Substring", topic: "Strings", difficulty: "Medium", url: "https://leetcode.com/problems/longest-palindromic-substring/" },
  { id: "reverse-linked-list", title: "Reverse Linked List", topic: "Linked Lists", difficulty: "Easy", url: "https://leetcode.com/problems/reverse-linked-list/" },
  { id: "merge-two-sorted-lists", title: "Merge Two Sorted Lists", topic: "Linked Lists", difficulty: "Easy", url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
  { id: "linked-list-cycle", title: "Linked List Cycle", topic: "Linked Lists", difficulty: "Easy", url: "https://leetcode.com/problems/linked-list-cycle/" },
  { id: "remove-nth-node-from-end-of-list", title: "Remove Nth Node From End of List", topic: "Linked Lists", difficulty: "Medium", url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/" },
  { id: "reorder-list", title: "Reorder List", topic: "Linked Lists", difficulty: "Medium", url: "https://leetcode.com/problems/reorder-list/" },
  { id: "merge-k-sorted-lists", title: "Merge k Sorted Lists", topic: "Linked Lists", difficulty: "Hard", url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
  { id: "valid-parentheses", title: "Valid Parentheses", topic: "Stacks & Queues", difficulty: "Easy", url: "https://leetcode.com/problems/valid-parentheses/" },
  { id: "min-stack", title: "Min Stack", topic: "Stacks & Queues", difficulty: "Medium", url: "https://leetcode.com/problems/min-stack/" },
  { id: "evaluate-reverse-polish-notation", title: "Evaluate Reverse Polish Notation", topic: "Stacks & Queues", difficulty: "Medium", url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/" },
  { id: "daily-temperatures", title: "Daily Temperatures", topic: "Stacks & Queues", difficulty: "Medium", url: "https://leetcode.com/problems/daily-temperatures/" },
  { id: "generate-parentheses", title: "Generate Parentheses", topic: "Recursion", difficulty: "Medium", url: "https://leetcode.com/problems/generate-parentheses/" },
  { id: "subsets", title: "Subsets", topic: "Recursion", difficulty: "Medium", url: "https://leetcode.com/problems/subsets/" },
  { id: "permutations", title: "Permutations", topic: "Recursion", difficulty: "Medium", url: "https://leetcode.com/problems/permutations/" },
  { id: "combination-sum", title: "Combination Sum", topic: "Recursion", difficulty: "Medium", url: "https://leetcode.com/problems/combination-sum/" },
  { id: "word-search", title: "Word Search", topic: "Recursion", difficulty: "Medium", url: "https://leetcode.com/problems/word-search/" },
  { id: "single-number", title: "Single Number", topic: "Bit Manipulation", difficulty: "Easy", url: "https://leetcode.com/problems/single-number/" },
  { id: "number-of-1-bits", title: "Number of 1 Bits", topic: "Bit Manipulation", difficulty: "Easy", url: "https://leetcode.com/problems/number-of-1-bits/" },
  { id: "counting-bits", title: "Counting Bits", topic: "Bit Manipulation", difficulty: "Easy", url: "https://leetcode.com/problems/counting-bits/" },
  { id: "missing-number", title: "Missing Number", topic: "Bit Manipulation", difficulty: "Easy", url: "https://leetcode.com/problems/missing-number/" },
  { id: "jump-game", title: "Jump Game", topic: "Greedy", difficulty: "Medium", url: "https://leetcode.com/problems/jump-game/" },
  { id: "gas-station", title: "Gas Station", topic: "Greedy", difficulty: "Medium", url: "https://leetcode.com/problems/gas-station/" },
  { id: "maximum-depth-of-binary-tree", title: "Maximum Depth of Binary Tree", topic: "Trees", difficulty: "Easy", url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
  { id: "invert-binary-tree", title: "Invert Binary Tree", topic: "Trees", difficulty: "Easy", url: "https://leetcode.com/problems/invert-binary-tree/" },
  { id: "same-tree", title: "Same Tree", topic: "Trees", difficulty: "Easy", url: "https://leetcode.com/problems/same-tree/" },
  { id: "binary-tree-level-order-traversal", title: "Binary Tree Level Order Traversal", topic: "Trees", difficulty: "Medium", url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
  { id: "validate-binary-search-tree", title: "Validate Binary Search Tree", topic: "Trees", difficulty: "Medium", url: "https://leetcode.com/problems/validate-binary-search-tree/" },
  { id: "lowest-common-ancestor-of-a-binary-search-tree", title: "Lowest Common Ancestor of a BST", topic: "Trees", difficulty: "Medium", url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/" },
  { id: "kth-smallest-element-in-a-bst", title: "Kth Smallest Element in a BST", topic: "Trees", difficulty: "Medium", url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/" },
  { id: "binary-tree-maximum-path-sum", title: "Binary Tree Maximum Path Sum", topic: "Trees", difficulty: "Hard", url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/" },
  { id: "number-of-islands", title: "Number of Islands", topic: "Graphs", difficulty: "Medium", url: "https://leetcode.com/problems/number-of-islands/" },
  { id: "clone-graph", title: "Clone Graph", topic: "Graphs", difficulty: "Medium", url: "https://leetcode.com/problems/clone-graph/" },
  { id: "course-schedule", title: "Course Schedule", topic: "Graphs", difficulty: "Medium", url: "https://leetcode.com/problems/course-schedule/" },
  { id: "pacific-atlantic-water-flow", title: "Pacific Atlantic Water Flow", topic: "Graphs", difficulty: "Medium", url: "https://leetcode.com/problems/pacific-atlantic-water-flow/" },
  { id: "rotting-oranges", title: "Rotting Oranges", topic: "Graphs", difficulty: "Medium", url: "https://leetcode.com/problems/rotting-oranges/" },
  { id: "climbing-stairs", title: "Climbing Stairs", topic: "Dynamic Programming", difficulty: "Easy", url: "https://leetcode.com/problems/climbing-stairs/" },
  { id: "house-robber", title: "House Robber", topic: "Dynamic Programming", difficulty: "Medium", url: "https://leetcode.com/problems/house-robber/" },
  { id: "coin-change", title: "Coin Change", topic: "Dynamic Programming", difficulty: "Medium", url: "https://leetcode.com/problems/coin-change/" },
  { id: "longest-increasing-subsequence", title: "Longest Increasing Subsequence", topic: "Dynamic Programming", difficulty: "Medium", url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
  { id: "word-break", title: "Word Break", topic: "Dynamic Programming", difficulty: "Medium", url: "https://leetcode.com/problems/word-break/" },
  { id: "unique-paths", title: "Unique Paths", topic: "Dynamic Programming", difficulty: "Medium", url: "https://leetcode.com/problems/unique-paths/" },
];

/* ============================================================
   PERSISTENCE — window.storage, personal (not shared) data only.
   ============================================================ */
/* Uses browser localStorage — persists per-visitor, per-browser.
   (The claude.ai artifact sandbox's window.storage doesn't exist outside
   claude.ai, so this is the production equivalent.) */
async function loadKey(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
async function saveKey(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
async function deleteKey(key) {
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/* ============================================================
   ROUTING — hash-based so refresh / back / forward work natively.
   ============================================================ */
const ROUTES = new Set([
  "", "onboarding", "home", "explore", "company", "saved", "matches",
  "placement-days", "preparation", "roadmap", "dsa", "dsa-problem",
  "compare", "analytics", "settings", "games",
]);
function parseHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  const [route, ...rest] = raw.split("/");
  return { route: ROUTES.has(route) ? route : "", param: rest.join("/") || null };
}
function navigate(route, param) {
  window.location.hash = param ? `/${route}/${param}` : `/${route}`;
}

/* ============================================================
   MATCH / ELIGIBILITY LOGIC — real function, works once
   PLACEX_DATA.companies is populated.
   ============================================================ */
/* The Bluebook data has no role-category field, so this derives a rough
   label from the actual profile/job-description text for filtering —
   it's a classification of real text, not invented data. Falls back to
   "Other" rather than guessing when nothing matches. */
/* Each placementYear maps 1:1 to exactly one of the two source Bluebooks
   (confirmed against PLACEX_DATA.generatedFrom) — this is a real mapping,
   not an invented one. */
/* Prefer the record's own `book` field (present in the v2 extraction);
   fall back to inferring from placementYear for older-shaped records. */
function bluebookNameFor(company) {
  if (company?.book) return company.book;
  const year = typeof company === "string" ? company : company?.placementYear;
  if (year === "2025-26") return "Revised Placement Bluebook 25-26";
  if (year === "2026-27") return "Non-Core Placement Bluebook 2026-27";
  return "Not specified in source";
}

/* The Bluebook data has no role-category field, so this derives a
   specific label from the actual profile/job-description text for
   filtering — a classification of real text, not invented data. Order
   matters: more specific categories are checked before general ones.
   Falls back to "Other" rather than guessing when nothing matches. */
function classifyRole(company) {
  const text = `${company.profile || ""} ${company.jobDescription || ""}`.toLowerCase();
  if (/\b(quant(itative)?\s*(researcher|analyst|trader)|hedge fund|trading|derivatives|risk analyst|investment banking)\b/.test(text)) return "Finance / Quant";
  if (/\b(consult(ant|ing)|strategy analyst|management consult)\b/.test(text)) return "Consulting";
  if (/\b(business analyst|\bba\b)\b/.test(text)) return "Business Analyst";
  if (/\b(product manager|product analyst|\bpm\b|product owner)\b/.test(text)) return "Product";
  if (/\b(data scientist)\b/.test(text)) return "Data Scientist";
  if (/\b(data analy|business intelligence|\bbi\b analyst)\b/.test(text)) return "Data Analyst";
  if (/\b(machine learning|\bml\b engineer|artificial intelligence|\bai\b engineer|deep learning|nlp|computer vision)\b/.test(text)) return "AI / ML";
  if (/\b(research(er)?\b|scientist\b|r&d)\b/.test(text)) return "Research";
  if (/\b(software|sde\b|developer|backend|frontend|full.?stack|programm|devops|cloud engineer)\b/.test(text)) return "Software / SDE";
  if (/\b(mechanical|electrical|civil|core engineer|process engineer|hardware|embedded|manufactur|design engineer)\b/.test(text)) return "Core Engineering";
  return "Other";
}

/* Maps onboarding degree labels to the level codes used in the real
   degree-eligibility extraction. "M.A." has no confident mapping to a
   single level code in the source data, so it's deliberately left
   unmapped — the degree check is skipped rather than guessed for it. */
const DEGREE_LEVEL_CODE = {
  "B.Tech": "UG",
  "Dual Degree (BTech+MTech)": "DUAL",
  "M.Tech": "PG",
  "MS by Research": "PG",
  "Ph.D": "PHD",
};

function computeMatch(profile, company) {
  if (!profile) return { status: "unknown", reason: "No profile yet." };
  const branchOk = company.eligibleAllBranches || (company.eligibleBranches || []).includes(profile.branch);
  if (!branchOk) return { status: "not-eligible", reason: `${profile.branch} is not listed as open for this role.` };

  const levelCode = DEGREE_LEVEL_CODE[profile.degree];
  if (levelCode && company.eligibleDegreeLevels && company.eligibleDegreeLevels.length > 0) {
    if (!company.eligibleDegreeLevels.includes(levelCode)) {
      return { status: "not-eligible", reason: `${profile.degree} isn't listed as an eligible degree level for this role.` };
    }
  }

  const cgpaStatus = company.cgpa?.status;
  if (cgpaStatus === "known") {
    if (profile.cgpa >= company.cgpa.min) {
      return { status: "eligible", reason: `Your CGPA (${profile.cgpa}) clears the ${company.cgpa.min} cutoff.` };
    }
    return { status: "not-eligible", reason: `Cutoff is ${company.cgpa.min}; your CGPA is ${profile.cgpa}.` };
  }
  if (cgpaStatus === "no_cutoff") return { status: "eligible", reason: "No CGPA cutoff for this role." };
  // Branch (and degree, where known) match and the Bluebook simply
  // didn't list a CGPA cutoff — treat as eligible rather than excluding
  // the student, but flag it since the real cutoff could turn out higher.
  return { status: "eligible", reason: "Branch matches. No CGPA cutoff was specified in the Bluebook for this role — actual eligibility may change once a cutoff is published.", cgpaUnconfirmed: true };
}

/* ============================================================
   SEARCH — real ranking across companies + prep/DSA content.
   Works today over prep content; will extend to companies
   automatically once PLACEX_DATA.companies is populated.
   ============================================================ */
function runSearch(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];
  const dayQuery = q.replace(/^day\s*/i, "").trim();

  // "50 LPA", "50LPA", "10lpa" etc. → companies at or above that package.
  const lpaMatch = q.match(/(\d+(?:\.\d+)?)\s*lpa/);
  if (lpaMatch) {
    const threshold = Number(lpaMatch[1]);
    PLACEX_DATA.companies
      .filter((c) => typeof c.compensation?.max_ctc_lpa === "number" && c.compensation.max_ctc_lpa >= threshold)
      .sort((a, b) => b.compensation.max_ctc_lpa - a.compensation.max_ctc_lpa)
      .forEach((c) => {
        results.push({ type: "company", rank: 1, label: c.company, sub: `${c.profile} · ${c.compensation.max_ctc_lpa} LPA`, data: c });
      });
    return results.slice(0, 8);
  }

  PLACEX_DATA.companies.forEach((c) => {
    const name = c.company.toLowerCase();
    if (name === q) results.push({ type: "company", rank: 0, label: c.company, sub: c.profile, data: c });
    else if (name.startsWith(q)) results.push({ type: "company", rank: 3, label: c.company, sub: c.profile, data: c });
    else if (name.includes(q)) results.push({ type: "company", rank: 4, label: c.company, sub: c.profile, data: c });
    else if ((c.profile || "").toLowerCase().includes(q)) results.push({ type: "company", rank: 5, label: c.company, sub: c.profile, data: c });

    const roleCat = classifyRole(c).toLowerCase();
    if (roleCat.includes(q)) {
      results.push({ type: "role", rank: 2, label: c.profile, sub: `${c.company} · ${classifyRole(c)}`, data: c });
    }

    if (c.placementDay && dayQuery && c.placementDay.toLowerCase() === dayQuery) {
      results.push({ type: "day", rank: 1, label: `Day ${c.placementDay}`, sub: c.company, data: c });
    }
  });

  PREP_DOMAINS.forEach((d) => {
    if (d.name.toLowerCase().includes(q)) {
      results.push({ type: "prep", rank: d.name.toLowerCase() === q ? 0 : 3, label: d.name, sub: "Preparation domain", data: d });
    }
  });
  DSA_PHASES.forEach((p) => {
    if (p.toLowerCase().includes(q)) {
      results.push({ type: "dsa-topic", rank: p.toLowerCase() === q ? 0 : 3, label: p, sub: "DSA topic", data: p });
    }
  });
  DSA_PROBLEMS.forEach((p) => {
    if (p.title.toLowerCase().includes(q)) {
      results.push({ type: "dsa-problem", rank: p.title.toLowerCase() === q ? 0 : 4, label: p.title, sub: `${p.topic} · ${p.difficulty}`, data: p });
    }
  });

  return results.sort((a, b) => a.rank - b.rank).slice(0, 8);
}

/* ============================================================
   STYLES — shared design system across landing + application.
   ============================================================ */
const CSS = `
  :root { --font-display:'Space Grotesk',sans-serif; --font-body:'IBM Plex Sans',sans-serif; --font-mono:'IBM Plex Mono',monospace; --radius:14px; --ease:cubic-bezier(0.16,1,0.3,1); }
  html, body { margin:0; padding:0; background:#0A0A0C; }
  #root { background:#0A0A0C; min-height:100vh; }
  ::-webkit-scrollbar { width:10px; height:10px; }
  ::-webkit-scrollbar-track { background:#0A0A0C; }
  ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.14); border-radius:6px; }
  ::-webkit-scrollbar-thumb:hover { background:rgba(255,255,255,0.22); }
  html { scrollbar-color: rgba(255,255,255,0.14) #0A0A0C; scrollbar-width: thin; }
  .px-root[data-theme="dark"] { --bg:#0A0A0C; --bg-elev:#111114; --surface:#16161B; --surface-2:#1D1D23; --border:rgba(255,255,255,0.09); --border-strong:rgba(255,255,255,0.16); --text:#F4F3EF; --text-dim:#A5A5AC; --text-faint:#6B6B72; --crimson:#D41B3F; --crimson-bright:#FF3358; --crimson-deep:#6E0E22; --on-crimson:#FBECEE; --glow:rgba(212,27,63,0.35); --good:#3ED598; --warn:#F5B942; }
  .px-root[data-theme="light"] { --bg:#FBFBFA; --bg-elev:#F3F2F0; --surface:#FFFFFF; --surface-2:#F5F4F2; --border:rgba(17,17,19,0.09); --border-strong:rgba(17,17,19,0.16); --text:#131315; --text-dim:#55555C; --text-faint:#8A8A90; --crimson:#A80F30; --crimson-bright:#D91642; --crimson-deep:#F4D6DB; --on-crimson:#FFF6F7; --glow:rgba(168,15,48,0.18); --good:#0F8F5F; --warn:#B5760A; }
  /* User-selectable accent color (Settings > Appearance). Only affects
     Placements mode — Internships mode always forces its own blue below,
     regardless of the chosen accent, so the two modes stay visually
     distinguishable no matter what the user picks. */
  .px-root[data-theme="dark"][data-accent="violet"] { --crimson:#7C3AED; --crimson-bright:#A78BFA; --crimson-deep:#2E1065; --on-crimson:#F3EEFF; --glow:rgba(124,58,237,0.35); }
  .px-root[data-theme="light"][data-accent="violet"] { --crimson:#6D28D9; --crimson-bright:#8B5CF6; --crimson-deep:#EDE4FF; --on-crimson:#F8F5FF; --glow:rgba(109,40,217,0.18); }
  .px-root[data-theme="dark"][data-accent="ocean"] { --crimson:#0891B2; --crimson-bright:#22D3EE; --crimson-deep:#083344; --on-crimson:#ECFEFF; --glow:rgba(8,145,178,0.35); }
  .px-root[data-theme="light"][data-accent="ocean"] { --crimson:#0E7490; --crimson-bright:#0891B2; --crimson-deep:#D6F5FA; --on-crimson:#F0FDFF; --glow:rgba(14,116,144,0.18); }
  .px-root[data-theme="dark"][data-accent="emerald"] { --crimson:#059669; --crimson-bright:#34D399; --crimson-deep:#022C22; --on-crimson:#ECFDF5; --glow:rgba(5,150,105,0.35); }
  .px-root[data-theme="light"][data-accent="emerald"] { --crimson:#047857; --crimson-bright:#059669; --crimson-deep:#D1FAE5; --on-crimson:#F0FDF9; --glow:rgba(4,120,87,0.18); }
  .px-root[data-theme="dark"][data-accent="amber"] { --crimson:#D97706; --crimson-bright:#FBBF24; --crimson-deep:#451A03; --on-crimson:#FFFBEB; --glow:rgba(217,119,6,0.35); }
  .px-root[data-theme="light"][data-accent="amber"] { --crimson:#B45309; --crimson-bright:#D97706; --crimson-deep:#FEF3C7; --on-crimson:#FFFBEB; --glow:rgba(180,83,9,0.18); }
  /* Internships mode overrides the accent to blue — everything that
     reads var(--crimson) (buttons, badges, active states, the mode
     switch itself) picks this up automatically, no per-component
     changes needed. Dark and light get their own blue so contrast
     stays correct in both. */
  .px-root[data-theme="dark"][data-mode="internships"] { --crimson:#2563EB; --crimson-bright:#4F8CFF; --crimson-deep:#0F2E6E; --on-crimson:#EAF1FF; --glow:rgba(37,99,235,0.35); }
  .px-root[data-theme="light"][data-mode="internships"] { --crimson:#1D4ED8; --crimson-bright:#2F6FEF; --crimson-deep:#D8E6FF; --on-crimson:#F5F9FF; --glow:rgba(29,78,216,0.18); }
  .px-root { background:var(--bg); color:var(--text); font-family:var(--font-body); min-height:100vh; -webkit-font-smoothing:antialiased; position:relative; }
  .px-root * { box-sizing:border-box; }
  .px-root a { color:inherit; text-decoration:none; }
  .px-root button { font-family:inherit; cursor:pointer; }
  .px-root ::selection { background:var(--crimson); color:var(--on-crimson); }

  .eyebrow { font-family:var(--font-mono); font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--crimson); display:inline-flex; align-items:center; gap:8px; }
  .eyebrow::before { content:""; width:14px; height:1px; background:var(--crimson); }

  .mark { width:34px; height:34px; border-radius:9px; background:linear-gradient(155deg,var(--crimson) 0%,var(--crimson-deep) 100%); display:grid; place-items:center; flex-shrink:0; box-shadow:0 4px 18px -6px var(--glow); }
  .mark.sm { width:26px; height:26px; border-radius:7px; }
  .brand { display:flex; align-items:center; gap:10px; font-family:var(--font-display); font-weight:700; font-size:17px; letter-spacing:-0.01em; }
  .brand .tag { display:block; font-family:var(--font-mono); font-weight:400; font-size:9px; letter-spacing:.16em; color:var(--text-faint); margin-top:1px; }

  .btn { display:inline-flex; align-items:center; gap:8px; font-size:14px; font-weight:600; padding:11px 20px; border-radius:999px; border:1px solid transparent; transition:transform .2s var(--ease),box-shadow .2s var(--ease),background .2s var(--ease),border-color .2s,opacity .2s; }
  .btn:active { transform:scale(.96); }
  .btn:disabled { opacity:.45; cursor:not-allowed; }
  .btn-primary { background:var(--crimson); color:var(--on-crimson); box-shadow:0 8px 24px -10px var(--glow); }
  .btn-primary:hover:not(:disabled) { background:var(--crimson-bright); }
  .btn-ghost { background:transparent; border-color:var(--border); color:var(--text); }
  .btn-ghost:hover { border-color:var(--border-strong); background:var(--surface); }
  .btn-sm { padding:8px 14px; font-size:13px; }
  .icon-btn { width:36px; height:36px; border-radius:50%; border:1px solid var(--border); background:var(--surface); display:grid; place-items:center; color:var(--text-dim); transition:all .2s var(--ease); flex-shrink:0; }
  .icon-btn:hover { border-color:var(--border-strong); color:var(--text); }

  .cursor-glow { position:fixed; width:460px; height:460px; border-radius:50%; pointer-events:none; background:radial-gradient(closest-side,var(--glow),transparent 70%); transform:translate(-50%,-50%); opacity:0; transition:opacity .3s; z-index:1; }

  .reveal { opacity:0; transform:translateY(24px); transition:opacity .7s var(--ease),transform .7s var(--ease); }
  .reveal.in { opacity:1; transform:translateY(0); }

  /* ---- Landing ---- */
  .land-header { position:sticky; top:0; z-index:50; backdrop-filter:blur(14px) saturate(140%); background:color-mix(in srgb,var(--bg) 72%,transparent); border-bottom:1px solid var(--border); }
  .land-nav { display:flex; align-items:center; justify-content:space-between; padding:16px 28px; max-width:1180px; margin:0 auto; }
  .land-nav-links { display:flex; gap:28px; font-size:14px; color:var(--text-dim); }
  .land-nav-links a:hover { color:var(--text); }
  .wrap { max-width:1180px; margin:0 auto; padding:0 28px; }
  .hero { position:relative; padding:110px 0 90px; overflow:hidden; text-align:center; }
  .hero-glow { position:absolute; top:-220px; left:50%; transform:translateX(-50%); width:900px; height:620px; background:radial-gradient(closest-side,var(--glow),transparent 70%); pointer-events:none; filter:blur(10px); }
  .hero h1 { position:relative; z-index:2; font-family:var(--font-display); font-weight:700; font-size:clamp(38px,6.6vw,80px); line-height:1.03; letter-spacing:-0.03em; margin:20px 0; }
  .hero .accent { color:var(--crimson); }
  .hero p.lede { position:relative; z-index:2; max-width:600px; margin:0 auto; font-size:17px; line-height:1.6; color:var(--text-dim); }
  .hero-ctas { position:relative; z-index:2; display:flex; justify-content:center; gap:14px; margin-top:32px; flex-wrap:wrap; }
  .hero-caption { position:relative; z-index:2; margin-top:16px; font-family:var(--font-mono); font-size:11.5px; color:var(--text-faint); }
  .trajectory { margin-top:70px; height:190px; position:relative; z-index:2; }
  .trajectory svg { width:100%; height:100%; overflow:visible; }
  .traj-line { fill:none; stroke:var(--crimson); stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round; }
  .traj-area { fill:url(#pxAreaGrad); }

  .marquee-section { border-top:1px solid var(--border); border-bottom:1px solid var(--border); padding:20px 0; overflow:hidden; background:var(--bg-elev); }
  .marquee-track { display:flex; width:max-content; animation:px-scroll 34s linear infinite; }
  .marquee-track span { font-family:var(--font-mono); font-size:12.5px; letter-spacing:.1em; color:var(--text-faint); padding:0 26px; white-space:nowrap; display:flex; align-items:center; gap:26px; }
  .marquee-track span::after { content:"◆"; color:var(--crimson); font-size:8px; opacity:.7; }
  @keyframes px-scroll { to { transform:translateX(-50%); } }

  section.block { padding:100px 0; }
  .block-head { max-width:600px; margin-bottom:56px; }
  .block-head h2 { font-family:var(--font-display); font-weight:700; font-size:clamp(28px,3.6vw,40px); letter-spacing:-0.02em; margin-top:12px; }
  .block-head p { margin-top:12px; color:var(--text-dim); font-size:15.5px; line-height:1.6; max-width:500px; }

  .questions-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1px; background:var(--border); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; }
  .q-card { background:var(--surface); padding:30px 24px; transition:background .3s var(--ease); }
  .q-card:hover { background:var(--surface-2); }
  .q-num { font-family:var(--font-mono); font-size:12.5px; color:var(--crimson); }
  .q-card h3 { font-family:var(--font-display); font-size:18px; font-weight:600; margin:14px 0 8px; }
  .q-card p { font-size:14px; color:var(--text-dim); line-height:1.5; }

  .how-steps { display:flex; flex-direction:column; }
  .step { display:grid; grid-template-columns:56px 1fr; gap:22px; padding:28px 0; border-top:1px solid var(--border); }
  .step:last-child { border-bottom:1px solid var(--border); }
  .step-index { font-family:var(--font-mono); font-size:12.5px; color:var(--text-faint); padding-top:3px; }
  .step h3 { font-family:var(--font-display); font-size:19px; font-weight:600; margin-bottom:6px; }
  .step p { color:var(--text-dim); font-size:14.5px; line-height:1.6; max-width:540px; }

  .features-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
  .f-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:26px; transition:transform .3s var(--ease),border-color .3s,box-shadow .3s var(--ease); }
  .f-card:hover { transform:translateY(-4px); border-color:var(--border-strong); box-shadow:0 18px 36px -22px rgba(0,0,0,.5); }
  .f-icon { width:36px; height:36px; border-radius:10px; background:color-mix(in srgb,var(--crimson) 14%,transparent); display:grid; place-items:center; margin-bottom:16px; color:var(--crimson); }
  .f-card h3 { font-family:var(--font-display); font-size:16.5px; font-weight:600; margin-bottom:6px; }
  .f-card p { font-size:13.5px; color:var(--text-dim); line-height:1.55; }

  .cta-band { text-align:center; padding:96px 0; }
  .cta-band h2 { font-family:var(--font-display); font-weight:700; font-size:clamp(28px,4.4vw,46px); letter-spacing:-0.02em; margin:16px 0 26px; }
  footer.land-foot { border-top:1px solid var(--border); padding:40px 0; }
  .foot-inner { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:18px; }
  .foot-links { display:flex; gap:22px; font-size:13px; color:var(--text-dim); }
  .foot-fine { font-size:12px; color:var(--text-faint); margin-top:4px; }

  /* ---- Onboarding ---- */
  .onb-wrap { max-width:520px; margin:0 auto; padding:90px 24px 60px; }
  .onb-progress { display:flex; gap:6px; margin-bottom:36px; }
  .onb-progress span { height:3px; flex:1; border-radius:2px; background:var(--border); overflow:hidden; }
  .onb-progress span.done { background:var(--crimson); }
  .onb-card h2 { font-family:var(--font-display); font-size:26px; font-weight:700; letter-spacing:-.01em; margin-bottom:8px; }
  .onb-card > p { color:var(--text-dim); font-size:14.5px; margin-bottom:28px; }
  .field { margin-bottom:18px; }
  .field label { display:block; font-size:13px; font-weight:600; margin-bottom:7px; color:var(--text-dim); }
  .field input, .field select { width:100%; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:12px 14px; font-size:14.5px; color:var(--text); font-family:inherit; transition:border-color .2s; }
  .field input:focus, .field select:focus { outline:none; border-color:var(--crimson); }
  input, select, textarea, button { outline: none; }
  input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--crimson);
    box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.15);
  }
  button:focus-visible, a:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(225, 29, 72, 0.25);
    border-radius: 8px;
  }
  .chip-row { display:flex; flex-wrap:wrap; gap:8px; }
  .chip { padding:8px 14px; border-radius:999px; border:1px solid var(--border); font-size:13px; color:var(--text-dim); transition:all .2s; background:var(--surface); }
  .chip.active { border-color:var(--crimson); color:var(--on-crimson); background:var(--crimson); }
  .onb-actions { display:flex; justify-content:space-between; margin-top:30px; }

  /* ---- App shell ---- */
  .shell { display:flex; min-height:100vh; }
  .sidebar { width:240px; flex-shrink:0; border-right:1px solid var(--border); padding:20px 14px; display:flex; flex-direction:column; position:sticky; top:0; height:100vh; }
  .sidebar-brand { padding:8px 10px 24px; }
  .sidebar-nav { display:flex; flex-direction:column; gap:2px; flex:1; }
  .sidebar-link { display:flex; align-items:center; gap:12px; padding:10px 12px; border-radius:10px; font-size:14px; color:var(--text-dim); transition:all .2s var(--ease); }
  .sidebar-link:hover { background:var(--surface); color:var(--text); }
  .sidebar-link.active { background:var(--surface-2); color:var(--text); }
  .sidebar-link.active svg { color:var(--crimson); }
  .sidebar-foot { border-top:1px solid var(--border); padding-top:12px; display:flex; flex-direction:column; gap:2px; }
  .main-col { flex:1; min-width:0; }
  .topbar { position:sticky; top:0; z-index:30; display:flex; align-items:center; gap:12px; padding:14px 28px; border-bottom:1px solid var(--border); background:color-mix(in srgb,var(--bg) 85%,transparent); backdrop-filter:blur(10px); }
  .mode-switch { display:flex; background:var(--surface-2); border:1px solid var(--border); border-radius:999px; padding:3px; flex-shrink:0; }
  .mode-switch button { border:none; background:transparent; color:var(--text-faint); font-size:12.5px; font-weight:600; padding:7px 14px; border-radius:999px; cursor:pointer; transition:all .15s ease; white-space:nowrap; }
  .mode-switch button.active { background:var(--crimson); color:var(--on-crimson); }
  @media (max-width:640px) { .mode-switch button { padding:7px 10px; font-size:11.5px; } }
  .topbar-search { flex:1; display:flex; align-items:center; gap:10px; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:9px 14px; color:var(--text-faint); font-size:13.5px; max-width:420px; }
  .topbar-search:hover { border-color:var(--border-strong); }
  @keyframes px-page-in { from { opacity:0; transform:translateY(10px) scale(0.99); } to { opacity:1; transform:translateY(0) scale(1); } }
  .page { padding:32px 28px 80px; max-width:1440px; margin:0 auto; width:100%; box-sizing:border-box; animation: px-page-in 0.28s var(--ease); }
  .page-head { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:24px; flex-wrap:wrap; }
  .page-head h1 { font-family:var(--font-display); font-size:26px; font-weight:700; letter-spacing:-.01em; }
  .page-head p { color:var(--text-dim); font-size:14px; margin-top:4px; }

  .bottom-nav { display:none; }
  @keyframes px-install-in { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .install-banner { position:fixed; left:20px; bottom:20px; z-index:150; display:flex; align-items:center; gap:14px; background:var(--surface); border:1px solid var(--border-strong); border-radius:14px; padding:12px 14px; box-shadow:0 20px 50px -15px rgba(0,0,0,.5); animation:px-install-in .25s var(--ease); max-width:calc(100vw - 40px); }

  .empty-state { border:1px dashed var(--border-strong); border-radius:var(--radius); padding:48px 28px; text-align:center; color:var(--text-dim); background:var(--surface); }
  .coming-soon-stage { position:relative; max-width:560px; margin:60px auto; text-align:center; padding:48px 32px; border-radius:24px; background:var(--surface); border:1px solid var(--border); overflow:hidden; }
  .coming-soon-glow { position:absolute; inset:-60px; background:radial-gradient(circle at 50% 0%, var(--glow), transparent 65%); pointer-events:none; }
  .coming-soon-icon { color:var(--crimson); margin-bottom:18px; position:relative; }
  .coming-soon-badge { display:inline-block; font-size:11px; font-weight:700; letter-spacing:.06em; color:var(--crimson); background:color-mix(in srgb, var(--crimson) 14%, transparent); padding:6px 14px; border-radius:999px; margin-bottom:18px; position:relative; }
  .coming-soon-title { font-family:var(--font-display); font-size:28px; font-weight:700; margin-bottom:14px; position:relative; }
  .coming-soon-sub { font-size:14px; color:var(--text-dim); line-height:1.7; margin-bottom:24px; position:relative; }
  .empty-state svg { color:var(--text-faint); margin-bottom:14px; }
  .empty-state h3 { font-family:var(--font-display); color:var(--text); font-size:17px; margin-bottom:6px; }
  .empty-state p { font-size:13.5px; max-width:420px; margin:0 auto; line-height:1.6; }

  @keyframes px-card-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:20px; transition:border-color .18s ease, transform .18s ease; }
  .company-card { animation: px-card-in 0.22s var(--ease) backwards; }
  .company-card:nth-child(n+31) { animation: none; }
  .company-card:hover { border-color:var(--crimson); transform:translateY(-4px); box-shadow:0 14px 30px -14px var(--glow); }
  .role-pill, .btn, .icon-btn { transition: all .15s ease; }
  .btn:active, .icon-btn:active, .role-pill:active { transform: scale(0.96); }
  .metric-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:14px; margin-bottom:28px; }
  .metric-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:18px 20px; transition:border-color .18s ease, transform .18s ease; }
  .metric-clickable { cursor:pointer; }
  .metric-clickable:hover { border-color:var(--crimson); transform:translateY(-4px); box-shadow:0 14px 30px -14px var(--glow); }
  .home-hero { padding:18px 20px; margin-bottom:18px; border-color:var(--crimson); background:linear-gradient(135deg, var(--surface), var(--surface-2)); position:relative; overflow:hidden; }
  .home-hero::after { content:""; position:absolute; right:-40px; top:-40px; width:160px; height:160px; background:radial-gradient(circle, var(--glow), transparent 70%); pointer-events:none; }
  .metric-card .label { font-family:var(--font-mono); font-size:11px; letter-spacing:.06em; text-transform:uppercase; color:var(--text-faint); }
  .metric-card .value { font-family:var(--font-display); font-size:26px; font-weight:700; margin-top:8px; }

  .filter-bar { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:22px; align-items:center; }
  .role-pill { font-size:12.5px; padding:6px 12px; border-radius:999px; background:var(--surface-2); border:1px solid var(--border); color:var(--text-dim); cursor:pointer; transition:border-color .15s ease; }
  .role-pill:hover { border-color: var(--crimson); }
  .filter-bar select { background:var(--surface); border:1px solid var(--border); border-radius:9px; padding:9px 12px; font-size:13.5px; color:var(--text); font-family:inherit; }

  .domain-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; }
  .domain-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:22px; transition:all .25s var(--ease); animation: px-card-in 0.3s var(--ease) backwards; }
  .domain-card:hover { border-color:var(--crimson); transform:translateY(-4px); box-shadow:0 14px 30px -14px var(--glow); }
  .domain-grid .domain-card:nth-child(1) { animation-delay: 0.02s; }
  .domain-grid .domain-card:nth-child(2) { animation-delay: 0.05s; }
  .domain-grid .domain-card:nth-child(3) { animation-delay: 0.08s; }
  .domain-grid .domain-card:nth-child(4) { animation-delay: 0.11s; }
  .domain-grid .domain-card:nth-child(5) { animation-delay: 0.14s; }
  .domain-grid .domain-card:nth-child(6) { animation-delay: 0.17s; }
  .metric-grid .metric-card { animation: px-card-in 0.3s var(--ease) backwards; }
  .metric-grid .metric-card:nth-child(1) { animation-delay: 0.02s; }
  .metric-grid .metric-card:nth-child(2) { animation-delay: 0.05s; }
  .metric-grid .metric-card:nth-child(3) { animation-delay: 0.08s; }
  .metric-grid .metric-card:nth-child(4) { animation-delay: 0.11s; }
  .metric-grid .metric-card:nth-child(5) { animation-delay: 0.14s; }
  .metric-grid .metric-card:nth-child(6) { animation-delay: 0.17s; }
  .domain-card h3 { font-family:var(--font-display); font-size:16px; font-weight:600; margin-bottom:6px; }
  .domain-card p { font-size:13px; color:var(--text-dim); margin-bottom:14px; line-height:1.5; }
  .progress-track { height:6px; border-radius:4px; background:var(--border); overflow:hidden; }
  .progress-fill { height:100%; background:var(--crimson); border-radius:4px; transition:width .5s var(--ease); }

  .roadmap-phase { display:flex; align-items:flex-start; gap:14px; padding:16px 0; border-top:1px solid var(--border); position:relative; }
  .roadmap-phase:last-child { border-bottom:1px solid var(--border); }
  .phase-badge { width:30px; height:30px; border-radius:8px; background:var(--surface-2); display:grid; place-items:center; font-family:var(--font-mono); font-size:12px; color:var(--text-faint); flex-shrink:0; position:relative; z-index:1; }
  .phase-connector { position:absolute; left:29px; top:46px; bottom:-16px; width:1px; background:var(--border-strong); }
  .roadmap-phase:last-child .phase-connector { display:none; }
  .resource-link { display:inline-flex; align-items:center; gap:5px; font-size:12px; padding:5px 10px; border-radius:8px; background:var(--surface-2); color:var(--text-dim); border:1px solid var(--border); text-decoration:none; transition:border-color .15s ease; }
  .resource-link:hover { border-color:var(--crimson); color:var(--text); }

  .compare-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  @media (max-width:700px) { .compare-grid { grid-template-columns:1fr; } }
  .compare-select { width:100%; background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:12px 14px; font-size:14px; color:var(--text); }

  @keyframes px-backdrop-in { from { opacity:0; } to { opacity:1; } }
  @keyframes px-modal-in { from { opacity:0; transform:translateY(-8px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
  .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,.5); backdrop-filter:blur(3px); z-index:200; display:flex; align-items:flex-start; justify-content:center; padding:12vh 16px 16px; animation:px-backdrop-in .15s ease; }
  .modal { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); width:100%; max-width:560px; max-height:70vh; overflow:hidden; display:flex; flex-direction:column; box-shadow:0 30px 70px -20px rgba(0,0,0,.5); animation:px-modal-in .2s var(--ease); }
  .modal-head { display:flex; align-items:center; gap:10px; padding:16px 18px; border-bottom:1px solid var(--border); }
  .modal-body { padding:8px; overflow-y:auto; }
  .search-result { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:10px; transition:background .15s; }
  .search-result:hover { background:var(--surface-2); }
  .search-result .badge-type { font-family:var(--font-mono); font-size:10px; text-transform:uppercase; color:var(--text-faint); }

  @keyframes px-ai-in { from { opacity:0; transform:translateY(16px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
  .ai-panel { position:fixed; right:20px; bottom:20px; width:380px; max-width:calc(100vw - 32px); max-height:70vh; background:var(--surface); border:1px solid var(--border); border-radius:16px; box-shadow:0 30px 70px -20px rgba(0,0,0,.55); z-index:200; display:flex; flex-direction:column; overflow:hidden; animation: px-ai-in .22s var(--ease); }
  .ai-head { display:flex; align-items:center; gap:10px; padding:14px 16px; border-bottom:1px solid var(--border); }
  .ai-msgs { flex:1; overflow-y:auto; padding:14px 16px; display:flex; flex-direction:column; gap:12px; }
  .ai-msg { font-size:13.5px; line-height:1.55; padding:10px 13px; border-radius:12px; max-width:90%; }
  .ai-msg.user { align-self:flex-end; background:var(--crimson); color:var(--on-crimson); }
  .ai-msg.assistant { align-self:flex-start; background:var(--surface-2); border:1px solid var(--border); }
  .ai-quick { display:flex; gap:6px; flex-wrap:wrap; padding:0 16px 12px; }
  .ai-quick button { font-size:12px; padding:6px 10px; border-radius:999px; border:1px solid var(--border); background:var(--surface); color:var(--text-dim); }
  .ai-input-row { display:flex; gap:8px; padding:12px; border-top:1px solid var(--border); }
  .ai-input-row input { flex:1; background:var(--surface-2); border:1px solid var(--border); border-radius:10px; padding:10px 12px; font-size:13.5px; color:var(--text); font-family:inherit; }
  .ai-fab { position:fixed; right:20px; bottom:20px; width:52px; height:52px; border-radius:50%; background:var(--crimson); color:var(--on-crimson); display:grid; place-items:center; box-shadow:0 12px 30px -8px var(--glow); z-index:150; border:none; }

  .code-area { width:100%; min-height:260px; background:#0d0d10; color:#e8e8e6; font-family:var(--font-mono); font-size:13px; line-height:1.6; border-radius:10px; border:1px solid var(--border); padding:16px; resize:vertical; }
  html[data-theme="light"] .code-area, .px-root[data-theme="light"] .code-area { background:#15151a; color:#eceff4; }

  .settings-section { margin-bottom:34px; }
  .settings-section h2 { font-family:var(--font-display); font-size:17px; font-weight:600; margin-bottom:14px; }
  .theme-row { display:flex; gap:10px; }
  .theme-opt { flex:1; padding:14px; border-radius:10px; border:1px solid var(--border); text-align:center; font-size:13px; color:var(--text-dim); }
  .theme-opt.active { border-color:var(--crimson); color:var(--text); background:var(--surface-2); }

  @media (max-width:900px) {
    .sidebar { display:none; }
    .questions-grid { grid-template-columns:1fr 1fr; }
    .features-grid { grid-template-columns:1fr 1fr; }
    .page { padding-bottom:96px; }
    .bottom-nav { display:flex; position:fixed; bottom:0; left:0; right:0; background:var(--bg-elev); border-top:1px solid var(--border); z-index:100; padding:8px 6px calc(8px + env(safe-area-inset-bottom)); justify-content:space-around; }
    .bottom-nav a, .bottom-nav button { display:flex; flex-direction:column; align-items:center; gap:3px; font-size:10px; color:var(--text-faint); padding:6px; border:none; background:none; }
    .bottom-nav a.active, .bottom-nav button.active { color:var(--crimson); }
    .more-sheet {
      width:100%; background:var(--bg-elev); border-top-left-radius:20px; border-top-right-radius:20px;
      border:1px solid var(--border); border-bottom:none; padding:10px 16px calc(20px + env(safe-area-inset-bottom));
      animation: px-install-in 0.22s var(--ease);
    }
    .more-sheet-handle { width:36px; height:4px; border-radius:4px; background:var(--border-strong); margin:6px auto 16px; }
    .more-sheet-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; }
    .more-sheet-item { display:flex; flex-direction:column; align-items:center; gap:6px; padding:14px 8px; border-radius:12px; background:var(--surface); border:1px solid var(--border); color:var(--text-dim); font-size:11.5px; }
    .more-sheet-item.active { color:var(--crimson); border-color:var(--crimson); }
    .ai-panel { right:10px; left:10px; width:auto; bottom:78px; }
    .ai-fab { bottom:78px; }
  }
  @media (max-width:560px) {
    .questions-grid { grid-template-columns:1fr; }
    .features-grid { grid-template-columns:1fr; }
    .step { grid-template-columns:1fr; gap:6px; }
    section.block { padding:70px 0; }
    .hero { padding:100px 0 60px; }
    .compare-grid { grid-template-columns:1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    .px-root *, .px-root *::before, .px-root *::after { animation-duration:.001ms !important; animation-iteration-count:1 !important; transition-duration:.001ms !important; }
    .reveal { opacity:1 !important; transform:none !important; }
    .marquee-track { animation:none; }
  }
`;

/* ============================================================
   SHARED COMPONENTS
   ============================================================ */
function PlaceXLogo({ size = "md" }) {
  return (
    <div className={`mark ${size === "sm" ? "sm" : ""}`}>
      <svg viewBox="0 0 24 24" fill="none" width={size === "sm" ? 14 : 18} height={size === "sm" ? 14 : 18}>
        <path d="M4 17L11 9L15 13L20 5" stroke="var(--on-crimson)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 5H20V11" stroke="var(--on-crimson)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function Brand({ size = "md" }) {
  return (
    <div className="brand">
      <PlaceXLogo size={size} />
      <div>PlaceX<span className="tag">IITM INTELLIGENCE</span></div>
    </div>
  );
}

function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="icon-btn" onClick={onToggle} aria-label="Toggle theme">
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

/* The one global switch that decides which dataset every page reads
   from — Explore, Placement Days, Compare, Analytics, and My Matches
   all key off this instead of having separate internship pages. */
function ModeSwitch({ mode, onChange }) {
  return (
    <div className="mode-switch">
      <button className={mode === "placements" ? "active" : ""} onClick={() => onChange("placements")}>Placements</button>
      <button className={mode === "internships" ? "active" : ""} onClick={() => onChange("internships")}>Internships</button>
    </div>
  );
}

function CursorGlow() {
  const ref = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canGlow = window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reduced;
    if (!canGlow || !ref.current) return;
    let raf = null;
    const el = ref.current;
    const move = (e) => {
      el.style.opacity = "1";
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.left = e.clientX + "px";
        el.style.top = e.clientY + "px";
      });
    };
    const leave = () => { el.style.opacity = "0"; };
    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mouseleave", leave);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseleave", leave);
    };
  }, []);
  return <div className="cursor-glow" ref={ref} />;
}

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!ref.current) return;
    if (reduced) { ref.current.classList.add("in"); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);
  return ref;
}

function EmptyState({ icon, title, body, action }) {
  return (
    <div className="empty-state">
      {icon}
      <h3>{title}</h3>
      <p>{body}</p>
      {action && <div style={{ marginTop: 18 }}>{action}</div>}
    </div>
  );
}

/* ============================================================
   LANDING PAGE
   ============================================================ */
function Trajectory() {
  return (
    <div className="trajectory">
      <svg viewBox="0 0 900 190" preserveAspectRatio="none">
        <defs>
          <linearGradient id="pxAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--crimson)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--crimson)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="traj-area" d="M0,164 L110,145 L230,153 L360,102 L500,113 L640,58 L780,71 L900,22 L900,190 L0,190 Z" />
        <path className="traj-line" d="M0,164 L110,145 L230,153 L360,102 L500,113 L640,58 L780,71 L900,22" />
      </svg>
    </div>
  );
}

function LandingPage({ theme, onToggleTheme, onGetStarted }) {
  const qRef = useReveal(), hRef = useReveal(), fRef = useReveal(), cRef = useReveal();
  return (
    <>
      <header className="land-header">
        <nav className="land-nav">
          <Brand />
          <div className="land-nav-links">
            <a href="#questions-anchor" onClick={(e) => { e.preventDefault(); document.getElementById("questions-anchor")?.scrollIntoView({ behavior: "smooth" }); }}>Product</a>
            <a href="#how-anchor" onClick={(e) => { e.preventDefault(); document.getElementById("how-anchor")?.scrollIntoView({ behavior: "smooth" }); }}>How it works</a>
            <a href="#features-anchor" onClick={(e) => { e.preventDefault(); document.getElementById("features-anchor")?.scrollIntoView({ behavior: "smooth" }); }}>Features</a>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <button className="btn btn-primary btn-sm" onClick={onGetStarted}>Get started</button>
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-glow" />
        <div className="wrap">
          <span className="eyebrow">Built for IIT Madras placements</span>
          <h1>Stop guessing.<br />Know where you <span className="accent">fit.</span></h1>
          <p className="lede">PlaceX pulls every placement day, role and eligibility rule into one dashboard — so you spend less time cross-checking PDFs, and more time preparing for the companies that actually want you.</p>
          <div className="hero-ctas">
            <button className="btn btn-primary" onClick={onGetStarted}>Get started</button>
            <a href="#how-anchor" className="btn btn-ghost" onClick={(e) => { e.preventDefault(); document.getElementById("how-anchor")?.scrollIntoView({ behavior: "smooth" }); }}>See how it works</a>
          </div>
          <div className="hero-caption">NO SPREADSHEETS &nbsp;·&nbsp; NO GUESSWORK &nbsp;·&nbsp; ONE DASHBOARD</div>
          <Trajectory />
        </div>
      </section>

      <div className="marquee-section">
        <div className="marquee-track">
          <span>
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <span>COMPANY DISCOVERY</span><span>ELIGIBILITY MATCHING</span><span>DSA ROADMAPS</span>
                <span>LIVE ANALYTICS</span><span>SIDE-BY-SIDE COMPARE</span><span>ASK PLACEX AI</span>
              </React.Fragment>
            ))}
          </span>
        </div>
      </div>

      <section className="block" id="questions-anchor">
        <div className="wrap">
          <div className="block-head reveal" ref={qRef}>
            <span className="eyebrow">The PlaceX method</span>
            <h2>Four questions. One dashboard.</h2>
            <p>Every screen in PlaceX exists to answer one of these — in the order you'll actually ask them.</p>
          </div>
          <div className="questions-grid reveal in">
            <div className="q-card"><div className="q-num">01</div><h3>Where do I fit?</h3><p>Branch, CGPA, year and role, matched against every company's real eligibility rules.</p></div>
            <div className="q-card"><div className="q-num">02</div><h3>What should I target?</h3><p>Compare companies, roles, packages and placement days before you commit your shortlist.</p></div>
            <div className="q-card"><div className="q-num">03</div><h3>What should I prepare?</h3><p>DSA, SQL, systems and company-specific prep, mapped to the gaps that matter for your targets.</p></div>
            <div className="q-card"><div className="q-num">04</div><h3>How am I progressing?</h3><p>Problems solved, roadmap completion and match quality — tracked in one place, over time.</p></div>
          </div>
        </div>
      </section>

      <section className="block" id="how-anchor" style={{ background: "var(--bg-elev)" }}>
        <div className="wrap">
          <div className="block-head reveal" ref={hRef}>
            <span className="eyebrow">Getting started</span>
            <h2>From profile to placement.</h2>
            <p>Three steps. You do the first one once — PlaceX handles the rest.</p>
          </div>
          <div className="how-steps reveal in">
            <div className="step"><div className="step-index">01</div><div><h3>Tell PlaceX about you</h3><p>Branch, CGPA, graduation year and the roles you're aiming for. Under two minutes, and you won't be asked again.</p></div></div>
            <div className="step"><div className="step-index">02</div><div><h3>See where you actually fit</h3><p>Real eligibility, not guesswork — every company and role checked against your profile, with the reasoning shown.</p></div></div>
            <div className="step"><div className="step-index">03</div><div><h3>Prepare with a plan</h3><p>A roadmap built from the gap between where you are and what your target companies expect — DSA, SQL, systems, all of it.</p></div></div>
          </div>
        </div>
      </section>

      <section className="block" id="features-anchor">
        <div className="wrap">
          <div className="block-head reveal" ref={fRef}>
            <span className="eyebrow">What's inside</span>
            <h2>Everything placement season needs, in one place.</h2>
          </div>
          <div className="features-grid reveal in">
            <div className="f-card"><div className="f-icon"><Compass size={18} /></div><h3>Explore companies</h3><p>Every role and placement day, filterable by exactly what you're eligible for.</p></div>
            <div className="f-card"><div className="f-icon"><Target size={18} /></div><h3>My matches</h3><p>A ranked list of companies you fit, and the ones just out of reach — with the reason why.</p></div>
            <div className="f-card"><div className="f-icon"><GitCompare size={18} /></div><h3>Compare</h3><p>Put two companies or roles side by side before you decide where to put your energy.</p></div>
            <div className="f-card"><div className="f-icon"><Code2 size={18} /></div><h3>Preparation &amp; DSA</h3><p>Roadmaps for DSA, SQL and systems, with progress that survives a refresh.</p></div>
            <div className="f-card"><div className="f-icon"><BarChart3 size={18} /></div><h3>Analytics</h3><p>Package distributions and placement-day trends, calculated from the real dataset — never invented.</p></div>
            <div className="f-card"><div className="f-icon"><Sparkles size={18} /></div><h3>Ask PlaceX AI</h3><p>Ask what to prepare, who's hiring for your branch, or where the highest packages are.</p></div>
          </div>
        </div>
      </section>

      <section className="cta-band reveal in" ref={cRef}>
        <div className="wrap">
          <span className="eyebrow" style={{ justifyContent: "center" }}>Ready when you are</span>
          <h2>Know where you fit —<br />before placement season decides for you.</h2>
          <button className="btn btn-primary" onClick={onGetStarted}>Get started with PlaceX</button>
        </div>
      </section>

      <footer className="land-foot">
        <div className="wrap foot-inner">
          <div>
            <Brand />
            <div className="foot-fine">Built by students, for students.</div>
          </div>
          <div className="foot-links">
            <a href="#questions-anchor" onClick={(e) => { e.preventDefault(); document.getElementById("questions-anchor")?.scrollIntoView({ behavior: "smooth" }); }}>Product</a>
            <a href="#how-anchor" onClick={(e) => { e.preventDefault(); document.getElementById("how-anchor")?.scrollIntoView({ behavior: "smooth" }); }}>How it works</a>
            <a href="#features-anchor" onClick={(e) => { e.preventDefault(); document.getElementById("features-anchor")?.scrollIntoView({ behavior: "smooth" }); }}>Features</a>
          </div>
        </div>
      </footer>
    </>
  );
}

/* ============================================================
   ONBOARDING
   ============================================================ */
/* Motivational tip shown right after picking current standing —
   different framing per degree/year, since a 3rd-year UG student and a
   final-year M.Tech student are in very different places. */
/* Real date math, not a guess: counts whole months from today to the
   next upcoming November 1st (this year if it hasn't happened yet,
   otherwise next year). November is used since that's when the SDC's
   Day 1 placement cycle traditionally opens. */
/* Real date math: counts whole months from today to a specific upcoming
   November 1st, `yearsAhead` Novembers past the nearest one. yearsAhead=0
   means "the very next November" (i.e. this student places this cycle);
   yearsAhead=1 means "the November after that" (one year further out),
   and so on — this is what makes a 3rd-year's countdown correctly land
   on *their* placement season instead of the season already underway
   for 4th-years. */
function monthsUntilNovember(yearsAhead = 0) {
  const now = new Date();
  let nextNov = new Date(now.getFullYear(), 10, 1); // month 10 = November
  if (nextNov <= now) nextNov = new Date(now.getFullYear() + 1, 10, 1);
  const target = new Date(nextNov.getFullYear() + yearsAhead, 10, 1);
  const months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  return Math.max(months, 0);
}

/* Maps how many years out THIS student's own placement season is —
   a 3rd-year UG student places next year, not this one. */
function yearsUntilOwnPlacementSeason(degree, standing) {
  const isPG = (degree || "").includes("M.Tech") || (degree || "").includes("MS") || (degree || "").includes("Ph.D");
  if (isPG) return standing === "Final year" ? 0 : 1;
  const idx = UG_STANDINGS.indexOf(standing);
  if (idx === -1) return 1;
  return UG_STANDINGS.length - 1 - idx; // 4th/Final=0, 3rd=1, 2nd=2, 1st=3
}

/* Combines the real months-to-THEIR-November countdown with
   year-appropriate framing — the number itself changes based on how
   many placement cycles out this student actually is. */
function standingCountdownLine(degree, standing) {
  const yearsAhead = yearsUntilOwnPlacementSeason(degree, standing);
  const months = monthsUntilNovember(yearsAhead);
  const monthWord = months === 1 ? "month" : "months";
  const isFinal = yearsAhead === 0;
  const isEarly = yearsAhead >= 2;

  if (isFinal) {
    return months <= 2
      ? `Placements are about ${months} ${monthWord} away — this is crunch time. Prioritize DSA, mock interviews, and applying widely.`
      : `About ${months} ${monthWord} until placement season (November) — use every week deliberately, this is your year.`;
  }
  if (isEarly) {
    return `Your placement season (November) is roughly ${months} ${monthWord} out — you have real runway to build fundamentals before it's your turn.`;
  }
  return `Around ${months} ${monthWord} until your placement season (November) opens — a good time to lock in the 2–3 skills you want to go deep on.`;
}

const UG_STANDINGS = ["1st year", "2nd year", "3rd year", "4th year / Final year"];
const PG_STANDINGS = ["1st year", "Final year"];

function Onboarding({ onComplete, initialProfile }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialProfile || {
    name: "", branch: "", degree: "B.Tech", standing: "3rd year", cgpa: "", year: SUPPORTED_YEARS[SUPPORTED_YEARS.length - 1],
    targetRoles: [], skills: "",
  });
  const steps = ["Basics", "Branch & CGPA", "Target roles"];
  const toggleRole = (r) => {
    setForm((f) => ({ ...f, targetRoles: f.targetRoles.includes(r) ? f.targetRoles.filter((x) => x !== r) : [...f.targetRoles, r] }));
  };
  const canNext = step === 0 ? form.name.trim().length > 0
    : step === 1 ? form.branch && form.cgpa !== "" && !isNaN(parseFloat(form.cgpa))
    : true;

  const finish = () => {
    onComplete({ ...form, cgpa: parseFloat(form.cgpa) });
  };

  return (
    <div className="onb-wrap">
      <div style={{ marginBottom: 28 }}><Brand /></div>
      <div className="onb-progress">
        {steps.map((_, i) => <span key={i} className={i <= step ? "done" : ""} />)}
      </div>
      <div className="onb-card">
        {step === 0 && (
          <>
            <h2>Let's set up your profile.</h2>
            <p>One-time setup — PlaceX will remember this.</p>
            <p style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 4 }}>Only you can see what you enter here — it's stored on this device, not shared with anyone.</p>
            <div className="field">
              <label>Your name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter your name" autoFocus />
            </div>
            <div className="field">
              <label>Placement year</label>
              <select value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })}>
                {SUPPORTED_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2>Branch and CGPA.</h2>
            <p>This drives every eligibility check in PlaceX.</p>
            <div className="field">
              <label>Degree</label>
              <select value={form.degree || "B.Tech"} onChange={(e) => setForm({ ...form, degree: e.target.value, standing: (e.target.value.includes("M.Tech") || e.target.value.includes("MS") || e.target.value.includes("Ph.D")) ? "1st year" : "3rd year" })}>
                {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 6 }}>Used alongside your branch and CGPA to calculate real eligibility, based on degree-level data extracted from the Bluebook.</p>
            </div>
            <div className="field">
              <label>Current year</label>
              <select value={form.standing || "3rd year"} onChange={(e) => setForm({ ...form, standing: e.target.value })}>
                {((form.degree || "").includes("M.Tech") || (form.degree || "").includes("MS") || (form.degree || "").includes("Ph.D") ? PG_STANDINGS : UG_STANDINGS).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {standingCountdownLine(form.degree, form.standing) && (
                <p style={{ fontSize: 12, color: "var(--crimson)", marginTop: 6 }}>{standingCountdownLine(form.degree, form.standing)}</p>
              )}
            </div>
            <div className="field">
              <label>Branch</label>
              <select value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                <option value="">Select your branch</option>
                {CANONICAL_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="field">
              <label>CGPA</label>
              <input type="number" step="0.01" min="0" max="10" value={form.cgpa} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} placeholder="e.g. 8.20" />
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2>What are you targeting?</h2>
            <p>Optional — you can change this anytime in Settings.</p>
            <div className="field">
              <label>Target roles</label>
              <div className="chip-row">
                {ROLE_CATEGORIES.map((r) => (
                  <button key={r} type="button" className={`chip ${form.targetRoles.includes(r) ? "active" : ""}`} onClick={() => toggleRole(r)}>{r}</button>
                ))}
              </div>
            </div>
            <div className="field">
              <label>Skills (optional)</label>
              <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} placeholder="e.g. Python, React, SQL" />
            </div>
          </>
        )}
        <div className="onb-actions">
          {step > 0 ? <button className="btn btn-ghost btn-sm" onClick={() => setStep(step - 1)}><ArrowLeft size={14} /> Back</button> : <span />}
          {step < steps.length - 1
            ? <button className="btn btn-primary btn-sm" disabled={!canNext} onClick={() => setStep(step + 1)}>Continue <ChevronRight size={14} /></button>
            : <button className="btn btn-primary btn-sm" onClick={finish}>Finish setup <Check size={14} /></button>}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   APP SHELL — sidebar, topbar, bottom nav, search, AI
   ============================================================ */
const NAV_ITEMS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "explore", label: "Explore Companies", icon: Compass },
  { id: "saved", label: "Saved Companies", icon: Bookmark },
  { id: "matches", label: "My Matches", icon: Target },
  { id: "placement-days", label: "Placement Days", icon: Calendar },
  { id: "preparation", label: "Preparation", icon: GraduationCap },
  { id: "dsa", label: "DSA", icon: Code2 },
  { id: "compare", label: "Compare", icon: GitCompare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "games", label: "Games", icon: Gamepad2 },
];

function Sidebar({ page, onNav }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><Brand /></div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <a key={item.id} className={`sidebar-link ${active ? "active" : ""}`} href={`#/${item.id}`} onClick={(e) => { e.preventDefault(); onNav(item.id); }}>
              <Icon size={17} /> {item.label}
            </a>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        <a className={`sidebar-link ${page === "settings" ? "active" : ""}`} href="#/settings" onClick={(e) => { e.preventDefault(); onNav("settings"); }}>
          <SettingsIcon size={17} /> Settings
        </a>
      </div>
    </aside>
  );
}

const MOBILE_PRIMARY = ["home", "explore", "matches", "dsa"];

function BottomNav({ page, onNav }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const primaryIds = new Set(MOBILE_PRIMARY);
  const primaryItems = NAV_ITEMS.filter((n) => primaryIds.has(n.id));
  const moreItems = [...NAV_ITEMS.filter((n) => !primaryIds.has(n.id)), { id: "settings", label: "Settings", icon: SettingsIcon }];
  const isMoreActive = moreItems.some((m) => m.id === page);

  return (
    <>
      <nav className="bottom-nav">
        {primaryItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={page === id ? "active" : ""} onClick={() => onNav(id)}>
            <Icon size={20} /><span>{label === "Explore Companies" ? "Explore" : label === "My Matches" ? "Matches" : label}</span>
          </button>
        ))}
        <button className={isMoreActive ? "active" : ""} onClick={() => setMoreOpen(true)}>
          <Menu size={20} /><span>More</span>
        </button>
      </nav>
      {moreOpen && (
        <div className="modal-backdrop" style={{ alignItems: "flex-end", padding: 0 }} onClick={() => setMoreOpen(false)}>
          <div className="more-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="more-sheet-handle" />
            <div className="more-sheet-grid">
              {moreItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`more-sheet-item ${page === id ? "active" : ""}`}
                  onClick={() => { onNav(id); setMoreOpen(false); }}
                >
                  <Icon size={22} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SearchModal({ onClose, onNav }) {
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(qInput), 120);
    return () => clearTimeout(t);
  }, [qInput]);
  const results = useMemo(() => runSearch(q), [q]);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const go = (r) => {
    if (r.type === "prep") onNav("roadmap", r.data.id);
    else if (r.type === "dsa-topic") onNav("dsa");
    else if (r.type === "dsa-problem") onNav("dsa-problem", r.data.id);
    else if (r.type === "company" || r.type === "role") onNav("company", r.data.id);
    else if (r.type === "day") onNav("placement-days");
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <SearchIcon size={16} color="var(--text-faint)" />
          <input
            ref={inputRef}
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); if (e.key === "Enter" && results[0]) go(results[0]); }}
            placeholder="Search companies, roles, Day 1.1, DSA topics…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text)", fontSize: 15, fontFamily: "inherit" }}
          />
          <button className="icon-btn" onClick={onClose}><X size={15} /></button>
        </div>
        <div className="modal-body">
          {q.trim() === "" && <div style={{ padding: "24px 16px", color: "var(--text-faint)", fontSize: 13.5 }}>Search across companies, roles, placement days, and preparation content.</div>}
          {q.trim() !== "" && results.length === 0 && (
            <div style={{ padding: "24px 16px", color: "var(--text-faint)", fontSize: 13.5 }}>NO RESULTS FOUND for "{q}"</div>
          )}
          {results.map((r, i) => (
            <div key={i} className="search-result" style={{ cursor: "pointer" }} onClick={() => go(r)}>
              <div>
                <div style={{ fontSize: 14 }}>{r.label}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-faint)" }}>{r.sub}</div>
              </div>
              <span className="badge-type" style={{ marginLeft: "auto" }}>{r.type.replace("-", " ")}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const AI_QUICK_PROMPTS = ["Eligible companies", "Top opportunities", "Highest packages", "Software engineering prep", "DSA topics to focus on", "Role recommendations"];

function AIPanel({ profile, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: PLACEX_DATA.companies.length === 0
      ? "Hi! I'm PlaceX AI. Placement data hasn't been loaded into PlaceX yet, so I can't look up specific companies right now — but I can help with general prep strategy, what to study, and how to use the app. What's on your mind?"
      : "Hi! I'm PlaceX AI. Ask me about eligible companies, prep priorities, or anything else about your placement search." }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);

  const send = async (text) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput("");
    setError(false);
    const nextMessages = [...messages, { role: "user", text: query }];
    setMessages(nextMessages);
    setLoading(true);
    try {
      const dataContext = PLACEX_DATA.companies.length === 0
        ? "No placement dataset is loaded yet — do not invent company names, packages, or statistics. Say plainly that data hasn't been imported yet when a question needs it, and instead help with general, honest preparation guidance."
        : `Dataset: ${JSON.stringify(PLACEX_DATA.companies.slice(0, 40))}`;
      const profileContext = profile
        ? `Student profile — name: ${profile.name}, branch: ${profile.branch}, CGPA: ${profile.cgpa}, target roles: ${(profile.targetRoles || []).join(", ") || "none specified"}.`
        : "No profile set up yet.";
      // Calls our own serverless function (api/chat.js), which holds the
      // real Gemini API key server-side. Never call the Gemini API
      // directly from the browser — that would expose the key publicly.
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system: `You are PlaceX AI, a placement-preparation assistant for IIT Madras students inside the PlaceX app. Be concise, direct, and honest — never invent company names, packages, or eligibility figures that aren't in the provided dataset. ${profileContext} ${dataContext}`,
          messages: nextMessages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", text: m.text })),
        }),
      });
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      const reply = data.text || "I couldn't generate a response for that.";
      setMessages((cur) => [...cur, { role: "assistant", text: reply }]);
    } catch (e) {
      setError(true);
      setMessages((cur) => [...cur, { role: "assistant", text: "AI is currently unavailable. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-panel">
      <div className="ai-head">
        <Sparkles size={16} color="var(--crimson)" />
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 14 }}>Ask PlaceX AI</div>
        <button className="icon-btn" style={{ marginLeft: "auto", width: 28, height: 28 }} onClick={onClose}><X size={13} /></button>
      </div>
      <div className="ai-msgs" ref={scrollRef}>
        {messages.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>)}
        {loading && <div className="ai-msg assistant" style={{ display: "flex", alignItems: "center", gap: 8 }}><Loader2 size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} /> Thinking…</div>}
      </div>
      {messages.length < 2 && (
        <div className="ai-quick">
          {AI_QUICK_PROMPTS.map((p) => <button key={p} onClick={() => send(p)}>{p}</button>)}
        </div>
      )}
      <div className="ai-input-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask about prep, roles, eligibility…"
        />
        <button className="btn btn-primary btn-sm" onClick={() => send()} disabled={loading}>Send</button>
      </div>
    </div>
  );
}

/* ============================================================
   PAGES
   ============================================================ */
function PageHead({ title, sub }) {
  return <div className="page-head"><div><h1>{title}</h1>{sub && <p>{sub}</p>}</div></div>;
}

function NoDataEmpty({ title = "No placement data loaded yet", body, action }) {
  return (
    <EmptyState
      icon={<Building2 size={30} />}
      title={title}
      body={body || "PlaceX hasn't been given a placement dataset yet. Once the Bluebook data is imported, this page fills in automatically — nothing here is faked in the meantime."}
      action={action}
    />
  );
}

function HomePage({ profile, saved, dsaProgress, onNav }) {
  const companies = PLACEX_DATA.companies;
  const hasData = companies.length > 0;
  const packages = companies.map((c) => c.compensation?.max_ctc_lpa).filter((v) => typeof v === "number");
  const highest = packages.length ? Math.max(...packages) : null;
  const average = packages.length ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1) : null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const tip = profile ? standingCountdownLine(profile.degree, profile.standing) : "";
  const roleCounts = useMemo(() => {
    const counts = {};
    companies.forEach((c) => { const r = classifyRole(c); counts[r] = (counts[r] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [companies]);
  const topCompanies = useMemo(
    () => [...companies].filter((c) => typeof c.compensation?.max_ctc_lpa === "number").sort((a, b) => b.compensation.max_ctc_lpa - a.compensation.max_ctc_lpa).slice(0, 6),
    [companies]
  );

  return (
    <div className="page">
      <PageHead title={`${greeting}${profile ? `, ${profile.name.split(" ")[0]}` : ""}.`} sub={profile ? `${profile.degree || "B.Tech"} · ${profile.standing || ""} · ${profile.branch} · CGPA ${profile.cgpa} · Class of ${profile.year}` : "Your placement command center."} />

      {tip && (
        <div className="card home-hero">
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--crimson)", letterSpacing: ".04em", marginBottom: 4 }}>{profile.standing?.toUpperCase()}</div>
          <div style={{ fontSize: 14, color: "var(--text-dim)" }}>{tip}</div>
        </div>
      )}

      <div className="metric-grid">
        <div className="metric-card metric-clickable" onClick={() => onNav("explore")}><div className="label">Companies to explore</div><div className="value">{hasData ? companies.length : "—"}</div></div>
        <div className="metric-card metric-clickable" onClick={() => onNav("analytics")}><div className="label">Highest package</div><div className="value">{highest ? `${highest} LPA` : "—"}</div></div>
        <div className="metric-card metric-clickable" onClick={() => onNav("analytics")}><div className="label">Average package</div><div className="value">{average ? `${average} LPA` : "—"}</div></div>
        <div className="metric-card metric-clickable" onClick={() => onNav("saved")}><div className="label">Saved companies</div><div className="value">{saved.length}</div></div>
        <div className="metric-card metric-clickable" onClick={() => onNav("games")}><div className="label">Need a break?</div><div className="value" style={{ fontSize: 18 }}>Play a game</div></div>
        <div className="metric-card"><div className="label">Students using PlaceX</div><div className="value">1</div></div>
      </div>

      {hasData && topCompanies.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-faint)" }}>TOP COMPANIES BY PACKAGE</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav("explore")}>View all <ArrowUpRight size={12} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {topCompanies.map((c) => (
              <CompanyCard key={c.id} company={c} isSaved={saved.some((s) => s.id === c.id)} onNav={onNav} />
            ))}
          </div>
        </div>
      )}

      {hasData && roleCounts.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-faint)", marginBottom: 8 }}>POPULAR ROLES RIGHT NOW</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {roleCounts.map(([role, count]) => (
              <button key={role} className="role-pill" onClick={() => onNav("explore")}>{role} ({count})</button>
            ))}
          </div>
        </div>
      )}

      {!hasData && (
        <NoDataEmpty
          title="Activate PlaceX with real placement data"
          body="Import the Bluebook dataset to see your eligible companies, top matches, and package stats here — calculated live from your profile, never hardcoded."
          action={<button className="btn btn-primary btn-sm" onClick={() => onNav("settings")}>Go to Settings</button>}
        />
      )}
    </div>
  );
}

function BackNextBar({ onBack, onNext, nextDisabled, nextLabel = "Next" }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
      <button className="btn btn-ghost btn-sm" onClick={onBack}><ArrowLeft size={14} /> Back</button>
      {onNext && (
        <button className="btn btn-ghost btn-sm" onClick={onNext} disabled={nextDisabled} style={nextDisabled ? { opacity: 0.45, cursor: "default" } : undefined}>
          {nextDisabled ? "Last item" : <>{nextLabel} <ArrowUpRight size={14} style={{ transform: "rotate(45deg)" }} /></>}
        </button>
      )}
    </div>
  );
}

function CompanyGrid({ companies, saved, onToggleSave, onNav, matchStatus, pageSize = 24 }) {
  const [shown, setShown] = useState(pageSize);
  useEffect(() => { setShown(pageSize); }, [companies]);
  const visible = companies.slice(0, shown);
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
        {visible.map((c) => (
          <CompanyCard key={c.id} company={c} isSaved={saved.some((s) => s.id === c.id)} onToggleSave={onToggleSave} onNav={onNav} matchStatus={matchStatus} />
        ))}
      </div>
      {shown < companies.length && (
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShown((s) => s + pageSize)}>
            Show more ({companies.length - shown} remaining)
          </button>
        </div>
      )}
    </>
  );
}

function CompanyCard({ company, isSaved, onToggleSave, onNav, matchStatus }) {
  const lpa = company.compensation?.max_ctc_lpa;
  const roleCategory = classifyRole(company);
  return (
    <div className="card company-card" style={{ padding: 16, cursor: "pointer" }} onClick={() => onNav("company", company.id)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>{company.company}</div>
          <div style={{ color: "var(--text-dim)", fontSize: 13, marginTop: 2 }}>{company.profile}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {company.isInternship && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 7px", borderRadius: 999, background: company.internshipType === "iddd" ? "var(--crimson)" : "var(--surface-2)", color: company.internshipType === "iddd" ? "var(--on-crimson)" : "var(--text-faint)" }}>
              {company.internshipType === "iddd" ? "IDDD" : "REGULAR"}
            </span>
          )}
          {onToggleSave && (
            <button
              className="icon-btn"
              aria-label={isSaved ? "Unsave" : "Save"}
              onClick={(e) => { e.stopPropagation(); onToggleSave(company); }}
            >
              <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
            </button>
          )}
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, fontSize: 12.5, color: "var(--text-dim)" }}>
        {company.location && <span style={{ display: "flex", alignItems: "center", gap: 4 }}><MapPin size={12} /> {company.location}</span>}
        {typeof lpa === "number" && <span>{lpa} LPA</span>}
        {company.isInternship && company.stipendLabel && <span style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{company.stipendLabel}</span>}
        {company.cgpa?.status === "known" && <span>CGPA ≥ {company.cgpa.min}</span>}
        <span>{company.placementYear}</span>
        {company.placementDay && <span>Day {company.placementDay}</span>}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
        <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "var(--surface-2)", color: "var(--text-faint)" }}>{roleCategory}</span>
        {typeof company.test === "boolean" && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "var(--surface-2)", color: "var(--text-faint)" }}>Test {company.test ? "✓" : "—"}</span>}
        {typeof company.gd === "boolean" && <span style={{ fontSize: 11, padding: "3px 9px", borderRadius: 999, background: "var(--surface-2)", color: "var(--text-faint)" }}>GD {company.gd ? "✓" : "—"}</span>}
      </div>
      {matchStatus && (
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: matchStatus === "eligible" ? "var(--good)" : "var(--text-faint)" }}>
          {matchStatus === "eligible" ? "Matches your profile" : "Worth preparing for"}
        </div>
      )}
    </div>
  );
}

function ExplorePage({ saved, onToggleSave, onNav, profile, mode }) {
  const [filters, setFilters] = useState({ year: "", role: "", branch: "", minLpa: "", cgpaMax: "", eligibleOnly: false, q: "", internshipType: "" });
  const [qInput, setQInput] = useState("");
  const companies = mode === "internships" ? internshipDatasetFor(filters.internshipType) : PLACEX_DATA.companies;

  // Debounce the free-text search so typing doesn't re-render up to 327
  // cards on every keystroke — only filters ~150ms after typing pauses.
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, q: qInput })), 150);
    return () => clearTimeout(t);
  }, [qInput]);
  // Reset filters that don't apply across a mode switch (e.g. minLpa has
  // no meaning for internship stipends yet).
  useEffect(() => { setFilters((f) => ({ ...f, minLpa: "", internshipType: "" })); }, [mode]);

  const roleCounts = useMemo(() => {
    const counts = {};
    ROLE_CATEGORIES.forEach((r) => (counts[r] = 0));
    companies.forEach((c) => { const r = classifyRole(c); counts[r] = (counts[r] || 0) + 1; });
    return counts;
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (filters.year && c.placementYear !== filters.year) return false;
      if (filters.role && classifyRole(c) !== filters.role) return false;
      if (filters.branch && !(c.eligibleAllBranches || (c.eligibleBranches || []).includes(filters.branch))) return false;
      if (mode === "placements" && filters.minLpa && !((c.compensation?.max_ctc_lpa || 0) >= Number(filters.minLpa))) return false;
      if (filters.cgpaMax && !(c.cgpa?.status === "known" && c.cgpa.min <= Number(filters.cgpaMax))) return false;
      if (filters.eligibleOnly && (!profile || computeMatch(profile, c).status !== "eligible")) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        const hay = `${c.company} ${c.profile} ${c.location || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [companies, filters, profile]);

  return (
    <div className="page">
      <PageHead
        title={mode === "internships" ? "Explore internships" : "Explore companies"}
        sub={mode === "internships" ? "Regular Bluebook + IDDD internships — filtered by what fits you." : "Every role, filtered by what you're eligible for."}
      />

      {mode === "internships" && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button className="role-pill" style={{ fontWeight: !filters.internshipType ? 700 : 400, borderColor: !filters.internshipType ? "var(--crimson)" : "var(--border)" }} onClick={() => setFilters({ ...filters, internshipType: "" })}>All Internships ({internshipDatasetFor().length})</button>
          <button className="role-pill" style={{ fontWeight: filters.internshipType === "regular" ? 700 : 400, borderColor: filters.internshipType === "regular" ? "var(--crimson)" : "var(--border)" }} onClick={() => setFilters({ ...filters, internshipType: "regular" })}>Regular ({internshipDatasetFor("regular").length})</button>
          <button className="role-pill" style={{ fontWeight: filters.internshipType === "iddd" ? 700 : 400, borderColor: filters.internshipType === "iddd" ? "var(--crimson)" : "var(--border)" }} onClick={() => setFilters({ ...filters, internshipType: "iddd" })}>IDDD ({internshipDatasetFor("iddd").length})</button>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-faint)", marginBottom: 8 }}>EXPLORE BY ROLE</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="role-pill"
            style={{ fontWeight: filters.role === "" ? 700 : 400, borderColor: filters.role === "" ? "var(--crimson)" : "var(--border)" }}
            onClick={() => setFilters({ ...filters, role: "" })}
          >All roles ({companies.length})</button>
          {ROLE_CATEGORIES.map((r) => (
            <button
              key={r}
              className="role-pill"
              style={{ fontWeight: filters.role === r ? 700 : 400, borderColor: filters.role === r ? "var(--crimson)" : "var(--border)" }}
              onClick={() => setFilters({ ...filters, role: filters.role === r ? "" : r })}
            >{r} ({roleCounts[r] || 0})</button>
          ))}
        </div>
      </div>

      <input
        placeholder="Search company or role..."
        value={qInput}
        onChange={(e) => setQInput(e.target.value)}
        style={{ width: "100%", marginBottom: 12, padding: "10px 14px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
      />

      <div className="filter-bar">
        <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
          <option value="">All years</option>
          {[...new Set(companies.map((c) => c.placementYear))].sort().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })}>
          <option value="">All branches</option>
          {CANONICAL_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        {mode === "placements" && <input type="number" placeholder="Min LPA" value={filters.minLpa} onChange={(e) => setFilters({ ...filters, minLpa: e.target.value })} style={{ width: 90 }} />}
        <select value={filters.cgpaMax} onChange={(e) => setFilters({ ...filters, cgpaMax: e.target.value })}>
          <option value="">CGPA cutoff: Any</option>
          <option value="6.0">≤ 6.0</option>
          <option value="6.5">≤ 6.5</option>
          <option value="7.0">≤ 7.0</option>
          <option value="7.5">≤ 7.5</option>
          <option value="8.0">≤ 8.0</option>
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
          <input type="checkbox" checked={filters.eligibleOnly} onChange={(e) => setFilters({ ...filters, eligibleOnly: e.target.checked })} /> Eligible for me
        </label>
        <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ year: "", role: "", branch: "", minLpa: "", cgpaMax: "", eligibleOnly: false, q: "" }); setQInput(""); }}>Clear filters</button>
      </div>

      {filters.eligibleOnly && profile && (
        <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginBottom: 12 }}>
          Showing {filtered.length} companies matching your selected filters.
        </div>
      )}

      {companies.length === 0 ? (
        <NoDataEmpty body="No companies to explore yet — once placement data is imported, cards for every role appear here with save, compare, and prepare actions." />
      ) : filtered.length === 0 ? (
        <NoDataEmpty title="No companies found" body="Try changing your filters." />
      ) : (
        <div style={{ marginTop: 16 }}>
          <CompanyGrid companies={filtered} saved={saved} onToggleSave={onToggleSave} onNav={onNav} matchStatus={filters.eligibleOnly && profile ? "eligible" : undefined} />
        </div>
      )}
    </div>
  );
}

function SavedPage({ saved, onRemove, onNav }) {
  return (
    <div className="page">
      <PageHead title="Saved companies" sub="Persisted to your PlaceX account." />
      {saved.length === 0
        ? <NoDataEmpty icon={<Bookmark size={30} />} title="No saved companies yet" body="Save companies from Explore or My Matches to track them here." action={<button className="btn btn-primary btn-sm" onClick={() => onNav("explore")}>Explore companies</button>} />
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {saved.map((s) => (
              <CompanyCard key={s.id} company={s} isSaved={true} onToggleSave={() => onRemove(s.id)} onNav={onNav} />
            ))}
          </div>}
    </div>
  );
}

function MatchesPage({ profile, saved, onToggleSave, onNav, mode }) {
  const companies = mode === "internships" ? internshipDatasetFor() : PLACEX_DATA.companies;
  const groups = useMemo(() => {
    if (!profile) return null;
    const matchesNow = [];
    const worthPreparingFor = [];
    companies.forEach((c) => {
      const m = computeMatch(profile, c);
      (m.status === "eligible" ? matchesNow : worthPreparingFor).push(c);
    });
    return { matchesNow, worthPreparingFor };
  }, [companies, profile]);

  return (
    <div className="page">
      <PageHead title="My matches" sub={profile ? "Companies that match your preferences right now — explore what you can target, and what to prepare for." : "Complete onboarding to see personalized matches."} />
      {companies.length === 0 ? (
        <NoDataEmpty icon={<Target size={30} />} body="Matches are calculated live from your profile against real eligibility rules — there's just no dataset loaded to match against yet." />
      ) : !profile ? (
        <NoDataEmpty icon={<Target size={30} />} title="No profile yet" body="Complete onboarding so PlaceX knows your branch and CGPA." action={<button className="btn btn-primary btn-sm" onClick={() => onNav("settings")}>Set up profile</button>} />
      ) : (
        <>
          <h3 style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 10 }}>Matches you can target now ({groups.matchesNow.length})</h3>
          {groups.matchesNow.length === 0 ? (
            <p style={{ color: "var(--text-faint)", fontSize: 13, marginBottom: 20 }}>Nothing matches your current branch/CGPA in this dataset yet — check what's worth preparing for below.</p>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <CompanyGrid companies={groups.matchesNow} saved={saved} onToggleSave={onToggleSave} onNav={onNav} />
            </div>
          )}
          <h3 style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 6 }}>Worth preparing for ({groups.worthPreparingFor.length})</h3>
          <p style={{ fontSize: 12.5, color: "var(--text-faint)", marginBottom: 10 }}>These need a higher CGPA, a different branch, or a degree level than your current profile — some of that can still change.</p>
          <CompanyGrid companies={groups.worthPreparingFor} saved={saved} onToggleSave={onToggleSave} onNav={onNav} />
        </>
      )}
    </div>
  );
}

function PlacementDaysPage({ saved, onToggleSave, onNav, mode }) {
  const companies = mode === "internships" ? internshipDatasetFor() : PLACEX_DATA.companies;
  const hasDayData = companies.some((c) => c.placementDay);
  const [filters, setFilters] = useState({ year: "", role: "", branch: "", minLpa: "", q: "" });

  const filtered = useMemo(() => {
    return companies.filter((c) => {
      if (filters.year && c.placementYear !== filters.year) return false;
      if (filters.role && classifyRole(c) !== filters.role) return false;
      if (filters.branch && !(c.eligibleAllBranches || (c.eligibleBranches || []).includes(filters.branch))) return false;
      if (filters.minLpa && !((c.compensation?.max_ctc_lpa || 0) >= Number(filters.minLpa))) return false;
      if (filters.q) {
        const q = filters.q.toLowerCase();
        if (!`${c.company} ${c.profile}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [companies, filters]);

  const byDay = useMemo(() => {
    if (!hasDayData) return [];
    const groups = {};
    filtered.forEach((c) => {
      if (!c.placementDay) return;
      (groups[c.placementDay] = groups[c.placementDay] || []).push(c);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }));
  }, [filtered, hasDayData]);

  const byYear = useMemo(() => {
    const groups = {};
    filtered.forEach((c) => {
      const key = c.placementYear || "Year unavailable";
      (groups[key] = groups[key] || []).push(c);
    });
    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const FilterBar = (
    <div className="filter-bar">
      <input placeholder="Search company or role..." value={filters.q} onChange={(e) => setFilters({ ...filters, q: e.target.value })} style={{ minWidth: 200 }} />
      <select value={filters.year} onChange={(e) => setFilters({ ...filters, year: e.target.value })}>
        <option value="">All years</option>
        {[...new Set(companies.map((c) => c.placementYear))].sort().map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
        <option value="">All roles</option>
        {ROLE_CATEGORIES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <select value={filters.branch} onChange={(e) => setFilters({ ...filters, branch: e.target.value })}>
        <option value="">All branches</option>
        {CANONICAL_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
      </select>
      <input type="number" placeholder="Min LPA" value={filters.minLpa} onChange={(e) => setFilters({ ...filters, minLpa: e.target.value })} style={{ width: 90 }} />
      <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ year: "", role: "", branch: "", minLpa: "", q: "" })}>Clear filters</button>
    </div>
  );

  return (
    <div className="page">
      <PageHead
        title={mode === "internships" ? "Internship timeline" : "Placement days"}
        sub={mode === "internships" ? "Browse internships by year — day-of-visit data isn't in the internship Bluebooks." : "Browse companies by the day they're on campus."}
      />
      {companies.length === 0 ? (
        <NoDataEmpty icon={<Calendar size={30} />} body="Placement groupings will appear here as soon as real Bluebook data is imported." />
      ) : hasDayData ? (
        <>
          {FilterBar}
          {byDay.length === 0 && <NoDataEmpty title="No companies match these filters" body="Try clearing a filter." />}
          {byDay.map(([day, list]) => (
            <div key={day} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 10 }}>Day {day} ({list.length})</h3>
              <CompanyGrid companies={list} saved={saved} onToggleSave={onToggleSave} onNav={onNav} />
            </div>
          ))}
        </>
      ) : (
        <>
          <div className="card" style={{ padding: 14, marginBottom: 20, fontSize: 12.5, color: "var(--text-dim)" }}>
            The two Bluebooks that were imported don't record which day each company visited campus — only placement year. This page is already wired to build a real Day 1.1 / Day 1.2 / etc. browser (with role, branch, package, and company filters) the moment any record includes a <code>placementDay</code> field — that just needs a source file that actually contains day-of-visit data. Until then, here's every company grouped by placement year instead, so nothing is fabricated.
          </div>
          {FilterBar}
          {byYear.length === 0 && <NoDataEmpty title="No companies match these filters" body="Try clearing a filter." />}
          {byYear.map(([year, list]) => (
            <div key={year} style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 10 }}>{year} ({list.length})</h3>
              <CompanyGrid companies={list} saved={saved} onToggleSave={onToggleSave} onNav={onNav} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

const DOMAIN_ICONS = {
  dsa: Code2, python: Grid3x3, oop: GitCompare, sql: BarChart3, databases: Building2,
  ml: Sparkles, "deep-learning": Sparkles, "system-design": TrendingUp, "data-analytics": BarChart3,
  os: Info, cn: Compass, statistics: BarChart3, java: Code2, cpp: Code2, cloud: TrendingUp,
  "interview-prep": Target,
};

function PreparationPage({ dsaProgress, roadmapProgress, onNav }) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? PREP_DOMAINS.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()) || d.blurb.toLowerCase().includes(q.toLowerCase()))
    : PREP_DOMAINS;
  return (
    <div className="page">
      <PageHead title="Preparation" sub="Want to learn a skill? Search it, or pick a domain below." />
      <input
        placeholder="Search a skill — e.g. SQL, Machine Learning, System Design…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ width: "100%", marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)", fontSize: 14 }}
      />
      {filtered.length === 0 && <NoDataEmpty title="No matching skill" body="Try a different search term." />}
      <div className="domain-grid">
        {filtered.map((d) => {
          let pct;
          if (d.id === "dsa") {
            const solvedCount = Object.values(dsaProgress.statuses || {}).filter((s) => s === "solved").length;
            pct = DSA_PROBLEMS.length ? Math.round((solvedCount / DSA_PROBLEMS.length) * 100) : 0;
          } else {
            const phases = 4; // Fundamentals, Core concepts, Applied problems, Interview-style questions
            const done = Object.values(roadmapProgress[d.id] || {}).filter(Boolean).length;
            pct = Math.round((done / phases) * 100);
          }
          const Icon = DOMAIN_ICONS[d.id] || GraduationCap;
          return (
            <div key={d.id} className="domain-card" onClick={() => onNav("roadmap", d.id)} style={{ cursor: "pointer" }}>
              <Icon size={20} color="var(--crimson)" style={{ marginBottom: 8 }} />
              <h3>{d.name}</h3>
              <p>{d.blurb}</p>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 8 }}>{pct}% complete</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RoadmapPage({ domainId, onNav, dsaProgress, roadmapProgress, onTogglePhase }) {
  const domain = PREP_DOMAINS.find((d) => d.id === domainId) || PREP_DOMAINS[0];
  const phases = domain.id === "dsa" ? DSA_PHASES : ["Fundamentals", "Core concepts", "Applied problems", "Interview-style questions"];
  const relevantCompanies = useMemo(
    () => PLACEX_DATA.companies.filter((c) => (domain.roles || []).includes(classifyRole(c))),
    [domain]
  );
  const idx = PREP_DOMAINS.findIndex((d) => d.id === domain.id);
  const nextDomain = idx >= 0 ? PREP_DOMAINS[idx + 1] : null;
  const dsaStatuses = dsaProgress?.statuses || {};
  const completedPhases = roadmapProgress?.[domain.id] || {};
  return (
    <div className="page">
      <BackNextBar
        onBack={() => onNav("preparation")}
        onNext={() => nextDomain && onNav("roadmap", nextDomain.id)}
        nextDisabled={!nextDomain}
        nextLabel={nextDomain ? nextDomain.name : "Next"}
      />
      <PageHead title={`${domain.name} roadmap`} sub={domain.blurb} />

      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>Relevant for roles such as</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(domain.roles || []).map((r) => <span key={r} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, background: "var(--surface-2)", color: "var(--text-dim)" }}>{r}</span>)}
        </div>
        {relevantCompanies.length > 0 && (
          <>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 14, marginBottom: 6 }}>Companies with these roles in the current dataset ({relevantCompanies.length})</div>
            <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>
              {relevantCompanies.slice(0, 8).map((c) => c.company).join(", ")}{relevantCompanies.length > 8 ? `, +${relevantCompanies.length - 8} more` : ""}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }} onClick={() => onNav("explore")}>Browse in Explore</button>
          </>
        )}
        {(DOMAIN_RESOURCES[domain.id] || []).length > 0 && (
          <>
            <div style={{ fontWeight: 600, fontSize: 13, marginTop: 14, marginBottom: 8 }}>Learning resources</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {DOMAIN_RESOURCES[domain.id].map((r) => (
                <a key={r.url} href={r.url} target="_blank" rel="noreferrer" className="resource-link">{r.label} <ArrowUpRight size={11} /></a>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="card">
        {phases.map((p, i) => {
          const phaseProblems = domain.id === "dsa" ? DSA_PROBLEMS.filter((pr) => pr.topic === p) : [];
          const solvedInPhase = phaseProblems.filter((pr) => dsaStatuses[pr.id] === "solved").length;
          const isComplete = domain.id === "dsa"
            ? phaseProblems.length > 0 && solvedInPhase === phaseProblems.length
            : !!completedPhases[i];
          return (
            <div className="roadmap-phase" key={p}>
              <div className="phase-connector" />
              <div className="phase-badge" style={isComplete ? { background: "var(--good)", color: "var(--bg)" } : undefined}>
                {isComplete ? <CheckCircle2 size={14} /> : String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5 }}>{p}</div>
                {phaseProblems.length > 0 ? (
                  <>
                    <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>{solvedInPhase} / {phaseProblems.length} solved</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                      {phaseProblems.map((pr) => (
                        <button key={pr.id} className="btn btn-ghost btn-sm" style={{ fontSize: 12, color: dsaStatuses[pr.id] === "solved" ? "var(--good)" : undefined }} onClick={() => onNav("dsa-problem", pr.id)}>{pr.title}</button>
                      ))}
                    </div>
                  </>
                ) : domain.id === "dsa" ? (
                  <div style={{ fontSize: 12, color: "var(--text-faint)", marginTop: 2 }}>No curated problems for this topic yet</div>
                ) : (
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--text-dim)", marginTop: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={isComplete} onChange={() => onTogglePhase(domain.id, i)} /> Mark this stage complete
                  </label>
                )}
              </div>
              {domain.id === "dsa" && phaseProblems.length === 0 && <button className="btn btn-ghost btn-sm" onClick={() => onNav("dsa")}>Open problems</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DSAPage({ dsaProgress, onNav }) {
  const [difficulty, setDifficulty] = useState("");
  const [topic, setTopic] = useState("");
  const statuses = dsaProgress.statuses || {};
  const solved = Object.values(statuses).filter((s) => s === "solved").length;

  const filtered = DSA_PROBLEMS.filter((p) => {
    if (difficulty && p.difficulty !== difficulty) return false;
    if (topic && p.topic !== topic) return false;
    return true;
  });

  return (
    <div className="page">
      <PageHead title="DSA" sub={`${solved} / ${DSA_PROBLEMS.length} problems solved`} />
      <div className="card" style={{ padding: 12, marginBottom: 16, fontSize: 12, color: "var(--text-faint)" }}>
        A curated subset organized in Striver's A2Z order — not the complete ~450-problem sheet. See the full sheet at{" "}
        <a href="https://takeuforward.org/dsa/strivers-a2z-sheet-learn-dsa-a-to-z" target="_blank" rel="noreferrer" style={{ color: "var(--crimson)" }}>takeuforward.org</a>.
      </div>
      <div className="filter-bar">
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">All difficulties</option><option>Easy</option><option>Medium</option><option>Hard</option>
        </select>
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">All topics</option>
          {DSA_PHASES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
        {filtered.map((p) => {
          const status = statuses[p.id] || "not-started";
          return (
            <div key={p.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => onNav("dsa-problem", p.id)}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{p.topic} · {p.difficulty}</div>
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: status === "solved" ? "var(--good)" : status === "attempted" ? "var(--warn)" : "var(--text-faint)" }}>
                {status === "solved" ? "Solved" : status === "attempted" ? "Attempted" : "Not started"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DSAProblemPage({ dsaProgress, onSetStatus, onNav, problemId }) {
  const problem = DSA_PROBLEMS.find((p) => p.id === problemId);
  if (!problem) {
    return (
      <div className="page">
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => onNav("dsa")}><ArrowLeft size={14} /> Back to DSA</button>
        <NoDataEmpty icon={<Code2 size={30} />} title="Problem not found" body="Open a problem from the DSA list." />
      </div>
    );
  }
  const status = (dsaProgress.statuses || {})[problem.id] || "not-started";
  const idx = DSA_PROBLEMS.findIndex((p) => p.id === problem.id);
  const nextProblem = idx >= 0 ? DSA_PROBLEMS[idx + 1] : null;
  return (
    <div className="page">
      <BackNextBar
        onBack={() => onNav("dsa")}
        onNext={() => nextProblem && onNav("dsa-problem", nextProblem.id)}
        nextDisabled={!nextProblem}
        nextLabel={nextProblem ? nextProblem.title : "Next"}
      />
      <PageHead title={problem.title} sub={`${problem.topic} · ${problem.difficulty}`} />
      <div className="card" style={{ padding: 18 }}>
        <p style={{ fontSize: 13.5, color: "var(--text-dim)", marginBottom: 16 }}>
          PlaceX doesn't reproduce problem statements (copyright) or execute code — solve it on LeetCode directly, or copy it into VS Code locally.
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href={problem.url} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm"><ArrowUpRight size={13} /> Practice on LeetCode</a>
          <button className="btn btn-ghost btn-sm" onClick={() => onSetStatus(problem.id, "attempted")}><Play size={13} /> Mark attempted</button>
          <button className="btn btn-ghost btn-sm" onClick={() => onSetStatus(problem.id, "solved")}><CheckCircle2 size={13} /> Mark solved</button>
          {status !== "not-started" && <button className="btn btn-ghost btn-sm" onClick={() => onSetStatus(problem.id, "not-started")}><RotateCcw size={13} /> Reset</button>}
        </div>
        <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-faint)" }}>Current status: <strong style={{ color: status === "solved" ? "var(--good)" : status === "attempted" ? "var(--warn)" : "var(--text-faint)" }}>{status === "not-started" ? "Not started" : status}</strong></div>
      </div>
    </div>
  );
}

function CompanyPicker({ label, companies, valueId, onSelect }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const selected = companies.find((c) => c.id === valueId);
  const matches = useMemo(() => {
    if (!q.trim()) return companies; // show everything on click, not just a sample
    const query = q.toLowerCase();
    return companies.filter((c) => c.company.toLowerCase().includes(query) || (c.profile || "").toLowerCase().includes(query));
  }, [q, companies]);

  return (
    <div style={{ position: "relative" }}>
      <input
        className="compare-select"
        placeholder={label}
        value={open ? q : (selected ? `${selected.company} — ${selected.profile}` : "")}
        onFocus={() => { setOpen(true); setQ(""); }}
        onChange={(e) => setQ(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && (
        <div className="card" style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 20, padding: 6, maxHeight: 320, overflowY: "auto" }}>
          {matches.length === 0 && <div style={{ padding: 10, fontSize: 13, color: "var(--text-faint)" }}>No companies found</div>}
          {!q.trim() && <div style={{ padding: "6px 10px", fontSize: 11, color: "var(--text-faint)" }}>All {companies.length} companies — type to narrow down</div>}
          {matches.map((c) => (
            <div
              key={c.id}
              style={{ padding: "8px 10px", borderRadius: 8, cursor: "pointer", fontSize: 13.5 }}
              onMouseDown={() => { onSelect(c.id); setOpen(false); }}
              className="search-result"
            >
              <div>{c.company}</div>
              <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>{c.profile}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ComparePage({ initialA, mode }) {
  const [a, setA] = useState(initialA || ""), [b, setB] = useState("");
  useEffect(() => { if (initialA) setA(initialA); }, [initialA]);
  const companies = mode === "internships" ? internshipDatasetFor() : PLACEX_DATA.companies;
  useEffect(() => { setA(""); setB(""); }, [mode]);
  const sameError = a && b && a === b;
  return (
    <div className="page">
      <PageHead title="Compare" sub="Search and put any two companies or roles side by side." />
      {companies.length === 0
        ? <NoDataEmpty icon={<GitCompare size={30} />} body="Comparison needs at least two companies in the dataset. Nothing to compare until real placement data is imported." />
        : (
          <>
            <div className="compare-grid">
              <CompanyPicker label="Search company A..." companies={companies} valueId={a} onSelect={setA} />
              <CompanyPicker label="Search company B..." companies={companies} valueId={b} onSelect={setB} />
            </div>
            {sameError && <div style={{ marginTop: 14, color: "var(--crimson)", fontSize: 13.5, display: "flex", gap: 6, alignItems: "center" }}><AlertCircle size={14} /> Pick two different companies to compare.</div>}
            {a && b && !sameError && (() => {
              const compA = companies.find((c) => c.id === a);
              const compB = companies.find((c) => c.id === b);
              const rows = [
                ["Role", compA.profile, compB.profile],
                ["Location", compA.location || "Not specified in source", compB.location || "Not specified in source"],
                ["Placement year", compA.placementYear, compB.placementYear],
                ["Placement day", compA.placementDay || "Not specified in source", compB.placementDay || "Not specified in source"],
                ["Package (max CTC)", typeof compA.compensation?.max_ctc_lpa === "number" ? `${compA.compensation.max_ctc_lpa} LPA` : "Not specified in source", typeof compB.compensation?.max_ctc_lpa === "number" ? `${compB.compensation.max_ctc_lpa} LPA` : "Not specified in source"],
                ["CGPA cutoff", compA.cgpa?.status === "known" ? compA.cgpa.min : "Not specified in source", compB.cgpa?.status === "known" ? compB.cgpa.min : "Not specified in source"],
                ["Eligible branches", compA.eligibleAllBranches ? "All branches" : (compA.eligibleBranches || []).join(", ") || "Not specified in source", compB.eligibleAllBranches ? "All branches" : (compB.eligibleBranches || []).join(", ") || "Not specified in source"],
                ["Interview rounds", compA.interviewRounds || "Not specified in source", compB.interviewRounds || "Not specified in source"],
                ["Test", typeof compA.test === "boolean" ? (compA.test ? "Yes" : "No") : "Not specified in source", typeof compB.test === "boolean" ? (compB.test ? "Yes" : "No") : "Not specified in source"],
                ["GD", typeof compA.gd === "boolean" ? (compA.gd ? "Yes" : "No") : "Not specified in source", typeof compB.gd === "boolean" ? (compB.gd ? "Yes" : "No") : "Not specified in source"],
                ["Offers", typeof compA.offers === "number" ? compA.offers : "Not specified in source", typeof compB.offers === "number" ? compB.offers : "Not specified in source"],
                ["Skills mentioned", (compA.skills || []).join(", ") || "Not specified in source", (compB.skills || []).join(", ") || "Not specified in source"],
                ["Source page", compA.sourcePage ?? "Not specified in source", compB.sourcePage ?? "Not specified in source"],
              ];
              return (
                <div className="card" style={{ marginTop: 18, padding: 0, overflow: "hidden", overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: 12, color: "var(--text-faint)", fontWeight: 500 }}></th>
                        <th style={{ textAlign: "left", padding: 12 }}>{compA.company}</th>
                        <th style={{ textAlign: "left", padding: 12 }}>{compB.company}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(([label, va, vb]) => (
                        <tr key={label} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: 12, color: "var(--text-faint)" }}>{label}</td>
                          <td style={{ padding: 12 }}>{String(va)}</td>
                          <td style={{ padding: 12 }}>{String(vb)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </>
        )}
    </div>
  );
}

function AnalyticsPage({ mode }) {
  const companies = mode === "internships" ? internshipDatasetFor() : PLACEX_DATA.companies;
  const [year, setYear] = useState("");
  const [branch, setBranch] = useState("");

  const filtered = useMemo(() => companies.filter((c) => {
    if (year && c.placementYear !== year) return false;
    if (branch && !(c.eligibleAllBranches || (c.eligibleBranches || []).includes(branch))) return false;
    return true;
  }), [companies, year, branch]);

  const packages = filtered.map((c) => c.compensation?.max_ctc_lpa).filter((v) => typeof v === "number").sort((a, b) => a - b);
  const highest = packages.length ? packages[packages.length - 1] : null;
  const average = packages.length ? (packages.reduce((a, b) => a + b, 0) / packages.length).toFixed(1) : null;
  const median = packages.length ? (packages.length % 2 ? packages[(packages.length - 1) / 2] : ((packages[packages.length / 2 - 1] + packages[packages.length / 2]) / 2).toFixed(1)) : null;
  const distinctCompanies = new Set(filtered.map((c) => c.company)).size;
  const distinctRoles = new Set(filtered.map((c) => c.profile)).size;

  const chartData = useMemo(() => {
    const buckets = {};
    filtered.forEach((c) => {
      const lpa = c.compensation?.max_ctc_lpa;
      if (typeof lpa !== "number") return;
      const bucket = `${Math.floor(lpa / 5) * 5}-${Math.floor(lpa / 5) * 5 + 5}`;
      buckets[bucket] = (buckets[bucket] || 0) + 1;
    });
    return Object.entries(buckets).map(([range, count]) => ({ range, count }));
  }, [filtered]);

  const roleDist = useMemo(() => {
    const counts = {};
    filtered.forEach((c) => { const r = classifyRole(c); counts[r] = (counts[r] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([role, count]) => ({ role, count }));
  }, [filtered]);

  const topPaying = useMemo(() => [...filtered].filter((c) => typeof c.compensation?.max_ctc_lpa === "number").sort((a, b) => b.compensation.max_ctc_lpa - a.compensation.max_ctc_lpa).slice(0, 5), [filtered]);

  return (
    <div className="page">
      <PageHead title="Analytics" sub="Calculated live from the current dataset — no static charts." />
      <div className="filter-bar">
        <select value={year} onChange={(e) => setYear(e.target.value)}>
          <option value="">All years</option>
          {[...new Set(companies.map((c) => c.placementYear))].sort().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option value="">All branches</option>
          {CANONICAL_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        {(year || branch) && <button className="btn btn-ghost btn-sm" onClick={() => { setYear(""); setBranch(""); }}>Clear filters</button>}
      </div>
      {companies.length === 0 ? (
        <NoDataEmpty icon={<BarChart3 size={30} />} body="Summary stats, package distribution, and top companies will populate here as soon as real placement data is loaded." />
      ) : filtered.length === 0 ? (
        <NoDataEmpty title="No data available for this filter." />
      ) : (
        <>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div className="metric-card"><div className="label">Placement records</div><div className="value">{filtered.length}</div></div>
            <div className="metric-card"><div className="label">Companies</div><div className="value">{distinctCompanies}</div></div>
            <div className="metric-card"><div className="label">Distinct roles</div><div className="value">{distinctRoles}</div></div>
            <div className="metric-card"><div className="label">Highest package</div><div className="value">{highest ? `${highest} LPA` : "Not specified in source"}</div></div>
            <div className="metric-card"><div className="label">Median package</div><div className="value">{median ? `${median} LPA` : "Not specified in source"}</div></div>
            <div className="metric-card"><div className="label">Average package</div><div className="value">{average ? `${average} LPA` : "Not specified in source"}</div></div>
          </div>

          <div className="card" style={{ height: 300, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Package distribution</div>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="range" stroke="var(--text-faint)" fontSize={12} />
                <YAxis stroke="var(--text-faint)" fontSize={12} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                <Bar dataKey="count" fill="var(--crimson)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card" style={{ height: 280, marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Role distribution</div>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={roleDist} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" stroke="var(--text-faint)" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="role" stroke="var(--text-faint)" fontSize={12} width={90} />
                <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                <Bar dataKey="count" fill="var(--crimson)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {!branch ? (
            <div className="card" style={{ height: 320, marginBottom: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Companies open per branch</div>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart
                  data={CANONICAL_BRANCHES.map((b) => ({
                    branch: b.length > 18 ? b.slice(0, 16) + "…" : b,
                    count: filtered.filter((c) => c.eligibleAllBranches || (c.eligibleBranches || []).includes(b)).length,
                  })).sort((a, b) => b.count - a.count).slice(0, 10)}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" stroke="var(--text-faint)" fontSize={12} allowDecimals={false} />
                  <YAxis type="category" dataKey="branch" stroke="var(--text-faint)" fontSize={11} width={130} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                  <Bar dataKey="count" fill="var(--crimson)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="card" style={{ padding: 14, marginBottom: 20, fontSize: 12.5, color: "var(--text-dim)" }}>
              Showing analytics for <strong>{branch}</strong> only ({filtered.length} companies open to it{year ? ` in ${year}` : ""}) — every chart and number above already reflects this filter.
            </div>
          )}

          {topPaying.length > 0 && (
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>Top paying roles</div>
              {topPaying.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid var(--border)" }}>
                  <span>{c.company} — {c.profile}</span>
                  <span style={{ fontWeight: 600 }}>{c.compensation.max_ctc_lpa} LPA</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================
   GAMES — small, self-contained, stress-relief breaks. Best scores
   persist in localStorage directly (casual, not tied to profile).
   ============================================================ */
function useLocalScore(key) {
  const [best, setBest] = useState(() => {
    try { return JSON.parse(window.localStorage.getItem(key)) ?? null; } catch { return null; }
  });
  const save = (val) => {
    setBest(val);
    try { window.localStorage.setItem(key, JSON.stringify(val)); } catch {}
  };
  return [best, save];
}

function TicTacToeGame() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState("X"); // player is X, AI is O
  const [wins, setWins] = useLocalScore("placex:game:ttt-wins");
  const winner = useMemo(() => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    if (board.every(Boolean)) return "draw";
    return null;
  }, [board]);

  useEffect(() => {
    if (turn === "O" && !winner) {
      const empty = board.map((v,i) => v ? null : i).filter((v) => v !== null);
      if (empty.length === 0) return;
      const t = setTimeout(() => {
        const move = empty[Math.floor(Math.random() * empty.length)];
        const next = [...board]; next[move] = "O";
        setBoard(next); setTurn("X");
      }, 350);
      return () => clearTimeout(t);
    }
  }, [turn, board, winner]);

  useEffect(() => {
    if (winner === "X") setWins((wins || 0) + 1);
  }, [winner]);

  const play = (i) => {
    if (board[i] || winner || turn !== "X") return;
    const next = [...board]; next[i] = "X";
    setBoard(next); setTurn("O");
  };
  const reset = () => { setBoard(Array(9).fill(null)); setTurn("X"); };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 4 }}>You're X. Wins: {wins || 0}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 70px)", gap: 6, margin: "16px auto", width: "fit-content" }}>
        {board.map((v, i) => (
          <button key={i} onClick={() => play(i)} style={{ width: 70, height: 70, fontSize: 28, fontWeight: 700, background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10, color: v === "X" ? "var(--crimson)" : "var(--text)", cursor: v || winner ? "default" : "pointer" }}>
            {v}
          </button>
        ))}
      </div>
      {winner && (
        <p style={{ fontWeight: 600, marginBottom: 10 }}>{winner === "draw" ? "Draw!" : winner === "X" ? "You win! 🎉" : "AI wins this one."}</p>
      )}
      <button className="btn btn-primary btn-sm" onClick={reset}>New game</button>
    </div>
  );
}

function MemoryMatchGame() {
  const EMOJIS = ["🎯","🚀","💡","🎧","📊","🧩"];
  const makeDeck = () => [...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, emoji: e })).sort(() => Math.random() - 0.5);
  const [deck, setDeck] = useState(makeDeck);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [best, setBest] = useLocalScore("placex:game:memory-best-moves");

  useEffect(() => {
    if (flipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = flipped;
      if (deck[a].emoji === deck[b].emoji) {
        setMatched((m) => [...m, a, b]);
        setFlipped([]);
      } else {
        const t = setTimeout(() => setFlipped([]), 700);
        return () => clearTimeout(t);
      }
    }
  }, [flipped, deck]);

  useEffect(() => {
    if (matched.length === deck.length && deck.length > 0) {
      if (!best || moves < best) setBest(moves);
    }
  }, [matched, deck.length]);

  const flip = (i) => {
    if (flipped.length === 2 || flipped.includes(i) || matched.includes(i)) return;
    setFlipped((f) => [...f, i]);
  };
  const reset = () => { setDeck(makeDeck()); setFlipped([]); setMatched([]); setMoves(0); };
  const done = matched.length === deck.length;

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 4 }}>Moves: {moves}{best ? ` · Best: ${best}` : ""}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 56px)", gap: 6, margin: "16px auto", width: "fit-content" }}>
        {deck.map((card, i) => {
          const shown = flipped.includes(i) || matched.includes(i);
          return (
            <button key={card.id} onClick={() => flip(i)} style={{ width: 56, height: 56, fontSize: 24, background: shown ? "var(--surface)" : "var(--surface-2)", border: "1px solid var(--border)", borderRadius: 10 }}>
              {shown ? card.emoji : ""}
            </button>
          );
        })}
      </div>
      {done && <p style={{ fontWeight: 600, marginBottom: 10 }}>Solved in {moves} moves! 🎉</p>}
      <button className="btn btn-primary btn-sm" onClick={reset}>{done ? "Play again" : "Restart"}</button>
    </div>
  );
}

function ReactionTimeGame() {
  const [state, setState] = useState("idle"); // idle | waiting | ready | tooSoon | result
  const [result, setResult] = useState(null);
  const [best, setBest] = useLocalScore("placex:game:reaction-best-ms");
  const startedAt = useRef(0);
  const timeoutRef = useRef(null);

  const start = () => {
    setState("waiting");
    const delay = 1000 + Math.random() * 2500;
    timeoutRef.current = setTimeout(() => {
      startedAt.current = Date.now();
      setState("ready");
    }, delay);
  };
  const click = () => {
    if (state === "waiting") {
      clearTimeout(timeoutRef.current);
      setState("tooSoon");
      return;
    }
    if (state === "ready") {
      const ms = Date.now() - startedAt.current;
      setResult(ms);
      if (!best || ms < best) setBest(ms);
      setState("result");
    }
  };
  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 12 }}>{best ? `Best: ${best}ms` : "Click when it turns green"}</p>
      <div
        onClick={state === "waiting" || state === "ready" ? click : undefined}
        style={{
          width: 220, height: 140, margin: "0 auto", borderRadius: 14, display: "grid", placeItems: "center",
          fontSize: 14, fontWeight: 600, cursor: state === "waiting" || state === "ready" ? "pointer" : "default",
          background: state === "ready" ? "var(--good)" : state === "waiting" ? "var(--surface-2)" : "var(--surface)",
          color: state === "ready" ? "var(--bg)" : "var(--text-dim)", border: "1px solid var(--border)",
        }}
      >
        {state === "idle" && "Press Start"}
        {state === "waiting" && "Wait for green…"}
        {state === "ready" && "Click now!"}
        {state === "tooSoon" && "Too soon — try again"}
        {state === "result" && `${result}ms`}
      </div>
      <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={start}>{state === "idle" ? "Start" : "Try again"}</button>
    </div>
  );
}

function QuickMathGame() {
  const [seconds, setSeconds] = useState(30);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useLocalScore("placex:game:math-best-score");
  const [q, setQ] = useState(null);
  const [answer, setAnswer] = useState("");

  const newQ = () => {
    const a = Math.floor(Math.random() * 12) + 1;
    const b = Math.floor(Math.random() * 12) + 1;
    const op = ["+", "-", "×"][Math.floor(Math.random() * 3)];
    setQ({ a, b, op });
    setAnswer("");
  };

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      if (!best || score > best) setBest(score);
      return;
    }
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [running, seconds]);

  const start = () => { setSeconds(30); setScore(0); setRunning(true); newQ(); };
  const submit = (e) => {
    e.preventDefault();
    if (!running || !q) return;
    const correct = q.op === "+" ? q.a + q.b : q.op === "-" ? q.a - q.b : q.a * q.b;
    if (Number(answer) === correct) setScore((s) => s + 1);
    newQ();
  };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 12 }}>{best ? `Best: ${best}` : "Solve as many as you can in 30s"}</p>
      {!running ? (
        <button className="btn btn-primary btn-sm" onClick={start}>Start</button>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "var(--text-faint)", marginBottom: 6 }}>{seconds}s · Score: {score}</div>
          <div style={{ fontSize: 30, fontWeight: 700, marginBottom: 14 }}>{q.a} {q.op} {q.b} = ?</div>
          <form onSubmit={submit}>
            <input autoFocus type="number" value={answer} onChange={(e) => setAnswer(e.target.value)} style={{ width: 100, textAlign: "center", fontSize: 18, padding: "8px 10px", borderRadius: 10, background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }} />
          </form>
        </>
      )}
    </div>
  );
}

function TruckOffRoadGame() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const gasRef = useRef(false);
  const brakeRef = useRef(false);
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [distance, setDistance] = useState(0);
  const [best, setBest] = useLocalScore("placex:game:truck-best-m");
  const TIME_LIMIT = 45;
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  const terrainHeight = (x) => {
    if (x < 400) return 300;
    const t = x - 400;
    return 300 + 70 * Math.sin(t * 0.008) + 35 * Math.sin(t * 0.02 + 1) + 18 * Math.sin(t * 0.045 + 2);
  };

  useEffect(() => {
    if (phase !== "running") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    let x = 0, vx = 0, wheelAngle = 0;
    let last = performance.now();
    const friction = 0.985, gravityFactor = 0.55, accel = 0.35;

    const step = (now) => {
      const dt = Math.min((now - last) / (1000 / 60), 3); // clamp big tab-switch gaps
      last = now;

      const slope = (terrainHeight(x + 1) - terrainHeight(x - 1)) / 2;
      if (gasRef.current) vx += accel * dt;
      if (brakeRef.current) vx -= accel * 1.4 * dt;
      vx -= slope * gravityFactor * dt;
      vx *= Math.pow(friction, dt);
      x += vx * dt;
      if (x < 0) { x = 0; vx = 0; }
      wheelAngle += vx * 0.05;

      setDistance(Math.max(0, x / 10));

      // Draw
      ctx.clearRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#1a1a22");
      grad.addColorStop(1, "#0A0A0C");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const camX = x - W * 0.32;
      // Terrain
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let sx = 0; sx <= W; sx += 8) {
        const wx = camX + sx;
        ctx.lineTo(sx, terrainHeight(wx));
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      const tgrad = ctx.createLinearGradient(0, 250, 0, H);
      tgrad.addColorStop(0, "#3a1420");
      tgrad.addColorStop(1, "#1a0a10");
      ctx.fillStyle = tgrad;
      ctx.fill();
      ctx.strokeStyle = "#D41B3F";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Truck
      const groundY = terrainHeight(x);
      const angle = Math.atan2(terrainHeight(x + 20) - terrainHeight(x - 20), 40);
      const screenX = W * 0.32;
      const screenY = groundY - 22;
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(angle);
      ctx.fillStyle = "#D41B3F";
      ctx.fillRect(-28, -18, 56, 20);
      ctx.fillStyle = "#F4F3EF";
      ctx.fillRect(-8, -30, 24, 14);
      // wheels
      [(-18), (18)].forEach((wx) => {
        ctx.save();
        ctx.translate(wx, 6);
        ctx.rotate(wheelAngle);
        ctx.fillStyle = "#131315";
        ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#F4F3EF"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(11, 0); ctx.stroke();
        ctx.restore();
      });
      ctx.restore();

      if (phase === "running") rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return;
    if (timeLeft <= 0) {
      setPhase("done");
      setDistance((d) => { if (!best || d > best) setBest(Math.round(d)); return d; });
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") gasRef.current = true;
      if (e.key === "ArrowLeft") brakeRef.current = true;
    };
    const onKeyUp = (e) => {
      if (e.key === "ArrowRight" || e.key === " ") gasRef.current = false;
      if (e.key === "ArrowLeft") brakeRef.current = false;
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKeyUp); };
  }, []);

  const start = () => { setTimeLeft(TIME_LIMIT); setDistance(0); setPhase("running"); };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 8 }}>
        {best ? `Best: ${best}m · ` : ""}{phase === "running" ? `${timeLeft}s left · ${Math.round(distance)}m` : "45 seconds — go as far as you can over the hills."}
      </p>
      <canvas ref={canvasRef} width={340} height={220} style={{ borderRadius: 12, border: "1px solid var(--border)", width: "100%", maxWidth: 340, touchAction: "none" }} />
      {phase !== "running" ? (
        <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={start}>{phase === "done" ? "Try again" : "Start"}</button>
      ) : (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
          <button
            className="btn btn-ghost btn-sm"
            style={{ touchAction: "none", userSelect: "none" }}
            onPointerDown={(e) => { e.preventDefault(); brakeRef.current = true; }}
            onPointerUp={() => (brakeRef.current = false)}
            onPointerLeave={() => (brakeRef.current = false)}
            onPointerCancel={() => (brakeRef.current = false)}
            onContextMenu={(e) => e.preventDefault()}
          >◀ Brake</button>
          <button
            className="btn btn-primary btn-sm"
            style={{ touchAction: "none", userSelect: "none" }}
            onPointerDown={(e) => { e.preventDefault(); gasRef.current = true; }}
            onPointerUp={() => (gasRef.current = false)}
            onPointerLeave={() => (gasRef.current = false)}
            onPointerCancel={() => (gasRef.current = false)}
            onContextMenu={(e) => e.preventDefault()}
          >Gas ▶</button>
        </div>
      )}
      <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10 }}>Hold the Gas button, or use → / Space on desktop.</p>
      {phase === "done" && <p style={{ fontWeight: 600, marginTop: 10 }}>You made it {Math.round(distance)}m! 🚚</p>}
    </div>
  );
}

function HighwayDodgeGame() {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState("idle");
  const [score, setScore] = useState(0);
  const [best, setBest] = useLocalScore("placex:game:dodge-best-score");
  const targetLaneRef = useRef(1);

  useEffect(() => {
    if (phase !== "running") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const LANES = [W * 0.25, W * 0.5, W * 0.75];
    let obstacles = [];
    let frame = 0;
    let speed = 2.4;
    let localScore = 0;
    let playerX = LANES[1];
    let rafId;
    let alive = true;

    const step = () => {
      frame++;
      speed = 2.4 + localScore * 0.0015;
      if (frame % Math.max(30, 55 - Math.floor(localScore / 15)) === 0) {
        obstacles.push({ lane: Math.floor(Math.random() * 3), y: -40 });
      }
      obstacles.forEach((o) => (o.y += speed));
      obstacles = obstacles.filter((o) => o.y < H + 40);

      const targetX = LANES[targetLaneRef.current];
      playerX += (targetX - playerX) * 0.25;

      // Collision uses the player's committed lane index, not the
      // eased pixel position — otherwise mid-transition frames can
      // register a false hit against the lane being left, since 34px
      // was nearly half the 70px lane spacing.
      const carY = H - 70;
      for (const o of obstacles) {
        if (o.lane === targetLaneRef.current && o.y > carY - 30 && o.y < carY + 30) {
          alive = false;
        }
      }

      localScore += 1;
      setScore(Math.floor(localScore / 6));

      ctx.fillStyle = "#15151a";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 2;
      [W * 0.375, W * 0.625].forEach((lx) => {
        ctx.setLineDash([14, 14]);
        ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, H); ctx.stroke();
      });
      ctx.setLineDash([]);

      obstacles.forEach((o) => {
        ctx.fillStyle = "#F5B942";
        ctx.fillRect(LANES[o.lane] - 20, o.y - 16, 40, 32);
      });

      ctx.fillStyle = "#D41B3F";
      ctx.fillRect(playerX - 18, carY - 20, 36, 40);

      if (!alive) {
        setPhase("done");
        setScore((s) => { if (!best || s > best) setBest(s); return s; });
        return;
      }
      rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [phase]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft") targetLaneRef.current = Math.max(0, targetLaneRef.current - 1);
      if (e.key === "ArrowRight") targetLaneRef.current = Math.min(2, targetLaneRef.current + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const start = () => { targetLaneRef.current = 1; setScore(0); setPhase("running"); };

  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ color: "var(--text-dim)", fontSize: 13, marginBottom: 8 }}>
        {best ? `Best: ${best} · ` : ""}{phase === "running" ? `Score: ${score}` : "Dodge the oncoming trucks — survive as long as you can."}
      </p>
      <canvas ref={canvasRef} width={280} height={340} style={{ borderRadius: 12, border: "1px solid var(--border)", width: "100%", maxWidth: 280, touchAction: "none" }} />
      {phase !== "running" ? (
        <button className="btn btn-primary btn-sm" style={{ marginTop: 14 }} onClick={start}>{phase === "done" ? "Try again" : "Start"}</button>
      ) : (
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => (targetLaneRef.current = Math.max(0, targetLaneRef.current - 1))}>◀ Left</button>
          <button className="btn btn-ghost btn-sm" onClick={() => (targetLaneRef.current = Math.min(2, targetLaneRef.current + 1))}>Right ▶</button>
        </div>
      )}
      <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10 }}>Tap Left/Right, or use ← → on desktop.</p>
      {phase === "done" && <p style={{ fontWeight: 600, marginTop: 10 }}>Crashed! Score: {score}</p>}
    </div>
  );
}

const GAMES_LIST = [
  { id: "ttt", name: "Tic-Tac-Toe", desc: "Classic 3x3, you vs a light AI.", icon: Grid3x3, component: TicTacToeGame },
  { id: "memory", name: "Memory Match", desc: "Flip cards, find all the pairs.", icon: Shuffle, component: MemoryMatchGame },
  { id: "reaction", name: "Reaction Time", desc: "How fast are your reflexes?", icon: Timer, component: ReactionTimeGame },
  { id: "math", name: "Quick Math", desc: "60 seconds, as many as you can.", icon: Trophy, component: QuickMathGame },
  { id: "truck", name: "Off-Road Truck", desc: "Gun it over the hills — 45 second run.", icon: TrendingUp, component: TruckOffRoadGame },
  { id: "dodge", name: "Highway Dodge", desc: "Weave between lanes, survive the traffic.", icon: Compass, component: HighwayDodgeGame },
];

/* Without this, a runtime error inside any single game (or any future
   component) unmounts React's ENTIRE tree, blanking the whole app —
   not just the broken part. This catches it and shows a recoverable
   fallback instead. */
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("PlaceX component error:", error, info); }
  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ padding: 24, textAlign: "center" }}>
          <AlertCircle size={26} color="var(--warn)" style={{ marginBottom: 10 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Something broke here</div>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 14 }}>{this.props.fallbackText || "This part hit an error, but the rest of PlaceX is fine."}</p>
          <button className="btn btn-primary btn-sm" onClick={() => this.setState({ error: null })}>Try again</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function InternshipsComingSoon({ onBackToPlacements }) {
  return (
    <div className="page">
      <div className="coming-soon-stage">
        <div className="coming-soon-glow" />
        <Building2 size={30} className="coming-soon-icon" />
        <div className="coming-soon-badge">INTERNSHIPS · IN DEVELOPMENT</div>
        <h1 className="coming-soon-title">Not quite ready yet.</h1>
        <p className="coming-soon-sub">
          Internship season for most students kicks in around August — so this section is still being built properly instead of shipped half-working. 181 real records from the Bluebooks (Regular + IDDD, kept separate) are already parsed and ready; the full browsing experience is coming before it's actually needed.
        </p>
        <button className="btn btn-primary btn-sm" onClick={onBackToPlacements}>Back to Placements</button>
      </div>
    </div>
  );
}

function GamesPage() {
  const [active, setActive] = useState(null);
  const Game = active ? GAMES_LIST.find((g) => g.id === active)?.component : null;
  return (
    <div className="page">
      <PageHead title="Games" sub="Short, stress-free breaks — none of this touches your placement data." />
      {!active ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {GAMES_LIST.map((g) => {
            const Icon = g.icon;
            return (
              <div key={g.id} className="card company-card" style={{ padding: 18, cursor: "pointer" }} onClick={() => setActive(g.id)}>
                <Icon size={22} color="var(--crimson)" style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 600, fontSize: 15 }}>{g.name}</div>
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 4 }}>{g.desc}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card" style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
          <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => setActive(null)}><ArrowLeft size={14} /> All games</button>
          {Game && <ErrorBoundary fallbackText="This game hit an error — the rest of PlaceX is unaffected."><Game /></ErrorBoundary>}
        </div>
      )}
    </div>
  );
}

const ACCENT_SWATCHES = [
  { id: "crimson", label: "Crimson (default)", swatch: "#D41B3F" },
  { id: "violet", label: "Violet", swatch: "#7C3AED" },
  { id: "ocean", label: "Ocean", swatch: "#0891B2" },
  { id: "emerald", label: "Emerald", swatch: "#059669" },
  { id: "amber", label: "Amber", swatch: "#D97706" },
];

function SettingsPage({ profile, theme, onToggleTheme, accentColor, onChangeAccent, onUpdateProfile, onClearSaved, onClearDSA, onResetProfile }) {
  const [form, setForm] = useState(profile || {});
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  useEffect(() => { setForm(profile || {}); }, [profile]);

  const save = () => {
    onUpdateProfile({ ...form, cgpa: parseFloat(form.cgpa) });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="page">
      <PageHead title="Settings" />
      <div className="settings-section">
        <h2>Profile</h2>
        <div className="field"><label>Name</label><input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>Degree</label>
          <select value={form.degree || "B.Tech"} onChange={(e) => setForm({ ...form, degree: e.target.value })}>
            {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="field"><label>Current year</label>
          <select value={form.standing || "3rd year"} onChange={(e) => setForm({ ...form, standing: e.target.value })}>
            {((form.degree || "").includes("M.Tech") || (form.degree || "").includes("MS") || (form.degree || "").includes("Ph.D") ? PG_STANDINGS : UG_STANDINGS).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="field"><label>Branch</label>
          <select value={form.branch || ""} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
            {CANONICAL_BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="field"><label>CGPA</label><input type="number" step="0.01" value={form.cgpa ?? ""} onChange={(e) => setForm({ ...form, cgpa: e.target.value })} /></div>
        <button className="btn btn-primary btn-sm" onClick={save}>{saved ? <><Check size={14} /> Saved</> : "Save profile"}</button>
      </div>

      <div className="settings-section">
        <h2>Appearance</h2>
        <div className="theme-row">
          <button className={`theme-opt ${theme === "light" ? "active" : ""}`} onClick={() => theme !== "light" && onToggleTheme()}>Light</button>
          <button className={`theme-opt ${theme === "dark" ? "active" : ""}`} onClick={() => theme !== "dark" && onToggleTheme()}>Dark</button>
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12.5, color: "var(--text-faint)", marginBottom: 10 }}>Accent color (Placements mode)</div>
          <div style={{ display: "flex", gap: 10 }}>
            {ACCENT_SWATCHES.map((a) => (
              <button
                key={a.id}
                aria-label={a.label}
                title={a.label}
                onClick={() => onChangeAccent(a.id)}
                style={{
                  width: 30, height: 30, borderRadius: "50%", background: a.swatch, cursor: "pointer",
                  border: accentColor === a.id ? "2px solid var(--text)" : "2px solid transparent",
                  outlineOffset: 2,
                  boxShadow: accentColor === a.id ? "0 0 0 2px var(--surface), 0 0 0 4px " + a.swatch : "none",
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 10 }}>Internships mode always shows its own blue, regardless of this choice.</p>
        </div>
      </div>

      <div className="settings-section">
        <h2>Data</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button className="btn btn-ghost btn-sm" onClick={onClearSaved}>Clear saved companies</button>
          <button className="btn btn-ghost btn-sm" onClick={onClearDSA}>Reset DSA progress</button>
          {!confirmReset ? (
            <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(true)}>Reset profile</button>
          ) : (
            <span style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
              Reset your profile and start onboarding again?
              <button className="btn btn-primary btn-sm" onClick={() => { onResetProfile(); setConfirmReset(false); }}>Yes, reset</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirmReset(false)}>Cancel</button>
            </span>
          )}
        </div>
      </div>

      <div className="settings-section">
        <h2>About</h2>
        <p style={{ fontSize: 13.5, color: "var(--text-dim)", lineHeight: 1.6 }}>
          PlaceX · IITM Intelligence. Data source: IIT Madras Placement Bluebooks (Revised 2025-26 + Non-Core 2026-27), {PLACEX_DATA.companies.length} records imported. Every number in this app is calculated from real state — nothing here is fabricated. PlaceX is built for IIT Madras students and isn't affiliated with the SDC.
        </p>
        <p style={{ fontSize: 12.5, color: "var(--text-faint)", marginTop: 10 }}>
          Students using PlaceX: 1 — this is an honest count for a single-user local build, not a marketing number.
        </p>
        <p style={{ fontSize: 13, marginTop: 14 }}>
          <a href="mailto:pundrub@gmail.com?subject=PlaceX%20feedback" style={{ color: "var(--crimson)", display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Mail size={13} /> Send feedback or report a problem
          </a>
        </p>
        <p style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 16, opacity: 0.7 }}>
          Developed by Bharath · BE24B034
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT APP
   ============================================================ */
export { ErrorBoundary };
export default function App() {
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [accentColor, setAccentColor] = useState("crimson");
  const [mode, setMode] = useState("placements");
  const [profile, setProfile] = useState(null);
  const [saved, setSaved] = useState([]);
  const [dsaProgress, setDsaProgress] = useState({ statuses: {}, dailyGoal: 2 });
  const [roadmapProgress, setRoadmapProgress] = useState({});
  const [route, setRoute] = useState({ route: "", param: null });
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installDismissed, setInstallDismissed] = useState(true); // default hidden until we check storage

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    const dismissed = window.localStorage.getItem("placex:install-dismissed");
    setInstallDismissed(!!dismissed);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  const dismissInstall = () => {
    setInstallDismissed(true);
    window.localStorage.setItem("placex:install-dismissed", "1");
  };
  const doInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
    dismissInstall();
  };

  // Initial load
  useEffect(() => {
    (async () => {
      const [t, p, s, d, rp, m, ac] = await Promise.all([
        loadKey("placex:theme", "dark"),
        loadKey("placex:profile", null),
        loadKey("placex:saved", []),
        loadKey("placex:dsa-progress", { statuses: {}, dailyGoal: 2 }),
        loadKey("placex:roadmap-progress", {}),
        loadKey("placex:mode", "placements"),
        loadKey("placex:accent", "crimson"),
      ]);
      setTheme(t);
      setProfile(p);
      setSaved(s);
      setDsaProgress(d);
      setRoadmapProgress(rp || {});
      setMode(m || "placements");
      setAccentColor(ac || "crimson");
      const initial = parseHash();
      if (!initial.route) {
        window.location.hash = p ? "/home" : "/onboarding";
        setRoute({ route: p ? "home" : "onboarding", param: null });
      } else {
        setRoute(initial);
      }
      setReady(true);
    })();
  }, []);

  // Hash routing
  useEffect(() => {
    const onHash = () => {
      const next = parseHash();
      if (!next.route || next.route === "") {
        // The internal landing page is redundant now that a static
        // marketing page lives at "/" — always redirect straight to
        // onboarding or home instead of showing it inside /app.
        navigate(profile ? "home" : "onboarding");
        return;
      }
      setRoute(next);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [profile]);

  // Keyboard shortcut for search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goto = useCallback((r, param) => navigate(r, param), []);

  useEffect(() => {
    const bg = theme === "dark" ? "#0A0A0C" : "#FBFBFA";
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    saveKey("placex:theme", next);
  };

  const changeMode = (next) => {
    setMode(next);
    saveKey("placex:mode", next);
  };

  const changeAccent = (next) => {
    setAccentColor(next);
    saveKey("placex:accent", next);
  };

  const completeOnboarding = (p) => {
    setProfile(p);
    saveKey("placex:profile", p);
    navigate("home");
  };
  const updateProfile = (p) => {
    setProfile(p);
    saveKey("placex:profile", p);
  };
  const getStarted = () => navigate(profile ? "home" : "onboarding");

  const removeSaved = (id) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    saveKey("placex:saved", next);
  };
  const toggleSaved = (company) => {
    const exists = saved.some((s) => s.id === company.id);
    const next = exists ? saved.filter((s) => s.id !== company.id) : [...saved, company];
    setSaved(next);
    saveKey("placex:saved", next);
  };
  const clearSaved = () => { setSaved([]); saveKey("placex:saved", []); };
  const clearDSA = () => { const reset = { statuses: {}, dailyGoal: 2 }; setDsaProgress(reset); saveKey("placex:dsa-progress", reset); };
  const togglePhase = (domainId, phaseIdx) => {
    const domainPhases = { ...(roadmapProgress[domainId] || {}) };
    domainPhases[phaseIdx] = !domainPhases[phaseIdx];
    const next = { ...roadmapProgress, [domainId]: domainPhases };
    setRoadmapProgress(next);
    saveKey("placex:roadmap-progress", next);
  };
  const setProblemStatus = (id, status) => {
    const next = { ...dsaProgress, statuses: { ...dsaProgress.statuses, [id]: status } };
    setDsaProgress(next);
    saveKey("placex:dsa-progress", next);
  };
  const resetProfile = () => {
    setProfile(null);
    saveKey("placex:profile", null);
    // Also clear everything else tied to this profile so it's a true
    // fresh start, then send them back to the real marketing landing
    // page (not just the in-app onboarding step).
    setSaved([]); saveKey("placex:saved", []);
    setDsaProgress({ statuses: {}, dailyGoal: 2 }); saveKey("placex:dsa-progress", { statuses: {}, dailyGoal: 2 });
    setRoadmapProgress({}); saveKey("placex:roadmap-progress", {});
    window.location.href = "/";
  };

  if (!ready) {
    return (
      <div className="px-root" data-theme={theme} style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <style>{CSS}</style>
        <Loader2 size={22} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isShellPage = route.route && route.route !== "" && route.route !== "onboarding";

  return (
    <div className="px-root" data-theme={theme} data-mode={mode} data-accent={accentColor}>
      <style>{CSS}</style>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      {route.route === "" && <CursorGlow />}

      {route.route === "" && <LandingPage theme={theme} onToggleTheme={toggleTheme} onGetStarted={getStarted} />}

      {route.route === "onboarding" && (
        <Onboarding initialProfile={profile} onComplete={completeOnboarding} />
      )}

      {isShellPage && (
        <div className="shell">
          <Sidebar page={route.route} onNav={goto} />
          <div className="main-col">
            <div className="topbar">
              <ModeSwitch mode={mode} onChange={changeMode} />
              <button className="topbar-search" onClick={() => setSearchOpen(true)}>
                <SearchIcon size={15} /> Search companies, roles, DSA topics… <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 11 }}>⌘K</span>
              </button>
              <div style={{ display: "flex", gap: 10, marginLeft: "auto" }}>
                <button className="icon-btn" onClick={() => setAiOpen(true)} aria-label="Ask PlaceX AI"><Sparkles size={16} /></button>
                <ThemeToggle theme={theme} onToggle={toggleTheme} />
                <button className="icon-btn" onClick={() => goto("settings")} aria-label="Profile"><User size={16} /></button>
              </div>
            </div>

            {mode === "internships" ? (
              <InternshipsComingSoon onBackToPlacements={() => changeMode("placements")} />
            ) : (
              <>
            {route.route === "home" && <HomePage profile={profile} saved={saved} dsaProgress={dsaProgress} onNav={goto} />}
            {route.route === "explore" && <ExplorePage saved={saved} onToggleSave={toggleSaved} onNav={goto} profile={profile} mode={mode} />}
            {route.route === "company" && (() => {
              const company = mode === "internships"
                ? internshipDatasetFor().find((c) => c.id === route.param)
                : PLACEX_DATA.companies.find((c) => c.id === route.param);
              if (!company) {
                return (
                  <div className="page">
                    <PageHead title="Company" />
                    <NoDataEmpty icon={<Building2 size={30} />} title="Company not found" body="This company isn't in the current dataset." action={<button className="btn btn-ghost btn-sm" onClick={() => goto("explore")}>Back to Explore</button>} />
                  </div>
                );
              }
              const isSaved = saved.some((s) => s.id === company.id);
              const match = profile ? computeMatch(profile, company) : null;
              const lpa = company.compensation?.max_ctc_lpa;
              const detailList = mode === "internships" ? internshipDatasetFor() : PLACEX_DATA.companies;
              const idx = detailList.findIndex((c) => c.id === company.id);
              const nextCompany = idx >= 0 ? detailList[idx + 1] : null;
              return (
                <div className="page">
                  <BackNextBar
                    onBack={() => goto("explore")}
                    onNext={() => nextCompany && goto("company", nextCompany.id)}
                    nextDisabled={!nextCompany}
                    nextLabel={nextCompany ? nextCompany.company : "Next"}
                  />
                  <PageHead title={company.company} sub={company.profile} />
                  <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
                    <button className="btn btn-primary btn-sm" onClick={() => toggleSaved(company)}>
                      <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved" : "Save"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => goto("compare", company.id)}><GitCompare size={14} /> Compare</button>
                  </div>
                  {match && (
                    <div className="card" style={{ marginBottom: 16, padding: 14, borderColor: match.status === "eligible" ? "var(--good)" : "var(--border-strong)" }}>
                      <strong style={{ color: match.status === "eligible" ? "var(--good)" : "var(--text-dim)" }}>{match.status === "eligible" ? "This matches your profile" : "Worth preparing for"}</strong>
                      <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 4 }}>{match.reason}</div>
                      {match.cgpaUnconfirmed && (
                        <div style={{ fontSize: 12, color: "var(--warn)", marginTop: 8, display: "flex", gap: 6, alignItems: "flex-start" }}>
                          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} /> No CGPA cutoff published yet for this role — this could change once one is announced.
                        </div>
                      )}
                    </div>
                  )}
                  <div className="card" style={{ padding: 16, display: "grid", gap: 10, fontSize: 13.5 }}>
                    <div><strong>Location:</strong> {company.location || "Not specified in source"}</div>
                    <div><strong>Placement year:</strong> {company.placementYear}</div>
                    <div><strong>{company.isInternship ? "Stipend / compensation" : "Package"}:</strong> {company.isInternship ? (company.stipendLabel || "Not specified in source") : (typeof lpa === "number" ? `${lpa} LPA` : "Not specified in source")}</div>
                    <div><strong>CGPA cutoff:</strong> {company.cgpa?.status === "known" ? company.cgpa.min : "Not specified in source"}</div>
                    <div><strong>Eligible branches:</strong> {company.eligibleAllBranches ? "All branches" : (company.eligibleBranches || []).join(", ") || "Not specified in source"}</div>
                    {company.eligibleDegreeLevels && company.eligibleDegreeLevels.length > 0 && (
                      <div><strong>Eligible degree levels:</strong> {company.eligibleDegreeLevels.map((l) => ({ UG: "B.Tech (UG)", DUAL: "Dual Degree", PG: "M.Tech / M.S (PG)", PHD: "Ph.D", MSC: "M.Sc.", INTEGRATED_MA: "Integrated M.A." }[l] || l)).join(", ")}</div>
                    )}
                    <div><strong>Interview rounds:</strong> {company.interviewRounds || "Not specified in source"}</div>
                    <div><strong>Offers:</strong> {typeof company.offers === "number" ? company.offers : "Not specified in source"}</div>
                    {company.jobDescription && <div><strong>Role:</strong> {company.jobDescription}</div>}
                    {company.testAndInterview && <div><strong>Test & interview process:</strong> {company.testAndInterview}</div>}
                    {company.preparationMaterials && <div><strong>Prep materials:</strong> {company.preparationMaterials}</div>}
                    {company.placementDay && <div><strong>Placement day:</strong> {company.placementDay}</div>}
                    {typeof company.test === "boolean" && <div><strong>Test:</strong> {company.test ? "Yes" : "No"}</div>}
                    {typeof company.gd === "boolean" && <div><strong>GD:</strong> {company.gd ? "Yes" : "No"}</div>}
                    {company.skills && company.skills.length > 0 && (
                      <div>
                        <strong>Skills mentioned:</strong>{" "}
                        <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                          {company.skills.map((s) => <span key={s} style={{ fontSize: 11.5, padding: "3px 8px", borderRadius: 999, background: "var(--surface-2)" }}>{s}</span>)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="card" style={{ padding: 16, marginTop: 12 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>📖 Source</div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Bluebook: {bluebookNameFor(company)}</div>
                    <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
                      Page: {company.sourcePage ?? "Not specified in source"}
                      {company.sourcePageEnd && company.sourcePageEnd !== company.sourcePage ? `–${company.sourcePageEnd}` : ""}
                      {company.tocPage ? ` (TOC: p.${company.tocPage})` : ""}
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--warn)", marginTop: 6, display: "flex", gap: 6, alignItems: "flex-start" }}>
                      <AlertCircle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
                      This information may be inaccurate. Please verify against {bluebookNameFor(company)}, page {company.sourcePage ?? "?"}, before relying on it.
                    </div>
                    {company.sourceLinks && company.sourceLinks.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>Links & resources (as found in the Bluebook)</div>
                        {company.sourceLinks.map((l, i) => (
                          <div key={i} style={{ fontSize: 12.5 }}>
                            <a href={l.url} target="_blank" rel="noreferrer" style={{ color: "var(--crimson)" }}>{l.url}</a>
                            {l.page && <span style={{ color: "var(--text-faint)" }}> (Bluebook p.{l.page})</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            {route.route === "saved" && <SavedPage saved={saved} onRemove={removeSaved} onNav={goto} />}
            {route.route === "matches" && <MatchesPage profile={profile} saved={saved} onToggleSave={toggleSaved} onNav={goto} mode={mode} />}
            {route.route === "placement-days" && <PlacementDaysPage saved={saved} onToggleSave={toggleSaved} onNav={goto} mode={mode} />}
              </>
            )}
            {route.route === "preparation" && <PreparationPage dsaProgress={dsaProgress} roadmapProgress={roadmapProgress} onNav={goto} />}
            {route.route === "roadmap" && <RoadmapPage domainId={route.param} onNav={goto} dsaProgress={dsaProgress} roadmapProgress={roadmapProgress} onTogglePhase={togglePhase} />}
            {route.route === "dsa" && <DSAPage dsaProgress={dsaProgress} onNav={goto} />}
            {route.route === "dsa-problem" && <DSAProblemPage dsaProgress={dsaProgress} onSetStatus={setProblemStatus} onNav={goto} problemId={route.param} />}
            {route.route === "compare" && mode === "placements" && <ComparePage initialA={route.param} mode={mode} />}
            {route.route === "analytics" && mode === "placements" && <AnalyticsPage mode={mode} />}
            {route.route === "compare" && mode === "internships" && <InternshipsComingSoon onBackToPlacements={() => changeMode("placements")} />}
            {route.route === "analytics" && mode === "internships" && <InternshipsComingSoon onBackToPlacements={() => changeMode("placements")} />}
            {route.route === "games" && <GamesPage />}
            {/* Internships now live inside Explore/company via the mode switch, not a separate route */}
            {route.route === "settings" && (
              <SettingsPage
                profile={profile}
                theme={theme}
                onToggleTheme={toggleTheme}
                accentColor={accentColor}
                onChangeAccent={changeAccent}
                onUpdateProfile={updateProfile}
                onClearSaved={clearSaved}
                onClearDSA={clearDSA}
                onResetProfile={resetProfile}
              />
            )}
          </div>
          <BottomNav page={route.route} onNav={goto} />
          {installPrompt && !installDismissed && (
            <div className="install-banner">
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Install PlaceX</div>
                <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Add it to your home screen for quick, full-screen access.</div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-primary btn-sm" onClick={doInstall}>Install</button>
                <button className="icon-btn" onClick={dismissInstall}><X size={14} /></button>
              </div>
            </div>
          )}
        </div>
      )}

      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} onNav={goto} />}
      {!aiOpen && isShellPage && (
        <button className="ai-fab" onClick={() => setAiOpen(true)} aria-label="Ask PlaceX AI"><Sparkles size={20} /></button>
      )}
      {aiOpen && <AIPanel profile={profile} onClose={() => setAiOpen(false)} />}
    </div>
  );
}
