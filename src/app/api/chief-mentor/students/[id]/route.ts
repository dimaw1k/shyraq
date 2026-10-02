import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
  const {id}=await params;
  const body=await request.json().catch(()=>null);
  const teamId=body?.teamId===null||body?.teamId===""?null:typeof body?.teamId==="string"?body.teamId:null;
  const admin=createAdminSupabaseClient();
  const {data:student}=await admin.from("profiles").select("id,role").eq("id",id).maybeSingle();
  if(!student||student.role!=="STUDENT")return NextResponse.json({error:"Оқушы табылмады."},{status:404});

  const {data:current}=await admin.from("team_members").select("id,team_id").eq("student_id",id).eq("status","ACTIVE");
  if(current?.length){
    const ids=current.map(x=>x.id);
    await admin.from("team_members").update({status:"REMOVED",removed_at:new Date().toISOString()}).in("id",ids);
  }

  if(teamId){
    const {data:team}=await admin.from("teams").select("id,name,capacity,status").eq("id",teamId).maybeSingle();
    if(!team||team.status!=="ACTIVE")return NextResponse.json({error:"Команда табылмады немесе белсенді емес."},{status:400});
    const {count}=await admin.from("team_members").select("*",{count:"exact",head:true}).eq("team_id",teamId).eq("status","ACTIVE");
    if(team.capacity&&Number(count??0)>=Number(team.capacity))return NextResponse.json({error:"Команда capacity-ге толған."},{status:409});
    const {error}=await admin.from("team_members").insert({team_id:teamId,student_id:id,status:"ACTIVE",assigned_by:profile.id});
    if(error)return NextResponse.json({error:"Оқушыны командаға қосу сәтсіз аяқталды."},{status:500});
    await admin.from("profiles").update({status:"ACTIVE"}).eq("id",id);
  }else{
    await admin.from("profiles").update({status:"WAITING_FOR_TEAM"}).eq("id",id);
  }

  await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"CHIEF_MENTOR_STUDENT_TEAM_CHANGED",entity_type:"PROFILE",entity_id:id,metadata:{team_id:teamId}});
  return NextResponse.json({ok:true,teamId});
}
