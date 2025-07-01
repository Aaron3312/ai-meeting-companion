"use client";

import { useState, useRef, useCallback, useEffect } from 'react';

interface AdvancedSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  audioStream?: MediaStream;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

export function useAdvancedSpeechRecognition({
  continuous = true,
  interimResults = true,
  lang = 'es-ES',
  audioStream,
  onTranscript,
  onError
}: AdvancedSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const isActiveRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Detectar soporte mejorado
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isChrome = /Chrome/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    
    setIsSupported(!!SpeechRecognition && (isChrome || isEdge));
    
    if (!SpeechRecognition) {
      setError('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.');
      return;
    }

    if (!isChrome && !isEdge) {
      setError('Para mejor compatibilidad, usa Chrome o Edge.');
    }
  }, []);

  // Configuración avanzada del reconocimiento
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    
    const recognition = recognitionRef.current;
    
    // Configuración optimizada
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    // Eventos mejorados
    recognition.onstart = () => {
      console.log('🎤 Speech recognition iniciado');
      setIsListening(true);
      setError(null);
      retryCountRef.current = 0;
      isActiveRef.current = true;
    };

    recognition.onend = () => {
      console.log('🛑 Speech recognition terminado');
      setIsListening(false);
      
      // Auto-restart solo si está activo y en modo continuo
      if (isActiveRef.current && continuous) {
        console.log('🔄 Reiniciando automáticamente...');
        setTimeout(() => {
          if (isActiveRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (err) {
              console.warn('Error en auto-restart:', err);
              // Solo incrementar retry en errores reales de restart
              retryCountRef.current++;
              if (retryCountRef.current >= maxRetries) {
                handleRecognitionError('restart-failed');
                isActiveRef.current = false;
              }
            }
          }
        }, 500); // Restart más rápido
      }
    };

    recognition.onerror = (event) => {
      console.error('❌ Speech recognition error:', event.error);
      handleRecognitionError(event.error);
    };

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';
      let maxConfidence = 0;

      // Procesar resultados con mejor handling
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;
        const confidence = result[0].confidence || 0;
        
        if (result.isFinal) {
          finalText += text;
          maxConfidence = Math.max(maxConfidence, confidence);
        } else {
          interimText += text;
        }
      }

      // Actualizar transcripciones
      if (finalText) {
        finalTranscriptRef.current += finalText + ' ';
        setTranscript(finalTranscriptRef.current.trim());
        setConfidence(maxConfidence);
        onTranscript?.(finalText, true);
        
        // Reset silence timer
        resetSilenceTimer();
        console.log('✅ Texto final:', finalText, 'Confianza:', maxConfidence);
      }
      
      if (interimText) {
        setInterimTranscript(interimText);
        onTranscript?.(interimText, false);
        resetSilenceTimer();
      }
    };

    recognition.onspeechstart = () => {
      console.log('🗣️ Voz detectada');
      setError(null);
      resetSilenceTimer();
    };

    recognition.onspeechend = () => {
      console.log('🤐 Voz terminada');
      startSilenceTimer();
    };

    recognition.onsoundstart = () => {
      console.log('🔊 Audio detectado');
      setError(null);
    };

    recognition.onsoundend = () => {
      console.log('🔇 Audio terminado');
    };

    recognition.onaudiostart = () => {
      console.log('🎵 Audio iniciado');
      setError(null);
    };

    recognition.onaudioend = () => {
      console.log('🎵 Audio terminado');
    };

    return () => {
      cleanup();
    };
  }, [continuous, interimResults, lang, isSupported]);

  const handleRecognitionError = useCallback((errorType: string) => {
    const errorMessages: Record<string, string> = {
      'no-speech': 'Detectando audio pero sin voz clara. Continúa hablando...',
      'audio-capture': 'Error de captura de audio. Revisa permisos.',
      'not-allowed': 'Permisos denegados. Activa el micrófono.',
      'network': 'Error de red. Verifica tu conexión.',
      'aborted': 'Reconocimiento cancelado.',
      'language-not-supported': 'Idioma no soportado.',
      'service-not-allowed': 'Servicio no disponible.',
      'restart-failed': 'Error al reiniciar el reconocimiento.'
    };

    const message = errorMessages[errorType] || `Error desconocido: ${errorType}`;
    
    // Manejo específico para no-speech
    if (errorType === 'no-speech') {
      // En modo continuo, no-speech es normal cuando hay audio de sistema sin voz
      if (continuous) {
        console.log(`🔇 No speech detected (audio presente), continuando...`);
        // No incrementar retry count para no-speech en modo continuo
        // Solo mostrar mensaje temporal
        setError(message);
        setTimeout(() => {
          if (isActiveRef.current) {
            setError(null);
          }
        }, 3000);
        // No detener el reconocimiento, se reiniciará automáticamente
        return;
      } else {
        retryCountRef.current++;
        if (retryCountRef.current >= maxRetries) {
          setError('No se detecta voz después de varios intentos.');
          isActiveRef.current = false;
        }
      }
    } else if (errorType === 'aborted') {
      // Para aborted, solo limpiar si no fue intencional
      if (isActiveRef.current) {
        console.log('🚫 Recognition aborted, continuando...');
        setTimeout(() => setError(null), 1000);
        return; // No detener isActiveRef para que se reinicie
      }
    } else {
      // Para otros errores, detener completamente
      setError(message);
      isActiveRef.current = false;
      setIsListening(false);
    }

    onError?.(errorType);
  }, [continuous, onError]);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const startSilenceTimer = useCallback(() => {
    resetSilenceTimer();
    
    // Si hay mucho silencio, reiniciar (solo si no hay transcript reciente)
    silenceTimerRef.current = setTimeout(() => {
      if (isActiveRef.current && continuous && !transcript) {
        console.log('⏰ Reiniciando por silencio prolongado sin transcripción');
        stopListening();
        setTimeout(() => startListening(), 1000);
      }
    }, 30000); // 30 segundos de silencio sin transcripción
  }, [continuous, transcript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening) {
      console.log('❌ No se puede iniciar: reconocimiento no disponible o ya activo');
      return;
    }

    console.log('🚀 Iniciando reconocimiento de voz...');
    
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    setConfidence(0);
    finalTranscriptRef.current = '';
    retryCountRef.current = 0;
    isActiveRef.current = true;

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error('Error al iniciar:', err);
      setError('No se pudo iniciar el reconocimiento de voz');
      isActiveRef.current = false;
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    console.log('🛑 Deteniendo reconocimiento de voz...');
    
    isActiveRef.current = false;
    resetSilenceTimer();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error al detener:', err);
      }
    }
    
    setIsListening(false);
  }, [resetSilenceTimer]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    finalTranscriptRef.current = '';
  }, []);

  const cleanup = useCallback(() => {
    console.log('🧹 Limpiando recursos...');
    isActiveRef.current = false;
    resetSilenceTimer();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (err) {
        console.warn('Error en cleanup:', err);
      }
    }
  }, [resetSilenceTimer]);

  // Cleanup en unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
    retryCount: retryCountRef.current,
    maxRetries
  };
}