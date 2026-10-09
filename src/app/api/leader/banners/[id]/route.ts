import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";

function isSafeHref(value: string) {
  const href = value.trim();
  if (!href || href.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(href)) return false;
  if (href.startsWith("/") && !href.startsWith("//")) return true;
  try {
    const parsed = new URL(href);
    return parsed.protocol === "https:" && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const {profile}=await getAuthenticatedStaff("LEADER");
  const {id}=await params;
  const parsedBody=await readLimitedJson(request,16*1024);
  if(!parsedBody.ok){
    return NextResponse.json({error:parsedBody.reason==="too-large"?"Banner деректері тым үлкен.":"Banner деректері дұрыс емес."},{status:parsedBody.reason==="too-large"?413:400,headers:{"Cache-Control":"no-store"}});
  }
  const body=parsedBody.value;
  if(!body||typeof body!=="object"||Array.isArray(body)){
    return NextResponse.json({error:"Banner деректері дұрыс емес."},{status:400});
  }
  const input=body as Record<string,unknown>;
  if(input.href!==undefined&&input.href!==null&&(typeof input.href!=="string"||!isSafeHref(input.href))){
    return NextResponse.json({error:"Banner сілтемесі қауіпсіз HTTPS немесе ішкі жол болуы керек."},{status:400});
  }
  const admin=createAdminSupabaseClient();
  const {data:current}=await admin.from("marathon_banners").select("*").eq("id",id).maybeSingle();
  if(!current)return NextResponse.json({error:"Banner табылмады."},{status:404});
  const {data,error}=await admin.from("marathon_banners").update({
    title:typeof input.title==="string"&&body.title.trim()?body.title.trim():current.title,
    description:input.description===null?null:typeof input.description==="string"?body.description.trim()||null:current.description,
    href:input.href===null?null:typeof input.href==="string"?input.href.trim()||null:current.href,
    published:typeof input.published==="boolean"?body.published:current.published,
    starts_at:input.startsAt===null||input.startsAt===""?null:typeof input.startsAt==="string"?body.startsAt:current.starts_at,
    ends_at:input.endsAt===null||input.endsAt===""?null:typeof input.endsAt==="string"?body.endsAt:current.ends_at,
    sort_order:typeof input.sortOrder==="number"?Math.floor(body.sortOrder):current.sort_order,
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
