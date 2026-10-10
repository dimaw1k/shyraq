import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function POST(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR"); const parsedBody = await readLimitedJson(request, 16 * 1024);
 if (!parsedBody.ok) {
   return NextResponse.json(
     { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Meet space деректері дұрыс емес." },
     { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
   );
 }
 if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
   return NextResponse.json({ error: "Meet space деректері дұрыс емес." }, { status: 400 });
 }
 const body = parsedBody.value as Record<string, unknown>;
 const teamId=typeof body?.teamId==="string"?body.teamId:"";const displayName=typeof body?.displayName==="string"?body.displayName.trim():"";const meetingUrl=typeof body?.meetingUrl==="string"?body.meetingUrl.trim():"";const externalSpaceId=typeof body?.externalSpaceId==="string"?body.externalSpaceId.trim():"";
 if(!teamId||!displayName||!meetingUrl||!externalSpaceId)return NextResponse.json({error:"Команда, атау, Meet URL және space ID міндетті."},{status:400});
 const admin=createAdminSupabaseClient();const {data:team}=await admin.from("teams").select("id").eq("id",teamId).maybeSingle();if(!team)return NextResponse.json({error:"Команда табылмады."},{status:404});
 const {data,error}=await admin.from("meet_spaces").upsert({team_id:teamId,external_space_id:externalSpaceId,meeting_url:meetingUrl,display_name:displayName,active:true},{onConflict:"team_id"}).select("*").single();
 if(error)return NextResponse.json({error:"Meet space сақталмады."},{status:500});
 await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"MEET_SPACE_UPSERTED",entity_type:"MEET_SPACE",entity_id:data.id,metadata:{teamId,displayName,meetingUrl}});
 return NextResponse.json({space:data});
}
