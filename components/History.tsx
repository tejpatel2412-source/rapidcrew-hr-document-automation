'use client';
import { useEffect, useState } from 'react';
import { Copy, Download, Pencil, Trash2 } from 'lucide-react';
import { AppShell } from './AppShell';
import { Button, Card, PageHeader, Toast } from './ui';
import { db } from '@/lib/db';
import type { HistoryData } from '@/lib/types';
import { uid } from '@/lib/utils';
import { downloadPdf } from '@/lib/exporters';

export default function History(){const [rows,setRows]=useState<HistoryData[]>([]);const [toast,setToast]=useState('');const say=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),2200)};async function load(){setRows(await db.history.orderBy('createdAt').reverse().toArray())}useEffect(()=>{load()},[]);
 function edit(r:HistoryData){localStorage.setItem('rapidcrew_edit_doc',JSON.stringify(r.document));window.location.href='/create'}
 function duplicate(r:HistoryData){const d={...r.document,id:uid(),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};localStorage.setItem('rapidcrew_edit_doc',JSON.stringify(d));window.location.href='/create'}
 async function del(id:string){if(!confirm('Delete this document history entry?'))return;await db.history.delete(id);await load();say('History entry deleted')}
 async function again(r:HistoryData){try{const company=await db.company.get('company');const employee=await db.employees.get(r.document.employeeId);const template=await db.templates.get(r.document.templateId);if(!company||!employee||!template){say('Company, employee, or template data is missing.');return;}await downloadPdf(company,employee,r.document,template);say('PDF downloaded')}catch{say('Unable to download document again.')}}
 return <AppShell><PageHeader title="Document History" description="Documents created in this browser only. Open, duplicate, delete, or generate them again."/><Card><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Document</th><th className="px-4 py-3">Template</th><th className="px-4 py-3">Created</th><th className="px-4 py-3"></th></tr></thead><tbody className="divide-y divide-gray-100">{rows.map(r=><tr key={r.id}><td className="px-4 py-3 font-semibold">{r.employeeName}</td><td className="px-4 py-3 capitalize">{r.documentType.replaceAll('-',' ')}</td><td className="px-4 py-3">{r.templateName}</td><td className="px-4 py-3 text-gray-500">{new Date(r.createdAt).toLocaleString()}</td><td className="px-4 py-3"><div className="flex justify-end gap-1"><Button variant="ghost" onClick={()=>edit(r)} aria-label="Edit again"><Pencil size={16}/></Button><Button variant="ghost" onClick={()=>duplicate(r)} aria-label="Duplicate"><Copy size={16}/></Button><Button variant="ghost" onClick={()=>again(r)} aria-label="Download again"><Download size={16}/></Button><Button variant="ghost" onClick={()=>del(r.id)} aria-label="Delete"><Trash2 size={16}/></Button></div></td></tr>)}{!rows.length&&<tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No local document history yet.</td></tr>}</tbody></table></div></Card><Toast message={toast}/></AppShell>}
