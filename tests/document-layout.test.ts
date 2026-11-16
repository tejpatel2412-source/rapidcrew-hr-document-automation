import { describe, expect, it } from 'vitest';
import { documentDensityFromHtml, docxLetterLayout, pdfLetterLayout } from '../lib/document-layout';

describe('single-page document layout',()=>{
  it('uses compact spacing for normal HR letters',()=>{
    const html='<h2>OFFER LETTER</h2><p>Dear Employee,</p><p>This is a standard offer letter.</p>';
    expect(documentDensityFromHtml(html)).toBe('compact');
    const pdf=pdfLetterLayout(html);
    expect(pdf.fontSize).toBeLessThan(10);
    expect(pdf.paragraphGap).toBeLessThanOrEqual(5);
    const docx=docxLetterLayout(html);
    expect(docx.bodySize).toBeLessThanOrEqual(18);
    expect(docx.paragraphAfter).toBeLessThanOrEqual(95);
  });

  it('automatically tightens longer templates so authorization stays on page one',()=>{
    const paragraph='<p>This paragraph contains employment terms, conditions, responsibilities, acceptance wording and other details that must remain together on the same A4 document page.</p>';
    const html='<h2>OFFER LETTER</h2>'+paragraph.repeat(12);
    expect(documentDensityFromHtml(html)).toBe('tight');
    const pdf=pdfLetterLayout(html);
    const docx=docxLetterLayout(html);
    expect(pdf.fontSize).toBeLessThan(9);
    expect(pdf.lineHeight).toBeLessThanOrEqual(1.22);
    expect(docx.bodySize).toBeLessThan(18);
    expect(docx.paragraphAfter).toBeLessThan(95);
  });
});
