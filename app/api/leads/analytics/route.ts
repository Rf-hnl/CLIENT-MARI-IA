import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET || 'super-secret-key-for-debugging-only'
    );

    let user;
    try {
      const { payload } = await jose.jwtVerify(token, secret);
      user = { 
        id: payload.userId as string, 
        email: payload.email as string,
        tenantId: payload.tenantId as string,
        organizationId: payload.organizationId as string
      };
    } catch (err) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ error: 'Token verification failed' }, { status: 401 });
    }

    console.log('📊 [LEADS-ANALYTICS] Fetching analytics for user:', user.email);

    // Use organization data directly from JWT token
    const organizationId = user.organizationId;
    const tenantId = user.tenantId;
    const whereClause = { organizationId, tenantId };

    console.log('📊 [LEADS-ANALYTICS] Using organization:', organizationId, 'tenant:', tenantId);

    try {
      // Pipeline distribution
      const pipelineData = await prisma.lead.groupBy({
        by: ['status'],
        where: whereClause,
        _count: {
          id: true
        }
      });

      // Lead sources distribution
      const sourceDistribution = await prisma.lead.groupBy({
        by: ['source'],
        where: whereClause,
        _count: {
          id: true
        }
      });

      // Recent activity (last 7 days for trends)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivity = await prisma.lead.findMany({
        where: {
          ...whereClause,
          createdAt: {
            gte: sevenDaysAgo
          }
        },
        select: {
          createdAt: true
        }
      });

      // Conversion metrics
      const totalLeads = await prisma.lead.count({ where: whereClause });
      const wonLeads = await prisma.lead.count({ where: { ...whereClause, status: 'won' } });
      const lostLeads = await prisma.lead.count({ where: { ...whereClause, status: 'lost' } });
      const qualifiedLeads = await prisma.lead.count({ where: { ...whereClause, isQualified: true } });

      // AI Score categories (filtering null values)
      const hotLeads = await prisma.lead.count({ 
        where: { 
          ...whereClause,
          aiScore: { gte: 70, not: null } 
        } 
      });
      const warmLeads = await prisma.lead.count({ 
        where: { 
          ...whereClause,
          aiScore: { gte: 40, lt: 70, not: null } 
        } 
      });
      const coldLeads = await prisma.lead.count({ 
        where: { 
          ...whereClause,
          OR: [
            { aiScore: { lt: 40, not: null } },
            { aiScore: null }
          ]
        } 
      });

      // Pipeline value (if available)
      const pipelineValue = await prisma.lead.aggregate({
        where: {
          ...whereClause,
          status: {
            in: ['qualified', 'proposal_current', 'negotiation']
          }
        },
        _sum: {
          conversionValue: true
        }
      });

      // Average AI Score
      const avgScore = await prisma.lead.aggregate({
        where: {
          ...whereClause,
          aiScore: { not: null }
        },
        _avg: {
          aiScore: true
        }
      });

      // Process trends data
      const dailyStats = recentActivity.reduce((acc, lead) => {
        const day = lead.createdAt.toISOString().split('T')[0];
        if (!acc[day]) {
          acc[day] = 0;
        }
        acc[day]++;
        return acc;
      }, {} as Record<string, number>);

      const weeklyTrends = Object.entries(dailyStats).map(([date, count]) => ({
        date,
        count
      }));

      const analytics = {
        summary: {
          totalLeads,
          conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0',
          qualificationRate: totalLeads > 0 ? ((qualifiedLeads / totalLeads) * 100).toFixed(1) : '0',
          pipelineValue: pipelineValue._sum.conversionValue || 0,
          averageScore: avgScore._avg.aiScore?.toFixed(1) || '0'
        },
        pipeline: pipelineData.map(item => ({
          status: item.status,
          count: item._count.id,
          label: getStatusLabel(item.status)
        })),
        scoreDistribution: [
          { name: '🔥 Calientes (70+)', value: hotLeads, color: '#ef4444' },
          { name: '🌡️ Tibios (40-69)', value: warmLeads, color: '#f97316' },
          { name: '❄️ Fríos (0-39)', value: coldLeads, color: '#3b82f6' }
        ],
        sourceDistribution: sourceDistribution.map(item => ({
          source: item.source || 'Desconocido',
          count: item._count.id
        })),
        trends: {
          thisWeek: weeklyTrends,
          thisMonth: recentActivity.length
        }
      };

      return NextResponse.json({
        success: true,
        analytics,
        timestamp: new Date().toISOString()
      });

    } catch (dbError) {
      console.error('❌ [LEADS-ANALYTICS] Database error:', dbError);
      
      // Fallback analytics
      const fallbackAnalytics = {
        summary: {
          totalLeads: 0,
          conversionRate: '0',
          qualificationRate: '0',
          pipelineValue: 0,
          averageScore: '0'
        },
        pipeline: [],
        scoreDistribution: [
          { name: '🔥 Calientes (70+)', value: 0, color: '#ef4444' },
          { name: '🌡️ Tibios (40-69)', value: 0, color: '#f97316' },
          { name: '❄️ Fríos (0-39)', value: 0, color: '#3b82f6' }
        ],
        sourceDistribution: [],
        trends: { thisWeek: [], thisMonth: 0 }
      };

      return NextResponse.json({
        success: true,
        analytics: fallbackAnalytics,
        timestamp: new Date().toISOString(),
        note: 'Using fallback data due to database connection issue'
      });
    }

  } catch (error) {
    console.error('❌ [LEADS-ANALYTICS] Error:', error);
    return NextResponse.json({
      error: 'Error fetching leads analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'new': 'Nuevos',
    'interested': 'Interesados',
    'qualified': 'Calificados',
    'follow_up': 'Seguimiento',
    'proposal_current': 'Cotización',
    'proposal_previous': 'Propuesta Previa',
    'negotiation': 'Negociación',
    'nurturing': 'Cultivo',
    'won': 'Ganados',
    'lost': 'Perdidos',
    'cold': 'Fríos'
  };
  return labels[status] || status;
}

