export const languageConfigs: Record<string, { id: string; label: string; boilerplate: string }> = {
  python: {
    id: 'python',
    label: 'Python 3.11',
    boilerplate: `import sys\n\ndef solve():\n    # Read input\n    n = int(input())\n    # Your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()\n`,
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript (Node 20)',
    boilerplate: `const readline = require('readline');\nconst rl = readline.createInterface({ input: process.stdin });\nconst lines = [];\n\nrl.on('line', (line) => lines.push(line));\nrl.on('close', () => {\n  // Your solution here\n  const n = parseInt(lines[0]);\n  console.log(n);\n});\n`,
  },
  cpp: {
    id: 'cpp',
    label: 'C++ (GCC 13)',
    boilerplate: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    ios_base::sync_with_stdio(false);\n    cin.tie(NULL);\n    \n    int n;\n    cin >> n;\n    \n    // Your solution here\n    \n    return 0;\n}\n`,
  },
  java: {
    id: 'java',
    label: 'Java (OpenJDK 17)',
    boilerplate: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        \n        // Your solution here\n        \n        System.out.println(n);\n    }\n}\n`,
  },
};
