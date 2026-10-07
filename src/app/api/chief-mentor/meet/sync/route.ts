import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getGoogleAccessToken } from "@/lib/google-oauth";
import { listConferences,listParticipants,listParticipantSessions,sessionDurationSeconds } from "@/lib/google-meet";
import { recordAttendanceScore } from "@/lib/attendance-scoring";

function normalizeName(value:string){return value.normalize("NFKC").toLocaleLowerCase("kk-KZ").replace(/[\s_]+/gu," ").trim();}
function duration(start?:string|null,end?:string|null){if(!start||!end)return 0;const s=Date.parse(start),e=Date.parse(end);return Number.isFinite(s)&&e>s?Math.floor((e-s)/1000):0;}

export async function POST(request:Request){
 const supabase=await createServerSupabaseClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return NextResponse.json({error:"Unauthorized"},{status:401});
 const {data:me}=await supabase.from("profiles").select("role").eq("id",user.id).maybeSingle();
 if(me?.role!=="CHIEF_MENTOR")return NextResponse.json({error:"Chief Mentor access required"},{status:403});
 const body=await request.json().catch(()=>null);const teamId=typeof body?.teamId==="string"?body.teamId:"";
 const studyTime=body?.studyTime==="EVENING"?"EVENING":"MORNING";
 if(!teamId)return NextResponse.json({error:"teamId қажет."},{status:400});
 const {data:team}=await supabase.from("teams").select("id,name,mentor_id,status").eq("id",teamId).maybeSingle();
 if(!team)return NextResponse.json({error:"Команда табылмады."},{status:404});
 const {data:space}=await supabase.from("meet_spaces").select("id,team_id,external_space_id,study_time,active").eq("team_id",teamId).eq("study_time",studyTime).eq("active",true).maybeSingle();
 if(!space)return NextResponse.json({error:"Бұл командаға " + (studyTime==="MORNING"?"таңғы":"кешкі") + " Study Time Meet space қосылмаған."},{status:404});

 const now=new Date();const startTime=typeof body?.startTime==="string"?body.startTime:new Date(now.getTime()-7*86400000).toISOString();const endTime=typeof body?.endTime==="string"?body.endTime:now.toISOString();
 const token=await getGoogleAccessToken(user.id);
 const conferences=await listConferences(token,space.external_space_id,startTime,endTime);
 const admin=createAdminSupabaseClient();
 const {data:members}=await admin.from("team_members").select("student_id,profiles(id,full_name,phone,email)").eq("team_id",teamId).eq("status","ACTIVE");
 const students=(members??[]).map(x=>Array.isArray(x.profiles)?x.profiles[0]:x.profiles).filter(Boolean) as Array<{id:string;full_name:string;phone:string;email:string}>;
 const buckets=new Map<string,string[]>();for(const s of students){const key=normalizeName(s.full_name);buckets.set(key,[...(buckets.get(key)??[]),s.id]);}
 const {data:mappings}=await admin.from("meet_participant_mappings").select("google_user_id,student_id");
 const mappingMap=new Map((mappings??[]).filter(x=>students.some(s=>s.id===x.student_id)).map(x=>[x.google_user_id,x.student_id]));
 let importedConferences=0,attendanceRows=0,matchedParticipants=0,unmatchedParticipants=0;

 for(const conference of conferences){
   const externalConferenceId=conference.name;
   const {data:conferenceRow}=await admin.from("meet_conferences").upsert({team_id:teamId,external_conference_id:externalConferenceId,space_name:space.external_space_id,start_time:conference.startTime??null,end_time:conference.endTime??null,raw:conference},{onConflict:"external_conference_id"}).select("id").single();
   if(!conferenceRow)continue;importedConferences++;
   const participants=await listParticipants(token,conference.name);
   for(const participant of participants){
     const googleUserId=participant.signedinUser?.user??null;
     const displayName=participant.signedinUser?.displayName??participant.anonymousUser?.displayName??participant.phoneUser?.displayName??null;
     let studentId=googleUserId?mappingMap.get(googleUserId)??null:null;let matchStatus=studentId?"MANUALLY_MATCHED":"UNMATCHED";
     if(!studentId&&displayName){const candidates=buckets.get(normalizeName(displayName))??[];if(candidates.length===1){studentId=candidates[0];matchStatus="MATCHED";}}
     if(studentId)matchedParticipants++;else unmatchedParticipants++;
     const {data:participantRow}=await admin.from("meet_participants").upsert({conference_id:conferenceRow.id,external_participant_id:participant.name,google_user_id:googleUserId,display_name:displayName,student_id:studentId,match_status:matchStatus,earliest_start_time:participant.earliestStartTime??null,latest_end_time:participant.latestEndTime??null,raw:participant},{onConflict:"conference_id,external_participant_id"}).select("id").single();
     if(!participantRow)continue;
     const sessions=await listParticipantSessions(token,participant.name);
     for(const session of sessions)await admin.from("meet_participant_sessions").upsert({participant_id:participantRow.id,external_session_id:session.name,start_time:session.startTime??null,end_time:session.endTime??null,duration_seconds:sessionDurationSeconds(session),raw:session},{onConflict:"participant_id,external_session_id"});
     if(studentId){
       const attendedSeconds=sessions.reduce((sum,s)=>sum+sessionDurationSeconds(s),0);const meetingDuration=duration(conference.startTime,conference.endTime);
       const attendancePercent=meetingDuration?Math.min(100,Math.max(0,(attendedSeconds/meetingDuration)*100)):0;
       const status=attendancePercent===0?"ABSENT":attendancePercent<60?"LOW":attendancePercent<85?"PARTIAL":attendancePercent<100?"ATTENDED":"FULL";
       const {data:row}=await admin.from("attendance_records").upsert({team_id:teamId,student_id:studentId,external_conference_id:externalConferenceId,session_count:sessions.length,attended_seconds:attendedSeconds,meeting_duration_seconds:meetingDuration,attendance_percent:Number(attendancePercent.toFixed(2)),status,started_at:conference.startTime??null,ended_at:conference.endTime??null,imported_at:new Date().toISOString()},{onConflict:"external_conference_id,student_id"}).select("id").single();
       if(row){attendanceRows++;await recordAttendanceScore(admin,{attendanceId:row.id,studentId,teamId,attendancePercent,conferenceEnded:Boolean(conference.endTime&&Date.parse(conference.endTime)<=Date.now())});}
     }
   }
 }
 await admin.from("audit_logs").insert({actor_id:user.id,actor_role:"CHIEF_MENTOR",action:"CHIEF_MENTOR_MEET_SYNCED",entity_type:"TEAM",entity_id:teamId,metadata:{importedConferences,attendanceRows,matchedParticipants,unmatchedParticipants}});
 return NextResponse.json({ok:true,teamId,studyTime,importedConferences,attendanceRows,matchedParticipants,unmatchedParticipants,range:{startTime,endTime}});
}
