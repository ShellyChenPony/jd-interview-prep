export type ProblemDifficulty = 'Easy' | 'Medium' | 'Hard';

export type JobCategoryId =
  | 'frontend'
  | 'backend'
  | 'fullstack'
  | 'mobile'
  | 'data'
  | 'devops'
  | 'general';

export type JobCategory = {
  id: JobCategoryId;
  labelEn: string;
  labelZh: string;
  descriptionEn: string;
  descriptionZh: string;
};

export type LeetCodeProblem = {
  id: string;
  number: number;
  title: string;
  slug: string;
  difficulty: ProblemDifficulty;
  tags: string[];
  categories: JobCategoryId[];
};

export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: 'frontend',
    labelEn: 'Frontend',
    labelZh: '前端',
    descriptionEn: 'DOM, strings, trees, graphs — common FE interview DS&A.',
    descriptionZh: '字符串、树、图与 DOM 相关结构——前端常考算法。',
  },
  {
    id: 'backend',
    labelEn: 'Backend',
    labelZh: '后端',
    descriptionEn: 'Systems thinking: graphs, heaps, DP, concurrency patterns.',
    descriptionZh: '图、堆、动态规划等——后端系统设计前的算法基础。',
  },
  {
    id: 'fullstack',
    labelEn: 'Full Stack',
    labelZh: '全栈',
    descriptionEn: 'Balanced mix of FE-friendly and classic backend problems.',
    descriptionZh: '前端友好题与经典后端题的均衡组合。',
  },
  {
    id: 'mobile',
    labelEn: 'Mobile',
    labelZh: '移动端',
    descriptionEn: 'Arrays, trees, recursion — typical mobile interview set.',
    descriptionZh: '数组、树、递归——移动端面试常见题。',
  },
  {
    id: 'data',
    labelEn: 'Data / ML',
    labelZh: '数据 / ML',
    descriptionEn: 'Arrays, hashing, sorting, sliding window for data roles.',
    descriptionZh: '数组、哈希、排序、滑动窗口——数据 / ML 岗位常练。',
  },
  {
    id: 'devops',
    labelEn: 'DevOps / SRE',
    labelZh: '运维 / SRE',
    descriptionEn: 'Graphs, BFS/DFS, heaps — debugging & infra interview style.',
    descriptionZh: '图遍历、堆——偏排查与基础设施面试风格。',
  },
  {
    id: 'general',
    labelEn: 'General SWE',
    labelZh: '通用开发',
    descriptionEn: 'Core Blind 75-style fundamentals for any SWE track.',
    descriptionZh: 'Blind 75 风格基础题，适合通用软件岗。',
  },
];

