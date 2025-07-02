"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Video, 
  Users, 
  Clock, 
  TrendingUp, 
  FileText, 
  Settings,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Brain,
  BarChart3,
  Download,
  MessageSquare,
  Target,
  Zap,
  Activity,
  Mic,
  Monitor,
  Calendar,
  Archive
} from 'lucide-react';
import HybridAudioTranscription from './HybridAudioTranscription';
import IntelligentSuggestions from './IntelligentSuggestions';
import IntelligentReportGenerator from '../reports/IntelligentReportGenerator';
import RealTimeAnalyzer from '../reports/RealTimeAnalyzer';
import RealTimeNotifications from '../reports/RealTimeNotifications';

interface MeetingStats {
  totalWords: number;
  speakingTime: number;
  questionsAsked: number;
  decisionsCount: number;
  technicalTerms: number;
  engagementScore: number;
}

interface MeetingDashboardProps {
  className?: string;
}

export default function MeetingDashboard({ className = '' }: MeetingDashboardProps) {
  // Core meeting state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [accumulatedTranscript, setAccumulatedTranscript] = useState('');
  const [meetingType, setMeetingType] = useState<'interview' | 'meeting' | 'presentation' | 'standup'>('meeting');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [participants, setParticipants] = useState<string[]>(['Aaron Hernández']);
  const [duration, setDuration] = useState(0);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('transcription');
  const [currentInsight, setCurrentInsight] = useState<any>(null);
  
  // Analytics and stats
  const [meetingStats, setMeetingStats] = useState<MeetingStats>({
    totalWords: 0,
    speakingTime: 0,
    questionsAsked: 0,
    decisionsCount: 0,
    technicalTerms: 0,
    engagementScore: 0
  });

  // Timer references
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Aaron's personalized profile for optimization
  const aaronProfile = {
    name: "Aaron Hernández Jiménez",
    role: "Full Stack Developer & Cloud Solutions Architect",
    company: "Tecnológico de Monterrey",
    expertise: [
      "React", "Next.js", "Node.js", "AWS", "GCP", "Azure", 
      "Docker", "Kubernetes", "AI/ML", "Computer Vision", "TypeScript"
    ],
    focusAreas: [
      "Cloud Architecture", "Scalable Solutions", "DevOps", "AI Implementation",
      "Full-Stack Development", "Technical Leadership"
    ]
  };

  // Calculate advanced analytics
  const calculateMeetingStats = useCallback((text: string): MeetingStats => {
    const words = text.split(' ').filter(word => word.length > 0);
    const totalWords = words.length;
    
    // Count questions
    const questionCount = (text.match(/[¿?]/g) || []).length;
    
    // Count decision keywords
    const decisionKeywords = ['decidir', 'acordar', 'concluir', 'resolver', 'definir'];
    const decisionsCount = decisionKeywords.reduce((count, keyword) => 
      count + (text.toLowerCase().match(new RegExp(keyword, 'g')) || []).length, 0
    );
    
    // Count technical terms from Aaron's expertise
    const technicalTerms = aaronProfile.expertise.reduce((count, tech) => 
      count + (text.toLowerCase().match(new RegExp(tech.toLowerCase(), 'g')) || []).length, 0
    );
    
    // Calculate engagement score (questions asked / total words * 100)
    const engagementScore = totalWords > 0 ? Math.min(100, (questionCount / totalWords) * 1000) : 0;
    
    return {
      totalWords,
      speakingTime: Math.floor(duration / 60), // Convert to minutes
      questionsAsked: questionCount,
      decisionsCount,
      technicalTerms,
      engagementScore: Math.round(engagementScore)
    };
  }, [duration]);

  // Handle transcript updates
  const handleTranscriptUpdate = useCallback((newTranscript: string, isFinal: boolean) => {
    if (isFinal && newTranscript.trim()) {
      setAccumulatedTranscript(prev => {
        const updated = prev + (prev ? ' ' : '') + newTranscript;
        // Update stats when transcript changes
        setMeetingStats(calculateMeetingStats(updated));
        return updated;
      });
    }
    
    // Update interim transcript for real-time display
    setTranscript(newTranscript);
  }, [calculateMeetingStats]);

  // Handle suggestion applications
  const handleSuggestionApplied = useCallback((suggestion: any) => {
    setKeyPoints(prev => [...prev, suggestion.title]);
  }, []);

  // Start meeting timer and recording
  const startMeeting = useCallback(() => {
    setIsRecording(true);
    startTimeRef.current = Date.now();
    
    // Start duration timer
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);

    // Set default meeting title if not set
    if (!meetingTitle) {
      const now = new Date();
      const defaultTitle = `${meetingType === 'interview' ? 'Entrevista' : 'Reunión'} - ${now.toLocaleDateString()}`;
      setMeetingTitle(defaultTitle);
    }
  }, [meetingType, meetingTitle]);

  // End meeting and cleanup
  const endMeeting = useCallback(() => {
    setIsRecording(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    startTimeRef.current = null;
    
    // Calculate final stats
    if (accumulatedTranscript) {
      setMeetingStats(calculateMeetingStats(accumulatedTranscript));
    }
  }, [accumulatedTranscript, calculateMeetingStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Format duration helper
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get meeting type label
  const getMeetingTypeLabel = (type: string) => {
    switch (type) {
      case 'interview': return 'Entrevista Técnica';
      case 'meeting': return 'Reunión de Trabajo';
      case 'presentation': return 'Presentación';
      case 'standup': return 'Daily Standup';
      default: return 'Reunión';
    }
  };

  // Handle new insights from real-time analyzer
  const handleInsightGenerated = useCallback((insight: any) => {
    console.log('🧠 Nuevo insight generado:', insight);
    setCurrentInsight(insight);
    
    // Update key points if it's important
    if (insight.priority === 'high') {
      setKeyPoints(prev => {
        const newPoint = `${insight.type}: ${insight.content}`;
        return [newPoint, ...prev.slice(0, 4)]; // Keep last 5
      });
    }
  }, []);

  // Extract key points from text
  const extractKeyPoints = useCallback((text: string) => {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const importantSentences = sentences.filter(sentence => {
      const lower = sentence.toLowerCase();
      return lower.includes('decidir') || 
             lower.includes('acuerdo') || 
             lower.includes('importante') ||
             lower.includes('clave') ||
             lower.includes('definir');
    });
    
    setKeyPoints(importantSentences.slice(0, 5));
  }, []);

  // Export meeting data
  const exportMeetingData = useCallback(() => {
    const meetingData = {
      title: meetingTitle,
      type: meetingType,
      date: new Date().toISOString(),
      duration: formatDuration(duration),
      participants,
      transcript: accumulatedTranscript,
      stats: meetingStats,
      keyPoints,
      profile: aaronProfile
    };

    const blob = new Blob([JSON.stringify(meetingData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [meetingTitle, meetingType, duration, participants, accumulatedTranscript, meetingStats, keyPoints, formatDuration]);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Meeting Companion
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Asistente inteligente personalizado para {aaronProfile.name}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {aaronProfile.role}
                </Badge>
                <Badge variant="outline" className="text-purple-700 border-purple-300">
                  {getMeetingTypeLabel(meetingType)}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isRecording && (
              <div className="flex items-center gap-3 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-700 font-medium">
                  🔴 EN VIVO • {formatDuration(duration)}
                </span>
              </div>
            )}
            
            <Select value={meetingType} onValueChange={(value: any) => setMeetingType(value)}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Tipo de reunión" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Reunión de trabajo
                  </div>
                </SelectItem>
                <SelectItem value="interview">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Entrevista técnica
                  </div>
                </SelectItem>
                <SelectItem value="presentation">
                  <div className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Presentación
                  </div>
                </SelectItem>
                <SelectItem value="standup">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Daily standup
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {accumulatedTranscript && (
              <Button
                onClick={exportMeetingData}
                variant="outline"
                size="lg"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            )}
            
            <Button
              onClick={isRecording ? endMeeting : startMeeting}
              size="lg"
              className={`px-6 ${
                isRecording 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
              }`}
            >
              {isRecording ? (
                <>
                  <StopCircle className="mr-2 h-5 w-5" />
                  Finalizar Reunión
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-5 w-5" />
                  Iniciar Reunión
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">Estado</CardTitle>
              <Activity className={`h-4 w-4 ${isRecording ? 'text-green-600' : 'text-gray-400'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {isRecording ? 'Activa' : 'Inactiva'}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {isRecording ? 'Grabando y analizando' : 'Lista para iniciar'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Duración</CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{formatDuration(duration)}</div>
              <p className="text-xs text-purple-600 mt-1">
                {meetingStats.speakingTime}min hablando
              </p>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">Palabras</CardTitle>
              <FileText className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                {meetingStats.totalWords}
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                Palabras transcritas
              </p>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-orange-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-700">Engagement</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">
                {meetingStats.engagementScore}%
              </div>
              <p className="text-xs text-orange-600 mt-1">
                {meetingStats.questionsAsked} preguntas
              </p>
            </CardContent>
          </Card>

          <Card className="border-cyan-200 bg-cyan-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-700">Técnico</CardTitle>
              <Zap className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-900">
                {meetingStats.technicalTerms}
              </div>
              <p className="text-xs text-cyan-600 mt-1">
                Términos técnicos
              </p>
            </CardContent>
          </Card>

          <Card className="border-indigo-200 bg-indigo-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">Insights</CardTitle>
              <Brain className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-900">
                {keyPoints.length}
              </div>
              <p className="text-xs text-indigo-600 mt-1">
                Puntos clave
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Dashboard Inteligente</CardTitle>
                <CardDescription>
                  Panel de control completo con IA personalizada para tu perfil técnico
                </CardDescription>
              </div>
              {accumulatedTranscript && (
                <Progress 
                  value={Math.min(100, (meetingStats.totalWords / 1000) * 100)} 
                  className="w-32"
                />
              )}
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="transcription" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Transcripción
                </TabsTrigger>
                <TabsTrigger value="realtime" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Tiempo Real
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Sugerencias
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reportes
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Transcription Tab */}
              <TabsContent value="transcription" className="mt-6">
                <HybridAudioTranscription 
                  onTranscriptUpdate={handleTranscriptUpdate}
                  className="w-full"
                />
              </TabsContent>

              {/* Real-Time Analysis Tab */}
              <TabsContent value="realtime" className="mt-6">
                <div className="space-y-6">
                  <RealTimeAnalyzer
                    transcriptText={accumulatedTranscript}
                    onInsightGenerated={handleInsightGenerated}
                    className="w-full"
                  />
                  <RealTimeNotifications 
                    newInsight={currentInsight}
                    className="w-full"
                  />
                </div>
              </TabsContent>

              {/* Intelligent Suggestions Tab */}
              <TabsContent value="suggestions" className="mt-6">
                <IntelligentSuggestions
                  transcript={accumulatedTranscript}
                  meetingType={meetingType}
                  participants={participants}
                  onSuggestionApplied={handleSuggestionApplied}
                  className="w-full"
                />
              </TabsContent>

              {/* Reports Tab */}
              <TabsContent value="reports" className="mt-6">
                <IntelligentReportGenerator
                  transcriptText={accumulatedTranscript}
                  meetingTitle={meetingTitle}
                  participants={participants}
                  className="w-full"
                />
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics" className="mt-6">
                <div className="space-y-6">
                  {/* Meeting Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        Análisis de Reunión
                      </CardTitle>
                      <CardDescription>
                        Métricas detalladas y análisis de rendimiento
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Participation Metrics */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">Métricas de Participación</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Engagement Score</span>
                                <span>{meetingStats.engagementScore}%</span>
                              </div>
                              <Progress value={meetingStats.engagementScore} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Preguntas por minuto</span>
                                <span>{duration > 0 ? (meetingStats.questionsAsked / (duration / 60)).toFixed(1) : '0'}</span>
                              </div>
                              <Progress 
                                value={Math.min(100, (meetingStats.questionsAsked / Math.max(1, duration / 60)) * 20)} 
                                className="h-2" 
                              />
                            </div>
                          </div>
                        </div>

                        {/* Technical Content */}
                        <div className="space-y-4">
                          <h4 className="font-semibold">Contenido Técnico</h4>
                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Términos Técnicos</span>
                                <span>{meetingStats.technicalTerms}</span>
                              </div>
                              <Progress 
                                value={Math.min(100, (meetingStats.technicalTerms / Math.max(1, meetingStats.totalWords)) * 100)} 
                                className="h-2" 
                              />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Decisiones Tomadas</span>
                                <span>{meetingStats.decisionsCount}</span>
                              </div>
                              <Progress 
                                value={Math.min(100, meetingStats.decisionsCount * 20)} 
                                className="h-2" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Aaron's Technical Profile Analysis */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-purple-600" />
                        Análisis de Perfil Técnico
                      </CardTitle>
                      <CardDescription>
                        Relevancia del contenido con tu experiencia en {aaronProfile.company}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold mb-3">Tu Expertise</h4>
                          <div className="flex flex-wrap gap-2">
                            {aaronProfile.expertise.map((skill) => (
                              <Badge 
                                key={skill} 
                                variant="outline" 
                                className={`text-xs ${
                                  accumulatedTranscript.toLowerCase().includes(skill.toLowerCase())
                                    ? 'bg-green-50 text-green-700 border-green-300'
                                    : 'bg-gray-50 text-gray-600 border-gray-300'
                                }`}
                              >
                                {skill}
                                {accumulatedTranscript.toLowerCase().includes(skill.toLowerCase()) && ' ✓'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-3">Áreas de Enfoque</h4>
                          <div className="space-y-2">
                            {aaronProfile.focusAreas.map((area) => (
                              <div key={area} className="flex items-center justify-between text-sm">
                                <span>{area}</span>
                                <Badge variant={
                                  accumulatedTranscript.toLowerCase().includes(area.toLowerCase()) 
                                    ? 'default' 
                                    : 'secondary'
                                }>
                                  {accumulatedTranscript.toLowerCase().includes(area.toLowerCase()) ? 'Discutido' : 'No mencionado'}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Real-time Statistics */}
                  {accumulatedTranscript && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="h-5 w-5 text-green-600" />
                          Estadísticas en Tiempo Real
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-700">
                              {(meetingStats.totalWords / Math.max(1, duration / 60)).toFixed(0)}
                            </div>
                            <div className="text-xs text-blue-600">Palabras/min</div>
                          </div>
                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-700">
                              {Math.round(meetingStats.engagementScore)}
                            </div>
                            <div className="text-xs text-green-600">Engagement</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-700">
                              {meetingStats.technicalTerms}
                            </div>
                            <div className="text-xs text-purple-600">Términos técnicos</div>
                          </div>
                          <div className="p-3 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-700">
                              {keyPoints.length}
                            </div>
                            <div className="text-xs text-orange-600">Insights generados</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Actions Footer */}
        {accumulatedTranscript && (
          <Card className="border-dashed border-gray-300 bg-gradient-to-r from-gray-50 to-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">Sesión Activa</h3>
                  <p className="text-sm text-gray-600">
                    {meetingStats.totalWords} palabras • {formatDuration(duration)} • {keyPoints.length} insights
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab('reports')}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Ver Reporte
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={exportMeetingData}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Exportar Datos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}