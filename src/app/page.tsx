"use client";

import MeetingDashboard from "@/components/meeting/MeetingDashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            AI Meeting Companion
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Tu asistente inteligente para entrevistas y juntas de trabajo en tiempo real.
            Optimizado para Aaron Hernández - Full Stack Developer & Cloud Solutions Architect.
          </p>
        </div>

        <MeetingDashboard />
      </div>
    </div>
  );
}
