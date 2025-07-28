'use client';

import { IClientAIProfile } from '@/modules/clients/types/clients';
import { mockClientAIProfiles } from '@/modules/clients/mock/clientsMockData';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { safeFormatDate } from '@/utils/dateFormat';

const InfoRow = ({ label, value, children }: { label: string; value?: string | number | boolean; children?: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {value !== undefined && <p className="text-sm font-semibold">{String(value)}</p>}
        {children && <div>{children}</div>}
    </div>
);

interface AiAnalysisProps {
  clientId: string;
}

export const AiAnalysis = ({ clientId }: AiAnalysisProps) => {
  const profile = mockClientAIProfiles.find(p => p.clientId === clientId);

  if (!profile) {
    return <p>No hay análisis de IA para este cliente.</p>;
  }

  return (
    <Card className="rounded-lg shadow-none border">
        <CardHeader>
            <CardTitle className="text-lg font-semibold">Análisis de IA</CardTitle>
        </CardHeader>
        <CardContent>
            <InfoRow label="Fecha de Análisis" value={safeFormatDate(profile.analysisDate)} />
            <InfoRow label="Segmento de Perfil" value={profile.profileSegment} />
            <InfoRow label="Puntuación de Riesgo" value={profile.riskScore} />
            <InfoRow label="Puntuación de Compromiso" value={profile.engagementScore} />
            <InfoRow label="Riesgo de Abandono Predicho" value={profile.predictedChurnRisk ? 'Sí' : 'No'} />
            <InfoRow label="Acción Recomendada" value={profile.recommendedAction} />
            <InfoRow label="Última Actualización por IA" value={safeFormatDate(profile.lastUpdatedByAI)} />
        </CardContent>
    </Card>
  );
};
