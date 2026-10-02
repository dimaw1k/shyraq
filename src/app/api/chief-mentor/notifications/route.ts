import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function GET(){
 await getAuthenticatedStaff("CHIEF_MENTOR");
 const admin=createAdminSupabaseClient();
 const [{data:requests},{data:reports},{data:support}]=await Promise.all([
  admin.from("mentor_task_requests").select("id,title,mentor_id,team_id,created_at").eq("status","REQUESTED").order("created_at",{ascending:false}).limit(20),
  admin.from("daily_reports").select("id,student_id,report_date,submitted_at").eq("status","SUBMITTED").order("submitted_at",{ascending:false}).limit(20),
  admin.from("support_tickets").select("id,subject,created_at").eq("status","NEW").order("created_at",{ascending:false}).limit(20),
 ]);
 const mentorIds=[...new Set((requests??[]).map(x=>x.mentor_id))];const studentIds=[...new Set((reports??[]).map(x=>x.student_id))];
 const [{data:mentors},{data:students}]=await Promise.all([
  mentorIds.length?admin.from("profiles").select("id,full_name").in("id",mentorIds):Promise.resolve({data:[] as Array<{id:string;full_name:string}>}),
  studentIds.length?admin.from("profiles").select("id,full_name").in("id",studentIds):Promise.resolve({data:[] as Array<{id:string;full_name:string}>}),
 ]);
 const mentorMap=new Map((mentors??[]).map(x=>[x.id,x.full_name]));const studentMap=new Map((students??[]).map(x=>[x.id,x.full_name]));
 const items=[
  ...(requests??[]).map(x=>({id:"task-"+x.id,type:"TASK_REQUEST",title:"Жаңа тапсырма сұранысы",message:(mentorMap.get(x.mentor_id)??"Ментор")+" · "+x.title,href:"/chief-mentor/tasks",created_at:x.created_at})),
  ...(reports??[]).map(x=>({id:"report-"+x.id,type:"REPORT",title:"Жаңа күндік есеп",message:(studentMap.get(x.student_id)??"Оқушы")+" · "+x.report_date,href:"/chief-mentor/reports",created_at:x.submitted_at??x.report_date})),
  ...(support??[]).map(x=>({id:"support-"+x.id,type:"SUPPORT",title:"Жаңа қолдау өтініші",message:x.subject,href:"/chief-mentor/support",created_at:x.created_at})),
 ].sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at)).slice(0,50);
 return NextResponse.json({notifications:items});
}
