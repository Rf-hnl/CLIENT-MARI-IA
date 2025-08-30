'use client';

import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisLoadingProps {
  message?: string;
  submessage?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  variant?: 'default' | 'modal' | 'inline';
}

export function AnalysisLoading({ 
  message = 'Analizando conversación...', 
  submessage = 'IA procesando datos con análisis avanzado',
  size = 'md',
  className,
  variant = 'default'
}: AnalysisLoadingProps) {
  
  const sizeClasses = {
    sm: {
      container: 'w-8 h-8',
      spinner: 'w-8 h-8 border-2',
      icon: 'h-3 w-3',
      text: 'text-xs',
      subtext: 'text-[10px]'
    },
    md: {
      container: 'w-16 h-16',
      spinner: 'w-16 h-16 border-4',
      icon: 'h-6 w-6',
      text: 'text-sm',
      subtext: 'text-xs'
    },
    lg: {
      container: 'w-24 h-24',
      spinner: 'w-24 h-24 border-6',
      icon: 'h-8 w-8',
      text: 'text-base',
      subtext: 'text-sm'
    }
  };

  const variantClasses = {
    default: 'flex-grow flex items-center justify-center',
    modal: 'flex items-center justify-center py-8',
    inline: 'flex items-center gap-2'
  };

  const classes = sizeClasses[size];

  if (variant === 'inline') {
    return (
      <div className={cn(variantClasses[variant], className)}>
        <div className="relative">
          <div className={cn("border-2 border-orange-200 border-t-orange-500 rounded-full animate-spin", "w-4 h-4")}></div>
        </div>
        <span className="text-sm text-orange-600 font-medium">{message}</span>
      </div>
    );
  }

  return (
    <div className={cn(variantClasses[variant], className)}>
      <div className="flex flex-col items-center gap-2">
        {/* Spinner con icono central */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              "border-orange-200 border-t-orange-500 rounded-full animate-spin",
              classes.spinner
            )}></div>
          </div>
          <div className={cn("flex items-center justify-center", classes.container)}>
            <Sparkles className={cn("text-orange-500 animate-pulse", classes.icon)} />
          </div>
        </div>
        
        {/* Texto */}
        <div className="text-center mt-4">
          <p className={cn("font-medium text-orange-600 dark:text-orange-400", classes.text)}>
            {message}
          </p>
          {submessage && (
            <p className={cn("text-orange-500 mt-1", classes.subtext)}>
              {submessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Variante para botones
interface AnalysisButtonLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
}

export function AnalysisButtonLoading({ 
  isLoading, 
  loadingText = 'Procesando...',
  children,
  className 
}: AnalysisButtonLoadingProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-60"></div>
      <span>{loadingText}</span>
    </div>
  );
}

// Variante para modales
export function ModalAnalysisLoading({ 
  message = 'Re-analizando conversación con IA...',
  className 
}: { message?: string; className?: string }) {
  return (
    <div className={cn("text-center py-4", className)}>
      <div className="flex items-center justify-center gap-2 text-sm text-orange-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        {message}
      </div>
    </div>
  );
}