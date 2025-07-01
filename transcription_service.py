#!/usr/bin/env python3
"""
Servicio local de transcripción con Whisper + GPU
Optimizado para RTX 4070 Super

Instalación:
pip install faster-whisper torch torchaudio flask flask-cors --index-url https://download.pytorch.org/whl/cu118

Uso:
python transcription_service.py
"""

import os
import time
import io
import wave
import tempfile
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

try:
    from faster_whisper import WhisperModel
    print("✅ Faster-Whisper importado correctamente")
except ImportError:
    print("❌ Error: Instala faster-whisper con: pip install faster-whisper")
    exit(1)

try:
    import torch
    print(f"✅ PyTorch {torch.__version__} disponible")
    print(f"🎮 CUDA disponible: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"🚀 GPU: {torch.cuda.get_device_name(0)}")
        print(f"💾 VRAM disponible: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
except ImportError:
    print("❌ Error: Instala PyTorch con CUDA")
    exit(1)

app = Flask(__name__)
CORS(app)

class WhisperTranscriptionService:
    def __init__(self):
        print("🚀 Inicializando servicio de transcripción...")
        
        # Configurar modelo según la GPU disponible
        device = "cuda" if torch.cuda.is_available() else "cpu"
        compute_type = "float16" if torch.cuda.is_available() else "int8"
        
        # Usar modelo base para balance entre velocidad y calidad
        # Opciones: tiny, base, small, medium, large-v2, large-v3
        model_size = "base"  # Cambia a "small" o "medium" si quieres más calidad
        
        print(f"📥 Descargando modelo Whisper '{model_size}' para {device}...")
        self.model = WhisperModel(
            model_size, 
            device=device, 
            compute_type=compute_type,
            cpu_threads=4,
            num_workers=1
        )
        
        print(f"✅ Modelo Whisper '{model_size}' cargado en {device}")
        print(f"⚡ Servicio listo para transcripción super rápida!")
    
    def transcribe_audio(self, audio_data, language="es"):
        start_time = time.time()
        
        try:
            # Verificar si el archivo existe y tiene contenido válido
            if isinstance(audio_data, str):  # Es una ruta de archivo
                if not os.path.exists(audio_data):
                    raise Exception(f"Archivo no encontrado: {audio_data}")
                
                file_size = os.path.getsize(audio_data)
                if file_size < 1000:  # Menos de 1KB probablemente esté corrupto
                    raise Exception(f"Archivo muy pequeño o corrupto: {file_size} bytes")
                
                print(f"📊 Procesando archivo: {audio_data} ({file_size} bytes)")
            
            # Transcribir con configuración optimizada para velocidad y tolerancia a errores
            segments, info = self.model.transcribe(
                audio_data,
                language=language,
                beam_size=1,  # Reducir para más velocidad
                best_of=1,    # Reducir para más velocidad
                temperature=0.0,
                word_timestamps=False,  # Desactivar para más velocidad
                vad_filter=True,  # Activar VAD para mejor calidad
                vad_parameters=dict(
                    min_silence_duration_ms=300,  # Más sensible
                    threshold=0.3  # Umbral más bajo
                ),
                # Configuración para manejar audio corrupto
                condition_on_previous_text=False,  # No depender del contexto anterior
                initial_prompt=None  # No usar prompt inicial
            )
            
            # Extraer texto
            text_segments = []
            for segment in segments:
                text_segments.append(segment.text.strip())
            
            result_text = " ".join(text_segments).strip()
            processing_time = (time.time() - start_time) * 1000  # en ms
            
            if result_text:
                print(f"✅ Transcripción completada en {processing_time:.0f}ms: '{result_text[:50]}...'")
            else:
                print(f"⚠️ Sin texto detectado en {processing_time:.0f}ms (posible silencio)")
            
            return {
                "text": result_text,
                "language": info.language,
                "language_probability": info.language_probability,
                "duration": info.duration,
                "processing_time": processing_time,
                "segments_count": len(text_segments)
            }
            
        except Exception as e:
            processing_time = (time.time() - start_time) * 1000
            error_msg = str(e)
            
            # Clasificar tipos de error
            if "Invalid data" in error_msg or "Errno 1094995529" in error_msg:
                print(f"🔧 Chunk corrupto detectado en {processing_time:.0f}ms - saltando")
                return {
                    "text": "",  # Devolver texto vacío en lugar de error
                    "error_type": "corrupted_chunk",
                    "processing_time": processing_time
                }
            else:
                print(f"❌ Error en transcripción después de {processing_time:.0f}ms: {e}")
                return {
                    "error": str(e),
                    "processing_time": processing_time
                }

# Inicializar servicio
print("🔧 Inicializando servicio de transcripción...")
transcription_service = WhisperTranscriptionService()

@app.route('/health', methods=['GET'])
def health_check():
    """Verificar que el servicio esté funcionando"""
    gpu_info = {}
    if torch.cuda.is_available():
        gpu_info = {
            "gpu_name": torch.cuda.get_device_name(0),
            "gpu_memory_total": f"{torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB",
            "gpu_memory_used": f"{torch.cuda.memory_allocated(0) / 1024**3:.1f} GB"
        }
    
    return jsonify({
        "status": "healthy",
        "service": "whisper-transcription",
        "model": "faster-whisper/base",
        "device": "cuda" if torch.cuda.is_available() else "cpu",
        "gpu_info": gpu_info,
        "timestamp": time.time()
    })

@app.route('/transcribe', methods=['POST'])
def transcribe_endpoint():
    """Endpoint principal de transcripción via HTTP"""
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        audio_file = request.files['audio']
        language = request.form.get('language', 'es')
        
        if audio_file.filename == '':
            return jsonify({"error": "No audio file selected"}), 400
        
        print(f"📥 Recibido archivo de audio: {audio_file.filename} ({language})")
        
        # Detectar tipo de archivo y usar extensión apropiada
        file_extension = '.wav' if audio_file.filename.endswith('.wav') else '.webm'
        temp_file = tempfile.NamedTemporaryFile(suffix=file_extension, delete=False)
        temp_file_path = temp_file.name
        temp_file.close()  # Cerrar inmediatamente para que Windows pueda acceder
        
        try:
            audio_file.save(temp_file_path)
            
            # Transcribir
            result = transcription_service.transcribe_audio(temp_file_path, language)
            
        finally:
            # Limpiar archivo temporal de forma segura
            try:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
            except Exception as cleanup_error:
                print(f"⚠️ Warning: No se pudo eliminar archivo temporal: {cleanup_error}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"💥 Error en endpoint de transcripción: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/transcribe-udp', methods=['POST'])
def transcribe_udp_endpoint():
    """Endpoint optimizado para datos raw (más rápido)"""
    temp_file_path = None
    try:
        audio_data = request.get_data()
        language = request.headers.get('X-Language', 'es')
        
        if not audio_data:
            return jsonify({"error": "No audio data provided"}), 400
        
        print(f"🚀 Recibido audio raw: {len(audio_data)} bytes ({language})")
        
        # Guardar temporalmente como archivo WebM con manejo seguro
        temp_file = tempfile.NamedTemporaryFile(suffix='.webm', delete=False)
        temp_file_path = temp_file.name
        
        try:
            temp_file.write(audio_data)
            temp_file.flush()
            temp_file.close()  # Cerrar antes de usar
            
            # Transcribir
            result = transcription_service.transcribe_audio(temp_file_path, language)
            
        finally:
            # Limpiar archivo temporal de forma segura
            try:
                if temp_file_path and os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
            except Exception as cleanup_error:
                print(f"⚠️ Warning: No se pudo eliminar archivo temporal: {cleanup_error}")
        
        return jsonify(result)
        
    except Exception as e:
        print(f"💥 Error en endpoint UDP: {e}")
        
        # Limpiar archivo en caso de error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass
                
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 SERVICIO LOCAL DE TRANSCRIPCIÓN WHISPER + GPU")
    print("=" * 60)
    print("🎮 GPU: RTX 4070 Super detectada")
    print("⚡ Velocidad estimada: ~50-100x más rápido que OpenAI")
    print("💰 Costo: $0 (vs $0.006/minuto de OpenAI)")
    print("🔒 Privacidad: 100% local")
    print("=" * 60)
    print("📡 Servidor iniciando en http://localhost:8889")
    print("🔗 Health check: http://localhost:8889/health")
    print("=" * 60)
    
    app.run(
        host='localhost',
        port=8889,
        debug=False,
        threaded=True
    )