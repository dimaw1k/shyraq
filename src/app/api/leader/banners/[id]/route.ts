import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {profile}=await getAuthenticatedStaff("LEADER"); const {id}=await params; const body=await request.json().catch(()=>null); const admin=createAdminSupabaseClient();
  const {data:current}=await admin.from("marathon_banners").select("*").eq("id",id).maybeSingle();
  if(!current)return NextResponse.json({error:"Banner табылмады."},{status:404});
  const {data,error}=await admin.from("marathon_banners").update({
    title:typeof body?.title==="string"&&body.title.trim()?body.title.trim():current.title,
    description:body?.description===null?null:typeof body?.description==="string"?body.description.trim()||null:current.description,
    href:body?.href===null?null:typeof body?.href==="string"?body.href.trim()||null:current.href,
    published:typeof body?.published==="boolean"?body.published:current.published,
    starts_at:body?.startsAt===null||body?.startsAt===""?null:typeof body?.startsAt==="string"?body.startsAt:current.starts_at,
    ends_at:body?.endsAt===null||body?.endsAt===""?null:typeof body?.endsAt==="string"?body.endsAt:current.ends_at,
    sort_order:typeof body?.sortOrder==="number"?Math.floor(body.sortOrder):current.sort_order,
  }).eq("id",id).select("*").single();
  if(error||!data)return NextResponse.json({error:"Banner жаңартылмады."},{status:500});
  await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"BANNER_UPDATED",entity_type:"MARATHON_BANNER",entity_id:id,metadata:{published:data.published}});
  return NextResponse.json({banner:data});
}

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {profile}=await getAuthenticatedStaff("LEADER"); const {id}=await params; const admin=createAdminSupabaseClient();
  const {data:current}=await admin.from("marathon_banners").select("id,image_path").eq("id",id).maybeSingle();
  if(!current)return NextResponse.json({error:"Banner табылмады."},{status:404});
  const {error}=await admin.from("marathon_banners").delete().eq("id",id);
  if(error)return NextResponse.json({error:"Banner өшірілмеді."},{status:500});
  if(current.image_path)await admin.storage.from("banners").remove([current.image_path]);
  await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"BANNER_DELETED",entity_type:"MARATHON_BANNER",entity_id:id,metadata:{}});
  return NextResponse.json({ok:true});
}
