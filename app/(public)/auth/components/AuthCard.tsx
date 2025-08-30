'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface AuthCardProps {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-950 p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
      <div className="w-full max-w-sm mx-auto space-y-6">
        {/* Theme Toggle */}
        <div className="flex justify-end">
          <ThemeToggle />
        </div>
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <div className="text-sm text-muted-foreground">
              {subtitle}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}