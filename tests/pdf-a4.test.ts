import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

describe('PDF A4 output', () => {
  it('uses explicit A4 portrait dimensions for salary slips and letters', () => {
    const source = readFileSync(path.join(process.cwd(), 'lib', 'exporters.tsx'), 'utf8');

    expect(source).toContain('const PDF_A4_WIDTH=595.28;');
    expect(source).toContain('const PDF_A4_HEIGHT=841.89;');
    expect(source).toContain('const PDF_A4_SIZE:[number,number]=[PDF_A4_WIDTH,PDF_A4_HEIGHT];');

    const pageMatches = source.match(/<Page size=\{PDF_A4_SIZE\} orientation="portrait"/g) || [];
    expect(pageMatches.length).toBeGreaterThanOrEqual(2);
    expect(source).not.toContain('dpi={PDF_OUTPUT_DPI}');
    expect(source).not.toContain('PDF_OUTPUT_DPI=300');
  });
});
