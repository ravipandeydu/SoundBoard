"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/common/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
  DropdownDivider,
} from "@/components/common/dropdown";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "@/components/common/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "@/components/common/sidebar";
import { SidebarLayout } from "@/components/common/sidebar-layout";
import {
  // Cog8ToothIcon,
  Square2StackIcon,
  UserIcon,
  HomeIcon,
  Cog6ToothIcon,
  MegaphoneIcon,
  ChartBarIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/auth/logout-button";

const SidebarMenuItem = ({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) => {
  return (
    <SidebarItem
      href={href}
      className={cn(
        "group relative gap-3 px-4 py-3 text-zinc-200 rounded-lg transition-all duration-300",
        "hover:bg-white/5 hover:text-violet-300",
        "before:absolute before:inset-0 before:rounded-lg before:transition-all before:duration-300",
        "after:absolute after:inset-0 after:rounded-lg after:transition-all after:duration-300",
        "hover:before:bg-gradient-to-r hover:before:from-violet-500/10 hover:before:to-fuchsia-500/10",
        "hover:after:bg-[url('/wave-pattern.svg')] hover:after:opacity-5 hover:after:bg-repeat-x hover:after:animate-wave",
        isActive && [
          "text-violet-300",
          "bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10",
          "before:border-l-2 before:border-violet-300",
          "after:bg-[url('/wave-pattern.svg')] after:opacity-5 after:bg-repeat-x after:animate-wave",
        ]
      )}
    >
      <div className="relative z-10 flex items-center gap-3">
        <div
          className={cn(
            "relative p-1.5 rounded-lg transition-all duration-300",
            "before:absolute before:inset-0 before:rounded-lg before:transition-transform before:duration-300 before:scale-0",
            "before:bg-gradient-to-r before:from-violet-500/20 before:to-fuchsia-500/20",
            "group-hover:before:scale-100",
            isActive && "before:scale-100"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 transition-all duration-300",
              isActive ? "text-violet-300" : "text-zinc-300",
              "group-hover:text-violet-300"
            )}
          />
        </div>
        <SidebarLabel className="font-medium tracking-wide">
          {label}
        </SidebarLabel>
      </div>
      {isActive && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex space-x-1">
          <div className="w-1 h-1 rounded-full bg-violet-400 animate-pulse"></div>
          <div className="w-1 h-1 rounded-full bg-fuchsia-400 animate-pulse delay-75"></div>
          <div className="w-1 h-1 rounded-full bg-pink-400 animate-pulse delay-150"></div>
        </div>
      )}
    </SidebarItem>
  );
};

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div className="bg-black text-white">
      <SidebarLayout
        navbar={
          <Navbar className="bg-black/40 backdrop-blur-xl border-b border-white/5">
            <NavbarSpacer />
            <NavbarSection>
              <NavbarItem
                href="/"
                className="text-zinc-200 hover:text-violet-300 transition-colors hidden lg:flex"
              >
                <HomeIcon className="h-5 w-5" />
              </NavbarItem>
              <Dropdown>
                <DropdownButton as={NavbarItem}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur group-hover:blur-md transition-all duration-300"></div>
                    <Avatar
                      src={session?.user?.image || "/profile-photo.jpg"}
                      square
                      className="relative ring-2 ring-white/10 h-8 w-8 rounded-lg"
                    />
                  </div>
                </DropdownButton>
                <DropdownMenu
                  className="min-w-64 bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-lg"
                  anchor="bottom end"
                >
                  {/* <DropdownItem
                    href="/my-profile"
                    className="text-zinc-200 hover:bg-white/5 hover:text-violet-300 rounded-md transition-all duration-200"
                  >
                    <UserIcon className="h-5 w-5" />
                    <DropdownLabel>My Profile</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem
                    href="/settings"
                    className="text-zinc-200 hover:bg-white/5 hover:text-violet-300 rounded-md transition-all duration-200"
                  >
                    <Cog8ToothIcon className="h-5 w-5" />
                    <DropdownLabel>Settings</DropdownLabel>
                  </DropdownItem> */}
                  <DropdownDivider className="border-white/5" />
                  <LogoutButton />
                </DropdownMenu>
              </Dropdown>
            </NavbarSection>
          </Navbar>
        }
        sidebar={
          <Sidebar className="bg-black/95 backdrop-blur-xl border-r border-white/5">
            <SidebarHeader className="border-b border-white/5 bg-black/50">
              <SidebarItem
                href="/"
                className="items-center gap-3 px-4 py-5 hover:bg-white/5 transition-all duration-300 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <MusicalNoteIcon className="relative h-8 w-8 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <SidebarLabel className="text-xl font-bold">
                  <span className="relative">
                    <span className="absolute inset-0 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 blur-sm opacity-50"></span>
                    <span className="relative bg-gradient-to-r from-violet-200 via-fuchsia-200 to-pink-200 bg-clip-text text-transparent">
                      SoundBoard
                    </span>
                  </span>
                </SidebarLabel>
              </SidebarItem>
            </SidebarHeader>

            <SidebarBody>
              <SidebarSection className="px-3 py-4 space-y-1">
                <SidebarMenuItem
                  href="/analytics"
                  icon={ChartBarIcon}
                  label="Profile Analytics"
                  isActive={pathname === "/analytics"}
                />
                <SidebarMenuItem
                  href="/rooms"
                  icon={Square2StackIcon}
                  label="All Rooms"
                  isActive={
                    pathname === "/rooms" || pathname.startsWith("/rooms/")
                  }
                />
                <SidebarMenuItem
                  href="/loops"
                  icon={MegaphoneIcon}
                  label="My Loops"
                  isActive={pathname === "/loops"}
                />
              </SidebarSection>
            </SidebarBody>

            <SidebarFooter className="border-t border-white/5 lg:block hidden">
              <Dropdown>
                <DropdownButton
                  as={SidebarItem}
                  className="group items-center gap-3 px-4 py-3 text-zinc-300 hover:bg-white/5 hover:text-violet-300 transition-all duration-300"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg blur group-hover:blur-md transition-all duration-300"></div>
                    <Avatar
                      src={session?.user?.image || "/profile-photo.jpg"}
                      square
                      className="relative ring-2 ring-white/10 h-8 w-8 rounded-lg group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <SidebarLabel className="hidden lg:block font-medium tracking-wide">
                    {session?.user?.name || "User"}
                  </SidebarLabel>
                </DropdownButton>
                <DropdownMenu
                  className="min-w-64 bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-lg"
                  anchor="top start"
                >
                  <DropdownItem
                    href="/profile"
                    className="text-zinc-200 hover:bg-white/5 hover:text-violet-300 rounded-md transition-all duration-200"
                  >
                    <UserIcon className="h-5 w-5" />
                    <DropdownLabel>My Profile</DropdownLabel>
                  </DropdownItem>
                  <DropdownItem
                    href="/settings"
                    className="text-zinc-200 hover:bg-white/5 hover:text-violet-300 rounded-md transition-all duration-200"
                  >
                    <Cog6ToothIcon className="h-5 w-5" />
                    <DropdownLabel>Settings</DropdownLabel>
                  </DropdownItem>
                  <DropdownDivider className="border-white/5" />
                  <LogoutButton />
                </DropdownMenu>
              </Dropdown>
            </SidebarFooter>
          </Sidebar>
        }
      >
        <div className="relative min-h-[calc(100vh-7rem)] rounded-xl bg-black/40 backdrop-blur-xl shadow-2xl border border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 to-fuchsia-950/20 pointer-events-none rounded-xl"></div>
          <div className="relative p-6">{children}</div>
        </div>
      </SidebarLayout>
    </div>
  );
}
