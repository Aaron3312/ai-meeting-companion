import HybridAudioTranscription from '@/components/meeting/HybridAudioTranscription';

export default function TestAudioPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">🧪 Test Audio del Sistema</h1>
        <HybridAudioTranscription />
      </div>
    </div>
  );
}