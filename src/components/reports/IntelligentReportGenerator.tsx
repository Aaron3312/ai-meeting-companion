"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Brain, 
  CheckSquare, 
  TrendingUp,
  Download,
  RefreshCw,
  Clock,
  Users,
  Target,
  AlertTriangle,
  Lightbulb,
  Code,
  Database,
  Cloud
} from 'lucide-react';

interface MeetingInsight {
  id: string;
  type: 'decision' | 'action' | 'risk' | 'opportunity' | 'technical' | 'business';
  content: string;
  confidence: number;
  timestamp: Date;
  participants?: string[];
  priority: 'high' | 'medium' | 'low';
}

interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'high' | 'medium' | 'low';
  context: string;
}

interface TechnicalDiscussion {
  id: string;
  technology: string;
  topic: string;
  decision?: string;
  pros: string[];
  cons: string[];
  nextSteps: string[];
}

interface MeetingReport {
  id: string;
  title: string;
  date: Date;
  duration: string;
  participants: string[];
  summary: string;
  keyDecisions: string[];
  actionItems: ActionItem[];
  technicalDiscussions: TechnicalDiscussion[];
  insights: MeetingInsight[];
  nextMeeting?: {
    date: string;
    agenda: string[];
  };
}

interface IntelligentReportGeneratorProps {
  transcriptText: string;
  meetingTitle?: string;
  participants?: string[];
  className?: string;
}

