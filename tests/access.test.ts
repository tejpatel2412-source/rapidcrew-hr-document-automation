// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createAccessToken, isValidAccessToken } from '../lib/access';

describe('access cookie token', () => {
  it('derives a stable token without exposing the raw password', async () => {
    const token = await createAccessToken('Buzzinga@0');
    expect(token).toBe(await createAccessToken('Buzzinga@0'));
    expect(token).not.toContain('Buzzinga@0');
    expect(token.length).toBeGreaterThan(20);
  });

  it('rejects a token derived from a different password', async () => {
    const token = await createAccessToken('wrong password');
    await expect(isValidAccessToken(token, 'Buzzinga@0')).resolves.toBe(false);
  });
});
