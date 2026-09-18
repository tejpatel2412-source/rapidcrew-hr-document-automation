export function sanitizeHtml(input: string) {
  if (typeof window === 'undefined') return input.replace(/<script[\s\S]*?<\/script>/gi, '');
  const doc = new DOMParser().parseFromString(input, 'text/html');
  doc.querySelectorAll('script,style,iframe,object,embed,link,meta').forEach((n) => n.remove());
  doc.querySelectorAll('*').forEach((el) => {
    [...el.attributes].forEach((a) => {
      const name = a.name.toLowerCase(); const value = a.value.trim().toLowerCase();
      if (name.startsWith('on') || (['href','src'].includes(name) && value.startsWith('javascript:'))) el.removeAttribute(a.name);
    });
  });
  return doc.body.innerHTML;
}
