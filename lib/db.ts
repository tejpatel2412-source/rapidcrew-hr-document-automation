'use client';
import Dexie, { type Table } from 'dexie';
import type { CompanyData, EmployeeData, HistoryData, TemplateData } from './types';
import { defaultCompany, defaultTemplates } from './defaults';
import { migrateAuthorizationAlignmentRecord, migrateCompanyRecord, migrateHistoryRecord, migrateLetterheadCompanyRecord, migrateRapidcrewDefaultsV5, migrateTemplateRecord } from './migrations';

class RapidcrewDB extends Dexie {
  company!: Table<CompanyData, string>;
  employees!: Table<EmployeeData, string>;
  templates!: Table<TemplateData, string>;
  history!: Table<HistoryData, string>;

  constructor() {
    super('rapidcrew_hr_documents');
    const stores = {
      company: 'id',
      employees: 'id,employeeId,fullName,status',
      templates: 'id,type,isDefault',
      history: 'id,documentType,employeeName,createdAt',
    };
    this.version(1).stores(stores);
    this.version(2).stores(stores).upgrade(async (tx) => {
      await tx.table('company').toCollection().modify((record: CompanyData) => Object.assign(record, migrateCompanyRecord(record)));
      await tx.table('templates').toCollection().modify((record: TemplateData) => Object.assign(record, migrateTemplateRecord(record)));
      await tx.table('history').toCollection().modify((record: HistoryData) => Object.assign(record, migrateHistoryRecord(record)));
    });
    this.version(3).stores(stores).upgrade(async (tx) => {
      await tx.table('company').toCollection().modify((record: CompanyData) => Object.assign(record, migrateLetterheadCompanyRecord(record)));
    });
    this.version(4).stores(stores).upgrade(async (tx) => {
      await tx.table('company').toCollection().modify((record: CompanyData) => Object.assign(record, migrateAuthorizationAlignmentRecord(record)));
    });
    this.version(5).stores(stores).upgrade(async (tx) => {
      await tx.table('company').toCollection().modify((record: CompanyData) => Object.assign(record, migrateRapidcrewDefaultsV5(record)));
      await tx.table('templates').toCollection().modify((record: TemplateData) => Object.assign(record, migrateTemplateRecord(record)));
      await tx.table('history').toCollection().modify((record: HistoryData) => Object.assign(record, migrateHistoryRecord(record)));
    });
  }
}

export const db = new RapidcrewDB();

export async function ensureDefaults() {
  if (typeof window === 'undefined') return;
  if ((await db.company.count()) === 0) await db.company.put({ ...defaultCompany, updatedAt: new Date().toISOString() });
  const defaults = defaultTemplates();
  if ((await db.templates.count()) === 0) {
    await db.templates.bulkPut(defaults);
    return;
  }
  const existing = await db.templates.toArray();
  const existingTypes = new Set(existing.map(template => template.type));
  const missing = defaults.filter(template => !existingTypes.has(template.type));
  if (missing.length) await db.templates.bulkPut(missing);
}
