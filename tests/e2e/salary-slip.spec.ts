import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const PASSWORD='Buzzinga@0';
const stampPath=path.join(process.cwd(),'tests','fixtures','stamp.png');

async function unlock(page:Page){
  await page.goto('/access');
  await page.getByLabel('Enter Access Password').fill(PASSWORD);
  await page.getByRole('button',{name:'ACCESS'}).click();
  await expect(page).toHaveURL(/\/$/);
}

async function seedCompanyAndEmployee(page:Page){
  await page.goto('/company');
  await expect(page.getByLabel('Company Name *')).toHaveValue('RapidCrew Solutions Private Limited');
  await page.getByLabel('Authorized Signatory Name').fill('HR Manager');
  await page.getByLabel('Authorized Signatory Designation').fill('Authorized Signatory');
  await page.getByLabel('Upload Official Company Stamp').setInputFiles(stampPath);
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
  await page.getByLabel('Bank Account Number').fill('1234567890');
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
  await page.getByLabel('Days Present').fill('31');
  await page.getByLabel('LOP Days').fill('0');
  await page.getByLabel('Basic').fill('35000');
  await page.getByLabel('HRA').fill('17500');
  await page.getByLabel('Other',{exact:true}).fill('15500');
  await page.getByLabel('Conveyance Allowance').fill('2000');
}

test.beforeEach(async({page})=>{await unlock(page);await seedCompanyAndEmployee(page)});

test('fresh setup uses official RapidCrew Solutions identity and salary preview includes shared stamp by default',async({page})=>{
  await openSalary(page);
  const document=page.locator('#official-document');
  await expect(document.getByText('RapidCrew Solutions Private Limited').first()).toBeVisible();
  await expect(document.getByText('Pay Slip for the Month October 2025')).toBeVisible();
  for(const label of ['Emp Code','Emp Name','Designation','DOJ','PAN','UAN','ESI A/c No','PF No','Working Days','Bank A/c No','Days Present','LOP Days','Gross Earnings','Total Deductions','Net Pay Amount','Net Pay Amount (in words)']) await expect(document.getByText(label,{exact:true}).first()).toBeVisible();
  await expect(document.getByText('₹70,000.00')).toBeVisible();
  await expect(document.getByText('Rupees Seventy Thousand Only')).toBeVisible();
  await expect(document.getByAltText('Official company stamp')).toBeVisible();
  await expect(document.getByText('This is a system-generated payslip.')).toBeVisible();
});

test('the one configured stamp appears on all four letters and can be disabled per document',async({page})=>{
  const docs=['offer-letter','internship-offer-letter','appointment-letter','experience-letter','relieving-letter'];
  for(const type of docs){
    await page.goto(`/create?type=${type}`);
    const employeeLabel=type==='offer-letter'||type==='internship-offer-letter'?'Employee / Candidate *':'Employee *';
    await page.getByLabel(employeeLabel).selectOption({label:'Swarn Sharma · 43'});
    await expect(page.locator('#official-document').getByAltText('Official company stamp')).toBeVisible();
  }
  await page.getByLabel('Include Company Stamp').uncheck();
  await expect(page.locator('#official-document').getByAltText('Official company stamp')).toHaveCount(0);
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
  await expect(page.locator('#official-document').getByAltText('Official company stamp')).toBeVisible();
});

test('company stamp persists after refresh',async({page})=>{
  await page.goto('/company');
  await page.reload();
  await expect(page.getByAltText('Official Company Stamp preview')).toBeVisible();
  await expect(page.getByLabel('Company Name *')).toHaveValue('RapidCrew Solutions Private Limited');
});

test('experience PDF and offer DOCX export while using the shared stamp',async({page})=>{
  await page.goto('/create?type=experience-letter');
  await page.getByLabel('Employee *').selectOption({label:'Swarn Sharma · 43'});
  await expect(page.locator('#official-document').getByAltText('Official company stamp')).toBeVisible();
  await page.getByRole('button',{name:'Final Review'}).click();
  const pdfPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download PDF'}).click();
  const experiencePdf=await pdfPromise; const experiencePath=await experiencePdf.path();
  expect(experiencePath).toBeTruthy();
  expect((await readFile(experiencePath!)).subarray(0,4).toString()).toBe('%PDF');

  await page.goto('/create?type=offer-letter');
  await page.getByLabel('Employee / Candidate *').selectOption({label:'Swarn Sharma · 43'});
  await expect(page.locator('#official-document').getByAltText('Official company stamp')).toBeVisible();
  await page.getByRole('button',{name:'Final Review'}).click();
  const docxPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download Word'}).click();
  const offerDocx=await docxPromise; const offerPath=await offerDocx.path();
  expect(offerPath).toBeTruthy();
  expect((await readFile(offerPath!)).subarray(0,2).toString()).toBe('PK');
});

test('relieving letter print view keeps the shared company stamp',async({page})=>{
  await page.goto('/create?type=relieving-letter');
  await page.getByLabel('Employee *').selectOption({label:'Swarn Sharma · 43'});
  await page.emulateMedia({media:'print'});
  await expect(page.locator('#official-document').getByAltText('Official company stamp')).toBeVisible();
  await expect(page.locator('aside')).toBeHidden();
});


test('internship offer supports live template wording and PDF/DOCX export',async({page})=>{
  await page.goto('/templates');
  await expect(page.getByText('Rapidcrew Internship Offer Letter')).toBeVisible();

  await page.goto('/create?type=internship-offer-letter');
  await expect(page.getByLabel('Document Type')).toHaveValue('internship-offer-letter');
  await page.getByLabel('Employee / Candidate *').selectOption({label:'Swarn Sharma · 43'});
  await page.getByLabel('Internship Start Date').fill('2026-11-01');
  await page.getByLabel('Internship End Date (optional)').fill('2027-01-31');
  await page.getByLabel('Internship Duration').fill('3 months');
  await page.getByLabel('Stipend').fill('₹10,000 per month');

  const document=page.locator('#official-document');
  await expect(document.getByText('INTERNSHIP OFFER LETTER')).toBeVisible();
  await expect(document.getByText(/3 months/)).toBeVisible();
  await expect(document.getByText(/₹10,000 per month/)).toBeVisible();

  await page.getByRole('button',{name:'Final Review'}).click();
  const pdfPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download PDF'}).click();
  const pdfDownload=await pdfPromise;
  expect(pdfDownload.suggestedFilename()).toMatch(/internship_offer_letter.*\.pdf$/i);

  const docxPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'Download Word'}).click();
  const docxDownload=await docxPromise;
  expect(docxDownload.suggestedFilename()).toMatch(/internship_offer_letter.*\.docx$/i);
});
