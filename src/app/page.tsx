"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, MicOff, Brain, Users, Calendar, Zap, MessageSquare } from "lucide-react";
import HybridAudioTranscription from "@/components/meeting/HybridAudioTranscription";

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const handleTranscriptUpdate = (newTranscript: string, isFinal: boolean) => {
    if (isFinal) {
      setTranscript(prev => prev + " " + newTranscript);
      // Aquí implementaremos las sugerencias de IA
      generateSuggestions(newTranscript);
    }
  };

  const generateSuggestions = (text: string) => {
    // Simulación de sugerencias - luego conectaremos con OpenAI
    const mockSuggestions = [
      "¿Podrías profundizar más en ese tema?",
      "¿Cuál ha sido tu experiencia con tecnologías similares?",
      "¿Qué desafíos has enfrentado en proyectos anteriores?"
    ];
    setSuggestions(mockSuggestions);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Meeting Companion
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tu asistente inteligente para entrevistas y juntas de trabajo en tiempo real.
          </p>
        </div>

        <Tabs defaultValue="transcription" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transcription" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Transcripción
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Sugerencias
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Análisis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcription" className="mt-6">
            <HybridAudioTranscription onTranscriptUpdate={handleTranscriptUpdate} />
          </TabsContent>

          <TabsContent value="suggestions" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    Sugerencias Inteligentes
                  </CardTitle>
                  <CardDescription>
                    Preguntas y respuestas sugeridas basadas en el contexto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {suggestions.length > 0 ? (
                    <div className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <p className="text-sm">{suggestion}</p>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-2 h-6 text-xs"
                            onClick={() => navigator.clipboard.writeText(suggestion)}
                          >
                            Copiar
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Las sugerencias aparecerán cuando comiences a transcribir
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contexto de la Conversación</CardTitle>
                  <CardDescription>
                    Análisis del tema y tono actual
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {transcript ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                        <h4 className="font-medium text-sm mb-2">Transcripción Actual:</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {transcript.slice(-200)}...
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                          <h5 className="font-medium text-sm text-green-700 dark:text-green-300">Tono</h5>
                          <p className="text-xs text-green-600 dark:text-green-400">Profesional</p>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-md">
                          <h5 className="font-medium text-sm text-purple-700 dark:text-purple-300">Tema</h5>
                          <p className="text-xs text-purple-600 dark:text-purple-400">Técnico</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">
                        El análisis aparecerá durante la conversación
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    Métricas de Sesión
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Duración</span>
                      <Badge variant="outline">00:00:00</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Palabras transcritas</span>
                      <Badge variant="outline">{transcript.split(' ').length - 1}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sugerencias generadas</span>
                      <Badge variant="outline">{suggestions.length}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estado del Sistema</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Reconocimiento de voz</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Activo
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">IA Assistant</span>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                        Simulado
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Firebase</span>
                      <Badge variant="outline" className="text-gray-600 border-gray-600">
                        Pendiente
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Próximas Funciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      OpenAI GPT-4 integration
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Exportar transcripciones
                    </li>
                    <li className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      Plantillas por industria
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
