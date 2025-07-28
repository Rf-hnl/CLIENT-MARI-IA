"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Command, ChevronRight } from "lucide-react"
import { useAuth } from "@/modules/auth"
import { getEnabledModules, AppModule } from "@/config/modules.config"
import { NavUser } from "@/components/nav-user"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { currentUser } = useAuth()
  const enabledModules = getEnabledModules()


  if (!currentUser) {
    return null
  }

  const userData = {
    name: currentUser.displayName || "Usuario",
    email: currentUser.email || "",
    avatar: currentUser.photoURL || "",
  }

  // Función para verificar si un módulo está activo
  const isModuleActive = (appModule: AppModule) => {
    if (appModule.path && pathname === appModule.path) return true
    if (appModule.submodules) {
      return appModule.submodules.some((sub) => pathname === sub.path)
    }
    return false
  }

  // Verificar si un submódulo está activo
  const isSubmoduleActive = (submodulePath: string) => pathname === submodulePath

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Client Mar-IA</span>
                  <span className="truncate text-xs">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {enabledModules.map((appModule) => {
                // Si el módulo tiene submódulos
                if (appModule.submodules && appModule.submodules.length > 0) {
                  return (
                    <Collapsible
                      key={appModule.id}
                      asChild
                      defaultOpen={isModuleActive(appModule)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={appModule.label}
                            isActive={isModuleActive(appModule)}
                          >
                            {appModule.icon}
                            <span>{appModule.label}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {appModule.submodules
                              .filter(sub => sub.enabled)
                              .map((submodule) => (
                                <SidebarMenuSubItem key={submodule.id}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubmoduleActive(submodule.path)}
                                  >
                                    <Link href={submodule.path}>
                                      {submodule.icon}
                                      <span>{submodule.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  )
                }

                // Si el módulo no tiene submódulos o no tiene path
                if (!appModule.path) return null

                return (
                  <SidebarMenuItem key={appModule.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === appModule.path}
                      tooltip={appModule.label}
                    >
                      <Link href={appModule.path}>
                        {appModule.icon}
                        <span>{appModule.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
