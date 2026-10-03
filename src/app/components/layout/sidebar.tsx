import Image from "next/image";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/actions/auth";
import { Suspense } from "react";
import {
  SidebarNavigation,
  type NavigationGroup,
  type NavigationItem,
} from "./sidebar-navigation";

type UserRole =
  | "master"
  | "site_chief"
  | "maintenance_manager"
  | "hr_manager"
  | "safety_manager";

const roleLabels: Record<UserRole, string> = {
  master: "Sistem Yöneticisi",
  site_chief: "Saha Şefi",
  maintenance_manager: "Bakım Sorumlusu",
  hr_manager: "İnsan Kaynakları Sorumlusu",
  safety_manager: "İSG Sorumlusu",
};

const maintenanceNavigationItem: NavigationItem = {
  label: "Bakım",
  href: "/bakim?status=open",
  exact: true,
  children: [
    {
      label: "Açık",
      href: "/bakim?status=open",
      exact: true,
    },
    {
      label: "İşleme Alındı",
      href: "/bakim?status=in_progress",
      exact: true,
    },
    {
      label: "Çözüldü",
      href: "/bakim?status=resolved",
      exact: true,
    },
  ],
};

export async function Sidebar() {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  const userId = claimsData?.claims?.sub;

  if (claimsError || !userId) {
    redirect("/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("profiles")
      .select("full_name, role, site_id")
      .eq("id", userId)
      .single();

  if (profileError || !profile) {
    redirect("/login?error=profile");
  }

  const role = profile.role as UserRole;

  let siteItems: NavigationItem[] = [];
  let assignedSiteSlug: string | null = null;

  

  if (role === "site_chief" && profile.site_id) {
    const { data: assignedSite } = await supabase
      .from("sites")
      .select("name, slug")
      .eq("id", profile.site_id)
      .single();

    if (!assignedSite) {
      redirect("/login?error=site");
    }

    assignedSiteSlug = assignedSite.slug;

    siteItems = [
      {
        label: assignedSite.name,
        href: `/sahalar/${assignedSite.slug}`,
      },
    ];
  }

  let centralDepartmentItems: NavigationItem[] = [];

  if (role === "master") {
    centralDepartmentItems = [
      maintenanceNavigationItem,
      {
        label: "Bakım",
        href: "/bakim",
      },
      {
        label: "İnsan Kaynakları",
        href: "/insan-kaynaklari",
      },
      {
        label: "İş Sağlığı ve Güvenliği",
        href: "/isg",
      },
    ];
  }
  if (role === "maintenance_manager") {
    centralDepartmentItems = [
      maintenanceNavigationItem,
    ];
  }

  
  if (role === "safety_manager") {
    centralDepartmentItems = [
      {
        label: "İş Sağlığı ve Güvenliği",
        href: "/isg",
      },
    ];
  }

  const overviewHref =
    role === "site_chief" && assignedSiteSlug
      ? `/sahalar/${assignedSiteSlug}`
      : role === "maintenance_manager"
        ? "/bakim"
        : role === "hr_manager"
          ? "/insan-kaynaklari"
          : role === "safety_manager"
            ? "/isg"
            : "/";

  const navigationGroups: NavigationGroup[] = [
    {
      title: "GENEL",
      sections: [
        {
          items: [
            {
              label: "Genel Bakış",
              href: overviewHref,
            },
          ],
        },
      ],
    },
    {
      title: "SAHALAR",
      sections: [
        ...(siteItems.length > 0
          ? [
              {
                items: siteItems,
              },
            ]
          : []),

        ...(centralDepartmentItems.length > 0
          ? [
              {
                label: "MERKEZİ BİRİMLER",
                items: centralDepartmentItems,
              },
            ]
          : []),
      ],
    },
  ].filter((group) =>
    group.sections.some((section) => section.items.length > 0)
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-blue-100 bg-white lg:flex lg:flex-col">
      <div className="flex h-24 shrink-0 items-center border-b border-blue-100 px-7">
        <Image
          src="/Uluova.png"
          alt="ULUOVA"
          width={500}
          height={140}
          className="h-auto w-48"
          priority
        />
      </div>

      <Suspense
  fallback={
    <div className="flex-1 px-7 py-7 text-sm text-slate-500">
      Menü yükleniyor...
    </div>
  }
>
  <SidebarNavigation groups={navigationGroups} />
</Suspense>

      <div className="shrink-0 border-t border-blue-100 p-4">
        <div className="rounded-xl bg-[#064786] p-4 text-white">
          <p className="truncate text-sm font-semibold">
            {profile.full_name}
          </p>

          <p className="mt-1 text-xs text-blue-100">
            {roleLabels[role]}
          </p>

          <form action={logout} className="mt-4">
            <button
              type="submit"
              className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-white/20"
            >
              Çıkış Yap
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}