import { test, expect } from '@playwright/test';

const PASSWORD = 'Buzzinga@0';

test('unauthenticated root redirects to access screen', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/access$/);
  await expect(page.getByText('RAPIDCREW PVT LTD').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'HR CRM' })).toBeVisible();
  await expect(page.getByLabel('Enter Access Password')).toBeVisible();
});

test('wrong password is rejected', async ({ page }) => {
  await page.goto('/access');
  await page.getByLabel('Enter Access Password').fill('wrong password');
  await page.getByRole('button', { name: 'ACCESS' }).click();
  await expect(page.getByText('Incorrect password. Please try again.')).toBeVisible();
  await expect(page).toHaveURL(/\/access$/);
});

test('correct password grants access and persists through refresh', async ({ page }) => {
  await page.goto('/access');
  await page.getByLabel('Enter Access Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'ACCESS' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Create HR Document' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/$/);
});

test('lock clears access and returns to password screen', async ({ page }) => {
  await page.goto('/access');
  await page.getByLabel('Enter Access Password').fill(PASSWORD);
  await page.getByRole('button', { name: 'ACCESS' }).click();
  await page.getByRole('button', { name: 'LOCK' }).click();
  await expect(page).toHaveURL(/\/access$/);
});
