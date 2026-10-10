import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");const {id}=await params;
 const parsedBody=await readLimitedJson(request,16*1024);
 if(!parsedBody.ok)return NextResponse.json({error:parsedBody.reason==="too-large"?"Сұраныс тым үлкен.":"Деректер пішімі дұрыс емес."},{status:parsedBody.reason==="too-large"?413:400,headers:{"Cache-Control":"no-store"}});
 if(!parsedBody.value||typeof parsedBody.value!=="object"||Array.isArray(parsedBody.value))return NextResponse.json({error:"Деректер пішімі дұрыс емес."},{status:400});
 const body=parsedBody.value as Record<string,unknown>;
 const admin=createAdminSupabaseClient();
 const updates:{display_name?:string;meeting_url?:string;external_space_id?:string;active?:boolean}={};
 if(typeof body?.displayName==="string")updates.display_name=body.displayName.trim();
 if(typeof body?.meetingUrl==="string")updates.meeting_url=body.meetingUrl.trim();
 if(typeof body?.externalSpaceId==="string")updates.external_space_id=body.externalSpaceId.trim();
 if(typeof body?.active==="boolean")updates.active=body.active;
 const {data,error}=await admin.from("meet_spaces").update(updates).eq("id",id).select("*").single();
 if(error||!data)return NextResponse.json({error:"Meet space жаңартылмады."},{status:500});
 await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"MEET_SPACE_UPDATED",entity_type:"MEET_SPACE",entity_id:id,metadata:{changes:updates}});
 return NextResponse.json({space:data});
}
