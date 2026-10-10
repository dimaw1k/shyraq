import { NextResponse } from "next/server";
import { hasValidFileSignature } from "@/lib/security/file-validation";
import { readLimitedFormData } from "@/lib/http/read-limited-json";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg","image/png","image/webp"]);

function safeName(name:string){return name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100);}

export async function POST(request:Request){
  const {profile}=await getAuthenticatedStaff("LEADER");
  const rateLimit = await consumeRateLimit("leader:banner-upload", profile.id, 10, 3600, 600);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Banner жүктеу әрекеттері тым жиі орындалды.");
  }
  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) ||
      Number(contentLength) > MAX_BYTES + 128 * 1024)
  ) {
    return NextResponse.json(
      { error: "Файл өлшемі 4 MB шегінен асады." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const boundedForm = await readLimitedFormData(request, MAX_BYTES + 128 * 1024);
  if (!boundedForm.ok) {
    return NextResponse.json(
      { error: boundedForm.reason === "too-large" ? "Файл өлшемі 4 MB шегінен асады." : "Banner форматы дұрыс емес." },
      { status: boundedForm.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const form = boundedForm.value;
  const file=form.get("file");
  if(!(file instanceof File))return NextResponse.json({error:"Banner суреті қажет."},{status:400});
  if(file.size<=0||file.size>MAX_BYTES)return NextResponse.json({error:"Banner 4 MB-тан аспауы керек."},{status:400});
  if(!ALLOWED.has(file.type))return NextResponse.json({error:"JPG, PNG немесе WebP ғана рұқсат."},{status:400});
  if(!(await hasValidFileSignature(file,file.type)))return NextResponse.json({error:"Файл мазмұны мәлімделген форматқа сәйкес емес."},{status:400});
  const title=String(form.get("title")??"").trim() || "Баннер";
  const admin=createAdminSupabaseClient();
  const path=profile.id+"/"+crypto.randomUUID()+"-"+safeName(file.name);
  const {error:uploadError}=await admin.storage.from("banners").upload(path,Buffer.from(await file.arrayBuffer()),{contentType:file.type,upsert:false});
  if(uploadError)return NextResponse.json({error:"Banner жүктелмеді."},{status:400});
  const {data,error}=await admin.from("marathon_banners").insert({
    title,
    description:null,
    href:null,
    image_path:path,
    published:form.get("published")==="true",
    starts_at:String(form.get("startsAt")??"").trim()||null,
    ends_at:String(form.get("endsAt")??"").trim()||null,
    sort_order:0,
    created_by:profile.id,
  }).select("*").single();
  if(error){await admin.storage.from("banners").remove([path]);return NextResponse.json({error:"Banner мәліметін сақтау сәтсіз аяқталды."},{status:400});}
  await admin.from("audit_logs").insert({actor_id:profile.id,actor_role:profile.role,action:"BANNER_CREATED",entity_type:"MARATHON_BANNER",entity_id:data.id,metadata:{title:data.title}});
  return NextResponse.json({banner:data});
}
