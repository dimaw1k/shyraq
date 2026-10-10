import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

function csvCell(value: string | number) {
 const text = String(value);
 if (typeof value === "number") return text;
 const formulaLike = ["=", "+", "-", "@"].some((prefix) => text.trimStart().startsWith(prefix));
 const safe = formulaLike ? "'" + text : text;
 return '"' + safe.replace(/"/g, '""') + '"';
}

export async function GET(request:Request){
 const { profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
 const rateLimit = await consumeRateLimit("chief-mentor:analytics-export", profile.id, 10, 10 * 60, 10 * 60);
 if (!rateLimit.available) return rateLimitUnavailableResponse();
 if (!rateLimit.allowed) {
  return rateLimitResponse(rateLimit.retryAfterSeconds, "Analytics export сұраныстары тым жиі орындалды.");
 }
 const admin=createAdminSupabaseClient();
 const days=new URL(request.url).searchParams.get("range")==="30"?30:7;
 const start=new Date(Date.now()-days*86400000).toISOString();
 const startDate=start.slice(0,10);
 const [{data:attendance},{data:reports},{data:subs},{data:video}]=await Promise.all([
  admin.from("attendance_records").select("student_id,attendance_percent").gte("imported_at",start),
  admin.from("daily_reports").select("student_id,status").gte("report_date",startDate),
  admin.from("task_submissions").select("student_id,status").gte("submitted_at",start),
  admin.from("video_progress").select("student_id,watched_percent").gte("updated_at",start),
 ]);
 const ids=[...new Set([...(attendance??[]).map(x=>x.student_id),...(reports??[]).map(x=>x.student_id),...(subs??[]).map(x=>x.student_id),...(video??[]).map(x=>x.student_id)])];
 const {data:students}=ids.length?await admin.from("profiles").select("id,full_name,email").in("id",ids):{data:[] as Array<{id:string;full_name:string;email:string}>};
 const names=new Map((students??[]).map(x=>[x.id,x]));
 const values=ids.map(id=>{const a=(attendance??[]).filter(x=>x.student_id===id);const r=(reports??[]).filter(x=>x.student_id===id);const s=(subs??[]).filter(x=>x.student_id===id);const v=(video??[]).filter(x=>x.student_id===id);return{id,name:names.get(id)?.full_name??"",email:names.get(id)?.email??"",attendance:a.length?a.reduce((x,y)=>x+Number(y.attendance_percent??0),0)/a.length:0,reports:r.length,tasks:s.length,video:v.length?v.reduce((x,y)=>x+Number(y.watched_percent??0),0)/v.length:0};});
 const head="id,name,email,attendance_percent,reports,tasks,video_percent\n";
 const body=values.map(x=>[x.id,x.name,x.email,x.attendance.toFixed(2),x.reports,x.tasks,x.video.toFixed(2)].map(csvCell).join(",")).join("\n");
 return new NextResponse(head+body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":"attachment; filename=shyraq-chief-mentor-analytics.csv","Cache-Control":"private, no-store, max-age=0","X-Content-Type-Options":"nosniff"}});
}
