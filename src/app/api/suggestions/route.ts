import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Aaron's professional profile for personalized suggestions
const AARON_PROFILE = {
  name: "Aaron Hernández Jiménez",
  role: "Full Stack Developer & Cloud Solutions Architect",
  expertise: [
    "React", "Next.js", "Node.js", "TypeScript", "AWS", "GCP", "Azure", 
    "Docker", "Kubernetes", "AI/ML", "Computer Vision", "YOLOv5", "TensorFlow"
  ],
  projects: [
    "Cronos Project: AI-powered project management platform",
    "Security Multi-Agent System: Prison security with autonomous drones",
    "JAI-VIER: Task management system with Next.js"
  ],
  interests: ["Cloud Architecture", "AI/ML Integration", "DevOps", "Full-Stack Development"]
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, meetingType = 'general', participantRole = 'participant' } = body;

    if (!transcript || typeof transcript !== 'string') {
      return NextResponse.json(
        { error: 'Transcript is required and must be a string' },
        { status: 400 }
      );
    }

    // Generate personalized suggestions using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for Aaron Hernández Jiménez, a ${AARON_PROFILE.role} with expertise in: ${AARON_PROFILE.expertise.join(', ')}.

His notable projects include: ${AARON_PROFILE.projects.join('; ')}.

Based on the meeting transcript, provide intelligent, personalized suggestions that:
1. Draw from Aaron's technical expertise
2. Suggest relevant questions based on his experience
3. Identify opportunities to share his project insights
4. Recommend technical deep-dives where appropriate
5. Help him demonstrate leadership and technical knowledge

Meeting type: ${meetingType}
Role: ${participantRole}

Respond with a JSON array of suggestions, each containing:
{
  "type": "question|insight|action|technical",
  "category": "meeting|interview|technical|leadership", 
  "title": "Brief title",
  "content": "Detailed suggestion",
  "priority": "high|medium|low",
  "context": "Why this suggestion is relevant"
}`
        },
        {
          role: "user",
          content: `Analyze this meeting transcript and provide personalized suggestions for Aaron: "${transcript}"`
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const suggestionsText = completion.choices[0]?.message?.content || '[]';
    let suggestions;
    
    try {
      suggestions = JSON.parse(suggestionsText);
    } catch {
      // Fallback if JSON parsing fails
      suggestions = [{
        type: "insight",
        category: "meeting",
        title: "Participación Activa",
        content: "Basado en tu experiencia, considera compartir insights sobre implementación técnica o mejores prácticas.",
        priority: "medium",
        context: "General participation suggestion"
      }];
    }

    // Add Aaron's expertise context
    const analysis = {
      keyTopics: extractKeyTopics(transcript),
      technicalLevel: assessTechnicalLevel(transcript),
      opportunityAreas: identifyOpportunities(transcript),
      aaronRelevance: assessAaronRelevance(transcript)
    };

    return NextResponse.json({
      suggestions,
      analysis,
      timestamp: new Date().toISOString(),
      profile: AARON_PROFILE.name
    });

  } catch (error) {
    console.error('Error in suggestions API:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

function extractKeyTopics(transcript: string): string[] {
  const topics = [];
  const lowerTranscript = transcript.toLowerCase();
  
  // Technical topics
  if (lowerTranscript.includes('react') || lowerTranscript.includes('frontend')) topics.push('Frontend Development');
  if (lowerTranscript.includes('cloud') || lowerTranscript.includes('aws')) topics.push('Cloud Architecture');
  if (lowerTranscript.includes('ia') || lowerTranscript.includes('inteligencia artificial')) topics.push('AI/ML');
  if (lowerTranscript.includes('proyecto') || lowerTranscript.includes('gestión')) topics.push('Project Management');
  
  return topics;
}

function assessTechnicalLevel(transcript: string): 'basic' | 'intermediate' | 'advanced' {
  const technicalTerms = ['api', 'microservicio', 'kubernetes', 'docker', 'arquitectura', 'escalabilidad'];
  const count = technicalTerms.filter(term => transcript.toLowerCase().includes(term)).length;
  
  if (count >= 3) return 'advanced';
  if (count >= 1) return 'intermediate';
  return 'basic';
}

function identifyOpportunities(transcript: string): string[] {
  const opportunities = [];
  const lowerTranscript = transcript.toLowerCase();
  
  if (lowerTranscript.includes('problema') || lowerTranscript.includes('desafío')) {
    opportunities.push('Share problem-solving experience');
  }
  if (lowerTranscript.includes('cómo') || lowerTranscript.includes('implementar')) {
    opportunities.push('Offer technical implementation insights');
  }
  if (lowerTranscript.includes('experiencia') || lowerTranscript.includes('has trabajado')) {
    opportunities.push('Share project experience');
  }
  
  return opportunities;
}

function assessAaronRelevance(transcript: string): number {
  const relevantTerms = [
    ...AARON_PROFILE.expertise.map(skill => skill.toLowerCase()),
    'proyecto', 'desarrollo', 'arquitectura', 'sistema', 'aplicación'
  ];
  
  const matches = relevantTerms.filter(term => 
    transcript.toLowerCase().includes(term)
  ).length;
  
  return Math.min(matches / relevantTerms.length * 100, 100);
}

export async function GET() {
  return NextResponse.json({
    message: 'Suggestions API is working',
    status: 'healthy'
  });
}