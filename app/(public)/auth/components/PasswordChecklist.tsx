'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordRule {
  id: string;
  text: string;
  isValid: boolean;
}

interface PasswordChecklistProps {
  rules: PasswordRule[];
  className?: string;
}

export function PasswordChecklist({ rules, className }: PasswordChecklistProps) {
  if (rules.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Requisitos de contraseña:
      </p>
      <ul className="space-y-1">
        {rules.map((rule) => (
          <li 
            key={rule.id}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            {rule.isValid ? (
              <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0" />
            ) : (
              <XCircle className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            )}
            <span className={cn(
              "text-xs leading-relaxed",
              rule.isValid ? "text-green-700 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
            )}>
              {rule.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}