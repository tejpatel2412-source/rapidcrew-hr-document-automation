import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const PASSWORD='Buzzinga@0';

async function unlock(page:Page){
  await page.goto('/access');
  await page.getByLabel('Enter Access Password').fill(PASSWORD);
  await page.getByRole('button',{name:'ACCESS'}).click();
  await expect(page).toHaveURL(/\/$/);
}

async function seedCompanyAndEmployee(page:Page){
  await page.goto('/company');
  await page.getByLabel('Company Name *').fill('Rapidcrew Solutions Private Limited');
  await page.getByRole('button',{name:'Save Company'}).click();

  await page.goto('/employees');
  await page.getByRole('button',{name:'Add Employee'}).click();
  await page.getByLabel('Employee Id').fill('43');
  await page.getByLabel('Full Name').fill('Swarn Sharma');
  await page.getByLabel('Department').fill('Operations');
  await page.getByLabel('Designation').fill('Team Leader');
  await page.getByLabel('PAN').fill('ABCDE1234F');
  await page.getByLabel('UAN').fill('100200300400');
  await page.getByLabel('PF Number').fill('PF-77');
  await page.getByLabel('ESIC Number').fill('ESI-88');
  await page.getByLabel('Date of Joining').fill('2024-03-20');
  await page.getByRole('button',{name:'Save Employee'}).click();
  await expect(page.getByText('Swarn Sharma').first()).toBeVisible();
}

async function openSalary(page:Page){
  await page.goto('/create?type=salary-slip');
  await expect(page.getByLabel('Document Type')).toHaveValue('salary-slip');
  await page.getByLabel('Employee *').selectOption({label:'Swarn Sharma · 43'});
  await page.getByLabel('Salary Month').fill('October');
  await page.getByLabel('Salary Year').fill('2025');
  await page.getByLabel('Working Days').fill('31');
  await page.getByLabel('Paid Days').fill('31');
  await page.getByLabel('LOP Days').fill('0');
  await page.getByLabel('Bank Account Number').fill('1234567890');
  await page.getByLabel('Basic').fill('35000');
  await page.getByLabel('HRA').fill('17500');
  await page.getByLabel('Other',{exact:true}).fill('15500');
  await page.getByLabel('Conveyance Allowance').fill('2000');
}

test.beforeEach(async({page})=>{await unlock(page);await seedCompanyAndEmployee(page)});

test('salary preview matches the required table structure and calculation',async({page})=>{
  await openSalary(page);
  const document=page.locator('#official-document');
  await expect(document.getByText('Rapidcrew Solutions Private Limited')).toBeVisible();
  await expect(document.getByText('Pay Slip for the Month October 2025')).toBeVisible();
  for(const label of ['Emp Code','Emp Name','Designation','DOJ','PAN','UAN','ESI A/c No','PF No','Working Days','Bank A/c No','No of Days Present','LOP Days','Gross Earnings','Net Pay Amount','Net Pay Amount (in words)']) await expect(document.getByText(label,{exact:true}).first()).toBeVisible();
  await expect(document.getByText('₹70,000.00')).toBeVisible();
  await expect(document.getByText('Rupees Seventy Thousand Only')).toBeVisible();
  await expect(document.getByText('This is a System Generated Pay Slip and does not require any Signature')).toBeVisible();
  await expect(document.getByText('For Rapidcrew Solutions Private Limited')).toHaveCount(0);
});

test('salary PDF and DOCX downloads are real files',async({page})=>{
  await openSalary(page);
  await page.getByRole('button',{name:'Final Review'}).click();
  const pdfPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download PDF'}).click();
  const pdfDownload=await pdfPromise; const pdfPath=await pdfDownload.path();
  expect(pdfDownload.suggestedFilename()).toMatch(/salary_slip.*\.pdf$/i);
  expect(pdfPath).toBeTruthy();
  const pdfBytes=await readFile(pdfPath!); expect(pdfBytes.subarray(0,4).toString()).toBe('%PDF'); expect(pdfBytes.length).toBeGreaterThan(1000);

  const docxPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download Word'}).click();
  const docxDownload=await docxPromise; const docxPath=await docxDownload.path();
  expect(docxDownload.suggestedFilename()).toMatch(/salary_slip\.docx$/i);
  expect(docxPath).toBeTruthy();
  const docxBytes=await readFile(docxPath!); expect(docxBytes.subarray(0,2).toString()).toBe('PK'); expect(docxBytes.length).toBeGreaterThan(1000);
});

test('print media shows the official salary slip and hides application UI',async({page})=>{
  await openSalary(page);
  await page.emulateMedia({media:'print'});
  await expect(page.locator('#official-document')).toBeVisible();
  await expect(page.locator('aside')).toBeHidden();
  await expect(page.getByRole('button',{name:'Final Review'})).toBeHidden();
});

test('other four document previews remain available',async({page})=>{
  const docs:[string,string][]=[['offer-letter','OFFER LETTER'],['appointment-letter','APPOINTMENT LETTER'],['experience-letter','EXPERIENCE LETTER'],['relieving-letter','RELIEVING LETTER']];
  for(const [type,heading] of docs){
    await page.goto(`/create?type=${type}`);
    await expect(page.getByLabel('Document Type')).toHaveValue(type);
    await page.getByLabel('Employee *').selectOption({label:'Swarn Sharma · 43'});
    await expect(page.locator('#official-document').getByText(heading)).toBeVisible();
  }
});