/** Curated LeetCode set mapped to job categories (links open leetcode.com). */
export const LEETCODE_PROBLEMS: LeetCodeProblem[] = [
  // —— Arrays / Hashing ——
  {
    id: 'two-sum',
    number: 1,
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    categories: ['frontend', 'backend', 'fullstack', 'mobile', 'data', 'general'],
  },
  {
    id: 'best-time-to-buy-and-sell-stock',
    number: 121,
    title: 'Best Time to Buy and Sell Stock',
    slug: 'best-time-to-buy-and-sell-stock',
    difficulty: 'Easy',
    tags: ['Array', 'DP'],
    categories: ['frontend', 'fullstack', 'data', 'general'],
  },
  {
    id: 'contains-duplicate',
    number: 217,
    title: 'Contains Duplicate',
    slug: 'contains-duplicate',
    difficulty: 'Easy',
    tags: ['Array', 'Hash Table'],
    categories: ['frontend', 'mobile', 'data', 'general'],
  },
  {
    id: 'product-of-array-except-self',
    number: 238,
    title: 'Product of Array Except Self',
    slug: 'product-of-array-except-self',
    difficulty: 'Medium',
    tags: ['Array', 'Prefix'],
    categories: ['backend', 'fullstack', 'data', 'general'],
  },
  {
    id: 'maximum-subarray',
    number: 53,
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'Medium',
    tags: ['Array', 'DP'],
    categories: ['backend', 'data', 'general'],
  },
  {
    id: '3sum',
    number: 15,
    title: '3Sum',
    slug: '3sum',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'container-with-most-water',
    number: 11,
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    tags: ['Array', 'Two Pointers'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'merge-intervals',
    number: 56,
    title: 'Merge Intervals',
    slug: 'merge-intervals',
    difficulty: 'Medium',
    tags: ['Array', 'Sorting'],
    categories: ['backend', 'devops', 'data', 'general'],
  },
  {
    id: 'insert-interval',
    number: 57,
    title: 'Insert Interval',
    slug: 'insert-interval',
    difficulty: 'Medium',
    tags: ['Array'],
    categories: ['backend', 'devops', 'general'],
  },
  {
    id: 'rotate-image',
    number: 48,
    title: 'Rotate Image',
    slug: 'rotate-image',
    difficulty: 'Medium',
    tags: ['Array', 'Matrix'],
    categories: ['frontend', 'mobile', 'general'],
  },
  {
    id: 'spiral-matrix',
    number: 54,
    title: 'Spiral Matrix',
    slug: 'spiral-matrix',
    difficulty: 'Medium',
    tags: ['Array', 'Matrix'],
    categories: ['frontend', 'mobile', 'general'],
  },
  {
    id: 'set-matrix-zeroes',
    number: 73,
    title: 'Set Matrix Zeroes',
    slug: 'set-matrix-zeroes',
    difficulty: 'Medium',
    tags: ['Array', 'Matrix'],
    categories: ['frontend', 'fullstack', 'general'],
  },

  // —— Strings ——
  {
    id: 'valid-anagram',
    number: 242,
    title: 'Valid Anagram',
    slug: 'valid-anagram',
    difficulty: 'Easy',
    tags: ['String', 'Hash Table'],
    categories: ['frontend', 'mobile', 'general'],
  },
  {
    id: 'valid-palindrome',
    number: 125,
    title: 'Valid Palindrome',
    slug: 'valid-palindrome',
    difficulty: 'Easy',
    tags: ['String', 'Two Pointers'],
    categories: ['frontend', 'mobile', 'general'],
  },
  {
    id: 'longest-substring-without-repeating-characters',
    number: 3,
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window'],
    categories: ['frontend', 'fullstack', 'backend', 'general'],
  },
  {
    id: 'longest-repeating-character-replacement',
    number: 424,
    title: 'Longest Repeating Character Replacement',
    slug: 'longest-repeating-character-replacement',
    difficulty: 'Medium',
    tags: ['String', 'Sliding Window'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'minimum-window-substring',
    number: 76,
    title: 'Minimum Window Substring',
    slug: 'minimum-window-substring',
    difficulty: 'Hard',
    tags: ['String', 'Sliding Window'],
    categories: ['backend', 'general'],
  },
  {
    id: 'group-anagrams',
    number: 49,
    title: 'Group Anagrams',
    slug: 'group-anagrams',
    difficulty: 'Medium',
    tags: ['String', 'Hash Table'],
    categories: ['frontend', 'backend', 'data', 'general'],
  },
  {
    id: 'encode-and-decode-strings',
    number: 271,
    title: 'Encode and Decode Strings',
    slug: 'encode-and-decode-strings',
    difficulty: 'Medium',
    tags: ['String', 'Design'],
    categories: ['backend', 'fullstack', 'general'],
  },

  // —— Linked List ——
  {
    id: 'reverse-linked-list',
    number: 206,
    title: 'Reverse Linked List',
    slug: 'reverse-linked-list',
    difficulty: 'Easy',
    tags: ['Linked List'],
    categories: ['frontend', 'backend', 'fullstack', 'mobile', 'general'],
  },
  {
    id: 'merge-two-sorted-lists',
    number: 21,
    title: 'Merge Two Sorted Lists',
    slug: 'merge-two-sorted-lists',
    difficulty: 'Easy',
    tags: ['Linked List'],
    categories: ['backend', 'fullstack', 'mobile', 'general'],
  },
  {
    id: 'linked-list-cycle',
    number: 141,
    title: 'Linked List Cycle',
    slug: 'linked-list-cycle',
    difficulty: 'Easy',
    tags: ['Linked List', 'Two Pointers'],
    categories: ['backend', 'devops', 'general'],
  },
  {
    id: 'reorder-list',
    number: 143,
    title: 'Reorder List',
    slug: 'reorder-list',
    difficulty: 'Medium',
    tags: ['Linked List'],
    categories: ['backend', 'general'],
  },
  {
    id: 'remove-nth-node-from-end-of-list',
    number: 19,
    title: 'Remove Nth Node From End of List',
    slug: 'remove-nth-node-from-end-of-list',
    difficulty: 'Medium',
    tags: ['Linked List', 'Two Pointers'],
    categories: ['fullstack', 'mobile', 'general'],
  },

  // —— Trees ——
  {
    id: 'invert-binary-tree',
    number: 226,
    title: 'Invert Binary Tree',
    slug: 'invert-binary-tree',
    difficulty: 'Easy',
    tags: ['Tree', 'DFS'],
    categories: ['frontend', 'fullstack', 'mobile', 'general'],
  },
  {
    id: 'maximum-depth-of-binary-tree',
    number: 104,
    title: 'Maximum Depth of Binary Tree',
    slug: 'maximum-depth-of-binary-tree',
    difficulty: 'Easy',
    tags: ['Tree', 'DFS'],
    categories: ['frontend', 'mobile', 'general'],
  },
  {
    id: 'same-tree',
    number: 100,
    title: 'Same Tree',
    slug: 'same-tree',
    difficulty: 'Easy',
    tags: ['Tree', 'DFS'],
    categories: ['frontend', 'mobile', 'general'],
  },
  {
    id: 'binary-tree-level-order-traversal',
    number: 102,
    title: 'Binary Tree Level Order Traversal',
    slug: 'binary-tree-level-order-traversal',
    difficulty: 'Medium',
    tags: ['Tree', 'BFS'],
    categories: ['frontend', 'backend', 'fullstack', 'general'],
  },
  {
    id: 'validate-binary-search-tree',
    number: 98,
    title: 'Validate Binary Search Tree',
    slug: 'validate-binary-search-tree',
    difficulty: 'Medium',
    tags: ['Tree', 'DFS'],
    categories: ['backend', 'fullstack', 'data', 'general'],
  },
  {
    id: 'lowest-common-ancestor-of-a-binary-search-tree',
    number: 235,
    title: 'Lowest Common Ancestor of a BST',
    slug: 'lowest-common-ancestor-of-a-binary-search-tree',
    difficulty: 'Medium',
    tags: ['Tree', 'BST'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'binary-tree-maximum-path-sum',
    number: 124,
    title: 'Binary Tree Maximum Path Sum',
    slug: 'binary-tree-maximum-path-sum',
    difficulty: 'Hard',
    tags: ['Tree', 'DFS'],
    categories: ['backend', 'general'],
  },
  {
    id: 'serialize-and-deserialize-binary-tree',
    number: 297,
    title: 'Serialize and Deserialize Binary Tree',
    slug: 'serialize-and-deserialize-binary-tree',
    difficulty: 'Hard',
    tags: ['Tree', 'Design'],
    categories: ['backend', 'fullstack', 'general'],
  },

  // —— Graphs ——
  {
    id: 'number-of-islands',
    number: 200,
    title: 'Number of Islands',
    slug: 'number-of-islands',
    difficulty: 'Medium',
    tags: ['Graph', 'BFS', 'DFS'],
    categories: ['backend', 'devops', 'fullstack', 'general'],
  },
  {
    id: 'clone-graph',
    number: 133,
    title: 'Clone Graph',
    slug: 'clone-graph',
    difficulty: 'Medium',
    tags: ['Graph', 'BFS', 'DFS'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'course-schedule',
    number: 207,
    title: 'Course Schedule',
    slug: 'course-schedule',
    difficulty: 'Medium',
    tags: ['Graph', 'Topological Sort'],
    categories: ['backend', 'devops', 'general'],
  },
  {
    id: 'pacific-atlantic-water-flow',
    number: 417,
    title: 'Pacific Atlantic Water Flow',
    slug: 'pacific-atlantic-water-flow',
    difficulty: 'Medium',
    tags: ['Graph', 'BFS', 'DFS'],
    categories: ['backend', 'devops', 'general'],
  },
  {
    id: 'word-ladder',
    number: 127,
    title: 'Word Ladder',
    slug: 'word-ladder',
    difficulty: 'Hard',
    tags: ['Graph', 'BFS'],
    categories: ['backend', 'general'],
  },

  // —— Heap / Interval ——
  {
    id: 'top-k-frequent-elements',
    number: 347,
    title: 'Top K Frequent Elements',
    slug: 'top-k-frequent-elements',
    difficulty: 'Medium',
    tags: ['Heap', 'Hash Table'],
    categories: ['backend', 'data', 'devops', 'general'],
  },
  {
    id: 'find-median-from-data-stream',
    number: 295,
    title: 'Find Median from Data Stream',
    slug: 'find-median-from-data-stream',
    difficulty: 'Hard',
    tags: ['Heap', 'Design'],
    categories: ['backend', 'data', 'general'],
  },
  {
    id: 'kth-largest-element-in-an-array',
    number: 215,
    title: 'Kth Largest Element in an Array',
    slug: 'kth-largest-element-in-an-array',
    difficulty: 'Medium',
    tags: ['Heap', 'Quickselect'],
    categories: ['backend', 'data', 'general'],
  },
  {
    id: 'meeting-rooms-ii',
    number: 253,
    title: 'Meeting Rooms II',
    slug: 'meeting-rooms-ii',
    difficulty: 'Medium',
    tags: ['Heap', 'Intervals'],
    categories: ['backend', 'devops', 'fullstack', 'general'],
  },

  // —— DP ——
  {
    id: 'climbing-stairs',
    number: 70,
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'Easy',
    tags: ['DP'],
    categories: ['frontend', 'mobile', 'fullstack', 'general'],
  },
  {
    id: 'house-robber',
    number: 198,
    title: 'House Robber',
    slug: 'house-robber',
    difficulty: 'Medium',
    tags: ['DP'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'coin-change',
    number: 322,
    title: 'Coin Change',
    slug: 'coin-change',
    difficulty: 'Medium',
    tags: ['DP'],
    categories: ['backend', 'data', 'general'],
  },
  {
    id: 'longest-increasing-subsequence',
    number: 300,
    title: 'Longest Increasing Subsequence',
    slug: 'longest-increasing-subsequence',
    difficulty: 'Medium',
    tags: ['DP'],
    categories: ['backend', 'data', 'general'],
  },
  {
    id: 'word-break',
    number: 139,
    title: 'Word Break',
    slug: 'word-break',
    difficulty: 'Medium',
    tags: ['DP', 'Trie'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'unique-paths',
    number: 62,
    title: 'Unique Paths',
    slug: 'unique-paths',
    difficulty: 'Medium',
    tags: ['DP', 'Matrix'],
    categories: ['frontend', 'fullstack', 'general'],
  },

  // —— Stack / Design ——
  {
    id: 'valid-parentheses',
    number: 20,
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'String'],
    categories: ['frontend', 'fullstack', 'mobile', 'general'],
  },
  {
    id: 'min-stack',
    number: 155,
    title: 'Min Stack',
    slug: 'min-stack',
    difficulty: 'Medium',
    tags: ['Stack', 'Design'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'evaluate-reverse-polish-notation',
    number: 150,
    title: 'Evaluate Reverse Polish Notation',
    slug: 'evaluate-reverse-polish-notation',
    difficulty: 'Medium',
    tags: ['Stack'],
    categories: ['backend', 'devops', 'general'],
  },
  {
    id: 'lru-cache',
    number: 146,
    title: 'LRU Cache',
    slug: 'lru-cache',
    difficulty: 'Medium',
    tags: ['Design', 'Hash Table'],
    categories: ['backend', 'fullstack', 'devops', 'general'],
  },
  {
    id: 'implement-trie-prefix-tree',
    number: 208,
    title: 'Implement Trie (Prefix Tree)',
    slug: 'implement-trie-prefix-tree',
    difficulty: 'Medium',
    tags: ['Trie', 'Design'],
    categories: ['backend', 'frontend', 'general'],
  },

  // —— Binary Search ——
  {
    id: 'binary-search',
    number: 704,
    title: 'Binary Search',
    slug: 'binary-search',
    difficulty: 'Easy',
    tags: ['Binary Search'],
    categories: ['frontend', 'mobile', 'data', 'general'],
  },
  {
    id: 'search-in-rotated-sorted-array',
    number: 33,
    title: 'Search in Rotated Sorted Array',
    slug: 'search-in-rotated-sorted-array',
    difficulty: 'Medium',
    tags: ['Binary Search', 'Array'],
    categories: ['backend', 'fullstack', 'general'],
  },
  {
    id: 'find-minimum-in-rotated-sorted-array',
    number: 153,
    title: 'Find Minimum in Rotated Sorted Array',
    slug: 'find-minimum-in-rotated-sorted-array',
    difficulty: 'Medium',
    tags: ['Binary Search'],
    categories: ['backend', 'general'],
  },
  {
    id: 'time-based-key-value-store',
    number: 981,
    title: 'Time Based Key-Value Store',
    slug: 'time-based-key-value-store',
    difficulty: 'Medium',
    tags: ['Binary Search', 'Design'],
    categories: ['backend', 'devops', 'general'],
  },
];

export function leetcodeUrl(slug: string): string {
  return `https://leetcode.com/problems/${slug}/`;
}

export function getCategory(id: JobCategoryId): JobCategory | undefined {
  return JOB_CATEGORIES.find((c) => c.id === id);
}

export function problemsForCategory(categoryId: JobCategoryId): LeetCodeProblem[] {
  return LEETCODE_PROBLEMS.filter((p) => p.categories.includes(categoryId));
}

export function getProblemById(id: string): LeetCodeProblem | undefined {
  return LEETCODE_PROBLEMS.find((p) => p.id === id);
}

export function catalogDigestForPrompt(): string {
  return LEETCODE_PROBLEMS.map(
    (p) =>
      `${p.id}|#${p.number}|${p.title}|${p.difficulty}|tags:${p.tags.join(',')}|cats:${p.categories.join(',')}`
  ).join('\n');
}
