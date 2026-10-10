import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

export async function GET(){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const admin=createAdminSupabaseClient();
 const {data:tickets,error}=await admin.from("support_tickets").select("id,student_id,category,subject,message,status,staff_note,resolved_by,resolved_at,created_at,updated_at").order("updated_at",{ascending:false}).limit(100);
 if(error)return NextResponse.json({error:"Support өтініштерін жүктеу сәтсіз."},{status:500});
 const ids=[...new Set((tickets??[]).map(t=>t.student_id))];
 const {data:students}=ids.length?await admin.from("profiles").select("id,full_name,phone,email").in("id",ids):{data:[] as Array<{id:string;full_name:string;phone:string;email:string}>};
 const map=new Map((students??[]).map(s=>[s.id,s]));
 return NextResponse.json({actor:profile.full_name,tickets:(tickets??[]).map(t=>({...t,profiles:map.get(t.student_id)??null}))});
}

export async function PATCH(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const parsedBody=await readLimitedJson(request,16*1024);
 if(!parsedBody.ok)return NextResponse.json({error:parsedBody.reason==="too-large"?"Сұраныс тым үлкен.":"Өтініш деректері дұрыс емес."},{status:parsedBody.reason==="too-large"?413:400,headers:{"Cache-Control":"no-store"}});
 if(!parsedBody.value||typeof parsedBody.value!=="object"||Array.isArray(parsedBody.value))return NextResponse.json({error:"Өтініш деректері дұрыс емес."},{status:400});
 const body=parsedBody.value as Record<string,unknown>;
 const id=typeof body.id==="string"?body.id.trim():"";
 const status=body.status;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)||typeof status!=="string"||!["NEW","IN_PROGRESS","RESOLVED"].includes(status))return NextResponse.json({error:"Ticket ID және status дұрыс емес."},{status:400});
 if(body.staffNote!==undefined&&body.staffNote!==null&&(typeof body.staffNote!=="string"||body.staffNote.length>3000))return NextResponse.json({error:"Staff note 3000 таңбадан аспауы керек."},{status:400});
 const admin=createAdminSupabaseClient();
 const {data,error}=await admin.from("support_tickets").update({
  status,
  staff_note:typeof body?.staffNote==="string"?body.staffNote.trim()||null:null,
  resolved_by:status==="RESOLVED"?profile.id:null,
  resolved_at:status==="RESOLVED"?new Date().toISOString():null,
 }).eq("id",id).select("*").single();
 if(error)return NextResponse.json({error:"Support жаңартылмады."},{status:500});
 await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"CHIEF_MENTOR_SUPPORT_UPDATED",entity_type:"SUPPORT_TICKET",entity_id:id,metadata:{status}});
 return NextResponse.json({ticket:data});
}