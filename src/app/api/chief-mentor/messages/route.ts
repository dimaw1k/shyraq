import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const mentorId=new URL(request.url).searchParams.get("mentorId")?.trim() ?? "";
 const admin=createAdminSupabaseClient();
 const {data:mentors}=await admin.from("profiles").select("id,full_name,email,phone,status").eq("role","MENTOR").order("full_name");
 if(!mentorId)return NextResponse.json({mentors:mentors??[],messages:[]});
 if(!UUID_RE.test(mentorId)) return NextResponse.json({error:"Mentor ID форматы дұрыс емес."},{status:400});
 const filter="and(sender_id.eq."+profile.id+",recipient_id.eq."+mentorId+"),and(sender_id.eq."+mentorId+",recipient_id.eq."+profile.id+")";
 const {data:messages,error}=await admin.from("staff_messages").select("id,sender_id,recipient_id,body,read_at,created_at").or(filter).order("created_at",{ascending:true}).limit(200);
 if(error)return NextResponse.json({error:"Хабарламаларды жүктеу сәтсіз аяқталды."},{status:500});
 return NextResponse.json({mentors:mentors??[],messages:messages??[]});
}

export async function POST(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const rateLimit = await consumeRateLimit("chief-mentor:staff-message", profile.id, 30, 10 * 60, 10 * 60);
 if (!rateLimit.available) return rateLimitUnavailableResponse();
 if (!rateLimit.allowed) return rateLimitResponse(rateLimit.retryAfterSeconds, "Қызметтік хабарламалар тым жиі жіберілді. Кейінірек қайта көріңіз.");
 const parsedBody=await readLimitedJson(request,16*1024);
 if(!parsedBody.ok) return NextResponse.json({error:parsedBody.reason==="too-large"?"Сұраныс тым үлкен.":"Хабарлама деректері дұрыс емес."},{status:parsedBody.reason==="too-large"?413:400,headers:{"Cache-Control":"no-store"}});
 if(!parsedBody.value||typeof parsedBody.value!=="object"||Array.isArray(parsedBody.value)) return NextResponse.json({error:"Хабарлама деректері дұрыс емес."},{status:400});
 const body=parsedBody.value as Record<string,unknown>;
 const recipientId=typeof body.recipientId==="string"?body.recipientId.trim():"";
 const text=typeof body.body==="string"?body.body.trim():"";
 if(!UUID_RE.test(recipientId)||!text||text.length>4000)return NextResponse.json({error:"Recipient және 1–4000 таңбалы хабарлама қажет."},{status:400});
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
  const patchLimit = await consumeRateLimit("chief-mentor:staff-message-read-update", profile.id, 120, 600, 60);
  if (!patchLimit.available) return rateLimitUnavailableResponse();
  if (!patchLimit.allowed) {
    return rateLimitResponse(patchLimit.retryAfterSeconds, "Хабарлама күйін жаңарту сұраныстары тым жиі жіберілді.");
  }
 const parsedBody=await readLimitedJson(request,16*1024);
 if(!parsedBody.ok) return NextResponse.json({error:parsedBody.reason==="too-large"?"Сұраныс тым үлкен.":"Хабарлама деректері дұрыс емес."},{status:parsedBody.reason==="too-large"?413:400,headers:{"Cache-Control":"no-store"}});
 if(!parsedBody.value||typeof parsedBody.value!=="object"||Array.isArray(parsedBody.value)) return NextResponse.json({error:"Хабарлама деректері дұрыс емес."},{status:400});
 const body=parsedBody.value as Record<string,unknown>;
 const id=typeof body.id==="string"?body.id.trim():"";
 if(!UUID_RE.test(id))return NextResponse.json({error:"Message ID дұрыс емес."},{status:400});
 const admin=createAdminSupabaseClient();
 const {error}=await admin.from("staff_messages").update({read_at:new Date().toISOString()}).eq("id",id).eq("recipient_id",profile.id);
 if(error)return NextResponse.json({error:"Хабарлама жаңартылмады."},{status:500});
 return NextResponse.json({ok:true});
}
