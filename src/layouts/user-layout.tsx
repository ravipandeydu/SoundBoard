"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/common/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
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
  ChevronDownIcon,
  Cog8ToothIcon,
  Square2StackIcon,
} from "@heroicons/react/20/solid";
import {
  HomeIcon,
  MegaphoneIcon,
  UserIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/solid";
import { LogoutButton } from "@/components/auth/logout-button";
import { cn } from "@/lib/utils";

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
        "hover:bg-gray-700/30 hover:text-indigo-300",
        "before:absolute before:inset-0 before:rounded-lg before:transition-all before:duration-300",
        "hover:before:bg-gradient-to-r hover:before:from-indigo-500/10 hover:before:to-purple-500/10",
        isActive && [
          "text-indigo-300",
          "bg-gradient-to-r from-indigo-500/10 to-purple-500/10",
          "before:border-l-2 before:border-indigo-300",
        ]
      )}
    >
      <div className="relative z-10 flex items-center gap-3">
        <div
          className={cn(
            "relative p-1 rounded-md transition-all duration-300",
            "before:absolute before:inset-0 before:rounded-md before:transition-transform before:duration-300 before:scale-0",
            "before:bg-gradient-to-r before:from-indigo-500/20 before:to-purple-500/20",
            "group-hover:before:scale-100",
            isActive && "before:scale-100"
          )}
        >
          <Icon
            className={cn(
              "h-5 w-5 transition-all duration-300",
              isActive ? "text-indigo-300" : "text-zinc-300",
              "group-hover:text-indigo-300"
            )}
          />
        </div>
        <SidebarLabel className="font-medium">{label}</SidebarLabel>
      </div>
      {isActive && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-300" />
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
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <NavbarItem
              href="/"
              className="text-zinc-200 hover:text-indigo-300 transition-colors hidden lg:flex"
            >
              <HomeIcon className="h-5 w-5" />
            </NavbarItem>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar
                  src={session?.user?.image || "/profile-photo.jpg"}
                  square
                  className="ring-2 ring-indigo-400/50 h-8 w-8"
                />
              </DropdownButton>
              <DropdownMenu
                className="min-w-64 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 shadow-xl"
                anchor="bottom end"
              >
                <DropdownItem
                  href="/my-profile"
                  className="text-zinc-200 hover:bg-gray-700/50 hover:text-indigo-300"
                >
                  <UserIcon className="h-5 w-5" />
                  <DropdownLabel>My Profile</DropdownLabel>
                </DropdownItem>
                <DropdownItem
                  href="/settings"
                  className="text-zinc-200 hover:bg-gray-700/50 hover:text-indigo-300"
                >
                  <Cog8ToothIcon className="h-5 w-5" />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider className="border-gray-700/50" />
                <LogoutButton />
              </DropdownMenu>
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar className="bg-gray-800/95 backdrop-blur-sm border-r border-gray-700/50">
          <SidebarHeader className="border-b border-gray-700/50 bg-gray-800/50">
            <SidebarItem
              href="/"
              className="items-center gap-3 px-4 py-5 hover:bg-gray-700/30 transition-all duration-200"
            >
              <div className="relative">
                <MusicalNoteIcon className="h-8 w-8 text-indigo-300 animate-pulse" />
                <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full"></div>
              </div>
              <SidebarLabel className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">
                SoundBoard
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
                isActive={pathname === "/rooms"}
              />
              <SidebarMenuItem
                href="/loops"
                icon={MegaphoneIcon}
                label="My Loops"
                isActive={pathname === "/loops"}
              />
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="border-t border-gray-700/50 mt-auto">
            <Dropdown>
              <DropdownButton
                as={SidebarItem}
                className="group items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-700/30 hover:text-indigo-400 transition-all duration-300"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-400/20 blur-md rounded-full group-hover:bg-indigo-400/30 transition-colors duration-300"></div>
                  <Avatar
                    src={session?.user?.image || "/profile-photo.jpg"}
                    square
                    className="relative ring-2 ring-indigo-500/50 h-8 w-8 group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <SidebarLabel className="hidden lg:block font-medium">
                  {session?.user?.name || "User"}
                </SidebarLabel>
                <ChevronDownIcon className="h-5 w-5 ml-auto opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
              </DropdownButton>
              <DropdownMenu
                className="min-w-64 bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 shadow-xl"
                anchor="top start"
              >
                <DropdownItem
                  href="/profile"
                  className="text-gray-300 hover:bg-gray-700/50 hover:text-indigo-400"
                >
                  <UserIcon className="h-5 w-5" />
                  <DropdownLabel>My Profile</DropdownLabel>
                </DropdownItem>
                <DropdownItem
                  href="/settings"
                  className="text-gray-300 hover:bg-gray-700/50 hover:text-indigo-400"
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                <DropdownDivider className="border-gray-700/50" />
                <LogoutButton />
              </DropdownMenu>
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
}
