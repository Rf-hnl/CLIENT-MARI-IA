/**
 * CLIENT VALIDATION UTILITIES
 * 
 * Funciones para validar completitud de datos del cliente
 * y generar alertas/warnings
 */

import { IClient, CLIENT_FIELD_CONFIG, FieldRequirement } from '../types/clients';

export interface IClientValidationResult {
  isValid: boolean;
  completenessScore: number; // 0-100
  missingRequired: string[];
  missingRecommended: string[];
  warnings: IFieldWarning[];
  riskLevel: "low" | "medium" | "high";
}

export interface IFieldWarning {
  field: string;
  message: string;
  severity: "warning" | "danger";
  category: string;
}

/**
 * Valida la completitud de los datos de un cliente
 */
export function validateClientData(client: IClient): IClientValidationResult {
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const warnings: IFieldWarning[] = [];

  // Verificar campos obligatorios
  const requiredFields = Object.entries(CLIENT_FIELD_CONFIG)
    .filter(([_, config]) => config.requirement === "required")
    .map(([field, _]) => field);

  for (const field of requiredFields) {
    const value = (client as any)[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingRequired.push(field);
      warnings.push({
        field,
        message: `Campo obligatorio: ${CLIENT_FIELD_CONFIG[field].description}`,
        severity: "danger",
        category: CLIENT_FIELD_CONFIG[field].category
      });
    }
  }

  // Verificar campos recomendados
  const recommendedFields = Object.entries(CLIENT_FIELD_CONFIG)
    .filter(([_, config]) => config.requirement === "recommended")
    .map(([field, config]) => ({ field, config }));

  for (const { field, config } of recommendedFields) {
    const value = (client as any)[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      missingRecommended.push(field);
      if (config.warningMessage) {
        warnings.push({
          field,
          message: config.warningMessage,
          severity: "warning",
          category: config.category
        });
      }
    }
  }

  // Calcular score de completitud
  const totalFields = Object.keys(CLIENT_FIELD_CONFIG).length;
  const requiredWeight = 0.6; // 60% del score
  const recommendedWeight = 0.3; // 30% del score
  const optionalWeight = 0.1; // 10% del score

  const requiredCount = requiredFields.length;
  const recommendedCount = recommendedFields.length;
  const optionalCount = totalFields - requiredCount - recommendedCount;

  const completedRequired = requiredCount - missingRequired.length;
  const completedRecommended = recommendedCount - missingRecommended.length;
  const completedOptional = getCompletedOptionalCount(client);

  const completenessScore = Math.round(
    (completedRequired / requiredCount) * requiredWeight * 100 +
    (completedRecommended / recommendedCount) * recommendedWeight * 100 +
    (completedOptional / optionalCount) * optionalWeight * 100
  );

  // Determinar nivel de riesgo
  let riskLevel: "low" | "medium" | "high" = "low";
  if (missingRequired.length > 0) {
    riskLevel = "high";
  } else if (missingRecommended.length >= 3) {
    riskLevel = "medium";
  }

  return {
    isValid: missingRequired.length === 0,
    completenessScore,
    missingRequired,
    missingRecommended,
    warnings,
    riskLevel
  };
}

/**
 * Cuenta campos opcionales completados
 */
function getCompletedOptionalCount(client: IClient): number {
  const optionalFields = Object.entries(CLIENT_FIELD_CONFIG)
    .filter(([_, config]) => config.requirement === "optional")
    .map(([field, _]) => field);

  let completed = 0;
  for (const field of optionalFields) {
    const value = (client as any)[field];
    if (value && !(typeof value === 'string' && value.trim() === '')) {
      completed++;
    }
  }
  return completed;
}

/**
 * Obtiene el color del badge según el score de completitud
 */
export function getCompletenessColor(score: number): string {
  if (score >= 90) return "bg-green-100 text-green-800";
  if (score >= 70) return "bg-yellow-100 text-yellow-800";
  if (score >= 50) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

/**
 * Obtiene el icono según el nivel de riesgo
 */
export function getRiskIcon(riskLevel: "low" | "medium" | "high"): string {
  switch (riskLevel) {
    case "low": return "✅";
    case "medium": return "⚠️";
    case "high": return "🚨";
    default: return "❓";
  }
}

/**
 * Genera resumen de validación para mostrar en UI
 */
export function getValidationSummary(validation: IClientValidationResult): string {
  if (validation.missingRequired.length > 0) {
    return `Faltan ${validation.missingRequired.length} campos obligatorios`;
  }
  if (validation.missingRecommended.length > 0) {
    return `Faltan ${validation.missingRecommended.length} campos recomendados`;
  }
  return "Datos completos";
}

/**
 * Agrupa warnings por categoría
 */
export function groupWarningsByCategory(warnings: IFieldWarning[]): Record<string, IFieldWarning[]> {
  return warnings.reduce((acc, warning) => {
    if (!acc[warning.category]) {
      acc[warning.category] = [];
    }
    acc[warning.category].push(warning);
    return acc;
  }, {} as Record<string, IFieldWarning[]>);
}