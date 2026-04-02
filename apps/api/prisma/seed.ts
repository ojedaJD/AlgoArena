import { PrismaClient, Difficulty, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Topics ───────────────────────────────────────────────────────────────

  const topicsData = [
    { slug: 'arrays', title: 'Arrays', orderIndex: 0 },
    { slug: 'strings', title: 'Strings', orderIndex: 1 },
    { slug: 'trees', title: 'Trees', orderIndex: 2 },
    { slug: 'graphs', title: 'Graphs', orderIndex: 3 },
    { slug: 'dynamic-programming', title: 'Dynamic Programming', orderIndex: 4 },
  ];

  const topics = await Promise.all(
    topicsData.map((t) =>
      prisma.topic.upsert({
        where: { slug: t.slug },
        update: {},
        create: t,
      }),
    ),
  );

  console.log(`Upserted ${topics.length} topics.`);

  const topicMap = Object.fromEntries(topics.map((t) => [t.slug, t.id]));

  // ─── Lessons ──────────────────────────────────────────────────────────────

  const lessonsData = [
    { title: 'Introduction to Arrays', contentMd: 'An array stores elements in a fixed-size, contiguous block of memory. Elements are accessed via a zero-based index in O(1) time.', orderIndex: 0, topicSlug: 'arrays' },
    { title: 'Two Pointers & Sliding Window', contentMd: 'The two-pointer technique uses two indices to reduce nested loops from O(n^2) to O(n). Sliding window is a specialized form for contiguous subarrays.', orderIndex: 1, topicSlug: 'arrays' },
    { title: 'String Fundamentals', contentMd: 'Strings are immutable sequences of characters. This lesson covers ASCII vs Unicode, common string methods, and character frequency maps.', orderIndex: 0, topicSlug: 'strings' },
    { title: 'Pattern Matching Algorithms', contentMd: 'Naive pattern matching runs in O(n*m). KMP preprocesses the pattern into a failure function to achieve O(n+m). Rabin-Karp uses rolling hashes.', orderIndex: 1, topicSlug: 'strings' },
    { title: 'Binary Trees & Traversals', contentMd: 'A binary tree has nodes with at most two children. Depth-first: inorder, preorder, postorder. Breadth-first uses a queue.', orderIndex: 0, topicSlug: 'trees' },
    { title: 'Binary Search Trees', contentMd: 'A BST maintains left < node < right. Search, insert, and delete are O(h). Covers validation, predecessor/successor, and self-balancing motivation.', orderIndex: 1, topicSlug: 'trees' },
    { title: 'Graph Representation & BFS', contentMd: 'Graphs can be adjacency matrices or lists. BFS explores all neighbors at current depth first, ideal for shortest-path on unweighted graphs.', orderIndex: 0, topicSlug: 'graphs' },
    { title: 'DFS & Topological Sort', contentMd: 'DFS explores as far as possible before backtracking. Powers connected-component detection, cycle detection, and topological sorting.', orderIndex: 1, topicSlug: 'graphs' },
    { title: 'Memoization vs Tabulation', contentMd: 'Memoization (top-down) caches recursive results. Tabulation (bottom-up) fills a table iteratively, eliminating call-stack overhead.', orderIndex: 0, topicSlug: 'dynamic-programming' },
    { title: 'Classic DP Patterns', contentMd: 'Most DP problems fit: 0/1 knapsack, unbounded knapsack, LCS, LIS, and interval DP. Recognizing the pattern lets you derive the recurrence quickly.', orderIndex: 1, topicSlug: 'dynamic-programming' },
  ];

  // Delete existing lessons to avoid duplicates on re-seed
  await prisma.lesson.deleteMany({});

  const lessons = await Promise.all(
    lessonsData.map(({ topicSlug, slug, ...lesson }) =>
      prisma.lesson.create({
        data: {
          ...lesson,
          topicId: topicMap[topicSlug],
        },
      }),
    ),
  );

  console.log(`Created ${lessons.length} lessons.`);

  // ─── Problems ─────────────────────────────────────────────────────────────

  const problemsData = [
    {
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: Difficulty.EASY,
      statementMd: 'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`.\n\n**Constraints:**\n- 2 <= nums.length <= 10^4\n- -10^9 <= nums[i] <= 10^9',
      isPublished: true,
      topicSlug: 'arrays',
      testCases: [
        { input: '{"nums": [2, 7, 11, 15], "target": 9}', expectedOutput: '[0, 1]', isPublic: true, orderIndex: 0 },
        { input: '{"nums": [3, 2, 4], "target": 6}', expectedOutput: '[1, 2]', isPublic: true, orderIndex: 1 },
        { input: '{"nums": [3, 3], "target": 6}', expectedOutput: '[0, 1]', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Valid Palindrome',
      slug: 'valid-palindrome',
      difficulty: Difficulty.EASY,
      statementMd: 'A phrase is a palindrome if, after converting all uppercase letters to lowercase and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome.\n\n**Constraints:**\n- 1 <= s.length <= 2 * 10^5',
      isPublished: true,
      topicSlug: 'strings',
      testCases: [
        { input: '{"s": "A man, a plan, a canal: Panama"}', expectedOutput: 'true', isPublic: true, orderIndex: 0 },
        { input: '{"s": "race a car"}', expectedOutput: 'false', isPublic: true, orderIndex: 1 },
        { input: '{"s": " "}', expectedOutput: 'true', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Maximum Depth of Binary Tree',
      slug: 'maximum-depth-binary-tree',
      difficulty: Difficulty.EASY,
      statementMd: 'Given the `root` of a binary tree, return its maximum depth. The maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.\n\n**Constraints:**\n- 0 <= number of nodes <= 10^4',
      isPublished: true,
      topicSlug: 'trees',
      testCases: [
        { input: '{"root": [3, 9, 20, null, null, 15, 7]}', expectedOutput: '3', isPublic: true, orderIndex: 0 },
        { input: '{"root": [1, null, 2]}', expectedOutput: '2', isPublic: true, orderIndex: 1 },
        { input: '{"root": []}', expectedOutput: '0', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      slug: 'longest-substring-without-repeating-characters',
      difficulty: Difficulty.MEDIUM,
      statementMd: 'Given a string `s`, find the length of the longest substring without repeating characters.\n\n**Constraints:**\n- 0 <= s.length <= 5 * 10^4',
      isPublished: true,
      topicSlug: 'strings',
      testCases: [
        { input: '{"s": "abcabcbb"}', expectedOutput: '3', isPublic: true, orderIndex: 0 },
        { input: '{"s": "bbbbb"}', expectedOutput: '1', isPublic: true, orderIndex: 1 },
        { input: '{"s": "pwwkew"}', expectedOutput: '3', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Binary Tree Level Order Traversal',
      slug: 'binary-tree-level-order-traversal',
      difficulty: Difficulty.MEDIUM,
      statementMd: 'Given the `root` of a binary tree, return the level order traversal of its node values (left to right, level by level) as a list of lists.\n\n**Constraints:**\n- 0 <= number of nodes <= 2000',
      isPublished: true,
      topicSlug: 'trees',
      testCases: [
        { input: '{"root": [3, 9, 20, null, null, 15, 7]}', expectedOutput: '[[3], [9, 20], [15, 7]]', isPublic: true, orderIndex: 0 },
        { input: '{"root": [1]}', expectedOutput: '[[1]]', isPublic: true, orderIndex: 1 },
        { input: '{"root": []}', expectedOutput: '[]', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Number of Islands',
      slug: 'number-of-islands',
      difficulty: Difficulty.MEDIUM,
      statementMd: 'Given an `m x n` 2D binary grid representing a map of land (`1`) and water (`0`), return the number of islands.\n\n**Constraints:**\n- 1 <= m, n <= 300\n- grid[i][j] is `0` or `1`',
      isPublished: true,
      topicSlug: 'graphs',
      testCases: [
        { input: '{"grid": [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]}', expectedOutput: '1', isPublic: true, orderIndex: 0 },
        { input: '{"grid": [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]}', expectedOutput: '3', isPublic: true, orderIndex: 1 },
        { input: '{"grid": [["1","0","1"],["0","1","0"],["1","0","1"]]}', expectedOutput: '5', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Coin Change',
      slug: 'coin-change',
      difficulty: Difficulty.MEDIUM,
      statementMd: 'Given an array `coins` of different denominations and an integer `amount`, return the fewest coins needed to make that amount. Return `-1` if impossible.\n\n**Constraints:**\n- 1 <= coins.length <= 12\n- 0 <= amount <= 10^4',
      isPublished: true,
      topicSlug: 'dynamic-programming',
      testCases: [
        { input: '{"coins": [1, 5, 10, 25], "amount": 41}', expectedOutput: '4', isPublic: true, orderIndex: 0 },
        { input: '{"coins": [2], "amount": 3}', expectedOutput: '-1', isPublic: true, orderIndex: 1 },
        { input: '{"coins": [1], "amount": 0}', expectedOutput: '0', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Trapping Rain Water',
      slug: 'trapping-rain-water',
      difficulty: Difficulty.HARD,
      statementMd: 'Given `n` non-negative integers representing an elevation map where the width of each bar is `1`, compute how much water it can trap after raining.\n\n**Constraints:**\n- 1 <= n <= 2 * 10^4\n- 0 <= height[i] <= 10^5',
      isPublished: true,
      topicSlug: 'arrays',
      testCases: [
        { input: '{"height": [0,1,0,2,1,0,1,3,2,1,2,1]}', expectedOutput: '6', isPublic: true, orderIndex: 0 },
        { input: '{"height": [4,2,0,3,2,5]}', expectedOutput: '9', isPublic: true, orderIndex: 1 },
        { input: '{"height": [3,0,2,0,4]}', expectedOutput: '7', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Serialize and Deserialize Binary Tree',
      slug: 'serialize-deserialize-binary-tree',
      difficulty: Difficulty.HARD,
      statementMd: 'Design an algorithm to serialize and deserialize a binary tree. Your methods must be inverses of each other.\n\n**Constraints:**\n- 0 <= number of nodes <= 10^4\n- -1000 <= Node.val <= 1000',
      isPublished: true,
      topicSlug: 'trees',
      testCases: [
        { input: '{"root": [1,2,3,null,null,4,5]}', expectedOutput: '[1,2,3,null,null,4,5]', isPublic: true, orderIndex: 0 },
        { input: '{"root": []}', expectedOutput: '[]', isPublic: true, orderIndex: 1 },
        { input: '{"root": [1,2,3,4,5,6,7]}', expectedOutput: '[1,2,3,4,5,6,7]', isPublic: false, orderIndex: 2 },
      ],
    },
    {
      title: 'Longest Increasing Path in a Matrix',
      slug: 'longest-increasing-path-in-a-matrix',
      difficulty: Difficulty.HARD,
      statementMd: 'Given an `m x n` integers matrix, return the length of the longest increasing path. From each cell, you can move in four directions.\n\n**Constraints:**\n- 1 <= m, n <= 200\n- 0 <= matrix[i][j] <= 2^31 - 1',
      isPublished: true,
      topicSlug: 'dynamic-programming',
      testCases: [
        { input: '{"matrix": [[9,9,4],[6,6,8],[2,1,1]]}', expectedOutput: '4', isPublic: true, orderIndex: 0 },
        { input: '{"matrix": [[3,4,5],[3,2,6],[2,2,1]]}', expectedOutput: '4', isPublic: true, orderIndex: 1 },
        { input: '{"matrix": [[1]]}', expectedOutput: '1', isPublic: false, orderIndex: 2 },
      ],
    },
  ];

  let problemCount = 0;
  let testCaseCount = 0;

  for (const { topicSlug, testCases, ...problemData } of problemsData) {
    const problem = await prisma.problem.upsert({
      where: { slug: problemData.slug },
      update: {},
      create: problemData,
    });

    // Link to topic via join table
    await prisma.problemTopic.upsert({
      where: {
        problemId_topicId: {
          problemId: problem.id,
          topicId: topicMap[topicSlug],
        },
      },
      update: {},
      create: {
        problemId: problem.id,
        topicId: topicMap[topicSlug],
      },
    });

    problemCount++;

    // Only create test cases if they don't already exist (for idempotency)
    const existingCases = await prisma.testCase.count({ where: { problemId: problem.id } });
    if (existingCases === 0) {
      for (const tc of testCases) {
        await prisma.testCase.create({
          data: {
            ...tc,
            problemId: problem.id,
          },
        });
        testCaseCount++;
      }
    }
  }

  console.log(`Upserted ${problemCount} problems with ${testCaseCount} test cases.`);

  // ─── Admin User ───────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { auth0Sub: 'auth0|admin' },
    update: {},
    create: {
      auth0Sub: 'auth0|admin',
      email: 'admin@dsaarena.dev',
      role: UserRole.ADMIN,
      profile: {
        create: {
          displayName: 'Admin',
        },
      },
    },
  });

  console.log(`Upserted admin user: ${admin.email} (id: ${admin.id})`);

  console.log('Seeding complete.');
}

main()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
