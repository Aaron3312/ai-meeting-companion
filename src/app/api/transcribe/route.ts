import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    console.log('📤 Nueva solicitud de transcripción recibida');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = formData.get('language') as string || 'es';

    console.log('📋 Datos recibidos:', {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      language
    });

    if (!file) {
      console.error('❌ No se proporcionó archivo de audio');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Verificar que es un archivo de audio
    if (!file.type.startsWith('audio/')) {
      console.error('❌ Tipo de archivo inválido:', file.type);
      return NextResponse.json(
        { error: `File must be an audio file, received: ${file.type}` },
        { status: 400 }
      );
    }

    // Verificar tamaño del archivo
    const maxSize = 25 * 1024 * 1024; // 25MB límite de OpenAI
    if (file.size > maxSize) {
      console.error('❌ Archivo demasiado grande:', file.size);
      return NextResponse.json(
        { error: `File too large: ${file.size} bytes. Max: ${maxSize} bytes` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      console.error('❌ Archivo vacío');
      return NextResponse.json(
        { error: 'Audio file is empty' },
        { status: 400 }
      );
    }

    console.log('🎵 Transcribiendo archivo:', {
      name: file.name,
      size: file.size,
      type: file.type,
      language
    });

    // Verificar que tenemos la API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY no configurada');
      console.log('🔍 Variables de entorno disponibles:', Object.keys(process.env).filter(key => key.includes('OPENAI')));
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    console.log('🔑 API Key configurada:', {
      keyPrefix: process.env.OPENAI_API_KEY.substring(0, 8) + '...',
      keyLength: process.env.OPENAI_API_KEY.length
    });
    console.log('🚀 Enviando a OpenAI...');

    // Transcribir con Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: language,
      response_format: 'json',
      temperature: 0.2,
    });

    const processingTime = Date.now() - startTime;
    
    console.log('✅ Transcripción completada:', {
      textLength: transcription.text?.length || 0,
      textPreview: transcription.text?.substring(0, 100) + '...',
      processingTime: `${processingTime}ms`,
      language
    });

    const result = {
      text: transcription.text,
      language: language,
      duration: file.size / 16000, // Estimación aproximada
      timestamp: new Date().toISOString(),
      processingTime,
      fileSize: file.size
    };

    console.log('📤 Enviando respuesta:', {
      textLength: result.text.length,
      processingTime: result.processingTime
    });

    return NextResponse.json(result);

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('💥 Error en transcripción:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${processingTime}ms`
    });
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured or invalid' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Try again later.' },
          { status: 429 }
        );
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timeout. File might be too large.' },
          { status: 408 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Transcription API is working',
    models: ['whisper-1'],
    supported_formats: ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
  });
}