'use client';
import { db } from './db';
import type { BackupData } from './types';

export async function exportBackup(): Promise<BackupData> {
  return { version:1, exportedAt:new Date().toISOString(), company: await db.company.get('company'), employees: await db.employees.toArray(), templates: await db.templates.toArray(), history: await db.history.toArray() };
}
export async function importBackup(data: BackupData) {
  if(!data || data.version!==1 || !Array.isArray(data.employees) || !Array.isArray(data.templates) || !Array.isArray(data.history)) throw new Error('Invalid or unsupported backup file.');
  await db.transaction('rw', db.company, db.employees, db.templates, db.history, async()=>{
    await Promise.all([db.company.clear(),db.employees.clear(),db.templates.clear(),db.history.clear()]);
    if(data.company) await db.company.put(data.company); if(data.employees.length) await db.employees.bulkPut(data.employees); if(data.templates.length) await db.templates.bulkPut(data.templates); if(data.history.length) await db.history.bulkPut(data.history);
  });
}
