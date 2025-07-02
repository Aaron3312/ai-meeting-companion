"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  X, 
  CheckSquare, 
  Lightbulb, 
  AlertTriangle,
  Target,
  Brain,
  Clock,
  Copy,
  Archive
} from 'lucide-react';

interface Notification {
  id: string;
  type: 'decision' | 'action' | 'opportunity' | 'risk' | 'question';
  title: string;
  content: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  isRead: boolean;
  suggestedAction?: string;
}

interface RealTimeNotificationsProps {
  newInsight?: any;
  className?: string;
}

export default function RealTimeNotifications({ 
  newInsight,
  className = '' 
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeNotification, setActiveNotification] = useState<Notification | null>(null);

  // Procesar nuevos insights como notificaciones
  useEffect(() => {
    if (newInsight && newInsight.priority === 'high') {
      const notification: Notification = {
        id: `notif-${Date.now()}`,
        type: newInsight.type,
        title: getNotificationTitle(newInsight.type),
        content: newInsight.content,
        timestamp: new Date(),
        priority: newInsight.priority,
        isRead: false,
        suggestedAction: newInsight.suggestedAction
      };

      setNotifications(prev => [notification, ...prev.slice(0, 9)]); // Máximo 10
      setActiveNotification(notification);

      // Auto-hide después de 8 segundos
      setTimeout(() => {
        setActiveNotification(null);
      }, 8000);
    }
  }, [newInsight]);

  const getNotificationTitle = (type: string): string => {
    switch (type) {
      case 'decision': return '🎯 Decisión Importante Detectada';
      case 'action': return '📋 Nueva Acción Identificada';
      case 'opportunity': return '💡 Oportunidad Detectada';
      case 'risk': return '⚠️ Riesgo Identificado';
      case 'question': return '❓ Pregunta Importante';
      default: return '🔍 Insight Detectado';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'decision': return <CheckSquare className="h-5 w-5" />;
      case 'action': return <Target className="h-5 w-5" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5" />;
      case 'risk': return <AlertTriangle className="h-5 w-5" />;
      case 'question': return <Brain className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'decision': return 'border-green-500 bg-green-50';
      case 'action': return 'border-blue-500 bg-blue-50';
      case 'opportunity': return 'border-yellow-500 bg-yellow-50';
      case 'risk': return 'border-red-500 bg-red-50';
      case 'question': return 'border-purple-500 bg-purple-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const dismissNotification = useCallback(() => {
    setActiveNotification(null);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  }, []);

  const copyNotification = useCallback((notification: Notification) => {
    const text = `${notification.title}\n${notification.content}\n${notification.suggestedAction ? `Acción: ${notification.suggestedAction}` : ''}`;
    navigator.clipboard.writeText(text);
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    setActiveNotification(null);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Notificación activa flotante */}
      {activeNotification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-5">
          <Card className={`w-80 border-l-4 shadow-lg ${getNotificationColor(activeNotification.type)}`}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {getNotificationIcon(activeNotification.type)}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">
                      {activeNotification.title}
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      {activeNotification.content}
                    </p>
                    {activeNotification.suggestedAction && (
                      <div className="bg-white/70 rounded p-2 mb-2">
                        <p className="text-xs font-medium">Acción sugerida:</p>
                        <p className="text-xs text-gray-600">
                          {activeNotification.suggestedAction}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {activeNotification.priority}
                      </Badge>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {activeNotification.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={() => copyNotification(activeNotification)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={dismissNotification}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Panel de historial de notificaciones */}
      {notifications.length > 0 && (
        <Card className="mt-4">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm">
                Historial de Insights ({notifications.filter(n => !n.isRead).length} no leídos)
              </h3>
              <Button
                size="sm"
                variant="outline"
                onClick={clearAllNotifications}
                className="h-6 text-xs"
              >
                <Archive className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            </div>
            
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-2 rounded border text-xs ${
                    notification.isRead 
                      ? 'bg-gray-50 border-gray-200 opacity-60' 
                      : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{notification.title}</p>
                        <p className="text-gray-600 mt-0.5">
                          {notification.content.length > 60 
                            ? `${notification.content.slice(0, 60)}...`
                            : notification.content
                          }
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs h-4">
                            {notification.type}
                          </Badge>
                          <span className="text-gray-400">
                            {notification.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.isRead && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <CheckSquare className="h-3 w-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={() => copyNotification(notification)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}