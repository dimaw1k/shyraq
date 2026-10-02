"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";

type Notification={id:string;title:string;message:string;href:string};

export function NotificationBell(){
 const [items,setItems]=useState<Notification[]>([]);const [open,setOpen]=useState(false);
 useEffect(()=>{let active=true;const load=async()=>{const r=await fetch("/api/student/notifications",{cache:"no-store"});const d=await r.json().catch(()=>({}));if(active&&r.ok)setItems(d.notifications??[]);};void load();return()=>{active=false;};},[]);
 return <div className="relative"><button type="button" aria-label="Хабарландырулар" onClick={()=>setOpen(v=>!v)} className="relative grid h-10 w-10 place-items-center rounded-[12px] text-[#81766D] transition hover:bg-[#F6F2ED] hover:text-[#172235]"><Bell size={17} strokeWidth={1.9}/>{items.length?<span className="absolute right-1.5 top-1.5 grid min-h-4 min-w-4 place-items-center rounded-full bg-[#FF6F2C] px-1 text-[8px] font-extrabold text-white">{Math.min(items.length,99)}</span>:null}</button>{open?<div className="absolute right-0 top-12 z-50 w-[320px] overflow-hidden rounded-[18px] border border-[#E8E1DA] bg-white shadow-[0_20px_70px_rgba(23,34,53,.14)]"><div className="border-b border-[#EFE8E1] px-4 py-3"><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF6F2C]">ХАБАРЛАНДЫРУЛАР</p><p className="mt-1 text-sm font-extrabold text-[#172235]">Хабарландырулар</p></div><div className="max-h-96 overflow-auto">{items.length?items.map(item=><Link key={item.id} href={item.href} onClick={()=>setOpen(false)} className="block border-b border-[#F2ECE7] px-4 py-3 transition hover:bg-[#FFFCF9]"><p className="text-[10px] font-extrabold text-[#172235]">{item.title}</p><p className="mt-1 text-[9px] leading-4 text-[#8B8179]">{item.message}</p></Link>):<p className="px-4 py-8 text-center text-xs font-semibold text-[#9A9189]">Жаңа хабарландыру жоқ.</p>}</div></div>:null}</div>;
}
