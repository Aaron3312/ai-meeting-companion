"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  CheckSquare, 
  Lightbulb, 
  AlertTriangle,
  TrendingUp,
  Code,
  Users,
  Clock,
  Zap,
  Target,
  Bell,
  Copy
} from 'lucide-react';

interface RealTimeInsight {
  id: string;
  type: 'decision' | 'action' | 'opportunity' | 'risk' | 'technical' | 'question' | 'keyword';
  content: string;
  confidence: number;
  timestamp: Date;
  context: string;
  priority: 'high' | 'medium' | 'low';
  suggestedAction?: string;
}

interface KeywordMatch {
  keyword: string;
  context: string;
  count: number;
  category: 'technology' | 'methodology' | 'business' | 'cloud' | 'ai';
}

interface RealTimeAnalyzerProps {
  transcriptText: string;
  onInsightGenerated?: (insight: RealTimeInsight) => void;
  className?: string;
}

export default function RealTimeAnalyzer({ 
  transcriptText, 
  onInsightGenerated,
  className = '' 
}: RealTimeAnalyzerProps) {
  const [insights, setInsights] = useState<RealTimeInsight[]>([]);
  const [keywordMatches, setKeywordMatches] = useState<KeywordMatch[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalyzedLength, setLastAnalyzedLength] = useState(0);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Aaron's expertise keywords para detección en tiempo real
  const expertiseKeywords = {
    technology: [
      'react', 'next.js', 'nextjs', 'node.js', 'nodejs', 'typescript', 'javascript',
      'docker', 'kubernetes', 'k8s', 'microservicios', 'api', 'rest', 'graphql'
    ],
    cloud: [
      'aws', 'amazon', 'gcp', 'google cloud', 'azure', 'microsoft', 'lambda',
      's3', 'ec2', 'cloudformation', 'terraform', 'serverless'
    ],
    ai: [
      'machine learning', 'ml', 'ai', 'artificial intelligence', 'neural network',
      'tensorflow', 'pytorch', 'whisper', 'gpt', 'llm', 'computer vision'
    ],
    methodology: [
      'agile', 'scrum', 'devops', 'ci/cd', 'testing', 'unit test', 'integration',
      'deployment', 'monitoring', 'scalability', 'performance'
    ],
    business: [
      'architecture', 'solution', 'technical lead', 'full stack', 'monterrey',
      'tecnológico', 'proyecto', 'requirements', 'stakeholder'
    ]
  };

  // Patrones para detectar insights específicos
  const insightPatterns = {
    decisions: [
      /vamos a (usar|implementar|adoptar|elegir|decidir)/i,
      /decidimos que/i,
      /la decisión es/i,
      /optamos por/i,
      /hemos elegido/i
    ],
    actions: [
      /necesito (hacer|crear|desarrollar|implementar)/i,
      /voy a (trabajar|hacer|crear|desarrollar)/i,
      /tenemos que (hacer|crear|implementar)/i,
      /el siguiente paso es/i,
      /action item/i
    ],
    opportunities: [
      /podríamos (mejorar|optimizar|implementar)/i,
      /oportunidad de/i,
      /sería bueno (agregar|incluir)/i,
      /podemos aprovechar/i
    ],
    risks: [
      /problema con/i,
      /riesgo de/i,
      /preocupa que/i,
      /podría fallar/i,
      /challenge/i,
      /dificultad/i
    ],
    questions: [
      /¿.*\?/,
      /pregunta sobre/i,
      /no estoy seguro/i,
      /cómo podemos/i
    ]
  };

  // Analizar texto en tiempo real
  const analyzeText = useCallback((text: string) => {
    if (!text || text.length <= lastAnalyzedLength) return;

    const newText = text.slice(lastAnalyzedLength);
    const sentences = newText.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();
      if (trimmedSentence.length < 10) return;

      // Detectar keywords de expertise
      Object.entries(expertiseKeywords).forEach(([category, keywords]) => {
        keywords.forEach(keyword => {
          if (trimmedSentence.toLowerCase().includes(keyword.toLowerCase())) {
            setKeywordMatches(prev => {
              const existing = prev.find(k => k.keyword === keyword);
              if (existing) {
                return prev.map(k => k.keyword === keyword 
                  ? { ...k, count: k.count + 1, context: trimmedSentence }
                  : k
                );
              } else {
                return [...prev, {
                  keyword,
                  context: trimmedSentence,
                  count: 1,
                  category: category as KeywordMatch['category']
                }];
              }
            });
          }
        });
      });

      // Detectar insights específicos
      Object.entries(insightPatterns).forEach(([type, patterns]) => {
        patterns.forEach(pattern => {
          if (pattern.test(trimmedSentence)) {
            const insight: RealTimeInsight = {
              id: `${type}-${Date.now()}-${index}`,
              type: type as RealTimeInsight['type'],
              content: trimmedSentence,
              confidence: 0.8,
              timestamp: new Date(),
              context: trimmedSentence,
              priority: type === 'decisions' || type === 'actions' ? 'high' : 'medium',
              suggestedAction: getSuggestedAction(type, trimmedSentence)
            };

            setInsights(prev => {
              // Evitar duplicados
              const exists = prev.some(i => 
                i.type === insight.type && 
                i.content.toLowerCase().includes(insight.content.toLowerCase().slice(0, 20))
              );
              if (!exists) {
                onInsightGenerated?.(insight);
                return [insight, ...prev].slice(0, 20); // Mantener solo los últimos 20
              }
              return prev;
            });
          }
        });
      });
    });

    setLastAnalyzedLength(text.length);
  }, [lastAnalyzedLength, onInsightGenerated]);

  // Sugerir acciones basadas en el tipo de insight
  const getSuggestedAction = (type: string, content: string): string => {
    switch (type) {
      case 'decisions':
        return 'Documentar esta decisión y sus razones';
      case 'actions':
        return 'Crear ticket/tarea con deadline específico';
      case 'opportunities':
        return 'Evaluar ROI y priorizar para roadmap';
      case 'risks':
        return 'Crear plan de mitigación y contingencia';
      case 'questions':
        return 'Agendar follow-up para resolver dudas';
      default:
        return 'Revisar y categorizar para próximos pasos';
    }
  };

  // Análisis automático con debounce
  useEffect(() => {
    if (!transcriptText) return;

    setIsAnalyzing(true);
    
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    analysisTimeoutRef.current = setTimeout(() => {
      analyzeText(transcriptText);
      setIsAnalyzing(false);
    }, 1000); // Analizar 1 segundo después de que pare de hablar

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [transcriptText, analyzeText]);

  const getInsightIcon = (type: RealTimeInsight['type']) => {
    switch (type) {
      case 'decision': return <CheckSquare className="h-4 w-4" />;
      case 'action': return <Target className="h-4 w-4" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'technical': return <Code className="h-4 w-4" />;
      case 'question': return <Brain className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: RealTimeInsight['type']) => {
    switch (type) {
      case 'decision': return 'bg-green-50 text-green-700 border-green-200';
      case 'action': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'opportunity': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'risk': return 'bg-red-50 text-red-700 border-red-200';
      case 'technical': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'question': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: RealTimeInsight['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  const getCategoryIcon = (category: KeywordMatch['category']) => {
    switch (category) {
      case 'technology': return <Code className="h-3 w-3" />;
      case 'cloud': return <TrendingUp className="h-3 w-3" />;
      case 'ai': return <Brain className="h-3 w-3" />;
      case 'methodology': return <Target className="h-3 w-3" />;
      case 'business': return <Users className="h-3 w-3" />;
    }
  };

  const copyInsight = (insight: RealTimeInsight) => {
    const text = `${insight.type.toUpperCase()}: ${insight.content}\nAcción sugerida: ${insight.suggestedAction}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header con estadísticas en tiempo real */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="relative">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Insights Detectados</p>
                <p className="text-2xl font-bold text-blue-600">{insights.length}</p>
              </div>
              <Brain className="h-8 w-8 text-blue-600" />
            </div>
            {isAnalyzing && (
              <div className="absolute top-2 right-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Keywords Técnicos</p>
                <p className="text-2xl font-bold text-purple-600">{keywordMatches.length}</p>
              </div>
              <Code className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acciones Pendientes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {insights.filter(i => i.type === 'action').length}
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Decisiones</p>
                <p className="text-2xl font-bold text-green-600">
                  {insights.filter(i => i.type === 'decision').length}
                </p>
              </div>
              <CheckSquare className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Insights en tiempo real */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-600" />
                  Insights en Tiempo Real
                </CardTitle>
                <CardDescription>
                  Detección automática mientras hablas
                </CardDescription>
              </div>
              {isAnalyzing && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  <Zap className="h-3 w-3 mr-1" />
                  Analizando...
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-3">
                {insights.length > 0 ? (
                  insights.map((insight) => (
                    <div key={insight.id} className={`border rounded-lg p-3 ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getInsightIcon(insight.type)}
                          <Badge variant="outline" className="text-xs">
                            {insight.type}
                          </Badge>
                          <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                            {insight.priority}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">
                            {insight.timestamp.toLocaleTimeString()}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={() => copyInsight(insight)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className="text-sm mb-2">{insight.content}</p>
                      
                      {insight.suggestedAction && (
                        <div className="bg-white/50 rounded p-2 mt-2">
                          <p className="text-xs font-medium">Acción sugerida:</p>
                          <p className="text-xs text-gray-600">{insight.suggestedAction}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Los insights aparecerán automáticamente mientras hablas
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Keywords detectados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-purple-600" />
              Keywords de Expertise
            </CardTitle>
            <CardDescription>
              Términos técnicos detectados en tiempo real
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {keywordMatches.length > 0 ? (
                  keywordMatches
                    .sort((a, b) => b.count - a.count)
                    .map((match) => (
                      <div key={match.keyword} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(match.category)}
                          <span className="font-medium text-sm">{match.keyword}</span>
                          <Badge variant="outline" className="text-xs">
                            {match.category}
                          </Badge>
                        </div>
                        <Badge variant="secondary">
                          {match.count}x
                        </Badge>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8">
                    <Code className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      Keywords técnicos aparecerán aquí
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}