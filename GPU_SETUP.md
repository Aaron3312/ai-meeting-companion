# Servicio Local GPU de Transcripción 🚀

Este documento te guía para configurar el servicio local de transcripción con tu RTX 4070 Super para obtener velocidades de transcripción ~50-100x más rápidas que OpenAI.

## 🛠️ Instalación Rápida

### 1. Instalar Dependencias Python

```bash
# Instalar PyTorch con CUDA 11.8 (compatible con RTX 4070 Super)
pip install faster-whisper torch torchaudio flask flask-cors --index-url https://download.pytorch.org/whl/cu118
```

### 2. Iniciar Servicio Local

```bash
# En una terminal separada, ejecutar:
python transcription_service.py
```

Deberías ver algo como:
```
✅ Faster-Whisper importado correctamente
✅ PyTorch 2.1.0 disponible
🎮 CUDA disponible: True
🚀 GPU: NVIDIA GeForce RTX 4070 Super
💾 VRAM disponible: 12.0 GB
📥 Descargando modelo Whisper 'base' para cuda...
✅ Modelo Whisper 'base' cargado en cuda
⚡ Servicio listo para transcripción super rápida!
📡 Servidor iniciando en http://localhost:8889
```

### 3. Usar en la Aplicación

1. Abre tu aplicación web
2. Ve al componente de Transcripción Híbrida  
3. Cambia de "OpenAI Cloud" a "GPU Local ✅"
4. ¡Listo! Ahora tienes transcripción ultra rápida y gratuita

## 🔧 Configuración Avanzada

### Modelos Disponibles

Cambia el modelo en `transcription_service.py` línea 53:

- `tiny` - Muy rápido, menor calidad
- `base` - Balance óptimo (recomendado)
- `small` - Mejor calidad, un poco más lento
- `medium` - Excelente calidad, más lento
- `large-v2` o `large-v3` - Máxima calidad, el más lento

### Optimización GPU

Para RTX 4070 Super (12GB VRAM):
- Modelo `base`: ~50ms por chunk de audio
- Modelo `small`: ~100ms por chunk de audio  
- Modelo `medium`: ~200ms por chunk de audio

## 🆚 Comparación vs OpenAI

| Característica | OpenAI Cloud | GPU Local |
|----------------|--------------|-----------|
| **Velocidad** | ~2-5 segundos | ~50-200ms |
| **Costo** | $0.006/minuto | $0 (gratis) |
| **Privacidad** | Envía audio a OpenAI | 100% local |
| **Límites** | Rate limits | Sin límites |
| **Disponibilidad** | Requiere internet | Funciona offline |

## 🐛 Solución de Problemas

### Error: CUDA no disponible
```bash
# Verificar instalación CUDA
python -c "import torch; print(torch.cuda.is_available())"
```

### Error: No se puede conectar al servicio
- Verifica que el servicio esté corriendo en http://localhost:8889
- Revisa que no haya otro proceso usando el puerto 8889

### Error: Memoria insuficiente
- Usa un modelo más pequeño (`tiny` o `base`)
- Cierra otras aplicaciones que usen GPU

## ⚡ Tips de Rendimiento

1. **Mantén el servicio corriendo**: No lo reinicies innecesariamente
2. **Usa modelo base**: Es el mejor balance velocidad/calidad
3. **Monitoring GPU**: Usa `nvidia-smi` para monitorear uso

## 🔄 Actualizaciones

Para actualizar el servicio:
```bash
pip install --upgrade faster-whisper torch torchaudio
```

---

¡Disfruta de transcripción ultrarrápida con tu RTX 4070 Super! 🎮⚡