"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, CheckCircle, AlertCircle, Info } from 'lucide-react';

interface SystemAudioGuideProps {
  onDismiss?: () => void;
  className?: string;
}

export default function SystemAudioGuide({ onDismiss, className = '' }: SystemAudioGuideProps) {
  return (
    <Card className={`border-blue-200 bg-blue-50 dark:bg-blue-900/20 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
          <Monitor className="h-5 w-5" />
          Cómo Capturar Audio del Sistema
        </CardTitle>
        <CardDescription className="text-blue-600 dark:text-blue-400">
          Sigue estos pasos para capturar audio de videollamadas, música y aplicaciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-700 border-blue-300">
              1
            </Badge>
            <div>
              <p className="font-medium text-sm">Haz clic en "Iniciar"</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Se abrirá el diálogo de compartir pantalla
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-700 border-blue-300">
              2
            </Badge>
            <div>
              <p className="font-medium text-sm">Selecciona una pestaña o ventana</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Elige la pestaña con la videollamada o aplicación con audio
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1 bg-green-100 text-green-700 border-green-300">
              3
            </Badge>
            <div>
              <p className="font-medium text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                ¡IMPORTANTE! Marca "Compartir audio del sistema"
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Esta opción aparece en la parte inferior del diálogo
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-700 border-blue-300">
              4
            </Badge>
            <div>
              <p className="font-medium text-sm">Haz clic en "Compartir"</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                La captura de audio comenzará automáticamente
              </p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-yellow-800 dark:text-yellow-200">
                Consejos importantes:
              </p>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-1">
                <li>• Funciona mejor en Chrome y Edge</li>
                <li>• Asegúrate de que la página use HTTPS</li>
                <li>• Si no ves "Compartir audio", actualiza tu navegador</li>
                <li>• Puedes capturar audio de Zoom, Teams, Meet, YouTube, etc.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-md p-3">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-gray-600 mt-0.5" />
            <div>
              <p className="font-medium text-sm text-gray-700 dark:text-gray-300">
                ¿Qué se puede capturar?
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 space-y-1">
                <li>• Audio de videollamadas (Zoom, Teams, Meet)</li>
                <li>• Música de Spotify, YouTube, etc.</li>
                <li>• Audio de presentaciones y videos</li>
                <li>• Sonidos del sistema y notificaciones</li>
              </ul>
            </div>
          </div>
        </div>

        {onDismiss && (
          <div className="flex justify-end">
            <Button onClick={onDismiss} variant="outline" size="sm">
              Entendido
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}