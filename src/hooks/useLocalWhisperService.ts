"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface LocalWhisperServiceOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useLocalWhisperService({
  onTranscript,
  onError,
  lang = 'es'
}: LocalWhisperServiceOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  // Conectar al servicio local via WebSocket
  const connect = useCallback(async () => {
    try {
      console.log('🔌 Conectando al servicio local de Whisper...');
      
      // Verificar si el servicio está corriendo (localhost para Windows desde navegador)
      const response = await fetch('http://localhost:8889/health');
      if (!response.ok) {
        throw new Error('Servicio local no disponible');
      }
      
      setIsConnected(true);
      setError(null);
      console.log('✅ Conectado al servicio local de Whisper');
      
    } catch (err) {
      console.error('❌ Error conectando al servicio local:', err);
      setError('Servicio local no disponible. Inicia transcription_service.py');
      setIsConnected(false);
    }
  }, []);

  // Transcribir audio usando el servicio local
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    if (!isConnected) {
      throw new Error('Servicio local no conectado');
    }

    setIsTranscribing(true);
    
    try {
      console.log('🎵 Enviando audio al servicio local...', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', lang);

      const response = await fetch('http://localhost:8889/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('✅ Transcripción local completada:', {
        text: result.text?.substring(0, 100) + '...',
        confidence: result.confidence,
        duration: result.duration,
        processingTime: result.processing_time
      });

      if (result.error) {
        throw new Error(result.error);
      }

      const transcriptText = result.text || '';
      setTranscript(prev => prev + ' ' + transcriptText);
      onTranscript?.(transcriptText, true);
      
      return transcriptText;
      
    } catch (err) {
      console.error('💥 Error en transcripción local:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      onError?.(errorMessage);
      throw err;
    } finally {
      setIsTranscribing(false);
    }
  }, [isConnected, lang, onTranscript, onError]);

  // Enviar audio raw via UDP (más rápido)
  const transcribeAudioUDP = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      console.log('🚀 Enviando audio via UDP al servicio local...');
      
      // Convertir blob a ArrayBuffer
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Simular UDP via fetch con ArrayBuffer
      const response = await fetch('http://localhost:8889/transcribe-udp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        body: arrayBuffer,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('⚡ Transcripción UDP completada:', {
        text: result.text?.substring(0, 100) + '...',
        processingTime: result.processing_time + 'ms'
      });

      return result.text || '';
      
    } catch (err) {
      console.error('💥 Error en transcripción UDP:', err);
      throw err;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Auto-conectar al servicio local cuando se monta el componente
  useEffect(() => {
    connect();
    
    // Intentar reconectar cada 5 segundos si no está conectado
    const interval = setInterval(() => {
      if (!isConnected) {
        connect();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connect, isConnected]);

  return {
    isConnected,
    isTranscribing,
    transcript,
    error,
    connect,
    disconnect,
    transcribeAudio,
    transcribeAudioUDP,
    resetTranscript
  };
}