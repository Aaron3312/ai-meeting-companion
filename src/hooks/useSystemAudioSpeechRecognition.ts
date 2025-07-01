"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface SystemAudioSpeechRecognitionOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useSystemAudioSpeechRecognition({
  onTranscript,
  onError,
  lang = 'es-ES'
}: SystemAudioSpeechRecognitionOptions = {}) {
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

      console.log('📺 Stream obtenido:', {
        id: stream.id,
        active: stream.active,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      // Verificar que tiene audio
      const audioTracks = stream.getAudioTracks();
      const videoTracks = stream.getVideoTracks();
      
      console.log('🎵 Audio tracks:', audioTracks.map(track => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings(),
        constraints: track.getConstraints()
      })));

      console.log('📹 Video tracks:', videoTracks.map(track => ({
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState,
        settings: track.getSettings()
      })));

      if (audioTracks.length === 0) {
        console.error('❌ No se encontraron pistas de audio en el stream');
        stream.getVideoTracks().forEach(track => {
          console.log('🛑 Deteniendo video track:', track.id);
          track.stop();
        });
        throw new Error('No se seleccionó audio del sistema. IMPORTANTE: Marca "Compartir audio del sistema" en el diálogo de Chrome.');
      }

      // Detener video ya que solo necesitamos audio
      stream.getVideoTracks().forEach(track => {
        console.log('🛑 Deteniendo video track (ya no necesario):', track.id);
        track.stop();
      });

      // Verificar configuración de audio
      const audioTrack = audioTracks[0];
      const audioSettings = audioTrack.getSettings();
      console.log('✅ Audio del sistema capturado exitosamente:', {
        trackId: audioTrack.id,
        label: audioTrack.label,
        settings: audioSettings,
        deviceId: audioSettings.deviceId,
        sampleRate: audioSettings.sampleRate,
        channelCount: audioSettings.channelCount
      });

      // Verificar que el audio está activo
      if (audioTrack.readyState !== 'live') {
        console.warn('⚠️ Audio track no está en estado "live":', audioTrack.readyState);
      }

      return stream;
    } catch (err) {
      console.error('💥 Error en captureSystemAudio:', err);
      
      if (err instanceof Error) {
        console.log('🔍 Detalles del error:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        
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
      console.log('📤 Preparando envío a Whisper API...', {
        size: audioBlob.size,
        type: audioBlob.type,
        timestamp: new Date().toISOString()
      });

      // Usar el blob original en formato WebM con extensión correcta
      const formData = new FormData();
      formData.append('file', audioBlob, `audio-${Date.now()}.webm`);
      formData.append('language', lang.split('-')[0]);
      
      console.log('📋 Detalles del archivo:', {
        size: audioBlob.size,
        type: audioBlob.type,
        lastModified: (audioBlob as any).lastModified || 'N/A'
      });

      console.log('📤 Enviando audio a Whisper API...');
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      console.log('📨 Respuesta HTTP:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response body:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        } catch {
          throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
        }
      }

      const result = await response.json();
      console.log('📥 Respuesta de Whisper exitosa:', {
        textLength: result.text?.length || 0,
        textPreview: result.text?.substring(0, 100) || 'Sin texto',
        processingTime: result.processingTime
      });
      
      return result.text || '';
    } catch (err) {
      console.error('💥 Error completo en transcribeWithWhisper:', {
        error: err instanceof Error ? err.message : err,
        stack: err instanceof Error ? err.stack : undefined,
        timestamp: new Date().toISOString()
      });
      throw err;
    }
  }, [lang]);

  const processAudioChunk = useCallback(async (audioBlob: Blob) => {
    // Rate limiting - no enviar requests demasiado rápido
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTimeRef.current;
    const minInterval = 2000; // Mínimo 2 segundos entre requests
    
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
      
      console.log('🎵 Procesando chunk de audio:', audioBlob.size, 'bytes');
      
      // Verificar tamaño mínimo del chunk
      if (audioBlob.size < 1000) { // Menos de 1KB probablemente no tiene audio útil
        console.log('⚠️ Chunk muy pequeño, saltando:', audioBlob.size, 'bytes');
        return;
      }
      
      // Usar Whisper API para transcribir el audio del sistema
      const transcribedText = await transcribeWithWhisper(audioBlob);
      
      if (transcribedText.trim()) {
        console.log('✅ Texto transcrito del sistema:', transcribedText);
        setTranscript(prev => prev + ' ' + transcribedText);
        onTranscript?.(transcribedText, true);
      } else {
        console.log('📝 Whisper no devolvió texto (silencio o ruido)');
      }
      
    } catch (err) {
      console.error('💥 Error procesando audio:', err);
      setError('Error al procesar audio del sistema');
      onError?.('processing-error');
    } finally {
      isProcessingRef.current = false;
    }
  }, [transcribeWithWhisper, onTranscript, onError]);

  const startRecording = useCallback(async () => {
    if (!isSupported || isRecording) {
      console.log('❌ No se puede iniciar grabación:', { isSupported, isRecording });
      return;
    }

    try {
      console.log('🚀 Iniciando grabación de audio del sistema...');
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
      console.log('📋 Formatos soportados:', supportedTypes.filter(type => MediaRecorder.isTypeSupported(type)));
      
      // Configurar MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: selectedMimeType
      });
      
      console.log('📹 MediaRecorder configurado:', {
        mimeType: mediaRecorder.mimeType,
        state: mediaRecorder.state,
        audioBitsPerSecond: mediaRecorder.audioBitsPerSecond
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Eventos del MediaRecorder
      mediaRecorder.ondataavailable = (event) => {
        console.log('📦 Chunk de audio recibido:', {
          size: event.data.size,
          type: event.data.type,
          timestamp: new Date().toISOString()
        });
        
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log('📚 Total chunks acumulados:', audioChunksRef.current.length);
          
          // Procesar chunk cada 5 chunks (~5 segundos) para mejor calidad
          if (audioChunksRef.current.length >= 5) {
            const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
            console.log('🔄 Procesando blob de audio:', {
              size: audioBlob.size,
              type: audioBlob.type,
              chunks: audioChunksRef.current.length,
              chunkSizes: audioChunksRef.current.map(chunk => chunk.size)
            });
            processAudioChunk(audioBlob);
            audioChunksRef.current = [];
          }
        } else {
          console.warn('⚠️ Chunk de audio vacío recibido');
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
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 MediaRecorder detenido');
        setIsRecording(false);
        
        // Procesar último chunk si existe
        if (audioChunksRef.current.length > 0) {
          console.log('🔄 Procesando chunks finales:', audioChunksRef.current.length);
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMimeType });
          processAudioChunk(audioBlob);
          audioChunksRef.current = [];
        }
      };

      mediaRecorder.onpause = () => {
        console.log('⏸️ MediaRecorder pausado');
      };

      mediaRecorder.onresume = () => {
        console.log('▶️ MediaRecorder reanudado');
      };

      // Iniciar grabación con chunks cada 2 segundos para mejor estabilidad
      console.log('🎬 Iniciando MediaRecorder...');
      mediaRecorder.start(2000);
      
      console.log('✅ Grabación de audio del sistema iniciada exitosamente');

    } catch (err) {
      console.error('💥 Error al iniciar grabación:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      onError?.('start-error');
    }
  }, [isSupported, isRecording, captureSystemAudio, processAudioChunk, onError]);

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
    startRecording,
    stopRecording,
    resetTranscript
  };
}