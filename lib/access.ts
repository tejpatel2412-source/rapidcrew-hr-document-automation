export const ACCESS_COOKIE_NAME = 'rapidcrew_access';
export const ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createAccessToken(password: string) {
  const bytes = new TextEncoder().encode(`rapidcrew-access-v1:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(digest);
}

export async function isValidAccessToken(token: string | undefined, password: string | undefined) {
  if (!token || !password) return false;
  return token === await createAccessToken(password);
}
