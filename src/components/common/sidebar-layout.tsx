"use client";

import * as Headless from "@headlessui/react";
import React, { useState } from "react";
import { NavbarItem } from "./navbar";

function OpenMenuIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="text-gray-300 w-6 h-6"
    >
      <path d="M2 6.75C2 6.33579 2.33579 6 2.75 6H17.25C17.6642 6 18 6.33579 18 6.75C18 7.16421 17.6642 7.5 17.25 7.5H2.75C2.33579 7.5 2 7.16421 2 6.75ZM2 13.25C2 12.8358 2.33579 12.5 2.75 12.5H17.25C17.6642 12.5 18 12.8358 18 13.25C18 13.6642 17.6642 14 17.25 14H2.75C2.33579 14 2 13.6642 2 13.25Z" />
    </svg>
  );
}

function CloseMenuIcon() {
  return (
    <svg
      data-slot="icon"
      viewBox="0 0 20 20"
      aria-hidden="true"
      className="text-gray-300 w-6 h-6"
    >
      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
    </svg>
  );
}

function MobileSidebar({
  open,
  close,
  children,
}: React.PropsWithChildren<{ open: boolean; close: () => void }>) {
  return (
    <Headless.Dialog open={open} onClose={close} className="lg:hidden">
      <Headless.DialogBackdrop
        transition
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />
      <Headless.DialogPanel
        transition
        className="fixed inset-y-0 left-0 w-full max-w-[280px] p-2 z-50 transition duration-300 ease-in-out data-closed:-translate-x-full"
      >
        <div className="flex h-full flex-col rounded-lg bg-gray-800 shadow-lg ring-1 ring-gray-700">
          <div className="-mb-3 px-4 pt-3">
            <Headless.CloseButton
              as={NavbarItem}
              aria-label="Close navigation"
              className="hover:bg-gray-700/50 rounded-lg"
            >
              <CloseMenuIcon />
            </Headless.CloseButton>
          </div>
          {children}
        </div>
      </Headless.DialogPanel>
    </Headless.Dialog>
  );
}

export function SidebarLayout({
  navbar,
  sidebar,
  children,
}: React.PropsWithChildren<{
  navbar: React.ReactNode;
  sidebar: React.ReactNode;
}>) {
  const [showSidebar, setShowSidebar] = useState(false);

  return (
    <div className="relative isolate flex min-h-svh w-full">
      {/* Sidebar on desktop */}
      <div className="fixed inset-y-0 left-0 w-64 max-lg:hidden z-30">
        {sidebar}
      </div>

      {/* Sidebar on mobile */}
      <MobileSidebar open={showSidebar} close={() => setShowSidebar(false)}>
        {sidebar}
      </MobileSidebar>

      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Navbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 px-4 sm:px-6 lg:px-8">
          <div className="lg:hidden">
            <NavbarItem
              onClick={() => setShowSidebar(true)}
              aria-label="Open navigation"
              className="text-zinc-200 hover:text-violet-300 transition-colors hover:bg-white/5 rounded-lg -ml-2 p-2"
            >
              <OpenMenuIcon />
            </NavbarItem>
          </div>
          <div className="flex-1">{navbar}</div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4">{children}</main>
      </div>
    </div>
  );
}
