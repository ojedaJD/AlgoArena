/**
 * Compare expected vs actual output for judge verdicts.
 */

export function exactMatch(expected: string, actual: string): boolean {
  return expected === actual;
}

export function normalizedMatch(expected: string, actual: string): boolean {
  return normalize(expected) === normalize(actual);
}

function normalize(s: string): string {
  return s
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd();
}

export function compareOutput(
  expected: string,
  actual: string,
  mode: 'exact' | 'normalized' = 'normalized',
): boolean {
  if (mode === 'exact') return exactMatch(expected, actual);
  return normalizedMatch(expected, actual);
}
