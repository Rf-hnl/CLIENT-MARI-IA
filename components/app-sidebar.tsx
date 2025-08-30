"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Image from "next/image"
import { useAuth } from "@/modules/auth"
import { getGroupedModules } from "@/config/modules.config"
import { NavUser } from "@/components/nav-user"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { open, setOpen } = useSidebar()
  
  const groupedModules = getGroupedModules()
  
  // MODO DESARROLLO: Sidebar siempre visible
  // if (!user) return null

  
  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" {...props}>
        {/* Header */}
        <SidebarHeader className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Image src="/favicon.png" alt="Logo" width={20} height={20} className="w-5 h-5" />
            </div>
            {open && (
              <div className="flex-1 min-w-0">
                <h1 className="font-bold text-lg text-gray-900 dark:text-white truncate">
                  Client Mar-IA
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  AI-Powered CRM
                </p>
              </div>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(!open)}
            className="w-6 h-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
            aria-label={open ? 'Colapsar sidebar' : 'Expandir sidebar'}
          >
            {open ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="p-2">
          {groupedModules.map((group, index) => (
            <div key={group.id}>
              <SidebarGroup className="py-2">
                {open && (
                  <SidebarGroupLabel className="uppercase text-xs text-gray-500 px-3 mb-2">
                    {group.label}
                  </SidebarGroupLabel>
                )}
                
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-2">
                    {group.modules.map((module) => {
                      const isActive = pathname === module.path

                      if (!open) {
                        return (
                          <SidebarMenuItem key={module.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <SidebarMenuButton
                                  asChild
                                  isActive={isActive}
                                  className={cn(
                                    "w-10 h-10 p-0 flex items-center justify-center rounded-md transition-colors duration-200",
                                    isActive 
                                      ? "bg-orange-100 text-orange-600 shadow-sm" 
                                      : "text-gray-600 hover:bg-orange-50 hover:text-orange-500 hover:shadow-sm"
                                  )}
                                >
                                  <Link href={module.path}>
                                    {module.icon}
                                  </Link>
                                </SidebarMenuButton>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {module.label}
                              </TooltipContent>
                            </Tooltip>
                          </SidebarMenuItem>
                        )
                      }

                      return (
                        <SidebarMenuItem key={module.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            className={cn(
                              "flex items-center space-x-2 px-3 py-2 rounded-md transition-all duration-200",
                              isActive 
                                ? "bg-orange-100 text-orange-600 shadow-sm border-l-2 border-orange-500" 
                                : "text-gray-700 hover:bg-orange-50 hover:text-orange-600 hover:shadow-sm hover:translate-x-1"
                            )}
                          >
                            <Link href={module.path} className="flex items-center space-x-2 w-full">
                              {module.icon}
                              <span className="font-medium">{module.label}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
              
              {index < groupedModules.length - 1 && open && (
                <div className="border-t my-2 mx-3" />
              )}
            </div>
          ))}
        </SidebarContent>

        {/* Footer */}
        <SidebarFooter className="border-t p-2 space-y-2">
          <NavUser user={{
            name: user?.email?.split('@')[0] || "Usuario",
            email: user?.email || "",
            avatar: ""
          }} />
          {open && (
            <div className="px-3 py-1">
              <div className="text-xs text-gray-400 text-center font-mono">
                v2.10
              </div>
            </div>
          )}
        </SidebarFooter>
        
        <SidebarRail />
      </Sidebar>
    </TooltipProvider>
  )
}