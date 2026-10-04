import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function GET(){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");const admin=createAdminSupabaseClient();
 const [{data:settings},{data:rules}]=await Promise.all([
  admin.from("marathon_settings").select("name,default_video_watch_percent,default_team_capacity,morning_report_open_time,evening_report_open_time,updated_at").eq("id",true).maybeSingle(),
  admin.from("score_rules").select("id,code,label,weight,active,updated_at").order("code")
 ]);
 return NextResponse.json({profile,settings,rules:rules??[]});
}

export async function PATCH(request:Request){
 const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");const body=await request.json().catch(()=>null);const admin=createAdminSupabaseClient();
 if(body?.settings){
  const next={};
  if(typeof body.settings.name==="string"&&body.settings.name.trim())Object.assign(next,{name:body.settings.name.trim()});
  if(typeof body.settings.defaultVideoWatchPercent==="number")Object.assign(next,{default_video_watch_percent:Math.min(100,Math.max(0,body.settings.defaultVideoWatchPercent))});
  if(typeof body.settings.defaultTeamCapacity==="number")Object.assign(next,{default_team_capacity:Math.max(1,Math.floor(body.settings.defaultTeamCapacity))});
  if(typeof body.settings.morningReportOpenTime==="string" && /^\d{2}:\d{2}$/.test(body.settings.morningReportOpenTime))Object.assign(next,{morning_report_open_time:body.settings.morningReportOpenTime});
  if(typeof body.settings.eveningReportOpenTime==="string" && /^\d{2}:\d{2}$/.test(body.settings.eveningReportOpenTime))Object.assign(next,{evening_report_open_time:body.settings.eveningReportOpenTime});
  if(Object.keys(next).length)await admin.from("marathon_settings").update({...next,updated_at:new Date().toISOString()}).eq("id",true);
 }
 if(Array.isArray(body?.rules)){
  for(const rule of body.rules){
   if(typeof rule?.id!=="string")continue;
   await admin.from("score_rules").update({weight:Number(rule.weight??0),active:Boolean(rule.active),updated_by:profile.id,updated_at:new Date().toISOString()}).eq("id",rule.id);
  }
 }
 await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"CHIEF_MENTOR_SETTINGS_UPDATED",entity_type:"MARATHON_SETTINGS",entity_id:null,metadata:{settings:body?.settings??null,rulesUpdated:Array.isArray(body?.rules)?body.rules.length:0}});
 return GET();
}
