'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showPassword: boolean;
  onTogglePassword: () => void;
  leftIcon?: React.ReactNode;
}

export function PasswordInput({ 
  showPassword, 
  onTogglePassword, 
  leftIcon,
  className,
  disabled,
  ...props 
}: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        {...props}
        type={showPassword ? 'text' : 'password'}
        disabled={disabled}
        className={cn(
          "h-11 pl-10 pr-10 rounded-md bg-white dark:bg-neutral-900 border-2 border-orange-200 dark:border-orange-800",
          "focus:ring-2 focus:ring-orange-500 focus:ring-offset-1 focus:border-orange-500",
          "transition-all duration-200",
          className
        )}
      />
      {leftIcon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          {leftIcon}
        </div>
      )}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={onTogglePassword}
        disabled={disabled}
        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-gray-400" />
        ) : (
          <Eye className="h-4 w-4 text-gray-400" />
        )}
      </Button>
    </div>
  );
}