"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { useLocalWhisperService } from './useLocalWhisperService';

interface SystemAudioWithLocalWhisperOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  lang?: string;
  useLocalService?: boolean;
}

export function useSystemAudioWithLocalWhisper({
  onTranscript,
  onError,
  lang = 'es-ES',
  useLocalService = false
}: SystemAudioWithLocalWhisperOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Hook del servicio local
  const {
    isConnected: localConnected,
    transcribeAudio: transcribeLocal,
    transcribeAudioUDP: transcribeLocalUDP
  } = useLocalWhisperService({
    lang: lang.split('-')[0],
    onError: useCallback((error: string) => {
      console.error('Local Whisper service error:', error);
      onError?.(error);
    }, [onError])
  });

  useEffect(() => {
    // Verificar soporte para getDisplayMedia y MediaRecorder
    const hasDisplayMedia = typeof navigator !== 'undefined' && 
                           navigator.mediaDevices && 
                           'getDisplayMedia' in navigator.mediaDevices;
    const hasMediaRecorder = typeof window !== 'undefined' && 'MediaRecorder' in window;
    const hasWebAudio = typeof window !== 'undefined' && 
                       ('AudioContext' in window || 'webkitAudioContext' in window);
    
    setIsSupported(hasDisplayMedia && hasMediaRecorder && hasWebAudio);
    
    if (!hasDisplayMedia) {
      setError('Tu navegador no soporta captura de pantalla');
    } else if (!hasMediaRecorder) {
      setError('Tu navegador no soporta grabación de audio');
    }
  }, []);

  const captureSystemAudio = useCallback(async (): Promise<MediaStream> => {
    try {
      console.log('🎬 Iniciando captura de pantalla para audio del sistema...');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Necesario para mostrar el diálogo
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 2
        }
      });

      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      
      if (audioTracks.length === 0) {
        console.error('❌ No se encontraron pistas de audio en el stream');
        stream.getVideoTracks().forEach(track => track.stop());
        throw new Error('No se seleccionó audio del sistema. IMPORTANTE: Marca "Compartir audio del sistema" en el diálogo de Chrome.');
      }

      // Detener video ya que solo necesitamos audio
      stream.getVideoTracks().forEach(track => {
        console.log('🛑 Deteniendo video track (ya no necesario):', track.id);
        track.stop();
      });

      const audioTrack = audioTracks[0];
      const audioSettings = audioTrack.getSettings();
      console.log('✅ Audio del sistema capturado exitosamente:', {
        trackId: audioTrack.id,
        label: audioTrack.label,
        settings: audioSettings
      });

      return stream;
    } catch (err) {
      console.error('💥 Error en captureSystemAudio:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          throw new Error('Permisos denegados para captura de pantalla. Permite el acceso cuando Chrome lo solicite.');
        }
        if (err.name === 'AbortError') {
          throw new Error('Captura cancelada por el usuario. Intenta de nuevo y selecciona una ventana.');
        }
        if (err.name === 'NotFoundError') {
          throw new Error('No se encontró ninguna fuente de audio. Asegúrate de tener audio reproduciéndose.');
        }
        if (err.name === 'NotSupportedError') {
          throw new Error('Tu navegador no soporta captura de audio del sistema. Usa Chrome o Edge.');
        }
        throw err;
      }
      throw new Error('Error desconocido al capturar audio del sistema');
    }
  }, []);

  const transcribeWithWhisper = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      if (useLocalService && localConnected) {
        console.log('🚀 Usando servicio local GPU para transcripción...');
        const result = await transcribeLocalUDP(audioBlob);
        return result;
      } else {
        console.log('❌ OpenAI API deshabilitada - solo GPU local disponible');
        throw new Error('OpenAI API deshabilitada. Por favor usa el servicio GPU local.');
      }
    } catch (err) {
      console.error('💥 Error en transcription:', err);
      throw err;
    }
  }, [useLocalService, localConnected, transcribeLocalUDP]);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    // Rate limiting - no enviar requests demasiado rápido
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const minInterval = useLocalService ? 1000 : 2000; // Más rápido con servicio local
    
    if (timeSinceLastRequest < minInterval) {
      console.log('⏱️ Rate limit: esperando', minInterval - timeSinceLastRequest, 'ms');
      return;
    }
    
    if (isProcessingRef.current) {
      console.log('⏳ Ya hay una transcripción en proceso, saltando...');
      return;
    }
    
    try {
      isProcessingRef.current = true;
      lastRequestTimeRef.current = now;
      
      console.log(`🎵 Procesando chunk de audio (${useLocalService ? 'GPU Local' : 'OpenAI'}):`, audioBlob.size, 'bytes');
      
      // Verificar tamaño mínimo del chunk
      if (audioBlob.size < 1000) {
        console.log('⚠️ Chunk muy pequeño, saltando:', audioBlob.size, 'bytes');
        return;
      }
      
      const transcribedText = await transcribeWithWhisper(audioBlob);
      
      if (transcribedText.trim()) {
        console.log('✅ Texto transcrito:', transcribedText);
        setTranscript(prev => prev + ' ' + transcribedText);
        onTranscript?.(transcribedText, true);
      } else {
        console.log('📝 No se devolvió texto (silencio o ruido)');
      }
      
    } catch (err) {
      console.error('💥 Error procesando audio:', err);
      setError(`Error al procesar audio: ${err instanceof Error ? err.message : 'Error desconocido'}`);
      onError?.('processing-error');
    } finally {
      isProcessingRef.current = false;
    }
  }, [transcribeWithWhisper, onTranscript, onError, useLocalService]);

  const startRecording = useCallback(async () => {
    if (!isSupported || isRecording) {
      console.log('❌ No se puede iniciar grabación:', { isSupported, isRecording });
      return;
    }

    try {
      console.log(`🚀 Iniciando grabación de audio del sistema (${useLocalService ? 'GPU Local' : 'OpenAI'})...`);
      setError(null);
      setTranscript('');
      
      // Capturar audio del sistema
      const stream = await captureSystemAudio();
      streamRef.current = stream;
      
      // Verificar formatos soportados
      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus'
      ];
      
      let selectedMimeType = 'audio/webm';
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          selectedMimeType = type;
          break;
        }
      }
      
      console.log('🎚️ Formato de audio seleccionado:', selectedMimeType);
      
      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Eventos del MediaRecorder - NUEVO ENFOQUE: Solo acumular, no procesar chunks individuales
      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 Chunk recibido (acumulando):', {
          size: event.data.size,
          type: event.data.type,
          timestamp: new Date().toISOString()
        });
        
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`📚 Total chunks acumulados: ${audioChunksRef.current.length}, Total size: ${audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0)} bytes`);
        } else {
          console.warn('⚠️ Chunk vacío recibido');
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('💥 MediaRecorder error:', event);
        setError('Error en la grabación de audio');
        onError?.('recording-error');
      };

      mediaRecorder.onstart = () => {
        console.log('▶️ MediaRecorder iniciado');
        setIsRecording(true);
        
        // Iniciar procesamiento automático cada 8 segundos usando audio acumulado
        if (useLocalService) {
          processingIntervalRef.current = setInterval(() => {
            if (audioChunksRef.current.length > 0 && !isProcessingRef.current) {
              const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
              if (totalSize > 50000) { // Solo procesar si hay al menos 50KB
                console.log(`⏰ Procesamiento automático: ${audioChunksRef.current.length} chunks, ${totalSize} bytes`);
                
                // Crear blob con todo el audio acumulado
                const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
                processAudioChunk(audioBlob);
                
                // Limpiar chunks procesados
                audioChunksRef.current = [];
              }
            }
          }, 8000); // Cada 8 segundos
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder detenido');
        setIsRecording(false);
        
        // Limpiar interval de procesamiento
        if (processingIntervalRef.current) {
          clearInterval(processingIntervalRef.current);
          processingIntervalRef.current = null;
        }
        
        // Procesar TODO el audio acumulado cuando se detiene
        if (audioChunksRef.current.length > 0) {
          const totalSize = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.size, 0);
          console.log(`🎵 Procesando audio final: ${audioChunksRef.current.length} chunks, ${totalSize} bytes total`);
          
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
          processAudioChunk(audioBlob);
          audioChunksRef.current = [];
        }
      };

      // Iniciar grabación con chunks más largos para mejor estabilidad
      const chunkInterval = useLocalService ? 3000 : 2000; // 3s vs 2s para GPU local
      console.log(`🎬 Iniciando MediaRecorder con intervalos de ${chunkInterval}ms...`);
      mediaRecorder.start(chunkInterval);
      
      console.log('✅ Grabación de audio del sistema iniciada exitosamente');

    } catch (err) {
      console.error('💥 Error al iniciar grabación:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      onError?.('start-error');
    }
  }, [isSupported, isRecording, captureSystemAudio, processAudioChunk, onError, useLocalService]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (recognitionTimeoutRef.current) {
      clearTimeout(recognitionTimeoutRef.current);
      recognitionTimeoutRef.current = null;
    }
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    setIsRecording(false);
  }, [isRecording]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isRecording,
    transcript,
    error,
    isSupported,
    localConnected: useLocalService ? localConnected : null,
    startRecording,
    stopRecording,
    resetTranscript
  };
}