'use client';
import Dexie, { type Table } from 'dexie';
import type { CompanyData, EmployeeData, HistoryData, TemplateData } from './types';
import { defaultTemplates } from './defaults';

class RapidcrewDB extends Dexie {
  company!: Table<CompanyData, string>;
  employees!: Table<EmployeeData, string>;
  templates!: Table<TemplateData, string>;
  history!: Table<HistoryData, string>;
  constructor() {
    super('rapidcrew_hr_documents');
    this.version(1).stores({ company: 'id', employees: 'id,employeeId,fullName,status', templates: 'id,type,isDefault', history: 'id,documentType,employeeName,createdAt' });
  }
}

export const db = new RapidcrewDB();

export async function ensureDefaults() {
  if (typeof window === 'undefined') return;
  if ((await db.templates.count()) === 0) await db.templates.bulkPut(defaultTemplates());
}
