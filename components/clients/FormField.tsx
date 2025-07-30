import React from 'react';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  field: string;
  required?: boolean;
  children: React.ReactNode;
  description?: string;
  className?: string;
  errors: Record<string, string>;
}

export const FormField = React.memo(({ 
  label, 
  field, 
  required = false, 
  children, 
  description,
  className,
  errors
}: FormFieldProps) => (
  <div className={`space-y-2 ${className || ''}`}>
    <Label htmlFor={field} className="flex items-center gap-1">
      {label}
      {required && <span className="text-red-500">*</span>}
    </Label>
    {description && (
      <p className="text-xs text-muted-foreground">{description}</p>
    )}
    {children}
    {errors[field] && (
      <p className="text-xs text-red-600 flex items-center gap-1">
        <AlertCircle className="h-3 w-3" />
        {errors[field]}
      </p>
    )}
  </div>
));

FormField.displayName = 'FormField';