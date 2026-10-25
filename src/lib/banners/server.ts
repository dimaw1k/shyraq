import type { DashboardBannerItem } from "@/components/student/DashboardBanner";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function getActiveDashboardBanners(): Promise<DashboardBannerItem[]> {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("marathon_banners")
    .select("id,title,description,image_path,href,published,starts_at,ends_at,sort_order")
    .eq("published", true)
    .order("sort_order")
    .limit(8);

  if (error || !data?.length) return [];

  const now = Date.now();
  const activeBanners = data.filter((banner) => {
    const startsAt = banner.starts_at ? Date.parse(banner.starts_at) : null;
    const endsAt = banner.ends_at ? Date.parse(banner.ends_at) : null;
    return (
      Boolean(banner.image_path) &&
      (startsAt === null || startsAt <= now) &&
      (endsAt === null || endsAt >= now)
    );
  });

  const signedBanners = await Promise.all(
    activeBanners.map(async (banner) => {
      const { data: signedData, error: signedError } = await admin.storage
        .from("banners")
        .createSignedUrl(banner.image_path, 60 * 60);

      return {
        id: banner.id,
        title: banner.title,
        description: banner.description,
        href: banner.href,
        imageUrl: signedError ? null : signedData?.signedUrl ?? null,
      };
    }),
  );

  return signedBanners.filter(
    (banner): banner is DashboardBannerItem => Boolean(banner.imageUrl),
  );
}
