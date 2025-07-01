"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onstart: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useSpeechRecognition({
  continuous = true,
  interimResults = true,
  lang = 'es-ES',
  onTranscript,
  onError
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const isStartingRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      
      const recognition = recognitionRef.current;
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
        isStartingRef.current = false;
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        isStartingRef.current = false;
        
        // Auto-restart if continuous mode is enabled and we're not manually stopping
        if (continuous && !isStartingRef.current) {
          restartTimeoutRef.current = setTimeout(() => {
            if (recognitionRef.current && !isListening && !isStartingRef.current) {
              try {
                console.log('Auto-restarting speech recognition');
                isStartingRef.current = true;
                recognitionRef.current.start();
              } catch (err) {
                console.warn('Auto-restart failed:', err);
                setError('Error al reiniciar reconocimiento automático');
                isStartingRef.current = false;
              }
            }
          }, 1000);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error, event.message);
        
        // Limpiar timeout de reinicio si hay error
        if (restartTimeoutRef.current) {
          clearTimeout(restartTimeoutRef.current);
          restartTimeoutRef.current = null;
        }
        
        isStartingRef.current = false;
        
        // Manejo específico de errores
        const errorMessages: Record<string, string> = {
          'aborted': 'Reconocimiento cancelado.',
          'audio-capture': 'No se puede acceder al micrófono. Revisa los permisos.',
          'bad-grammar': 'Error de configuración.',
          'language-not-supported': 'Idioma no soportado.',
          'network': 'Error de conexión. Verifica tu internet.',
          'no-speech': 'No se detectó voz. Verifica tu micrófono o nivel de audio.',
          'not-allowed': 'Permisos de micrófono denegados. Actívalos en tu navegador.',
          'service-not-allowed': 'Servicio no disponible.'
        };

        const userFriendlyError = errorMessages[event.error] || `Error: ${event.error}`;
        
        // Solo mostrar error si no es un 'no-speech' en modo continuo (es normal)
        if (event.error !== 'no-speech' || !continuous) {
          setError(userFriendlyError);
        }
        
        setIsListening(false);
        onError?.(event.error);

        // Manejo específico por tipo de error
        if (event.error === 'no-speech' && continuous) {
          // En modo continuo, 'no-speech' es normal, solo reiniciar
          console.log('No speech detected, restarting in continuous mode');
          setTimeout(() => {
            setError(null);
            if (recognitionRef.current && !isStartingRef.current) {
              try {
                isStartingRef.current = true;
                recognitionRef.current.start();
              } catch (err) {
                console.warn('Restart after no-speech failed:', err);
                isStartingRef.current = false;
              }
            }
          }, 500);
        } else if (event.error === 'aborted') {
          // Para 'aborted', no reiniciar automáticamente
          setTimeout(() => {
            setError(null);
          }, 1000);
        }
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
          setTranscript(finalTranscriptRef.current);
          onTranscript?.(finalTranscript, true);
        }
        
        setInterimTranscript(interimTranscript);
        if (interimTranscript) {
          onTranscript?.(interimTranscript, false);
        }
      };
    } else {
      setIsSupported(false);
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      // Limpiar timeouts
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (err) {
          console.warn('Cleanup error:', err);
        }
      }
    };
  }, [continuous, interimResults, lang, onTranscript, onError]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening && !isStartingRef.current) {
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      finalTranscriptRef.current = '';
      
      // Limpiar timeout previo si existe
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      try {
        isStartingRef.current = true;
        console.log('Starting speech recognition manually');
        recognitionRef.current.start();
      } catch (err) {
        console.error('Start error:', err);
        setError('No se pudo iniciar el reconocimiento de voz');
        isStartingRef.current = false;
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    console.log('Stopping speech recognition manually');
    
    // Limpiar timeout de auto-reinicio
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    isStartingRef.current = false;
    
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Stop error:', err);
        setIsListening(false);
      }
    } else {
      setIsListening(false);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    finalTranscriptRef.current = '';
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript
  };
}