"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type DashboardShellProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

export function DashboardShell({
  sidebar,
  children,
}: DashboardShellProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function openMenu() {
    dialogRef.current?.showModal();
    setIsMenuOpen(true);
  }

  function closeMenu() {
    dialogRef.current?.close();
    setIsMenuOpen(false);
  }

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const desktopQuery = window.matchMedia(
      "(min-width: 1024px)"
    );

    function handleResize() {
      if (desktopQuery.matches) {
        dialogRef.current?.close();
        setIsMenuOpen(false);
      }
    }

    handleResize();
    desktopQuery.addEventListener("change", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktopQuery.removeEventListener(
        "change",
        handleResize
      );
    };
  }, [isMenuOpen]);

  return (
    <div className="min-h-screen bg-[#f5f8fc] lg:flex">
      <div className="sticky top-0 hidden h-dvh w-72 shrink-0 lg:block">
        {sidebar}
      </div>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-blue-100 bg-white px-4 lg:hidden">
          <Image
            src="/Uluova.png"
            alt="ULUOVA"
            width={500}
            height={140}
            className="h-auto w-32"
            priority
          />

          <button
            type="button"
            onClick={openMenu}
            aria-label="Ana menüyü aç"
            aria-haspopup="dialog"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            className="flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-blue-100 text-[#064786] hover:bg-blue-50"
          >
            <svg
              aria-hidden="true"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </header>

        <main className="min-w-0">{children}</main>
      </div>

      <dialog
        ref={dialogRef}
        id="mobile-navigation"
        aria-labelledby="mobile-navigation-title"
        onClose={() => setIsMenuOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeMenu();
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-transparent p-0 backdrop:bg-slate-900/40"
      >
        <div className="flex h-full w-80 max-w-[88vw] flex-col bg-white shadow-xl">
          <div className="flex shrink-0 items-center justify-between border-b border-blue-100 px-4 py-2">
            <h2
              id="mobile-navigation-title"
              className="font-semibold text-[#064786]"
            >
              Ana Menü
            </h2>

            <button
              type="button"
              onClick={closeMenu}
              aria-label="Ana menüyü kapat"
              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-2xl text-slate-600 hover:bg-slate-100"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          <div
            className="min-h-0 flex-1"
            onClick={(event) => {
              if (
                event.target instanceof Element &&
                event.target.closest("a[href]")
              ) {
                closeMenu();
              }
            }}
          >
            {sidebar}
          </div>
        </div>
      </dialog>
    </div>
  );
}