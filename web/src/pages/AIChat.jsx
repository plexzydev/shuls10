import OpenRouterChat from '../components/OpenRouterChat';

export default function AIChat() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-slate-900">
      <div className="max-w-6xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🤖 AI Chat Assistant
          </h1>
          <p className="text-slate-400">
            Powered by OpenRouter with Claude 3.5 Sonnet
          </p>
        </div>
        
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-6 backdrop-blur-sm">
          <OpenRouterChat />
        </div>
      </div>
    </div>
  );
}
