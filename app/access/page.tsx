'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandSplash, markInitialBrandSplashShown } from '@/components/BrandSplash';

export default function AccessPage(){
  const router=useRouter();
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [granted,setGranted]=useState(false);

  async function submit(event:FormEvent){
    event.preventDefault(); setError(''); setBusy(true);
    try{
      const response=await fetch('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});
      if(response.ok){markInitialBrandSplashShown();setGranted(true);window.setTimeout(()=>{router.replace('/');router.refresh();},900);return;}
      const data=await response.json().catch(()=>({}));
      setError(data.error || 'Incorrect password. Please try again.');
    }catch{
      setError('Unable to verify access right now. Please try again.');
    }finally{setBusy(false)}
  }

  return <main className="min-h-screen bg-[#f7f7f5] px-4 py-10 sm:py-16">
    <BrandSplash visible={granted} mode="success"/>
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center"><img src="/brand/rapidcrew-letterhead-wordmark.png" alt="Rapidcrew" className="mx-auto h-14 w-auto max-w-[290px] object-contain"/><div className="mt-3 text-lg font-black tracking-wide brand-text">RAPIDCREW PVT LTD</div><h1 className="mt-1 text-sm font-bold tracking-[.22em] text-gray-600">HR CRM</h1></div>
      <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <label htmlFor="access-password" className="block text-sm font-semibold text-gray-800">Enter Access Password</label>
        <input id="access-password" type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm brand-focus" required autoFocus/>
        {error&&<div role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <button type="submit" disabled={busy||!password} className="mt-5 w-full rounded-lg brand-bg px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{busy?'VERIFYING...':'ACCESS'}</button>
      </form>
      <p className="mt-4 text-center text-xs text-gray-500">Authorized access only. HR records remain stored locally in this browser.</p>
    </div>
  </main>;
}
