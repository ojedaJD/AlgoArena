import type { LanguageConfig } from './index.js';

export const python: LanguageConfig = {
  name: 'python',
  image: 'dsa-judge-python:latest',
  extension: '.py',
  compileCmd: null,
  runCmd: 'python3 /sandbox/solution.py',
  boilerplate: `import sys
from typing import List, Optional

def solve():
    # Read input
    n = int(input())
    nums = list(map(int, input().split()))

    # TODO: implement your solution
    result = 0

    # Write output
    print(result)

if __name__ == "__main__":
    solve()
`,
};
