"use client";

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Video, 
  Users, 
  Clock, 
  TrendingUp, 
  FileText, 
  Settings,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import HybridAudioTranscription from './HybridAudioTranscription';
import IntelligentSuggestions from './IntelligentSuggestions';

interface MeetingDashboardProps {
  className?: string;
}

export default function MeetingDashboard({ className = '' }: MeetingDashboardProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [meetingType, setMeetingType] = useState<'interview' | 'meeting' | 'presentation' | 'standup'>('meeting');
  const [meetingTitle, setMeetingTitle] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [duration, setDuration] = useState(0);
  const [keyPoints, setKeyPoints] = useState<string[]>([]);

  const handleTranscriptUpdate = useCallback((newTranscript: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(prev => prev + ' ' + newTranscript);
    }
  }, []);

  const handleSuggestionApplied = useCallback((suggestion: any) => {
    // Add to key points or take action based on suggestion
    setKeyPoints(prev => [...prev, suggestion.title]);
  }, []);

  const startMeeting = () => {
    setIsRecording(true);
    // Start timer
    const startTime = Date.now();
    const interval = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  };

  const endMeeting = () => {
    setIsRecording(false);
    // Save meeting data, generate summary, etc.
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6 ${className}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              AI Meeting Companion
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              Asistente inteligente para Aaron Hernández
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            {isRecording && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-red-600 font-medium">
                  En vivo • {formatDuration(duration)}
                </span>
              </div>
            )}
            
            <Select value={meetingType} onValueChange={(value: any) => setMeetingType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de reunión" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="meeting">Reunión de trabajo</SelectItem>
                <SelectItem value="interview">Entrevista técnica</SelectItem>
                <SelectItem value="presentation">Presentación</SelectItem>
                <SelectItem value="standup">Daily standup</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              onClick={isRecording ? endMeeting : startMeeting}
              size="lg"
              className={isRecording ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
            >
              {isRecording ? (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Finalizar
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Iniciar Reunión
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estado</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isRecording ? 'Activa' : 'Inactiva'}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRecording ? 'Grabando y analizando' : 'Reunión no iniciada'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Duración</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatDuration(duration)}</div>
              <p className="text-xs text-muted-foreground">
                Tiempo transcurrido
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Palabras</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {transcript.split(' ').filter(word => word.length > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Palabras transcritas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sugerencias</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keyPoints.length}</div>
              <p className="text-xs text-muted-foreground">
                Puntos clave identificados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Hybrid Audio Transcription */}
          <div className="space-y-6">
            <HybridAudioTranscription 
              onTranscriptUpdate={handleTranscriptUpdate}
            />
          </div>

          {/* Right Column - AI Suggestions */}
          <div className="space-y-6">
            <IntelligentSuggestions
              transcript={transcript}
              meetingType={meetingType}
              participants={participants}
              onSuggestionApplied={handleSuggestionApplied}
            />
          </div>
        </div>

        {/* Meeting Summary */}
        {transcript && (
          <Card>
            <CardHeader>
              <CardTitle>Resumen de la Reunión</CardTitle>
              <CardDescription>
                Información clave extraída automáticamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="transcript" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="transcript">Transcripción</TabsTrigger>
                  <TabsTrigger value="keypoints">Puntos Clave</TabsTrigger>
                  <TabsTrigger value="actions">Acciones</TabsTrigger>
                </TabsList>
                
                <TabsContent value="transcript" className="mt-4">
                  <div className="max-h-64 overflow-y-auto p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {transcript || 'La transcripción aparecerá aquí...'}
                    </p>
                  </div>
                </TabsContent>
                
                <TabsContent value="keypoints" className="mt-4">
                  <div className="space-y-2">
                    {keyPoints.length > 0 ? (
                      keyPoints.map((point, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <span className="text-sm">{point}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        Los puntos clave se generarán automáticamente durante la reunión
                      </p>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="mt-4">
                  <p className="text-sm text-gray-500">
                    Las acciones sugeridas aparecerán basadas en el análisis de la conversación
                  </p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}