'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface FieldProps {
  label: string;
  name: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Field({ label, name, hint, error, icon, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label 
        htmlFor={name} 
        className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
      >
        {icon}
        {label}
      </Label>
      <div className="relative">
        {children}
      </div>
      {hint && !error && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {hint}
        </p>
      )}
      {error && (
        <p 
          className="text-xs text-red-600 dark:text-red-400 leading-relaxed" 
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}