import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const STATUS = new Set(["ACTIVE","INACTIVE","COMPLETED"]);

export async function PATCH(request: Request,{params}:{params:Promise<{id:string}>}) {
  const { profile }=await getAuthenticatedStaff("CHIEF_MENTOR");
  const { id }=await params;
  const body=await request.json().catch(()=>null);
  const admin=createAdminSupabaseClient();
  const { data:target }=await admin.from("profiles").select("id,role,status").eq("id",id).maybeSingle();
  if(!target) return NextResponse.json({error:"Профиль табылмады."},{status:404});
  if(body?.role!==undefined && body.role!=="MENTOR") return NextResponse.json({error:"Chief Mentor тек MENTOR рөлін тағайындай алады."},{status:403});
  if(target.role!=="MENTOR" && body?.role!=="MENTOR") return NextResponse.json({error:"Бұл профиль ментор емес."},{status:400});
  if(body?.status!==undefined && !STATUS.has(body.status)) return NextResponse.json({error:"Жарамсыз статус."},{status:400});

  const updates:Record<string,string>={};
  if(body?.role==="MENTOR") updates.role="MENTOR";
  if(typeof body?.status==="string") updates.status=body.status;
  if(Object.keys(updates).length===0) return NextResponse.json({error:"Өзгеріс жоқ."},{status:400});

  const {data,error}=await admin.from("profiles").update(updates).eq("id",id).select("id,full_name,email,phone,role,status,age,created_at").single();
  if(error||!data) return NextResponse.json({error:"Менторды жаңарту сәтсіз аяқталды."},{status:500});

  await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"CHIEF_MENTOR_PROFILE_UPDATED",entity_type:"PROFILE",entity_id:id,metadata:{changes:updates}});
  return NextResponse.json({profile:data});
}
