"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

export interface AudioSource {
  id: string;
  label: string;
  type: 'microphone' | 'system' | 'combined';
}

export interface UseScreenAudioCaptureOptions {
  onAudioData?: (audioData: Float32Array) => void;
  onError?: (error: string) => void;
}

export function useScreenAudioCapture({ onAudioData, onError }: UseScreenAudioCaptureOptions = {}) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [audioSources, setAudioSources] = useState<AudioSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>('combined');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const systemStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Verificar soporte para Screen Capture API
    const supported = 'getDisplayMedia' in navigator.mediaDevices;
    setIsSupported(supported);

    if (supported) {
      // Configurar fuentes de audio disponibles
      const sources: AudioSource[] = [
        { id: 'microphone', label: 'Solo Micrófono', type: 'microphone' },
        { id: 'system', label: 'Solo Audio del Sistema', type: 'system' },
        { id: 'combined', label: 'Micrófono + Sistema', type: 'combined' }
      ];
      setAudioSources(sources);
    } else {
      setError('Screen Capture API no soportada en este navegador');
    }

    return () => {
      stopCapture();
    };
  }, []);

  const getMicrophoneStream = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });
      return stream;
    } catch (err) {
      throw new Error('No se pudo acceder al micrófono');
    }
  }, []);

  const getSystemAudioStream = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true, // Necesario para mostrar el diálogo de audio
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100
        }
      });
      
      // Verificar que el stream tiene pistas de audio
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        // Detener pistas de video ya que solo necesitamos audio
        stream.getVideoTracks().forEach(track => track.stop());
        throw new Error('AUDIO_NOT_SELECTED');
      }
      
      // Detener pistas de video ya que solo necesitamos audio
      stream.getVideoTracks().forEach(track => track.stop());
      
      return stream;
    } catch (err) {
      if (err instanceof Error) {
        if (err.message === 'AUDIO_NOT_SELECTED') {
          throw new Error('AUDIO_NOT_SELECTED');
        }
        if (err.name === 'NotAllowedError') {
          throw new Error('PERMISSION_DENIED');
        }
        if (err.name === 'AbortError') {
          throw new Error('USER_CANCELLED');
        }
      }
      throw new Error('CAPTURE_FAILED');
    }
  }, []);

  const combineAudioStreams = useCallback(async (micStream: MediaStream, systemStream: MediaStream): Promise<MediaStream> => {
    const audioContext = new AudioContext();
    const destination = audioContext.createMediaStreamDestination();

    // Crear nodos de audio
    const micSource = audioContext.createMediaStreamSource(micStream);
    const systemSource = audioContext.createMediaStreamSource(systemStream);
    
    // Crear mezclador con control de volumen
    const micGain = audioContext.createGain();
    const systemGain = audioContext.createGain();
    
    // Configurar niveles (puedes ajustar estos valores)
    micGain.gain.value = 1.0;
    systemGain.gain.value = 0.8;
    
    // Conectar nodos
    micSource.connect(micGain);
    systemSource.connect(systemGain);
    micGain.connect(destination);
    systemGain.connect(destination);
    
    audioContextRef.current = audioContext;
    return destination.stream;
  }, []);

  const setupAudioAnalysis = useCallback((stream: MediaStream) => {
    const audioContext = audioContextRef.current || new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    
    source.connect(analyser);
    
    analyserRef.current = analyser;
    audioContextRef.current = audioContext;

    // Configurar análisis en tiempo real
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Float32Array(bufferLength);

    const analyze = () => {
      if (analyserRef.current && onAudioData) {
        analyserRef.current.getFloatFrequencyData(dataArray);
        onAudioData(dataArray);
      }
      
      if (isCapturing) {
        requestAnimationFrame(analyze);
      }
    };

    analyze();
  }, [isCapturing, onAudioData]);

  const startCapture = useCallback(async () => {
    if (isCapturing) return;

    try {
      setError(null);
      let finalStream: MediaStream;

      switch (selectedSource) {
        case 'microphone':
          micStreamRef.current = await getMicrophoneStream();
          finalStream = micStreamRef.current;
          break;
          
        case 'system':
          systemStreamRef.current = await getSystemAudioStream();
          finalStream = systemStreamRef.current;
          break;
          
        case 'combined':
        default:
          micStreamRef.current = await getMicrophoneStream();
          systemStreamRef.current = await getSystemAudioStream();
          finalStream = await combineAudioStreams(micStreamRef.current, systemStreamRef.current);
          break;
      }

      mediaStreamRef.current = finalStream;
      setupAudioAnalysis(finalStream);
      setIsCapturing(true);

    } catch (err) {
      let errorMessage = 'Error desconocido';
      
      if (err instanceof Error) {
        switch (err.message) {
          case 'AUDIO_NOT_SELECTED':
            errorMessage = 'Debes marcar "Compartir audio del sistema" en el diálogo';
            break;
          case 'PERMISSION_DENIED':
            errorMessage = 'Permisos denegados para captura de pantalla';
            break;
          case 'USER_CANCELLED':
            errorMessage = 'Captura cancelada por el usuario';
            break;
          case 'CAPTURE_FAILED':
            errorMessage = 'Error al capturar audio del sistema';
            break;
          default:
            errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('Error starting audio capture:', err);
    }
  }, [selectedSource, isCapturing, getMicrophoneStream, getSystemAudioStream, combineAudioStreams, setupAudioAnalysis, onError]);

  const stopCapture = useCallback(() => {
    setIsCapturing(false);

    // Detener todas las pistas de audio
    [mediaStreamRef.current, micStreamRef.current, systemStreamRef.current].forEach(stream => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    });

    // Cerrar contexto de audio
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Limpiar referencias
    mediaStreamRef.current = null;
    micStreamRef.current = null;
    systemStreamRef.current = null;
    analyserRef.current = null;
  }, []);

  const getAudioLevel = useCallback((): number => {
    if (!analyserRef.current) return 0;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calcular nivel promedio
    const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
    return average / 255; // Normalizar a 0-1
  }, []);

  return {
    isCapturing,
    audioSources,
    selectedSource,
    setSelectedSource,
    error,
    isSupported,
    startCapture,
    stopCapture,
    getAudioLevel,
    mediaStream: mediaStreamRef.current
  };
}