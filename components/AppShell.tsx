'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, FileClock, FilePlus2, LayoutDashboard, LockKeyhole, Menu, Settings, Users, Files, X } from 'lucide-react';
import { useState } from 'react';

const items = [
  ['/', 'Dashboard', LayoutDashboard], ['/create','Create Document',FilePlus2], ['/employees','Employees',Users], ['/templates','Templates',Files], ['/company','Company Setup',Building2], ['/history','Document History',FileClock], ['/settings','Settings',Settings]
] as const;

export function AppShell({children}:{children:React.ReactNode}){
  const path=usePathname(); const [open,setOpen]=useState(false);
  async function lock(){try{await fetch('/api/lock',{method:'POST'});}finally{window.location.href='/access';}}
  return <div className="min-h-screen bg-[#f7f7f5]">
    <header className="no-print sticky top-0 z-40 flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:hidden">
      <button aria-label="Open navigation" onClick={()=>setOpen(true)} className="mr-3 rounded-md p-2 hover:bg-gray-100"><Menu size={20}/></button>
      <div><div className="font-black tracking-wide text-[#8B0000]">RAPIDCREW</div><div className="text-[10px] font-medium tracking-widest text-gray-500">HR DOCUMENT AUTOMATION</div></div><button onClick={lock} className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"><LockKeyhole size={14}/>LOCK</button>
    </header>
    <aside className={`no-print fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white p-4 transition-transform lg:translate-x-0 ${open?'translate-x-0':'-translate-x-full'}`}>
      <div className="mb-8 flex items-start justify-between">
        <div><div className="text-2xl font-black tracking-wide text-[#8B0000]">RAPIDCREW</div><div className="mt-0.5 text-[10px] font-semibold tracking-[.18em] text-gray-500">HR DOCUMENT AUTOMATION</div></div>
        <button aria-label="Close navigation" className="rounded p-1 lg:hidden" onClick={()=>setOpen(false)}><X size={20}/></button>
      </div>
      <nav className="space-y-1">
        {items.map(([href,label,Icon])=>{ const active=href==='/'?path==='/':path.startsWith(href); return <Link key={href} href={href} onClick={()=>setOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold ${active?'bg-red-50 text-[#8B0000]':'text-gray-700 hover:bg-gray-100'}`}><Icon size={18}/>{label}</Link>})}
      </nav>
      <button onClick={lock} className="absolute bottom-24 left-4 right-4 flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"><LockKeyhole size={15}/>LOCK</button>
      <div className="absolute bottom-4 left-4 right-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs leading-5 text-gray-600">Local-first mode<br/><span className="font-semibold text-green-700">HR data stays in this browser.</span></div>
    </aside>
    <main className="print-shell lg:pl-64"><div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">{children}</div></main>
  </div>
}
