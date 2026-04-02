export type ComparisonMode = 'exact' | 'normalized';

/**
 * Normalize output for lenient comparison:
 * - Trim trailing whitespace from each line
 * - Trim trailing empty lines
 * - Normalize line endings to \n
 */
export function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd();
}

/**
 * Compare expected output against actual output.
 *
 * - "exact": byte-for-byte comparison (after normalizing line endings)
 * - "normalized" (default): trims trailing whitespace per line and trailing newlines
 */
export function compareOutput(
  expected: string,
  actual: string,
  mode: ComparisonMode = 'normalized',
): boolean {
  if (mode === 'exact') {
    return expected.replace(/\r\n/g, '\n') === actual.replace(/\r\n/g, '\n');
  }

  return normalizeOutput(expected) === normalizeOutput(actual);
}
