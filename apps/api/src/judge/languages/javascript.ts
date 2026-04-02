import type { LanguageConfig } from './index.js';

export const javascript: LanguageConfig = {
  name: 'javascript',
  image: 'dsa-judge-node:latest',
  extension: '.js',
  compileCmd: null,
  runCmd: 'node /sandbox/solution.js',
  boilerplate: `'use strict';

const lines = [];
const rl = require('readline').createInterface({ input: process.stdin });

rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
  const n = parseInt(lines[0], 10);
  const nums = lines[1].split(' ').map(Number);

  // TODO: implement your solution
  let result = 0;

  console.log(result);
});
`,
};
