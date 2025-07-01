"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Mic, 
  MicOff, 
  Monitor, 
  RotateCcw, 
  Copy, 
  Settings,
  Volume2,
  Wifi,
  Zap
} from 'lucide-react';
import { useAdvancedSpeechRecognition } from '@/hooks/useAdvancedSpeechRecognition';
import { useSystemAudioSpeechRecognition } from '@/hooks/useSystemAudioSpeechRecognition';

interface TranscriptEntry {
  id: string;
  text: string;
  source: 'microphone' | 'system';
  timestamp: Date;
  confidence?: number;
}

interface HybridAudioTranscriptionProps {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  className?: string;
}

export default function HybridAudioTranscription({ 
  onTranscriptUpdate, 
  className = '' 
}: HybridAudioTranscriptionProps) {
  const [transcriptEntries, setTranscriptEntries] = useState<TranscriptEntry[]>([]);
  const [activeSource, setActiveSource] = useState<'microphone' | 'system' | 'both'>('both');
  const [isRecording, setIsRecording] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Evitar problemas de hidratación
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Hook para reconocimiento de micrófono
  const {
    isListening: micListening,
    transcript: micTranscript,
    interimTranscript: micInterim,
    error: micError,
    confidence: micConfidence,
    startListening: startMic,
    stopListening: stopMic,
    resetTranscript: resetMic
  } = useAdvancedSpeechRecognition({
    continuous: true,
    interimResults: true,
    lang: 'es-ES',
    onTranscript: useCallback((text: string, isFinal: boolean) => {
      if (isFinal && text.trim()) {
        const entry: TranscriptEntry = {
          id: `mic-${Date.now()}`,
          text: text.trim(),
          source: 'microphone',
          timestamp: new Date(),
          confidence: 0.8 // Usamos un valor por defecto, se actualizará después
        };
        setTranscriptEntries(prev => [...prev, entry]);
        onTranscriptUpdate?.(text, true);
      }
    }, [onTranscriptUpdate]),
    onError: useCallback((error: string) => {
      if (error !== 'no-speech') {
        console.error('Microphone error:', error);
      }
    }, [])
  });

  // Hook para reconocimiento de audio del sistema
  const {
    isRecording: systemRecording,
    transcript: systemTranscript,
    error: systemError,
    startRecording: startSystem,
    stopRecording: stopSystem,
    resetTranscript: resetSystem
  } = useSystemAudioSpeechRecognition({
    lang: 'es-ES',
    onTranscript: useCallback((text: string, isFinal: boolean) => {
      if (isFinal && text.trim()) {
        const entry: TranscriptEntry = {
          id: `sys-${Date.now()}`,
          text: text.trim(),
          source: 'system',
          timestamp: new Date()
        };
        setTranscriptEntries(prev => [...prev, entry]);
        onTranscriptUpdate?.(text, true);
      }
    }, [onTranscriptUpdate]),
    onError: useCallback((error: string) => {
      console.error('System audio error:', error);
    }, [])
  });

  // Control unificado de grabación
  const toggleRecording = useCallback(async () => {
    console.log('🎛️ Toggle recording clicked:', { isRecording, activeSource });
    
    if (isRecording) {
      console.log('🛑 Deteniendo grabación...');
      stopMic();
      stopSystem();
      setIsRecording(false);
    } else {
      console.log('▶️ Iniciando grabación con fuente:', activeSource);
      setIsRecording(true);
      
      if (activeSource === 'microphone' || activeSource === 'both') {
        console.log('🎤 Iniciando micrófono...');
        startMic();
      }
      
      if (activeSource === 'system' || activeSource === 'both') {
        console.log('🖥️ Iniciando captura de sistema...');
        try {
          await startSystem();
          console.log('✅ Sistema de audio iniciado exitosamente');
        } catch (error) {
          console.error('❌ Error iniciando sistema de audio:', error);
        }
      }
    }
  }, [isRecording, activeSource, startMic, stopMic, startSystem, stopSystem]);

  // Reset todo
  const resetAll = useCallback(() => {
    resetMic();
    resetSystem();
    setTranscriptEntries([]);
  }, [resetMic, resetSystem]);

  // Copiar transcripción completa
  const copyAll = useCallback(() => {
    const allText = transcriptEntries
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(entry => `[${entry.source === 'microphone' ? 'MIC' : 'SYS'}] ${entry.text}`)
      .join('\n');
    navigator.clipboard.writeText(allText);
  }, [transcriptEntries]);

  // Actualizar estado de grabación
  useEffect(() => {
    const recording = micListening || systemRecording;
    if (recording !== isRecording) {
      setIsRecording(recording);
    }
  }, [micListening, systemRecording, isRecording]);

  const combinedError = micError || systemError;
  const hasTranscripts = transcriptEntries.length > 0 || micInterim;

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600" />
                Transcripción Híbrida
              </CardTitle>
              <CardDescription>
                Micrófono + Audio del Sistema con OpenAI Whisper
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isRecording && (
                <Badge variant="default" className="bg-green-500">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                  Grabando
                </Badge>
              )}
              {micListening && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Mic className="h-3 w-3 mr-1" />
                  Micrófono
                </Badge>
              )}
              {systemRecording && (
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  <Monitor className="h-3 w-3 mr-1" />
                  Sistema
                </Badge>
              )}
              {combinedError && !combinedError.includes('Continúa hablando') && (
                <Badge variant="destructive">
                  Error
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Selector de fuente */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Fuente de Audio:</label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={activeSource === 'microphone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSource('microphone')}
                disabled={isRecording}
                className="flex items-center gap-2"
              >
                <Mic className="h-4 w-4" />
                Solo Mic
              </Button>
              <Button
                variant={activeSource === 'system' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSource('system')}
                disabled={isRecording}
                className="flex items-center gap-2"
              >
                <Monitor className="h-4 w-4" />
                Solo Sistema
              </Button>
              <Button
                variant={activeSource === 'both' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSource('both')}
                disabled={isRecording}
                className="flex items-center gap-2"
              >
                <Wifi className="h-4 w-4" />
                Ambos
              </Button>
            </div>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2">
            <Button
              onClick={toggleRecording}
              size="lg"
              className={`flex-1 ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              {isRecording ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Detener
                </>
              ) : (
                <>
                  <Volume2 className="mr-2 h-4 w-4" />
                  Iniciar Grabación
                </>
              )}
            </Button>
            
            <Button
              onClick={resetAll}
              variant="outline"
              size="lg"
              disabled={!hasTranscripts}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={copyAll}
              variant="outline"
              size="lg"
              disabled={transcriptEntries.length === 0}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {/* Estado de conexión */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded flex items-center gap-2 ${
              activeSource === 'microphone' || activeSource === 'both' 
                ? micListening ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                : 'bg-gray-50 text-gray-400'
            }`}>
              <Mic className="h-3 w-3" />
              Micrófono: {micListening ? 'Activo' : 'Inactivo'}
              {micConfidence > 0 && ` (${Math.round(micConfidence * 100)}%)`}
            </div>
            <div className={`p-2 rounded flex items-center gap-2 ${
              activeSource === 'system' || activeSource === 'both'
                ? systemRecording ? 'bg-purple-50 text-purple-700' : 'bg-gray-50 text-gray-500'
                : 'bg-gray-50 text-gray-400'
            }`}>
              <Monitor className="h-3 w-3" />
              Sistema: {systemRecording ? 'Grabando' : 'Detenido'}
            </div>
          </div>

          {/* Debug info */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
            <h4 className="text-sm font-medium mb-2">🔧 Debug Info</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <strong>Estado:</strong>
                <br />• System Recording: {systemRecording ? '✅' : '❌'}
                <br />• Mic Listening: {micListening ? '✅' : '❌'}
                <br />• Combined: {isRecording ? '✅' : '❌'}
              </div>
              <div>
                <strong>Soporte:</strong>
                {isClient ? (
                  <>
                    <br />• getDisplayMedia: {(navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) ? '✅' : '❌'}
                    <br />• MediaRecorder: {'MediaRecorder' in window ? '✅' : '❌'}
                    <br />• AudioContext: {'AudioContext' in window ? '✅' : '❌'}
                  </>
                ) : (
                  <>
                    <br />• getDisplayMedia: ⏳
                    <br />• MediaRecorder: ⏳
                    <br />• AudioContext: ⏳
                  </>
                )}
              </div>
              <div>
                <strong>Datos:</strong>
                <br />• Entradas: {transcriptEntries.length}
                <br />• Fuente activa: {activeSource}
                <br />• Navegador: {isClient ? (navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Edge') ? 'Edge' : 'Otro') : 'Cargando...'}
              </div>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              💡 <strong>Instrucciones:</strong> Para capturar audio de Chrome, selecciona "Solo Sistema" o "Ambos", 
              luego en el diálogo de Chrome selecciona la ventana/tab y marca "Compartir audio del sistema".
            </div>
          </div>

          {/* Error display */}
          {combinedError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{combinedError}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcripciones */}
      <Card>
        <CardHeader>
          <CardTitle>Transcripciones en Tiempo Real</CardTitle>
          <CardDescription>
            {transcriptEntries.length === 0 
              ? "Las transcripciones aparecerán aquí"
              : `${transcriptEntries.length} entradas transcritas`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full">
            <div className="space-y-3">
              {transcriptEntries.map((entry) => (
                <div 
                  key={entry.id} 
                  className={`p-3 rounded-md border ${
                    entry.source === 'microphone' 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-purple-50 border-purple-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {entry.source === 'microphone' ? (
                        <Mic className="h-3 w-3 text-blue-600" />
                      ) : (
                        <Monitor className="h-3 w-3 text-purple-600" />
                      )}
                      <span className={`text-xs font-medium ${
                        entry.source === 'microphone' ? 'text-blue-600' : 'text-purple-600'
                      }`}>
                        {entry.source === 'microphone' ? 'Micrófono' : 'Sistema'}
                      </span>
                      {entry.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(entry.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {entry.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{entry.text}</p>
                </div>
              ))}
              
              {/* Transcripción temporal del micrófono */}
              {micInterim && (
                <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <Mic className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-600">Transcribiendo...</span>
                  </div>
                  <p className="text-sm text-blue-700 italic">{micInterim}</p>
                </div>
              )}
              
              {transcriptEntries.length === 0 && !micInterim && (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    {isRecording 
                      ? "Esperando audio..." 
                      : "Selecciona una fuente y presiona 'Iniciar Grabación'"
                    }
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}