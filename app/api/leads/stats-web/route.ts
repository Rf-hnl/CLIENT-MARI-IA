import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { tenantId, organizationId } = await request.json();

    if (!tenantId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'tenantId and organizationId are required' },
        { status: 400 }
      );
    }

    console.log('📊 [LEADS-STATS-WEB] Fetching stats for tenant:', tenantId, 'org:', organizationId);

    try {
      // Get real statistics from database filtered by organization
      const whereClause = { organizationId, tenantId };
      
      const totalLeads = await prisma.lead.count({ where: whereClause });
      const newLeads = await prisma.lead.count({ where: { ...whereClause, status: 'new' } });
      const interestedLeads = await prisma.lead.count({ where: { ...whereClause, status: 'interested' } });
      const qualifiedLeads = await prisma.lead.count({ where: { ...whereClause, status: 'qualified' } });
      const followUpLeads = await prisma.lead.count({ where: { ...whereClause, status: 'follow_up' } });
      const proposalLeads = await prisma.lead.count({ where: { ...whereClause, status: 'proposal_current' } });
      const wonLeads = await prisma.lead.count({ where: { ...whereClause, status: 'won' } });
      const lostLeads = await prisma.lead.count({ where: { ...whereClause, status: 'lost' } });

      // Calculate percentage changes (simplified - in real app you'd compare with previous period)
      const stats = [
        {
          label: 'Total Leads',
          value: totalLeads,
          change: '+0%',
          icon: 'Users',
          color: 'text-blue-600',
          description: 'Total de leads en el sistema'
        },
        {
          label: 'Nuevos',
          value: newLeads,
          change: '+0%',
          icon: 'Target',
          color: 'text-green-600',
          description: 'Leads recién ingresados'
        },
        {
          label: 'Potenciales',
          value: interestedLeads,
          change: '+0%',
          icon: 'TrendingUp',
          color: 'text-purple-600',
          description: 'Leads con interés confirmado'
        },
        {
          label: 'Calificados',
          value: qualifiedLeads,
          change: '+0%',
          icon: 'CheckCircle',
          color: 'text-orange-600',
          description: 'Leads que cumplen criterios'
        },
        {
          label: 'Seguimiento',
          value: followUpLeads,
          change: '+0%',
          icon: 'Clock',
          color: 'text-amber-600',
          description: 'Leads pendientes de contacto'
        },
        {
          label: 'Cotizaciones',
          value: proposalLeads,
          change: '+0%',
          icon: 'AlertCircle',
          color: 'text-indigo-600',
          description: 'Leads en proceso de cotización'
        },
        {
          label: 'Ganados',
          value: wonLeads,
          change: '+0%',
          icon: 'CheckCircle',
          color: 'text-green-700',
          description: 'Leads convertidos exitosamente'
        },
        {
          label: 'Descartados',
          value: lostLeads,
          change: '+0%',
          icon: 'AlertCircle',
          color: 'text-red-600',
          description: 'Leads no viables o perdidos'
        }
      ];

      console.log('✅ [LEADS-STATS-WEB] Real stats calculated:', stats.length, 'metrics');

      return NextResponse.json({
        success: true,
        stats,
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.error('❌ [LEADS-STATS-WEB] Database error:', dbError);
      
      // Fallback stats if database query fails
      const fallbackStats = [
        { label: 'Total Leads', value: 0, change: '+0%', icon: 'Users', color: 'text-blue-600', description: 'Total de leads en el sistema' },
        { label: 'Nuevos', value: 0, change: '+0%', icon: 'Target', color: 'text-green-600', description: 'Leads recién ingresados' },
        { label: 'Potenciales', value: 0, change: '+0%', icon: 'TrendingUp', color: 'text-purple-600', description: 'Leads con interés confirmado' },
        { label: 'Calificados', value: 0, change: '+0%', icon: 'CheckCircle', color: 'text-orange-600', description: 'Leads que cumplen criterios' }
      ];

      return NextResponse.json({
        success: true,
        stats: fallbackStats,
        timestamp: new Date().toISOString(),
        note: 'Using fallback data due to database connection issue'
      });
    }

  } catch (error) {
    console.error('❌ [LEADS-STATS-WEB] Error getting stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Error fetching leads statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}