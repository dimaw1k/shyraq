import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function GET(){
 await getAuthenticatedStaff("CHIEF_MENTOR");
 const admin=createAdminSupabaseClient();
 const [{data:attendance},{data:reports},{data:subs},{data:video}]=await Promise.all([
  admin.from("attendance_records").select("student_id,attendance_percent"),
  admin.from("daily_reports").select("student_id,status"),
  admin.from("task_submissions").select("student_id,status"),
  admin.from("video_progress").select("student_id,watched_percent"),
 ]);
 const ids=[...new Set([...(attendance??[]).map(x=>x.student_id),...(reports??[]).map(x=>x.student_id),...(subs??[]).map(x=>x.student_id),...(video??[]).map(x=>x.student_id)])];
 const {data:students}=ids.length?await admin.from("profiles").select("id,full_name,email").in("id",ids):{data:[] as Array<{id:string;full_name:string;email:string}>};
 const names=new Map((students??[]).map(x=>[x.id,x]));
 const values=ids.map(id=>{const a=(attendance??[]).filter(x=>x.student_id===id);const r=(reports??[]).filter(x=>x.student_id===id);const s=(subs??[]).filter(x=>x.student_id===id);const v=(video??[]).filter(x=>x.student_id===id);return{id,name:names.get(id)?.full_name??"",email:names.get(id)?.email??"",attendance:a.length?a.reduce((x,y)=>x+Number(y.attendance_percent??0),0)/a.length:0,reports:r.length,tasks:s.length,video:v.length?v.reduce((x,y)=>x+Number(y.watched_percent??0),0)/v.length:0};});
 const head="id,name,email,attendance_percent,reports,tasks,video_percent\n";const body=values.map(x=>[x.id,JSON.stringify(x.name),JSON.stringify(x.email),x.attendance.toFixed(2),x.reports,x.tasks,x.video.toFixed(2)].join(",")).join("\n");
 return new NextResponse(head+body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=shyraq-chief-mentor-analytics.csv"}});
}
