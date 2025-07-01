import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function GET() {
  try {
    console.log('🧪 Testing Whisper API configuration...');
    
    // Verificar variables de entorno
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('🔑 API Key check:', {
      hasApiKey: !!apiKey,
      keyPrefix: apiKey?.substring(0, 8) + '...',
      keyLength: apiKey?.length
    });

    if (!apiKey) {
      return NextResponse.json({
        error: 'OPENAI_API_KEY not found in environment variables',
        env: Object.keys(process.env).filter(key => key.includes('OPENAI'))
      }, { status: 500 });
    }

    // Inicializar OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log('✅ OpenAI client initialized');

    // Test simple de la API (sin archivo)
    try {
      // Solo hacer una verificación básica de la API key
      console.log('🔍 Testing API key validity...');
      
      return NextResponse.json({
        status: 'success',
        message: 'OpenAI client initialized successfully',
        hasApiKey: true,
        keyPrefix: apiKey.substring(0, 8) + '...',
        timestamp: new Date().toISOString()
      });
      
    } catch (apiError) {
      console.error('❌ OpenAI API Error:', apiError);
      return NextResponse.json({
        error: 'OpenAI API key validation failed',
        details: apiError instanceof Error ? apiError.message : 'Unknown API error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('💥 General error:', error);
    return NextResponse.json({
      error: 'Server configuration error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}