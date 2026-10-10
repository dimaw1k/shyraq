import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

export async function GET(){
 const {profile}=await getAuthenticatedStaff(["MENTOR","CHIEF_MENTOR","LEADER"]);
 const admin=createAdminSupabaseClient();
 const {data,error}=await admin.from("daily_report_questions").select("*").order("marathon_day").order("sort_order");
 if(error)return NextResponse.json({error:"Report сұрақтарын жүктеу сәтсіз."},{status:500});
 return NextResponse.json({actor:profile.role,questions:data??[]});
}

export async function POST(request:Request){
 const {profile}=await getAuthenticatedStaff(["CHIEF_MENTOR","LEADER"]);
  const rateLimit = await consumeRateLimit("chief-mentor:report-question-write", profile.id, 30, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Есеп сұрақтарын өзгерту әрекеттері тым жиі орындалды.");
  }
  const parsedBody = await readLimitedJson(request, 16 * 1024);
 if (!parsedBody.ok) {
   return NextResponse.json(
     { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Есеп сұрағының деректері дұрыс емес." },
     { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
   );
 }
 if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
   return NextResponse.json({ error: "Есеп сұрағының деректері дұрыс емес." }, { status: 400 });
 }
 const body = parsedBody.value as Record<string, unknown>;
 const question=typeof body?.question==="string"?body.question.trim():"";
 const fieldKey=typeof body?.fieldKey==="string"?body.fieldKey.trim().toLowerCase().replace(/[^a-z0-9_]/g,"_").slice(0,80):"";
 const fieldType=body?.fieldType;
 const marathonDay=body?.marathonDay===null||body?.marathonDay===""||body?.marathonDay===undefined?null:Number(body.marathonDay);
 if(!question||question.length>1000||!fieldKey)return NextResponse.json({error:"Сұрақ 1–1000 таңба және key міндетті."},{status:400});
 if(typeof fieldType!=="string"||!["SHORT_TEXT","LONG_TEXT","NUMBER"].includes(fieldType))return NextResponse.json({error:"Сұрақ түрі дұрыс емес."},{status:400});
 if(marathonDay!==null&&(!Number.isInteger(marathonDay)||marathonDay<1||marathonDay>21))return NextResponse.json({error:"Күн 1–21 аралығында болуы керек."},{status:400});
 const admin=createAdminSupabaseClient();
 const {data,error}=await admin.from("daily_report_questions").insert({question,field_key:fieldKey,field_type:fieldType,marathon_day:marathonDay,required:Boolean(body?.required),sort_order:Number(body?.sortOrder??0)||0,active:body?.active!==false,created_by:profile.id}).select("*").single();
 if(error)return NextResponse.json({error:error.code==="23505"?"Бұл key осы күнге бұрыннан бар.":"Сұрақ сақталмады."},{status:400});
 return NextResponse.json({question:data});
}

export async function PATCH(request:Request){
 const {profile}=await getAuthenticatedStaff(["CHIEF_MENTOR","LEADER"]);
  const rateLimit = await consumeRateLimit("chief-mentor:report-question-write", profile.id, 30, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Есеп сұрақтарын өзгерту әрекеттері тым жиі орындалды.");
  }
 const parsedBody = await readLimitedJson(request, 16 * 1024);
 if(!parsedBody.ok) return NextResponse.json({error:parsedBody.reason==="too-large"?"Сұраныс тым үлкен.":"Есеп сұрағының деректері дұрыс емес."},{status:parsedBody.reason==="too-large"?413:400,headers:{"Cache-Control":"no-store"}});
 if(!parsedBody.value||typeof parsedBody.value!=="object"||Array.isArray(parsedBody.value)) return NextResponse.json({error:"Есеп сұрағының деректері дұрыс емес."},{status:400});
 const body=parsedBody.value as Record<string, unknown>; const id=String(body.id??"");
 if(!id||id.length>80)return NextResponse.json({error:"Question ID дұрыс емес."},{status:400});
 const admin=createAdminSupabaseClient();
 const {data,error}=await admin.from("daily_report_questions").update({question:typeof body?.question==="string"?body.question.trim():undefined,required:typeof body?.required==="boolean"?body.required:undefined,sort_order:typeof body?.sortOrder==="number"?Math.floor(body.sortOrder):undefined,active:typeof body?.active==="boolean"?body.active:undefined,marathon_day:body?.marathonDay===null?null:typeof body?.marathonDay==="number"?Math.floor(body.marathonDay):undefined}).eq("id",id).select("*").single();
 if(error||!data)return NextResponse.json({error:"Сұрақ жаңартылмады."},{status:500});
 await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"REPORT_QUESTION_UPDATED",entity_type:"DAILY_REPORT_QUESTION",entity_id:id,metadata:{active:data.active}});
 return NextResponse.json({question:data});
}

export async function DELETE(request:Request){
 const {profile}=await getAuthenticatedStaff(["CHIEF_MENTOR","LEADER"]);
  const rateLimit = await consumeRateLimit("chief-mentor:report-question-write", profile.id, 30, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Есеп сұрақтарын өзгерту әрекеттері тым жиі орындалды.");
  }
 const id=new URL(request.url).searchParams.get("id");
 if(!id)return NextResponse.json({error:"Question ID қажет."},{status:400});
 const admin=createAdminSupabaseClient();
 const {error}=await admin.from("daily_report_questions").delete().eq("id",id);
 if(error)return NextResponse.json({error:"Сұрақ өшірілмеді."},{status:500});
 await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"REPORT_QUESTION_DELETED",entity_type:"DAILY_REPORT_QUESTION",entity_id:id,metadata:{}});
 return NextResponse.json({ok:true});
}
