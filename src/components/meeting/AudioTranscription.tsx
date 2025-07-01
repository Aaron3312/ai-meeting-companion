"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Copy, Monitor, Settings, HelpCircle } from 'lucide-react';
import { useAdvancedSpeechRecognition } from '@/hooks/useAdvancedSpeechRecognition';
import { useScreenAudioCapture } from '@/hooks/useScreenAudioCapture';
import SystemAudioGuide from './SystemAudioGuide';

interface AudioTranscriptionProps {
  onTranscriptUpdate?: (transcript: string, isFinal: boolean) => void;
  className?: string;
}

export default function AudioTranscription({ 
  onTranscriptUpdate, 
  className = '' 
}: AudioTranscriptionProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [transcriptHistory, setTranscriptHistory] = useState<string[]>([]);
  const [, setAudioLevel] = useState(0);
  const [useSystemAudio, setUseSystemAudio] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);

  const handleTranscript = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal && transcript.trim()) {
      setTranscriptHistory(prev => [...prev, transcript.trim()]);
    }
    onTranscriptUpdate?.(transcript, isFinal);
  }, [onTranscriptUpdate]);

  const handleError = useCallback((error: string) => {
    // Solo loggear errores que no sean no-speech en modo continuo
    if (error !== 'no-speech') {
      console.error('Speech recognition error:', error);
    }
  }, []);

  const handleAudioData = useCallback((data: Float32Array) => {
    // Calcular nivel de audio para visualización
    const average = data.reduce((sum, value) => sum + Math.abs(value), 0) / data.length;
    setAudioLevel(Math.min(average * 100, 100));
  }, []);

  // Hook para captura de audio del sistema
  const {
    isCapturing: isCapturingSystem,
    audioSources,
    selectedSource,
    setSelectedSource,
    error: systemError,
    isSupported: isSystemSupported,
    startCapture: startSystemCapture,
    stopCapture: stopSystemCapture,
    getAudioLevel,
    mediaStream
  } = useScreenAudioCapture({
    onAudioData: handleAudioData,
    onError: handleError
  });

  const {
    isListening,
    transcript,
    interimTranscript,
    error: speechError,
    isSupported,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    retryCount,
    maxRetries
  } = useAdvancedSpeechRecognition({
    continuous: continuousMode,
    interimResults: true,
    lang: 'es-ES',
    audioStream: mediaStream || undefined,
    onTranscript: handleTranscript,
    onError: handleError
  });

  // Combinar errores de speech y system audio
  const combinedError = speechError || systemError;

  const toggleListening = async () => {
    if (isListening || isCapturingSystem) {
      stopListening();
      stopSystemCapture();
    } else {
      if (useSystemAudio && isSystemSupported) {
        await startSystemCapture();
      }
      startListening();
    }
  };

  // Actualizar nivel de audio periódicamente
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCapturingSystem) {
      interval = setInterval(() => {
        const level = getAudioLevel();
        setAudioLevel(level * 100);
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCapturingSystem, getAudioLevel]);

  const handleReset = () => {
    resetTranscript();
    setTranscriptHistory([]);
    stopSystemCapture();
  };

  const copyToClipboard = () => {
    const fullText = transcriptHistory.join(' ');
    navigator.clipboard.writeText(fullText);
  };

  if (!isSupported) {
    return (
      <Card className={`border-red-200 ${className}`}>
        <CardHeader>
          <CardTitle className="text-red-600">Audio no soportado</CardTitle>
          <CardDescription>
            Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-blue-600" />
                Transcripción en Tiempo Real
              </CardTitle>
              <CardDescription>
                Convierte tu voz en texto automáticamente
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {isListening && (
                <Badge variant="default" className="bg-green-500">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse mr-2" />
                  Escuchando
                </Badge>
              )}
              {combinedError && !combinedError.includes('Continúa hablando') && (
                <Badge variant="destructive">
                  Error
                </Badge>
              )}
              {combinedError && combinedError.includes('Continúa hablando') && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse mr-2" />
                  Audio detectado
                </Badge>
              )}
              {confidence > 0 && (
                <Badge variant="outline" className="text-green-600 border-green-200">
                  ✓ {Math.round(confidence * 100)}%
                </Badge>
              )}
              {transcript && (
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  {transcript.split(' ').length} palabras
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuración de fuente de audio */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Fuente de Audio:</label>
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                <span className="text-xs text-gray-500">
                  {useSystemAudio ? 'Sistema + Mic' : 'Solo Micrófono'}
                </span>
              </div>
            </div>
            
            {isSystemSupported && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button
                  variant={useSystemAudio ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseSystemAudio(true)}
                  className="flex items-center gap-2"
                >
                  <Monitor className="h-4 w-4" />
                  Sistema + Micrófono
                </Button>
                <Button
                  variant={!useSystemAudio ? "default" : "outline"}
                  size="sm"
                  onClick={() => setUseSystemAudio(false)}
                  className="flex items-center gap-2"
                >
                  <Mic className="h-4 w-4" />
                  Solo Micrófono
                </Button>
              </div>
            )}

            {useSystemAudio && isSystemSupported && (
              <div className="space-y-2">
                <Select value={selectedSource} onValueChange={setSelectedSource}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona fuente de audio" />
                  </SelectTrigger>
                  <SelectContent>
                    {audioSources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGuide(true)}
                  className="w-full flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <HelpCircle className="h-4 w-4" />
                  ¿Cómo capturar audio del sistema?
                </Button>
              </div>
            )}

            {/* Control de modo continuo */}
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <label className="text-sm font-medium text-blue-800">Modo Continuo</label>
                <p className="text-xs text-blue-600">Reconocimiento automático sin interrupciones</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={continuousMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContinuousMode(true)}
                  className="text-xs"
                >
                  Auto
                </Button>
                <Button
                  variant={!continuousMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setContinuousMode(false)}
                  className="text-xs"
                >
                  Manual
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleListening}
              size="lg"
              className={`flex-1 ${
                (isListening || isCapturingSystem)
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {(isListening || isCapturingSystem) ? (
                <>
                  <MicOff className="mr-2 h-4 w-4" />
                  Detener
                </>
              ) : (
                <>
                  {useSystemAudio ? <Monitor className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                  Iniciar
                </>
              )}
            </Button>
            
            <Button
              onClick={() => setIsMuted(!isMuted)}
              variant="outline"
              size="lg"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              onClick={handleReset}
              variant="outline"
              size="lg"
              disabled={!transcript && transcriptHistory.length === 0}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="lg"
              disabled={transcriptHistory.length === 0}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          {combinedError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
              <div className="flex items-center justify-between">
                <p className="text-sm text-red-600 dark:text-red-400">
                  {combinedError}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="text-red-600 hover:text-red-700 h-6 text-xs"
                >
                  Recargar
                </Button>
              </div>
              {systemError && systemError.includes('Compartir audio') && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGuide(true)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Ver guía paso a paso
                  </Button>
                </div>
              )}
              
              <div className="mt-2 text-xs text-red-500">
                <p>💡 Consejos:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Verifica que tu micrófono esté conectado</li>
                  <li>Permite el acceso al micrófono y pantalla en tu navegador</li>
                  <li>Para audio del sistema, marca "Compartir audio del sistema"</li>
                  <li>Usa Chrome o Edge para mejor compatibilidad</li>
                  <li>Prueba recargando la página</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guía del sistema de audio */}
      {showGuide && (
        <SystemAudioGuide 
          onDismiss={() => setShowGuide(false)}
          className="mb-4"
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transcripción</CardTitle>
          <CardDescription>
            {transcriptHistory.length === 0 
              ? "La transcripción aparecerá aquí en tiempo real"
              : `${transcriptHistory.length} fragmento(s) transcritos`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64 w-full rounded-md border p-4">
            <div className="space-y-3">
              {transcriptHistory.map((text, index) => (
                <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-500">
                      Fragmento {index + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm">{text}</p>
                </div>
              ))}
              
              {interimTranscript && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border-l-4 border-blue-400">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-blue-600">
                      Transcribiendo...
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 italic">
                    {interimTranscript}
                  </p>
                </div>
              )}
              
              {transcriptHistory.length === 0 && !interimTranscript && (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    {isListening 
                      ? "Esperando audio..." 
                      : "Presiona 'Iniciar' para comenzar la transcripción"
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