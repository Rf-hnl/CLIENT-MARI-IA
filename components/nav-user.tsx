"use client"

import { LogOut, User, Palette } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/modules/auth"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

interface NavUserProps {
  user: {
    name: string
    email: string
    avatar: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { open } = useSidebar()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {open ? (
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-orange-50 hover:bg-orange-50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left ml-2 min-w-0">
                  <span className="truncate font-medium text-sm text-gray-800 block">{user.name}</span>
                  <span className="truncate text-xs text-gray-500 block">{user.email}</span>
                </div>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton className="w-10 h-10 p-0 data-[state=open]:bg-orange-50 hover:bg-orange-50">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </SidebarMenuButton>
            )}
          </DropdownMenuTrigger>
          
          <DropdownMenuContent className="w-56" side="right" align="end" sideOffset={4}>
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-2 py-2 text-left text-sm">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User />
              Mi Perfil
            </DropdownMenuItem>
            
            <DropdownMenuItem asChild>
              <div className="flex items-center justify-between w-full cursor-pointer">
                <div className="flex items-center">
                  <Palette className="mr-2 h-4 w-4" />
                  Tema
                </div>
                <ThemeToggle />
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}