export type DocumentDensity = 'compact' | 'tight';

export function documentDensityFromHtml(html:string): DocumentDensity {
  const text = (html || '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
  const blockCount = (html.match(/<(p|h1|h2|h3|li|tr)\b/gi) || []).length;
  const score = text.length + blockCount * 70;
  return score > 1750 ? 'tight' : 'compact';
}

export function pdfLetterLayout(html:string) {
  const density=documentDensityFromHtml(html);
  return density==='tight'
    ? {fontSize:8.35,lineHeight:1.22,paragraphGap:3,headingSize:9.8,headingGap:4,authGap:7}
    : {fontSize:9.15,lineHeight:1.32,paragraphGap:5,headingSize:10.8,headingGap:6,authGap:9};
}

export function docxLetterLayout(html:string) {
  const density=documentDensityFromHtml(html);
  return density==='tight'
    ? {bodySize:17,headingSize:20,paragraphAfter:70,headingAfter:90,authBefore:110,signatureHeight:42,stampSize:92}
    : {bodySize:18,headingSize:21,paragraphAfter:95,headingAfter:120,authBefore:150,signatureHeight:46,stampSize:105};
}
