const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const OpenRouterService = require('../services/openrouterService');

const router = express.Router();
const openRouterService = new OpenRouterService();

// Analyze image endpoint
router.post('/analyze-image', authenticateToken, async (req, res) => {
    try {
        const { imageUrl, question } = req.body;

        if (!imageUrl) {
            return res.status(400).json({ error: 'imageUrl is required' });
        }

        const result = await openRouterService.analyzeImage(
            imageUrl,
            question || 'What is in this image?'
        );

        res.json(result);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to analyze image',
            message: error.message
        });
    }
});

// Chat endpoint
router.post('/chat', authenticateToken, async (req, res) => {
    try {
        const { messages, model } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'messages array is required' });
        }

        const result = await openRouterService.chat(
            messages,
            model || 'anthropic/claude-3-5-sonnet'
        );

        res.json(result);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            error: 'Failed to process chat',
            message: error.message
        });
    }
});

// List available models endpoint
router.get('/models', authenticateToken, async (req, res) => {
    try {
        // Return a list of common models available on OpenRouter
        const models = [
            { id: 'anthropic/claude-3-5-sonnet', name: 'Claude 3.5 Sonnet' },
            { id: 'anthropic/claude-3-opus', name: 'Claude 3 Opus' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
            { id: 'mistral/mistral-7b-instruct', name: 'Mistral 7B' }
        ];

        res.json({ 
            success: true,
            models: models
        });
    } catch (error) {
        res.status(500).json({ 
            error: 'Failed to fetch models',
            message: error.message
        });
    }
});

module.exports = router;
