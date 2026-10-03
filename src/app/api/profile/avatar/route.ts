import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Фото қажет." }, { status: 400 });
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Фото 5 MB-тан үлкен болмауы керек." }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: "JPG, PNG немесе WebP қана рұқсат." }, { status: 400 });
  }

  const admin = createAdminSupabaseClient();
  const { data: current } = await admin
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  const oldPath = typeof current?.avatar_path === "string" ? current.avatar_path : null;
  const path = user.id + "/" + crypto.randomUUID() + "-" + safeName(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (uploadError) {
    return NextResponse.json({ error: "Фото жүктелмеді." }, { status: 400 });
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_path: path, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    await admin.storage.from("avatars").remove([path]);
    return NextResponse.json({ error: "Профиль суретін сақтау сәтсіз аяқталды." }, { status: 500 });
  }

  if (oldPath) {
    await admin.storage.from("avatars").remove([oldPath]);
  }

  const { data } = admin.storage.from("avatars").getPublicUrl(path);
  return NextResponse.json({ avatarPath: path, avatarUrl: data.publicUrl });
}
