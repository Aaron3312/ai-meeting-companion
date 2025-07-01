import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Solo para desarrollo
});

export interface SuggestionContext {
  transcript: string;
  meetingType: 'interview' | 'meeting' | 'general';
  participantRole: 'interviewer' | 'interviewee' | 'participant';
}

export async function generateSuggestions(context: SuggestionContext): Promise<string[]> {
  try {
    const systemPrompt = getSystemPrompt(context.meetingType, context.participantRole);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Contexto de la conversación: "${context.transcript}"` }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const suggestions = completion.choices[0]?.message?.content;
    if (!suggestions) return [];

    // Parsear las sugerencias (esperamos una lista separada por líneas)
    return suggestions
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-*]\s*/, '').trim())
      .slice(0, 5); // Máximo 5 sugerencias

  } catch (error) {
    console.error('Error generating suggestions:', error);
    return getFallbackSuggestions(context.meetingType, context.participantRole);
  }
}

function getSystemPrompt(meetingType: string, role: string): string {
  const basePrompt = `Eres un asistente de IA especializado en entrevistas y reuniones de trabajo. Tu función es generar sugerencias útiles y contextualmente relevantes.`;
  
  const rolePrompts = {
    interviewer: `Como entrevistador, necesitas preguntas que profundicen en la experiencia del candidato, evalúen habilidades técnicas y exploren fit cultural.`,
    interviewee: `Como entrevistado, necesitas respuestas que demuestren tus habilidades, experiencia y valor agregado de manera clara y convincente.`,
    participant: `Como participante en reunión, necesitas preguntas que clarifiquen puntos, impulsen la discusión y mantengan el enfoque en los objetivos.`
  };

  const typePrompts = {
    interview: `Contexto: Entrevista de trabajo. Enfócate en evaluación de competencias técnicas, experiencia previa y soft skills.`,
    meeting: `Contexto: Reunión de trabajo. Enfócate en clarificación de objetivos, seguimiento de acciones y toma de decisiones.`,
    general: `Contexto: Conversación profesional. Mantén un enfoque constructivo y orientado a resultados.`
  };

  return `${basePrompt}

${rolePrompts[role as keyof typeof rolePrompts]}

${typePrompts[meetingType as keyof typeof typePrompts]}

Instrucciones:
- Genera entre 3-5 sugerencias cortas y accionables
- Cada sugerencia debe ser una pregunta o frase completa
- Mantén un tono profesional y apropiado
- Basa las sugerencias en el contexto proporcionado
- Responde solo con las sugerencias, una por línea, sin numeración`;
}

function getFallbackSuggestions(meetingType: string, role: string): string[] {
  const suggestions = {
    interviewer: [
      "¿Podrías profundizar más en esa experiencia?",
      "¿Cómo manejaste los desafíos en ese proyecto?",
      "¿Qué tecnologías utilizaste y por qué las elegiste?",
      "¿Cuál fue tu mayor aprendizaje en ese rol?",
      "¿Cómo te ves contribuyendo a nuestro equipo?"
    ],
    interviewee: [
      "En mi experiencia previa he trabajado con...",
      "Un ejemplo específico de esto sería...",
      "Me gustaría destacar que...",
      "Una situación similar que enfrenté fue...",
      "¿Podrían contarme más sobre el equipo y la cultura?"
    ],
    participant: [
      "¿Podrías clarificar ese punto?",
      "¿Cuáles serían los próximos pasos?",
      "¿Cómo se alinea esto con nuestros objetivos?",
      "¿Qué recursos necesitaríamos para esto?",
      "¿Cuál sería el timeline propuesto?"
    ]
  };

  return suggestions[role as keyof typeof suggestions] || suggestions.participant;
}

export async function analyzeMeetingContext(transcript: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Analiza el contexto de una conversación y proporciona insights breves. 
          Responde SOLO con un JSON en este formato:
          {
            "tone": "formal|informal|professional|casual",
            "topic": "technical|business|personal|general",
            "sentiment": "positive|neutral|negative",
            "keywords": ["palabra1", "palabra2", "palabra3"]
          }`
        },
        { role: "user", content: transcript }
      ],
      max_tokens: 150,
      temperature: 0.3,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('No response from OpenAI');

    return JSON.parse(response);
  } catch (error) {
    console.error('Error analyzing context:', error);
    return {
      tone: "professional",
      topic: "general",
      sentiment: "neutral",
      keywords: ["conversación", "profesional"]
    };
  }
}