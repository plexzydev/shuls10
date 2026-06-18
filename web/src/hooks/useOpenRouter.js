import { useState } from 'react';

export function useOpenRouter() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getToken = () => {
    return localStorage.getItem('shuls_token') || '';
  };

  const analyzeImage = async (imageUrl, question = '¿Qué hay en esta imagen?') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/openrouter/analyze-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ imageUrl, question })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }

      const data = await response.json();
      return data.result;
    } catch (err) {
      setError(err.message);
      console.error('[OpenRouter Error]', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const chat = async (messages, model = 'anthropic/claude-3.5-sonnet') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/openrouter/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ messages, model })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error en la respuesta del servidor');
      }

      const data = await response.json();
      return data.result;
    } catch (err) {
      setError(err.message);
      console.error('[OpenRouter Error]', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAvailableModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/openrouter/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!response.ok) throw new Error('Error obteniendo modelos');

      const data = await response.json();
      return data.models;
    } catch (err) {
      setError(err.message);
      console.error('[OpenRouter Error]', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeImage, chat, getAvailableModels, loading, error };
}
