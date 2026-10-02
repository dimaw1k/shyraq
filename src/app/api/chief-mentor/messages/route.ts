import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function GET(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const mentorId=new URL(request.url).searchParams.get("mentorId");
 const admin=createAdminSupabaseClient();
 const {data:mentors}=await admin.from("profiles").select("id,full_name,email,phone,status").eq("role","MENTOR").order("full_name");
 if(!mentorId)return NextResponse.json({mentors:mentors??[],messages:[]});
 const filter="and(sender_id.eq."+profile.id+",recipient_id.eq."+mentorId+"),and(sender_id.eq."+mentorId+",recipient_id.eq."+profile.id+")";
 const {data:messages,error}=await admin.from("staff_messages").select("id,sender_id,recipient_id,body,read_at,created_at").or(filter).order("created_at",{ascending:true}).limit(200);
 if(error)return NextResponse.json({error:"Хабарламаларды жүктеу сәтсіз аяқталды."},{status:500});
 return NextResponse.json({mentors:mentors??[],messages:messages??[]});
}

export async function POST(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const body=await request.json().catch(()=>null);
 const recipientId=typeof body?.recipientId==="string"?body.recipientId:"";
 const text=typeof body?.body==="string"?body.body.trim().slice(0,4000):"";
 if(!recipientId||!text)return NextResponse.json({error:"Recipient және message қажет."},{status:400});
 const admin=createAdminSupabaseClient();
 const {data:mentor}=await admin.from("profiles").select("id,role").eq("id",recipientId).maybeSingle();
 if(!mentor||mentor.role!=="MENTOR")return NextResponse.json({error:"Хабарлама тек менторға жіберіледі."},{status:403});
 const {data,error}=await admin.from("staff_messages").insert({sender_id:profile.id,recipient_id:recipientId,body:text}).select("*").single();
 if(error||!data)return NextResponse.json({error:"Хабарлама жіберілмеді."},{status:500});
 await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"STAFF_MESSAGE_SENT",entity_type:"STAFF_MESSAGE",entity_id:data.id,metadata:{recipient_id:recipientId}});
 return NextResponse.json({message:data});
}

export async function PATCH(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const body=await request.json().catch(()=>null);const id=typeof body?.id==="string"?body.id:"";
 if(!id)return NextResponse.json({error:"Message ID қажет."},{status:400});
 const admin=createAdminSupabaseClient();
 const {error}=await admin.from("staff_messages").update({read_at:new Date().toISOString()}).eq("id",id).eq("recipient_id",profile.id);
 if(error)return NextResponse.json({error:"Хабарлама жаңартылмады."},{status:500});
 return NextResponse.json({ok:true});
}
