// User form validation utilities
import { z } from 'zod';
import { UserEditFormData } from '@/types/firestoreUser';

// Validation schema for user edit form
export const userEditFormSchema = z.object({
  // Información personal
  displayName: z
    .string()
    .min(1, 'El nombre completo es requerido')
    .max(100, 'El nombre es demasiado largo')
    .trim(),
  
  firstName: z
    .string()
    .min(1, 'El nombre es requerido')
    .max(50, 'El nombre es demasiado largo')
    .trim(),
  
  lastName: z
    .string()
    .min(1, 'El apellido es requerido')
    .max(50, 'El apellido es demasiado largo')
    .trim(),
  
  phoneNumber: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      // Basic phone validation - adjust regex as needed
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(val.replace(/[\s\-\(\)]/g, ''));
    }, 'Formato de teléfono inválido'),
  
  // Información profesional
  position: z
    .string()
    .max(100, 'El puesto es demasiado largo')
    .optional(),
  
  department: z
    .string()
    .max(100, 'El departamento es demasiado largo')
    .optional(),
  
  location: z
    .string()
    .max(200, 'La ubicación es demasiado larga')
    .optional(),
  
  bio: z
    .string()
    .max(1000, 'La biografía es demasiado larga')
    .optional(),
  
  // Preferencias
  theme: z.enum(['light', 'dark', 'system'], {
    errorMap: () => ({ message: 'Tema inválido' })
  }),
  
  language: z
    .string()
    .min(2, 'Idioma inválido')
    .max(10, 'Idioma inválido'),
  
  // Notificaciones
  notificationEmail: z.boolean(),
  notificationPush: z.boolean(),
  notificationSms: z.boolean(),
});

// Type for validation errors
export interface ValidationErrors {
  [key: string]: string[];
}

// Validate user edit form data
export function validateUserEditForm(data: UserEditFormData): {
  isValid: boolean;
  errors: ValidationErrors;
  data?: UserEditFormData;
} {
  try {
    const validatedData = userEditFormSchema.parse(data);
    
    return {
      isValid: true,
      errors: {},
      data: validatedData as UserEditFormData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationErrors = {};
      
      error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!errors[field]) {
          errors[field] = [];
        }
        errors[field].push(err.message);
      });
      
      return {
        isValid: false,
        errors,
      };
    }
    
    return {
      isValid: false,
      errors: { general: ['Error de validación desconocido'] },
    };
  }
}

// Get first error message for a field
export function getFieldError(errors: ValidationErrors, field: string): string | null {
  const fieldErrors = errors[field];
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
}

// Check if form has any errors
export function hasFormErrors(errors: ValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

// Sanitize and prepare form data
export function sanitizeUserFormData(data: UserEditFormData): UserEditFormData {
  return {
    // Trim and clean string fields
    displayName: data.displayName.trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    phoneNumber: data.phoneNumber?.trim() || '',
    position: data.position?.trim() || '',
    department: data.department?.trim() || '',
    location: data.location?.trim() || '',
    bio: data.bio?.trim() || '',
    
    // Keep other fields as-is
    theme: data.theme,
    language: data.language,
    notificationEmail: data.notificationEmail,
    notificationPush: data.notificationPush,
    notificationSms: data.notificationSms,
  };
}

// Validate individual field
export function validateField(field: keyof UserEditFormData, value: any): string | null {
  try {
    const fieldSchema = userEditFormSchema.shape[field];
    fieldSchema.parse(value);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return error.errors[0]?.message || 'Error de validación';
    }
    return 'Error de validación';
  }
}

// Phone number formatting helper
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d\+]/g, '');
  
  // Basic formatting - you can enhance this based on your needs
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  }
  
  return cleaned;
}

// Email validation helper
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}