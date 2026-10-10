import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

export async function POST(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const parsedBody=await readLimitedJson(request,16*1024);
 if(!parsedBody.ok)return NextResponse.json({error:parsedBody.reason==="too-large"?"Сұраныс тым үлкен.":"Деректер пішімі дұрыс емес."},{status:parsedBody.reason==="too-large"?413:400,headers:{"Cache-Control":"no-store"}});
 if(!parsedBody.value||typeof parsedBody.value!=="object"||Array.isArray(parsedBody.value))return NextResponse.json({error:"Деректер пішімі дұрыс емес."},{status:400});
 const body=parsedBody.value as Record<string,unknown>;
 const teamId=typeof body.teamId==="string"?body.teamId.trim():"";
 const displayName=typeof body.displayName==="string"?body.displayName.trim():"";
 const meetingUrl=typeof body.meetingUrl==="string"?body.meetingUrl.trim():"";
 const externalSpaceId=typeof body.externalSpaceId==="string"?body.externalSpaceId.trim():"";
 const rawStudyTime=body.studyTime===undefined?"MORNING":body.studyTime;
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teamId))return NextResponse.json({error:"Команда ID дұрыс емес."},{status:400});
 if(!displayName||displayName.length>120||!meetingUrl||meetingUrl.length>2048||!externalSpaceId||externalSpaceId.length>200)return NextResponse.json({error:"Команда, атау, Meet URL және space ID міндетті; атау 120 таңбадан аспауы керек."},{status:400});
 if(typeof rawStudyTime!=="string"||!["MORNING","EVENING","EXTRA"].includes(rawStudyTime))return NextResponse.json({error:"Meet түрі дұрыс емес."},{status:400});
 let parsedMeetingUrl:URL;
 try{parsedMeetingUrl=new URL(meetingUrl);}catch{return NextResponse.json({error:"Meet URL дұрыс емес."},{status:400});}
 if(parsedMeetingUrl.protocol!=="https:"||parsedMeetingUrl.hostname!=="meet.google.com"||!/^\/[a-z0-9-]+\/?$/i.test(parsedMeetingUrl.pathname))return NextResponse.json({error:"Тек жарамды Google Meet сілтемесіне рұқсат."},{status:400});
 if(!/^spaces\/[A-Za-z0-9_-]{3,180}$/.test(externalSpaceId))return NextResponse.json({error:"Google Meet space ID дұрыс емес."},{status:400});
 const studyTime=rawStudyTime;
 const admin=createAdminSupabaseClient();const {data:team}=await admin.from("teams").select("id").eq("id",teamId).maybeSingle();if(!team)return NextResponse.json({error:"Команда табылмады."},{status:404});
 const {data,error}=await admin.from("meet_spaces").upsert({team_id:teamId,study_time:studyTime,external_space_id:externalSpaceId,meeting_url:meetingUrl,display_name:displayName,active:true},{onConflict:"team_id,study_time"}).select("*").single();
 if(error)return NextResponse.json({error:"Meet space сақталмады."},{status:500});
 await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"MEET_SPACE_UPSERTED",entity_type:"MEET_SPACE",entity_id:data.id,metadata:{teamId,displayName,meetingUrl}});
 return NextResponse.json({space:data});
}
