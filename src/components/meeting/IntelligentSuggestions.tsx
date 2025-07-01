"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  MessageSquare, 
  Target, 
  Clock, 
  TrendingUp, 
  Users, 
  Briefcase,
  Code,
  Cloud,
  Sparkles,
  ChevronRight,
  Lightbulb
} from 'lucide-react';

interface Suggestion {
  id: string;
  type: 'question' | 'insight' | 'action' | 'technical';
  category: 'meeting' | 'interview' | 'technical' | 'leadership';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  timestamp: Date;
  context?: string;
}

interface IntelligentSuggestionsProps {
  transcript: string;
  meetingType: 'interview' | 'meeting' | 'presentation' | 'standup';
  participants?: string[];
  onSuggestionApplied?: (suggestion: Suggestion) => void;
  className?: string;
}

export default function IntelligentSuggestions({
  transcript,
  meetingType,
  participants = [],
  onSuggestionApplied,
  className = ''
}: IntelligentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Aaron's profile-based personalization
  const aaronProfile = {
    name: "Aaron Hernández Jiménez",
    role: "Full Stack Developer & Cloud Solutions Architect",
    expertise: [
      "React", "Next.js", "Node.js", "AWS", "GCP", "Azure", 
      "Docker", "Kubernetes", "AI/ML", "Computer Vision", "TypeScript"
    ],
    projects: [
      "Cronos Project (AI-powered project management)",
      "Security Multi-Agent System",
      "JAI-VIER Task Management"
    ],
    interests: ["Cloud Architecture", "AI/ML Integration", "DevOps", "Full-Stack Development"]
  };

  const generateSmartSuggestions = useCallback(async (text: string) => {
    if (!text.trim() || text.length < 50) return;
    
    setIsAnalyzing(true);
    
    try {
      // Simulate AI analysis - replace with actual OpenAI API call
      const contextualSuggestions: Suggestion[] = [];
      
      // Technical interview suggestions
      if (meetingType === 'interview') {
        if (text.toLowerCase().includes('react') || text.toLowerCase().includes('frontend')) {
          contextualSuggestions.push({
            id: `tech-${Date.now()}`,
            type: 'question',
            category: 'technical',
            title: 'Profundizar en React/Next.js',
            content: `Basado en tu experiencia con Next.js y el proyecto Cronos, podrías preguntar: "¿Cómo manejarían la hidratación del lado del servidor en una aplicación Next.js con estado global complejo?"`,
            priority: 'high',
            timestamp: new Date(),
            context: 'Frontend development discussion detected'
          });
        }
        
        if (text.toLowerCase().includes('cloud') || text.toLowerCase().includes('aws')) {
          contextualSuggestions.push({
            id: `cloud-${Date.now()}`,
            type: 'question',
            category: 'technical',
            title: 'Arquitectura Cloud',
            content: `Conecta con tu experiencia en AWS/GCP/Azure: "¿Cómo diseñarían una arquitectura de microservicios escalable usando contenedores? ¿Qué patrones de comunicación utilizarían?"`,
            priority: 'high',
            timestamp: new Date(),
            context: 'Cloud architecture discussion'
          });
        }
      }
      
      // Meeting suggestions
      if (meetingType === 'meeting') {
        if (text.toLowerCase().includes('proyecto') || text.toLowerCase().includes('deadline')) {
          contextualSuggestions.push({
            id: `pm-${Date.now()}`,
            type: 'action',
            category: 'leadership',
            title: 'Gestión de Proyecto',
            content: `Basado en tu experiencia con Cronos Project, sugiere: "Podríamos implementar un sistema de tracking automatizado para convertir estas discusiones en tareas accionables, similar a como funciona la IA en gestión de proyectos."`,
            priority: 'medium',
            timestamp: new Date(),
            context: 'Project management discussion'
          });
        }
      }
      
      // AI/ML related suggestions
      if (text.toLowerCase().includes('inteligencia artificial') || text.toLowerCase().includes('machine learning')) {
        contextualSuggestions.push({
          id: `ai-${Date.now()}`,
          type: 'insight',
          category: 'technical',
          title: 'Aplicación de IA',
          content: `Conecta con tu experiencia en Computer Vision/YOLOv5: "Considerando los avances en ML, ¿cómo podríamos implementar un sistema de reconocimiento en tiempo real similar a lo que hicimos con YOLOv5?"`,
          priority: 'high',
          timestamp: new Date(),
          context: 'AI/ML discussion detected'
        });
      }
      
      // General professional suggestions based on conversation patterns
      const words = text.toLowerCase().split(' ');
      const questionWords = ['qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'cuál'];
      const hasQuestions = questionWords.some(word => words.includes(word));
      
      if (!hasQuestions && text.length > 100) {
        contextualSuggestions.push({
          id: `engage-${Date.now()}`,
          type: 'question',
          category: 'meeting',
          title: 'Fomentar Participación',
          content: `Para mantener el engagement: "¿Qué opinan sobre esto?" o "¿Alguien ha tenido experiencia similar?" o "¿Cómo lo implementarían en sus proyectos?"`,
          priority: 'medium',
          timestamp: new Date(),
          context: 'Low engagement detected'
        });
      }
      
      setSuggestions(prev => [...prev, ...contextualSuggestions].slice(-10)); // Keep last 10
      
    } catch (error) {
      console.error('Error generating suggestions:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [meetingType]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      generateSmartSuggestions(transcript);
    }, 2000); // Wait 2 seconds after transcript changes
    
    return () => clearTimeout(timeoutId);
  }, [transcript, generateSmartSuggestions]);

  const applySuggestion = (suggestion: Suggestion) => {
    onSuggestionApplied?.(suggestion);
    // Remove applied suggestion
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const filteredSuggestions = suggestions.filter(s => 
    activeTab === 'all' || s.category === activeTab
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question': return <MessageSquare className="h-4 w-4" />;
      case 'insight': return <Lightbulb className="h-4 w-4" />;
      case 'action': return <Target className="h-4 w-4" />;
      case 'technical': return <Code className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            <div>
              <CardTitle>Sugerencias Inteligentes</CardTitle>
              <CardDescription>
                IA personalizada para {aaronProfile.name} • {meetingType === 'interview' ? 'Entrevista' : 'Reunión'}
              </CardDescription>
            </div>
          </div>
          {isAnalyzing && (
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
              <Badge variant="outline" className="text-purple-600 border-purple-200">
                Analizando...
              </Badge>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todo</TabsTrigger>
            <TabsTrigger value="technical">Técnico</TabsTrigger>
            <TabsTrigger value="interview">Entrevista</TabsTrigger>
            <TabsTrigger value="meeting">Reunión</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-96">
              <div className="space-y-3">
                {filteredSuggestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                      {isAnalyzing 
                        ? "Analizando la conversación..." 
                        : "Habla para recibir sugerencias inteligentes basadas en tu perfil profesional"
                      }
                    </p>
                  </div>
                ) : (
                  filteredSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(suggestion.type)}
                          <h4 className="font-medium text-sm">{suggestion.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(suggestion.priority)}`}
                          >
                            {suggestion.priority}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {suggestion.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                        {suggestion.content}
                      </p>
                      
                      {suggestion.context && (
                        <p className="text-xs text-blue-600 mb-3 italic">
                          Contexto: {suggestion.context}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.category}
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => applySuggestion(suggestion)}
                          className="h-7 text-xs"
                        >
                          Aplicar
                          <ChevronRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
        
        {/* Aaron's expertise highlight */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Tu Experiencia Clave</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {aaronProfile.expertise.slice(0, 6).map((skill) => (
              <Badge key={skill} variant="outline" className="text-xs text-blue-700 border-blue-300">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}