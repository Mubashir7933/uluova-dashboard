"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export type NavigationItem = {
  label: string;
  href: string;
  exact?: boolean;
  children?: NavigationItem[];
};

export type NavigationSection = {
  label?: string;
  items: NavigationItem[];
};

export type NavigationGroup = {
  title: string;
  sections: NavigationSection[];
};

type SidebarNavigationProps = {
  groups: NavigationGroup[];
};

export function SidebarNavigation({
  groups,
}: SidebarNavigationProps) {
  const pathname = usePathname(); 
  const searchParams = useSearchParams();

  function isItemActive(item: NavigationItem): boolean {
    const [itemPath, itemQuery] = item.href.split("?");
    const itemParams = new URLSearchParams(itemQuery);
    const itemStatus = itemParams.get("status");
  
    if (itemStatus !== null) {
      return (
        pathname === itemPath &&
        searchParams.get("status") === itemStatus
      );
    }
  
    if (itemPath === "/bakim" && pathname === "/bakim") {
      return !searchParams.has("status");
    }
  
    if (item.exact || itemPath === "/") {
      return pathname === itemPath;
    }
  
    return (
      pathname === itemPath ||
      pathname.startsWith(`${itemPath}/`)
    );
  }

  return (
    <nav
      aria-label="Ana menü"
      className="flex-1 space-y-7 overflow-y-auto px-4 py-7"
    >
      {groups.map((group) => (
        <div key={group.title}>
          <p className="mb-3 px-3 text-xs font-bold tracking-widest text-slate-400">
            {group.title}
          </p>

          <div className="space-y-5">
            {group.sections.map((section, sectionIndex) => (
              <div
                key={`${group.title}-${section.label ?? sectionIndex}`}
              >
                {section.label && (
                  <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-slate-400">
                    {section.label}
                  </p>
                )}

                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = isItemActive(item);

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={
                            isActive ? "page" : undefined
                          }
                          className={`block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-blue-50 text-[#064786]"
                              : "text-slate-600 hover:bg-slate-50 hover:text-[#064786]"
                          }`}
                        >
                          {item.label}
                        </Link>

                        {item.children &&
                          item.children.length > 0 && (
                            <ul
                              aria-label={`${item.label} alt menüsü`}
                              className="ml-5 mt-2 space-y-1 border-l border-blue-100 pl-3"
                            >
                              {item.children.map((child) => {
                                const isChildActive =
                                  isItemActive(child);

                                return (
                                  <li key={child.href}>
                                    <Link
                                      href={child.href}
                                      aria-current={
                                        isChildActive
                                          ? "page"
                                          : undefined
                                      }
                                      className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                                        isChildActive
                                          ? "bg-blue-50 font-semibold text-[#064786]"
                                          : "text-slate-500 hover:bg-slate-50 hover:text-[#064786]"
                                      }`}
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                          isChildActive
                                            ? "bg-[#064786]"
                                            : "bg-slate-300"
                                        }`}
                                      />

                                      {child.label}
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}