export default function IntelligentReportGenerator({ 
  transcriptText, 
  meetingTitle = "Reunión sin título",
  participants = ["Aaron Hernández"],
  className = '' 
}: IntelligentReportGeneratorProps) {
  const [report, setReport] = useState<MeetingReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Aaron's profile context for personalized analysis
  const aaronProfile = {
    role: "Full Stack Developer & Cloud Solutions Architect",
    expertise: ["React", "Next.js", "Node.js", "AWS", "GCP", "Azure", "Docker", "Kubernetes", "AI/ML", "Computer Vision"],
    company: "Tecnológico de Monterrey",
    focus: ["Cloud Architecture", "Scalable Solutions", "DevOps", "AI Implementation"]
  };

  // Análisis inteligente de transcripción
  const analyzeTranscript = useCallback(async (transcript: string): Promise<MeetingReport> => {
    setIsAnalyzing(true);
    
    try {
      console.log('🧠 Iniciando análisis inteligente de transcripción...');
      
      // Simulated AI analysis - En producción usarías OpenAI/Claude API
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simular procesamiento
      
      // Extraer insights basados en el perfil de Aaron
      const insights: MeetingInsight[] = [
        {
          id: 'insight-1',
          type: 'technical',
          content: 'Se discutió migración a microservicios con Docker y Kubernetes',
          confidence: 0.9,
          timestamp: new Date(),
          priority: 'high'
        },
        {
          id: 'insight-2',
          type: 'decision',
          content: 'Decidido usar Next.js 14 con App Router para el nuevo proyecto',
          confidence: 0.85,
          timestamp: new Date(),
          priority: 'high'
        },
        {
          id: 'insight-3',
          type: 'opportunity',
          content: 'Oportunidad de implementar AI/ML para análisis predictivo',
          confidence: 0.75,
          timestamp: new Date(),
          priority: 'medium'
        }
      ];

      const actionItems: ActionItem[] = [
        {
          id: 'action-1',
          task: 'Crear arquitectura de microservicios para el proyecto',
          assignee: 'Aaron Hernández',
          deadline: '2025-07-15',
          status: 'pending',
          priority: 'high',
          context: 'Definir estructura de servicios y comunicación entre componentes'
        },
        {
          id: 'action-2',
          task: 'Evaluar opciones de deployment en AWS/GCP',
          assignee: 'Aaron Hernández',
          deadline: '2025-07-10',
          status: 'pending',
          priority: 'medium',
          context: 'Comparar costos y features de diferentes cloud providers'
        }
      ];

      const technicalDiscussions: TechnicalDiscussion[] = [
        {
          id: 'tech-1',
          technology: 'Next.js 14',
          topic: 'Migración de Pages Router a App Router',
          decision: 'Usar App Router para mejores performance y SEO',
          pros: ['Mejor SEO', 'Server Components', 'Streaming'],
          cons: ['Curva de aprendizaje', 'Algunos packages no compatibles'],
          nextSteps: ['Crear POC', 'Migrar componentes críticos', 'Testing completo']
        },
        {
          id: 'tech-2',
          technology: 'Kubernetes',
          topic: 'Orquestación de contenedores',
          decision: 'Implementar K8s para escalabilidad',
          pros: ['Auto-scaling', 'Load balancing', 'Self-healing'],
          cons: ['Complejidad inicial', 'Overhead de recursos'],
          nextSteps: ['Setup cluster', 'Definir manifests', 'CI/CD pipeline']
        }
      ];

      const report: MeetingReport = {
        id: `report-${Date.now()}`,
        title: meetingTitle,
        date: new Date(),
        duration: '45 minutos',
        participants,
        summary: `Reunión enfocada en arquitectura técnica y decisiones de implementación. Se discutieron temas clave de migración a microservicios, adopción de Next.js 14, y estrategias de deployment en cloud. Aaron lideró las discusiones técnicas basado en su experiencia en ${aaronProfile.company}.`,
        keyDecisions: [
          'Adoptar Next.js 14 con App Router para el proyecto principal',
          'Migrar a arquitectura de microservicios con Docker/Kubernetes',
          'Evaluar AWS vs GCP para hosting y servicios cloud',
          'Implementar CI/CD pipeline con automated testing'
        ],
        actionItems,
        technicalDiscussions,
        insights,
        nextMeeting: {
          date: '2025-07-08',
          agenda: [
            'Review de arquitectura propuesta',
            'Demo de POC con Next.js 14',
            'Decisión final sobre cloud provider',
            'Timeline y recursos para migración'
          ]
        }
      };

      return report;
      
    } catch (err) {
      console.error('💥 Error en análisis:', err);
      throw new Error('Error generando análisis inteligente');
    } finally {
      setIsAnalyzing(false);
    }
  }, [meetingTitle, participants]);

  // Generar reporte completo
  const generateReport = useCallback(async () => {
    if (!transcriptText.trim()) {
      setError('No hay transcripción disponible para analizar');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      console.log('📊 Generando reporte inteligente...');
      const analyzedReport = await analyzeTranscript(transcriptText);
      setReport(analyzedReport);
      console.log('✅ Reporte generado exitosamente');
    } catch (err) {
      console.error('💥 Error generando reporte:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsGenerating(false);
    }
  }, [transcriptText, analyzeTranscript]);

  // Exportar reporte
  const exportReport = useCallback(() => {
    if (!report) return;

    const reportData = {
      ...report,
      generatedBy: 'AI Meeting Companion',
      generatedFor: aaronProfile,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-report-${report.date.toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  const getInsightIcon = (type: MeetingInsight['type']) => {
    switch (type) {
      case 'technical': return <Code className="h-4 w-4" />;
      case 'decision': return <CheckSquare className="h-4 w-4" />;
      case 'opportunity': return <Lightbulb className="h-4 w-4" />;
      case 'risk': return <AlertTriangle className="h-4 w-4" />;
      case 'business': return <TrendingUp className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: MeetingInsight['type']) => {
    switch (type) {
      case 'technical': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'decision': return 'bg-green-50 text-green-700 border-green-200';
      case 'opportunity': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'risk': return 'bg-red-50 text-red-700 border-red-200';
      case 'business': return 'bg-purple-50 text-purple-700 border-purple-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Reportes Inteligentes
              </CardTitle>
              <CardDescription>
                Análisis automático de reuniones con insights personalizados para {aaronProfile.role}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {report && (
                <Button
                  onClick={exportReport}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </Button>
              )}
              <Button
                onClick={generateReport}
                disabled={isGenerating || !transcriptText.trim()}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                {isGenerating ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Estado y estadísticas */}
        {transcriptText && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-700">{transcriptText.split(' ').length}</div>
                <div className="text-blue-600">Palabras</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="font-semibold text-green-700">{Math.ceil(transcriptText.length / 1000)}</div>
                <div className="text-green-600">Minutos Est.</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-700">{participants.length}</div>
                <div className="text-purple-600">Participantes</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="font-semibold text-orange-700">{report?.insights.length || 0}</div>
                <div className="text-orange-600">Insights</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Error display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Reporte generado */}
      {report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {report.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {report.date.toLocaleDateString()} - {report.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {report.participants.join(', ')}
              </span>
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="summary">Resumen</TabsTrigger>
                <TabsTrigger value="actions">Acciones</TabsTrigger>
                <TabsTrigger value="technical">Técnico</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="next">Próximos Pasos</TabsTrigger>
              </TabsList>

              {/* Resumen Ejecutivo */}
              <TabsContent value="summary" className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Resumen Ejecutivo</h3>
                  <p className="text-gray-700 mb-4">{report.summary}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Decisiones Clave</h3>
                  <ul className="space-y-2">
                    {report.keyDecisions.map((decision, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckSquare className="h-4 w-4 text-green-600 mt-0.5" />
                        <span className="text-gray-700">{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </TabsContent>

              {/* Action Items */}
              <TabsContent value="actions" className="space-y-4">
                <div className="space-y-3">
                  {report.actionItems.map((action) => (
                    <div key={action.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{action.task}</h4>
                        <Badge variant="outline" className={getPriorityColor(action.priority)}>
                          {action.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Asignado a:</strong> {action.assignee}</p>
                        {action.deadline && (
                          <p><strong>Fecha límite:</strong> {action.deadline}</p>
                        )}
                        <p><strong>Contexto:</strong> {action.context}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Discusiones Técnicas */}
              <TabsContent value="technical" className="space-y-4">
                <div className="space-y-4">
                  {report.technicalDiscussions.map((tech) => (
                    <div key={tech.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Code className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">{tech.technology}</h4>
                        <Badge variant="outline">{tech.topic}</Badge>
                      </div>
                      
                      {tech.decision && (
                        <div className="mb-3 p-3 bg-green-50 rounded border border-green-200">
                          <strong className="text-green-800">Decisión:</strong>
                          <p className="text-green-700 mt-1">{tech.decision}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <strong className="text-green-600">Pros:</strong>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {tech.pros.map((pro, index) => (
                              <li key={index}>{pro}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <strong className="text-red-600">Cons:</strong>
                          <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                            {tech.cons.map((con, index) => (
                              <li key={index}>{con}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <strong className="text-blue-600">Próximos Pasos:</strong>
                        <ul className="list-disc list-inside text-sm text-gray-600 mt-1">
                          {tech.nextSteps.map((step, index) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Insights */}
              <TabsContent value="insights" className="space-y-4">
                <div className="space-y-3">
                  {report.insights.map((insight) => (
                    <div key={insight.id} className={`border rounded-lg p-4 ${getInsightColor(insight.type)}`}>
                      <div className="flex items-start gap-3">
                        {getInsightIcon(insight.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {insight.type}
                            </Badge>
                            <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                              {insight.priority}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              Confianza: {(insight.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                          <p className="text-sm">{insight.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Próximos Pasos */}
              <TabsContent value="next" className="space-y-4">
                {report.nextMeeting && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Próxima Reunión - {report.nextMeeting.date}
                    </h4>
                    <div>
                      <strong>Agenda:</strong>
                      <ul className="list-disc list-inside text-sm text-gray-600 mt-2 space-y-1">
                        {report.nextMeeting.agenda.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">Recomendaciones para Aaron</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <p>• <strong>Prioridad técnica:</strong> Comenzar con el POC de Next.js 14 para validar la migración</p>
                    <p>• <strong>Arquitectura:</strong> Definir los boundaries de microservicios antes del desarrollo</p>
                    <p>• <strong>Cloud Strategy:</strong> Crear matriz de comparación AWS vs GCP con métricas específicas</p>
                    <p>• <strong>Timeline:</strong> Establecer milestones claros para la migración en fases</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Placeholder cuando no hay transcripción */}
      {!transcriptText.trim() && !report && (
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">No hay transcripción disponible</p>
              <p className="text-sm text-gray-400">
                Inicia una grabación para generar reportes inteligentes
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}