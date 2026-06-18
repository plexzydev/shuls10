import { useState, useRef, useEffect } from 'react';
import { useOpenRouter } from '../hooks/useOpenRouter';

export default function OpenRouterChat() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' o 'image'
  const messagesEndRef = useRef(null);
  const { chat, analyzeImage, loading, error } = useOpenRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await chat([...messages, userMessage]);
      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Error: ${err.message}` }
      ]);
    }
  };

  const handleAnalyzeImage = async (e) => {
    e.preventDefault();
    if (!imageUrl.trim() || loading) return;

    try {
      const result = await analyzeImage(imageUrl);
      setMessages((prev) => [
        ...prev,
        {
          role: 'user',
          content: `[Imagen analizada: ${imageUrl}]`,
          image: imageUrl
        },
        { role: 'assistant', content: result }
      ]);
      setImageUrl('');
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error al analizar imagen: ${err.message}`
        }
      ]);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-slate-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand">OpenRouter AI</h1>
          <p className="text-sm text-slate-400">Powered by Claude 3.5 Sonnet</p>
        </div>
        <button
          onClick={clearChat}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
        >
          Limpiar Chat
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('chat')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'chat'
              ? 'bg-brand text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          💬 Chat
        </button>
        <button
          onClick={() => setActiveTab('image')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'image'
              ? 'bg-brand text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          🖼️ Analizar Imagen
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-900 text-red-200 rounded-lg text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto mb-4 p-4 bg-slate-800 rounded-lg border border-slate-700">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500">
            <p className="text-center">
              {activeTab === 'chat'
                ? 'Inicia una conversación...'
                : 'Analiza una imagen...'}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-3 p-3 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-blue-900 text-blue-100 ml-8'
                  : 'bg-slate-700 text-slate-100 mr-8'
              }`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="analyzed"
                  className="max-w-xs rounded-lg mb-2"
                />
              )}
              <p className="text-sm break-words">{msg.content}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      {activeTab === 'chat' ? (
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Escribe tu mensaje..."
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="px-6 py-2 bg-brand hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳' : '📤'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleAnalyzeImage} className="flex gap-2">
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="URL de la imagen..."
            disabled={loading}
            className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={loading || !imageUrl.trim()}
            className="px-6 py-2 bg-brand hover:bg-green-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '⏳' : '🔍'}
          </button>
        </form>
      )}

      {/* Loading State */}
      {loading && (
        <div className="mt-2 text-center text-sm text-slate-400">
          ⌛ Procesando...
        </div>
      )}
    </div>
  );
}
