'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BriefcaseBusiness, FileBadge2, FileCheck2, FileText, ReceiptIndianRupee } from 'lucide-react';
import { db, ensureDefaults } from '@/lib/db';
import { AppShell } from './AppShell';
import { Card, PageHeader } from './ui';
import type { HistoryData } from '@/lib/types';

const docs=[
  ['salary-slip','Salary Slip','Create professional monthly salary slips',ReceiptIndianRupee],
  ['offer-letter','Offer Letter','Create company-format employment offers',BriefcaseBusiness],
  ['appointment-letter','Appointment Letter','Create appointment documentation',FileText],
  ['experience-letter','Experience Letter','Generate employee experience certification',FileBadge2],
  ['relieving-letter','Relieving Letter','Generate official relieving documentation',FileCheck2]
] as const;

export default function Dashboard(){
  const [stats,setStats]=useState({history:0,employees:0,templates:0});
  const [stampReady,setStampReady]=useState(true);
  const [recent,setRecent]=useState<HistoryData[]>([]);
  useEffect(()=>{(async()=>{
    await ensureDefaults();
    const [h,e,t,c]=await Promise.all([db.history.count(),db.employees.count(),db.templates.count(),db.company.get('company')]);
    setStats({history:h,employees:e,templates:t});
    setStampReady(Boolean(c?.stampDataUrl)||c?.stampEnabled===false);
    setRecent(await db.history.orderBy('createdAt').reverse().limit(5).toArray());
  })()},[]);
  return <AppShell><PageHeader title="Create HR Document" description="Generate professional company-format HR documents with minimum manual input."/>
    {!stampReady&&<div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-semibold text-amber-950">Company stamp not configured.</div><div className="text-sm text-amber-800">RapidCrew Solutions Private Limited is ready to use. Upload the official stamp once to show it across documents.</div></div><Link href="/company" className="rounded-lg brand-bg px-4 py-2 text-center text-sm font-semibold text-white">UPLOAD STAMP</Link></div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{docs.map(([type,title,desc,Icon])=><Link key={type} href={`/create?type=${type}`}><Card className="h-full p-5 transition hover:-translate-y-0.5 brand-card hover:shadow-md"><div className="mb-4 inline-flex rounded-lg brand-soft p-2.5"><Icon size={22}/></div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm leading-5 text-gray-600">{desc}</p></Card></Link>)}</div>
    <div className="mt-6 grid gap-4 sm:grid-cols-3"><Card className="p-5"><div className="text-3xl font-black text-gray-950">{stats.history}</div><div className="mt-1 text-sm text-gray-600">Documents Created</div></Card><Card className="p-5"><div className="text-3xl font-black text-gray-950">{stats.employees}</div><div className="mt-1 text-sm text-gray-600">Employees Saved</div></Card><Card className="p-5"><div className="text-3xl font-black text-gray-950">{stats.templates}</div><div className="mt-1 text-sm text-gray-600">Templates Available</div></Card></div>
    <Card className="mt-6"><div className="border-b border-gray-100 px-5 py-4 font-bold">Recent Documents</div><div className="divide-y divide-gray-100">{recent.length?recent.map(r=><div key={r.id} className="flex items-center justify-between px-5 py-3 text-sm"><div><div className="font-semibold">{r.employeeName}</div><div className="text-gray-500">{r.documentType.replaceAll('-',' ')} · {r.templateName}</div></div><div className="text-xs text-gray-500">{new Date(r.createdAt).toLocaleString()}</div></div>):<div className="px-5 py-8 text-center text-sm text-gray-500">No documents created in this browser yet.</div>}</div></Card>
  </AppShell>;
}
