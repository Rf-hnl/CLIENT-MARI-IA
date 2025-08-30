'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Sparkles,
  RefreshCw,
  BarChart3,
  Target,
  AlertTriangle
} from 'lucide-react';

interface ConversationAnalysisPanelProps {
  leadId: string;
  conversationId: string;
  transcript?: any;
}

export const ConversationAnalysisPanel: React.FC<ConversationAnalysisPanelProps> = ({
  leadId,
  conversationId,
  transcript
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    // TODO: Implement actual analysis
    setTimeout(() => setIsAnalyzing(false), 2000);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-sm">
            <Brain className="w-4 h-4 mr-2 text-orange-600" />
            Inteligencia de Conversaciones
          </CardTitle>
          <Button 
            onClick={handleRunAnalysis} 
            variant="outline" 
            size="sm"
            disabled={isAnalyzing}
          >
            <RefreshCw className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 flex items-center justify-center">
        {isAnalyzing ? (
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-600" />
            <p className="text-sm text-gray-600">Analizando conversación con IA...</p>
          </div>
        ) : (
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-sm text-gray-600 mb-4">
              No hay análisis disponible para esta conversación.
            </p>
            <Button 
              onClick={handleRunAnalysis} 
              disabled={!transcript || isAnalyzing}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Brain className="w-4 h-4 mr-2" />
              Analizar con IA
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};