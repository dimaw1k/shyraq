"use client";
import Link from "next/link";
import { useEffect,useState } from "react";
import { Bell } from "lucide-react";
import { StatusPill } from "@/components/ui/ShyraqUI";
type Item={id:string;type:string;title:string;message:string;href:string;created_at:string};
export function ChiefMentorNotifications(){
 const [items,setItems]=useState<Item[]>([]);
 useEffect(()=>{let active=true;const run=async()=>{const r=await fetch("/api/chief-mentor/notifications",{cache:"no-store"});const d=await r.json().catch(()=>({}));if(active&&r.ok)setItems(d.notifications??[])};void run();return()=>{active=false}},[]);
 return <div className="rounded-[16px] border border-[#E8E1DA] bg-[#FFFCF9]"><div className="flex items-center justify-between border-b border-[#EFE8E1] px-4 py-3"><div className="flex items-center gap-2"><Bell size={14} className="text-[var(--accent)]"/><p className="text-[11px] font-extrabold text-[#172235]">Notification history</p></div><span className="text-[8px] font-bold text-[#9A9189]">{items.length}</span></div><div className="divide-y divide-[#EFE8E1]">{items.map(item=><Link key={item.id} href={item.href} className="flex items-start gap-3 px-4 py-3 hover:bg-white"><span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]"/><div className="min-w-0 flex-1"><p className="text-[9px] font-extrabold text-[#354153]">{item.title}</p><p className="mt-0.5 truncate text-[8px] text-[#8B8179]">{item.message}</p><p className="mt-1 text-[7px] text-[#A19890]">{new Date(item.created_at).toLocaleString("kk-KZ")}</p></div><StatusPill tone="orange">{item.type}</StatusPill></Link>)}{!items.length?<p className="p-7 text-center text-[9px] font-semibold text-[#9A91890]">Жаңа notification жоқ.</p>:null}</div></div>;
}
