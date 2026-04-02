import type { LanguageConfig } from './index.js';

export const cpp: LanguageConfig = {
  name: 'cpp',
  image: 'dsa-judge-cpp:latest',
  extension: '.cpp',
  compileCmd: 'g++ -O2 -std=c++17 -o /sandbox/solution /sandbox/solution.cpp',
  runCmd: '/sandbox/solution',
  boilerplate: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }

    // TODO: implement your solution
    int result = 0;

    cout << result << endl;
    return 0;
}
`,
};
