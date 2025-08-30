'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle2, AlertTriangle, Database, Brain } from 'lucide-react';
import { ExtendedClient } from '@/modules/clients/context/ClientsContext';

interface ClientMigrationBadgeProps {
  client: ExtendedClient;
  variant?: 'full' | 'icon' | 'minimal';
  showTooltip?: boolean;
}

export function ClientMigrationBadge({ 
  client, 
  variant = 'full', 
  showTooltip = true 
}: ClientMigrationBadgeProps) {
  const hasInteractions = Boolean(client.customerInteractions);
  const hasAIProfile = Boolean(client.customerInteractions?.clientAIProfiles);
  
  // Determine migration status
  const migrationStatus = {
    isMigrated: hasInteractions,
    hasAI: hasAIProfile,
    needsMigration: !hasInteractions
  };

  const getBadgeProps = () => {
    if (migrationStatus.isMigrated && migrationStatus.hasAI) {
      return {
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: CheckCircle2,
        text: variant === 'minimal' ? '✓' : 'Migrado',
        tooltip: 'Cliente migrado con perfil de IA completo'
      };
    } else if (migrationStatus.isMigrated && !migrationStatus.hasAI) {
      return {
        variant: 'secondary' as const,
        className: 'bg-blue-100 text-blue-800 border-blue-200',
        icon: Database,
        text: variant === 'minimal' ? 'DB' : 'Estructura',
        tooltip: 'Cliente con nueva estructura pero sin perfil de IA'
      };
    } else {
      return {
        variant: 'outline' as const,
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: AlertTriangle,
        text: variant === 'minimal' ? '!' : 'Migrar',
        tooltip: 'Cliente requiere migración a nueva estructura'
      };
    }
  };

  const badgeProps = getBadgeProps();
  const Icon = badgeProps.icon;

  const renderBadge = () => {
    if (variant === 'icon') {
      return (
        <div className={`p-1 rounded-full ${badgeProps.className.replace('border-', 'bg-').split(' ')[0]} opacity-80`}>
          <Icon className="h-3 w-3" />
        </div>
      );
    }

    if (variant === 'minimal') {
      return (
        <Badge 
          variant={badgeProps.variant}
          className={`${badgeProps.className} text-xs px-1.5 py-0.5 font-mono`}
        >
          {badgeProps.text}
        </Badge>
      );
    }

    return (
      <Badge 
        variant={badgeProps.variant}
        className={`${badgeProps.className} flex items-center gap-1 text-xs`}
      >
        <Icon className="h-3 w-3" />
        {badgeProps.text}
        {migrationStatus.hasAI && (
          <Brain className="h-3 w-3 ml-0.5 text-purple-600" />
        )}
      </Badge>
    );
  };

  if (!showTooltip) {
    return renderBadge();
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {renderBadge()}
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">{badgeProps.tooltip}</p>
            <div className="text-xs space-y-0.5">
              <p>• Estructura: {migrationStatus.isMigrated ? '✅' : '❌'}</p>
              <p>• Perfil IA: {migrationStatus.hasAI ? '✅' : '❌'}</p>
              {migrationStatus.hasAI && client.customerInteractions?.clientAIProfiles && (
                <p>• Segmento: {client.customerInteractions.clientAIProfiles.profileSegment}</p>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Hook to get migration statistics
export function useMigrationStats(clients: ExtendedClient[]) {
  const stats = React.useMemo(() => {
    const total = clients.length;
    const migrated = clients.filter(c => c.customerInteractions).length;
    const withAI = clients.filter(c => c.customerInteractions?.clientAIProfiles).length;
    const needsMigration = total - migrated;
    
    return {
      total,
      migrated,
      withAI,
      needsMigration,
      migrationPercentage: total > 0 ? (migrated / total) * 100 : 100,
      aiPercentage: total > 0 ? (withAI / total) * 100 : 100
    };
  }, [clients]);

  return stats;
}