"use client";
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  FileIcon,
  HomeIcon,
  LogOutIcon,
  MenuIcon,
  SettingsIcon,
} from "lucide-react"
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { logoutUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useAuthStore } from '@/states/useAuthStore';


interface NavItemProps {
  href: string
  icon: React.ReactNode
  title: string
  isActive?: boolean
}


function NavItem({ href, icon, title, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary",
        isActive ? "bg-gray-200 dark:bg-muted font-medium text-primary" : "text-muted-foreground",
      )}
    >
      {icon}
      {title}
    </Link>
  )
}

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function Navbar({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const { theme, setTheme } = useTheme();
  const router = useRouter();


  const handleLogout = async () => {
    await logoutUser();
    useAuthStore.getState().clearAuth();
    router.push("/login");
  };

  const navigation = [
    { href: "/dashboard", icon: <HomeIcon className="h-4 w-4" />, title: "Dashboard" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="md:hidden">
              <MenuIcon className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <nav className="grid gap-2 text-lg font-medium">
              {navigation.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  title={item.title}
                  isActive={pathname === item.href}
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <FileIcon className="h-6 w-6" />
          <span className="text-lg font-bold">FileShare</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleLogout()}>
                <LogOutIcon className="mr-2 h-4 w-4" />
                <p>Log out</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>
      {/* Main Content */}
      <div className="flex flex-1">
        {/* Sidebar Navigation (desktop) */}
        <aside className="hidden w-64 flex-col border-r bg-muted/40 md:flex">
          <nav className="grid gap-2 p-4 text-sm">
            {navigation.map((item) => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                title={item.title}
                isActive={pathname === item.href}
              />
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="px-3 flex gap-2 w-max items-center py-2"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (

                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90" />
              ) : (

                <Moon className="h-5 w-5 transition-all rotate-0 dark:scale-100" />
              )}
              <span className="inline-block">Toggle theme</span>
            </Button>
            <button className="flex px-3 cursor-pointer py-2 items-center gap-2" onClick={() => handleLogout()}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <p>Log out</p>
            </button>
          </nav>
        </aside>
        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div >
  );
} 