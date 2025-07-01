"use client";

import { useState, useRef, useCallback } from 'react';

interface WebAudioRecorderOptions {
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  lang?: string;
  useLocalService?: boolean;
}

export function useWebAudioRecorder({
  onTranscript,
  onError,
  lang = 'es-ES',
  useLocalService = true
}: WebAudioRecorderOptions = {}) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const recordedBuffersRef = useRef<Float32Array[]>([]);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sampleRateRef = useRef<number>(44100);

  // Función para convertir Float32Array a WAV
  const encodeWAV = useCallback((samples: Float32Array, sampleRate: number): Blob => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);
    
    // WAV Header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples.length * 2, true);
    
    // Convert samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      const sample = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }, []);

  // Función para transcribir usando servicio local
  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      console.log('🎵 Enviando WAV al servicio GPU local...', {
        size: audioBlob.size,
        type: audioBlob.type
      });

      const formData = new FormData();
      formData.append('audio', audioBlob, `audio-${Date.now()}.wav`);
      formData.append('language', lang.split('-')[0]);

      const response = await fetch('http://localhost:8889/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        throw new Error(result.error);
      }

      return result.text || '';
      
    } catch (err) {
      console.error('💥 Error en transcripción WAV:', err);
      throw err;
    }
  }, [lang]);

  // Capturar audio del sistema
  const captureSystemAudio = useCallback(async (): Promise<MediaStream> => {
    try {
      console.log('🎬 Iniciando captura con Web Audio API...');
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
          channelCount: 1 // Mono para simplificar
        }
      });

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        stream.getVideoTracks().forEach(track => track.stop());
        throw new Error('No se seleccionó audio del sistema. Marca "Compartir audio del sistema".');
      }

      // Detener video
      stream.getVideoTracks().forEach(track => track.stop());

      return stream;
    } catch (err) {
      console.error('💥 Error en captura de audio:', err);
      throw err;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!useLocalService) {
      setError('Solo funciona con servicio GPU local');
      return;
    }

    try {
      console.log('🚀 Iniciando Web Audio Recorder...');
      setError(null);
      setTranscript('');
      
      // Capturar audio
      const stream = await captureSystemAudio();
      streamRef.current = stream;
      
      // Crear AudioContext
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 44100
      });
      audioContextRef.current = audioContext;
      sampleRateRef.current = audioContext.sampleRate;
      
      // Crear nodos de audio
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      recordedBuffersRef.current = [];
      
      // Procesar audio en tiempo real
      processor.onaudioprocess = (event) => {
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Copiar datos de audio
        const buffer = new Float32Array(inputData.length);
        buffer.set(inputData);
        recordedBuffersRef.current.push(buffer);
        
        console.log(`🎤 Audio buffer: ${inputData.length} samples, Total buffers: ${recordedBuffersRef.current.length}`);
      };
      
      // Conectar nodos
      source.connect(processor);
      processor.connect(audioContext.destination);
      
      setIsRecording(true);
      
      // Procesar audio cada 10 segundos
      processingIntervalRef.current = setInterval(async () => {
        if (recordedBuffersRef.current.length > 0) {
          try {
            // Concatenar todos los buffers
            const totalLength = recordedBuffersRef.current.reduce((sum, buffer) => sum + buffer.length, 0);
            const concatenated = new Float32Array(totalLength);
            
            let offset = 0;
            for (const buffer of recordedBuffersRef.current) {
              concatenated.set(buffer, offset);
              offset += buffer.length;
            }
            
            console.log(`🔄 Procesando ${totalLength} samples (${(totalLength / sampleRateRef.current).toFixed(1)}s de audio)`);
            
            // Convertir a WAV
            const wavBlob = encodeWAV(concatenated, sampleRateRef.current);
            
            // Transcribir
            const transcribedText = await transcribeAudio(wavBlob);
            
            if (transcribedText.trim()) {
              console.log('✅ Texto transcrito:', transcribedText);
              setTranscript(prev => prev + ' ' + transcribedText);
              onTranscript?.(transcribedText, true);
            }
            
            // Limpiar buffers procesados
            recordedBuffersRef.current = [];
            
          } catch (err) {
            console.error('💥 Error procesando audio WAV:', err);
            onError?.('processing-error');
          }
        }
      }, 10000); // Cada 10 segundos
      
      console.log('✅ Web Audio Recorder iniciado exitosamente');
      
    } catch (err) {
      console.error('💥 Error iniciando Web Audio Recorder:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      onError?.('start-error');
    }
  }, [useLocalService, captureSystemAudio, encodeWAV, transcribeAudio, onTranscript, onError]);

  const stopRecording = useCallback(() => {
    console.log('🛑 Deteniendo Web Audio Recorder...');
    
    if (processingIntervalRef.current) {
      clearInterval(processingIntervalRef.current);
      processingIntervalRef.current = null;
    }
    
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Procesar audio final
    if (recordedBuffersRef.current.length > 0) {
      const totalLength = recordedBuffersRef.current.reduce((sum, buffer) => sum + buffer.length, 0);
      const concatenated = new Float32Array(totalLength);
      
      let offset = 0;
      for (const buffer of recordedBuffersRef.current) {
        concatenated.set(buffer, offset);
        offset += buffer.length;
      }
      
      const wavBlob = encodeWAV(concatenated, sampleRateRef.current);
      transcribeAudio(wavBlob).then(text => {
        if (text.trim()) {
          setTranscript(prev => prev + ' ' + text);
          onTranscript?.(text, true);
        }
      }).catch(err => console.error('Error en transcripción final:', err));
      
      recordedBuffersRef.current = [];
    }
    
    setIsRecording(false);
  }, [encodeWAV, transcribeAudio, onTranscript]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  return {
    isRecording,
    transcript,
    error,
    isSupported: true, // Web Audio API es ampliamente soportado
    startRecording,
    stopRecording,
    resetTranscript
  };
}