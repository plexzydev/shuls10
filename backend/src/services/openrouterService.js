const fetch = require('node-fetch');

class OpenRouterService {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.apiUrl = 'https://openrouter.ai/api/v1';
    }

    async analyzeImage(imageUrl, question = "What is in this image?") {
        if (!this.apiKey) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }

        try {
            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'http://localhost:5173',
                    'X-Title': 'Shuls Extension'
                },
                body: JSON.stringify({
                    model: 'anthropic/claude-3.5-sonnet',
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'text',
                                    text: question
                                },
                                {
                                    type: 'image_url',
                                    image_url: {
                                        url: imageUrl
                                    }
                                }
                            ]
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[OpenRouter] API Error:', errorData);
                throw new Error(errorData.error?.message || 'OpenRouter API error');
            }

            const data = await response.json();

            return {
                success: true,
                result: data.choices[0].message.content,
                model: data.model,
                usage: data.usage
            };
        } catch (error) {
            console.error('[OpenRouter] Error analyzing image:', error.message);
            throw error;
        }
    }

    async chat(messages, model = 'anthropic/claude-3.5-sonnet') {
        if (!this.apiKey) {
            throw new Error('OPENROUTER_API_KEY is not configured');
        }

        try {
            const response = await fetch(`${this.apiUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'http://localhost:5173',
                    'X-Title': 'Shuls Extension'
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('[OpenRouter] API Error:', errorData);
                throw new Error(errorData.error?.message || 'OpenRouter API error');
            }

            const data = await response.json();

            return {
                success: true,
                result: data.choices[0].message.content,
                model: data.model,
                usage: data.usage
            };
        } catch (error) {
            console.error('[OpenRouter] Error in chat:', error.message);
            throw error;
        }
    }
}

module.exports = OpenRouterService;
