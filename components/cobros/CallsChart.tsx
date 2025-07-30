'use client';

import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { IBatchCall, getBatchHybridStatus } from '@/types/cobros';
import { TrendingUp } from 'lucide-react';

interface CallsChartProps {
  calls: IBatchCall[];
  loading?: boolean;
}

// Configuración de colores para el chart (actualizada para coincidir con estados híbridos)
const chartConfig = {
  completed_success: {
    label: "Exitosas",
    color: "hsl(142, 76%, 36%)", // Verde - Solo para completadas exitosas
  },
  completed_partial: {
    label: "Parciales",
    color: "hsl(25, 95%, 53%)", // Naranja - Para completadas parciales
  },
  completed_failed: {
    label: "Con Errores",
    color: "hsl(0, 84%, 60%)", // Rojo - Para completadas con errores
  },
  processed: {
    label: "Procesadas",
    color: "hsl(221, 83%, 53%)", // Azul - Para procesadas sin detalle
  },
  in_progress: {
    label: "En Progreso",
    color: "hsl(200, 83%, 53%)", // Azul claro
  },
  pending: {
    label: "Pendientes",
    color: "hsl(48, 96%, 53%)", // Amarillo
  },
  failed: {
    label: "Fallidas",
    color: "hsl(0, 84%, 60%)", // Rojo
  },
  cancelled: {
    label: "Canceladas",
    color: "hsl(0, 0%, 45%)", // Gris
  },
} satisfies ChartConfig;

export function CallsChart({ calls, loading }: CallsChartProps) {
  const [timeRange, setTimeRange] = useState("7d"); // Cambiar filtro por defecto a 7 días

  // Procesar datos para la gráfica
  const chartData = useMemo(() => {
    if (!calls.length) return [];

    // Agrupar llamadas por fecha usando estados híbridos
    const grouped = calls.reduce((acc, call) => {
      const date = new Date(call.created_at).toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!acc[date]) {
        acc[date] = {
          date,
          completed_success: 0,
          completed_partial: 0,
          completed_failed: 0,
          processed: 0,
          in_progress: 0,
          pending: 0,
          failed: 0,
          cancelled: 0,
        };
      }
      
      // Usar estado híbrido para una clasificación más precisa
      const hybridStatus = getBatchHybridStatus(call);
      const status = hybridStatus.status;
      
      if (status in acc[date]) {
        acc[date][status]++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Convertir a array y ordenar por fecha
    return Object.values(grouped).sort((a: any, b: any) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [calls]);

  // Filtrar datos según el rango de tiempo seleccionado
  const filteredData = useMemo(() => {
    if (!chartData.length) return [];

    const now = new Date();
    let daysToSubtract = 30;
    
    if (timeRange === "7d") {
      daysToSubtract = 7;
    } else if (timeRange === "90d") {
      daysToSubtract = 90;
    }
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);
    
    return chartData.filter((item: any) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate;
    });
  }, [chartData, timeRange]);

  if (loading) {
    return (
      <Card className="pt-0">
        <CardHeader className="animate-pulse">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData.length) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análisis de Llamadas
          </CardTitle>
          <CardDescription>
            No hay datos de llamadas para mostrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No hay datos suficientes para mostrar gráficas
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análisis de Llamadas
          </CardTitle>
          <CardDescription>
            Tendencia de llamadas exitosas, parciales y con errores en el tiempo
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="hidden w-[160px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Seleccionar rango de tiempo"
          >
            <SelectValue placeholder="Últimos 7 días" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Últimos 7 días
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Últimos 30 días
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Últimos 3 meses
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillCompletedSuccess" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-completed_success)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-completed_success)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCompletedPartial" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-completed_partial)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-completed_partial)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCompletedFailed" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-completed_failed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-completed_failed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillProcessed" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-processed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-processed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillInProgress" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-in_progress)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-in_progress)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-pending)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-pending)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillFailed" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-failed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-failed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillCancelled" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-cancelled)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-cancelled)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("es-ES", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("es-ES", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="pending"
              type="natural"
              fill="url(#fillPending)"
              stroke="var(--color-pending)"
              stackId="a"
            />
            <Area
              dataKey="cancelled"
              type="natural"
              fill="url(#fillCancelled)"
              stroke="var(--color-cancelled)"
              stackId="a"
            />
            <Area
              dataKey="failed"
              type="natural"
              fill="url(#fillFailed)"
              stroke="var(--color-failed)"
              stackId="a"
            />
            <Area
              dataKey="in_progress"
              type="natural"
              fill="url(#fillInProgress)"
              stroke="var(--color-in_progress)"
              stackId="a"
            />
            <Area
              dataKey="processed"
              type="natural"
              fill="url(#fillProcessed)"
              stroke="var(--color-processed)"
              stackId="a"
            />
            <Area
              dataKey="completed_failed"
              type="natural"
              fill="url(#fillCompletedFailed)"
              stroke="var(--color-completed_failed)"
              stackId="a"
            />
            <Area
              dataKey="completed_partial"
              type="natural"
              fill="url(#fillCompletedPartial)"
              stroke="var(--color-completed_partial)"
              stackId="a"
            />
            <Area
              dataKey="completed_success"
              type="natural"
              fill="url(#fillCompletedSuccess)"
              stroke="var(--color-completed_success)"
              stackId="a"
            />
            <ChartLegend
              content={
                <ChartLegendContent
                  nameKey="dataKey"
                  payload={Object.keys(chartConfig).map((key) => ({
                    dataKey: key,
                    color: chartConfig[key as keyof typeof chartConfig].color,
                    value: chartConfig[key as keyof typeof chartConfig].label,
                  }))}
                />
              }
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
