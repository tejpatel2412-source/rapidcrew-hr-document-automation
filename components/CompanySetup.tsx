'use client';
import { useEffect, useState } from 'react';
import { AppShell } from './AppShell';
import { Button, Card, CardHead, Field, PageHeader, SelectField, TextAreaField, Toast } from './ui';
import { db, ensureDefaults } from '@/lib/db';
import { defaultCompany } from '@/lib/defaults';
import type { Alignment, CompanyData } from '@/lib/types';
import { imageFileToDataUrl } from '@/lib/uploads';
import { LETTERHEAD } from '@/lib/letterhead';

const fonts=['Arial','Aptos','Calibri','Times New Roman','Cambria','Georgia','Garamond','Verdana','Tahoma','Trebuchet MS','Helvetica','Inter','Roboto','Open Sans','Lato','Source Sans 3','Noto Sans','Merriweather','Libre Baskerville','IBM Plex Sans'];


export default function CompanySetup(){
 const [data,setData]=useState<CompanyData>(defaultCompany); const [toast,setToast]=useState('');
 useEffect(()=>{(async()=>{await ensureDefaults();const x=await db.company.get('company');if(x)setData(x)})()},[]);
 function patch<K extends keyof CompanyData>(k:K,v:CompanyData[K]){setData(s=>({...s,[k]:v}))}
 const say=(m:string)=>{setToast(m);setTimeout(()=>setToast(''),2500)};
 async function upload(k:'logoDataUrl'|'signatureDataUrl'|'stampDataUrl',file?:File){if(!file)return;try{patch(k,await imageFileToDataUrl(file));say('Image ready to save');}catch(e){say(e instanceof Error?e.message:'Invalid image')}}
 async function save(){try{const saved={...data,id:'company' as const,updatedAt:new Date().toISOString()};await db.company.put(saved);setData(saved);window.dispatchEvent(new CustomEvent('rapidcrew-data-changed',{detail:{scope:'company'}}));say('Company settings saved')}catch{say('Unable to save company settings.')}}
 return <AppShell><PageHeader title="Company Setup" description="Upload company assets once. Every HR document reuses the same branding; applicable letters use the signature and official stamp." action={<Button onClick={save}>Save Company</Button>}/>
 <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
  <div className="space-y-6">
   <Card><CardHead title="Official Rapidcrew Letterhead" description="Applied automatically to Salary Slip, Offer, Appointment, Experience, and Relieving documents in Preview, PDF, DOCX, and Print."/><div className="p-5"><div className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-5 pb-16"><img src={LETTERHEAD.wordmarkSrc} alt="Rapidcrew official wordmark" className="h-10 w-auto object-contain"/><img src={LETTERHEAD.markSrc} alt="" className="pointer-events-none absolute left-1/2 top-1/2 w-28 -translate-x-1/2 -translate-y-1/2" style={{opacity:LETTERHEAD.watermarkOpacity}}/><div className="absolute bottom-3 left-4 right-4 text-[9px] font-semibold text-gray-700"><div className="grid grid-cols-3 gap-2"><span className="underline" style={{color:LETTERHEAD.brandColor}}>{LETTERHEAD.website}</span><span className="text-center">{LETTERHEAD.legalName}</span><span className="text-right">{LETTERHEAD.phone}</span></div><div className="mt-1 text-center">{LETTERHEAD.address}</div></div></div></div></Card>
   <Card><CardHead title="Company Details" description="Only details used in normal HR documents are shown here."/><div className="grid gap-4 p-5 md:grid-cols-2"><Field label="Company Name *" value={data.companyName} onChange={e=>patch('companyName',e.target.value)}/><Field label="Legal Name" value={data.legalCompanyName} onChange={e=>patch('legalCompanyName',e.target.value)}/><TextAreaField label="Address" rows={3} value={data.address} onChange={e=>patch('address',e.target.value)} className="md:col-span-2"/><Field label="Phone" value={data.phone} onChange={e=>patch('phone',e.target.value)}/><Field label="Email" type="email" value={data.email} onChange={e=>patch('email',e.target.value)}/><Field label="Website" value={data.website} onChange={e=>patch('website',e.target.value)}/></div></Card>
   <Card><CardHead title="Document Authorization" description="The same authorized signatory and stamp are available across applicable HR letters."/><div className="grid gap-4 p-5 md:grid-cols-2"><Field label="Authorized Signatory Name" value={data.signatoryName} onChange={e=>patch('signatoryName',e.target.value)}/><Field label="Authorized Signatory Designation" value={data.signatoryDesignation} onChange={e=>patch('signatoryDesignation',e.target.value)}/><label className="md:col-span-2 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold"><input type="checkbox" checked={data.stampEnabled!==false} onChange={e=>patch('stampEnabled',e.target.checked)}/>Company Stamp Enabled by default</label></div></Card>
   <Card><CardHead title="Document Defaults"/><div className="grid gap-4 p-5 md:grid-cols-2"><SelectField label="Currency" value={data.currency} onChange={e=>patch('currency',e.target.value)}><option>INR</option><option>USD</option><option>GBP</option><option>EUR</option></SelectField><SelectField label="Date Format" value={data.dateFormat} onChange={e=>patch('dateFormat',e.target.value)}><option>DD/MM/YYYY</option><option>DD MMM YYYY</option><option>MM/DD/YYYY</option></SelectField><SelectField label="Default Font" value={data.fontFamily} onChange={e=>patch('fontFamily',e.target.value)}>{fonts.map(f=><option key={f}>{f}</option>)}</SelectField><SelectField label="Paper Size" value={data.paperSize||'A4'} onChange={e=>patch('paperSize',e.target.value as 'A4')}><option value="A4">A4</option></SelectField></div></Card>
  </div>
  <div className="space-y-6">
   <AssetCard title="Company Logo" data={data.logoDataUrl} width={data.logoWidth} align={data.logoPosition} onFile={f=>upload('logoDataUrl',f)} onWidth={v=>patch('logoWidth',v)} onAlign={v=>patch('logoPosition',v)} onRemove={()=>patch('logoDataUrl',undefined)}/>
   <AssetCard title="Authorized Signature" data={data.signatureDataUrl} width={data.signatureWidth} align={data.signatureAlignment} onFile={f=>upload('signatureDataUrl',f)} onWidth={v=>patch('signatureWidth',v)} onAlign={v=>patch('signatureAlignment',v)} onRemove={()=>patch('signatureDataUrl',undefined)}/>
   <AssetCard title="Official Company Stamp" data={data.stampDataUrl} width={data.stampWidth} align={data.stampAlignment} onFile={f=>upload('stampDataUrl',f)} onWidth={v=>patch('stampWidth',v)} onAlign={v=>patch('stampAlignment',v)} onRemove={()=>patch('stampDataUrl',undefined)}/>
  </div>
 </div><Toast message={toast}/></AppShell>
}

function AssetCard({title,data,width,align,onFile,onWidth,onAlign,onRemove}:{title:string;data?:string;width:number;align:Alignment;onFile:(f?:File)=>void;onWidth:(n:number)=>void;onAlign:(a:Alignment)=>void;onRemove:()=>void}){
 return <Card><CardHead title={title} description="PNG/JPG/WEBP · max 2 MB"/><div className="p-5"><div className="mb-4 flex min-h-28 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">{data?<img src={data} alt={`${title} preview`} className="max-h-24 max-w-full object-contain"/>:<span className="text-xs text-gray-500">No image uploaded</span>}</div><Field label={`Upload ${title}`} type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>onFile(e.target.files?.[0])}/><div className="mt-3 grid grid-cols-2 gap-3"><Field label="Width (px)" type="number" min={40} max={400} value={width} onChange={e=>onWidth(Number(e.target.value))}/><SelectField label="Alignment" value={align==='justify'?'right':align} onChange={e=>onAlign(e.target.value as Alignment)}><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></SelectField></div>{data&&<Button className="mt-3 w-full" variant="secondary" onClick={onRemove}>Remove Image</Button>}</div></Card>
}
