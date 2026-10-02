import { Mail } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { ChiefMentorMessagesManager } from "@/components/staff/ChiefMentorMessagesManager";
import { getAuthenticatedStaff } from "@/lib/staff/server";
export default async function ChiefMentorMessagesPage({searchParams}:{searchParams:Promise<{mentorId?:string}>}){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");const params=await searchParams;
 const {data:mentors}=await supabase.from("profiles").select("id,full_name,email,phone,status").eq("role","MENTOR").order("full_name");
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Хабарламалар" description="Менторлармен жеке ішкі байланыс."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="MESSAGES" title="Менторлармен байланыс" description="Private chat арқылы тікелей сөйлесу." action={<Mail size={18} className="text-[var(--accent)]"/>}/><Card className="p-4 sm:p-5"><ChiefMentorMessagesManager initialMentors={mentors??[]} initialMentorId={params.mentorId??null}/></Card></div></PageContainer></AppShell>;
}