'use client';

import Link from 'next/link';
import { ChevronRight, Home, Bot } from 'lucide-react';

export function BreadcrumbNav() {
  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
      <Link 
        href="/dashboard" 
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3 w-3" />
        Inicio
      </Link>
      <ChevronRight className="h-3 w-3" />
      <div className="flex items-center gap-1 text-foreground font-medium">
        <Bot className="h-3 w-3" />
        Agentes IA
      </div>
    </nav>
  );
}