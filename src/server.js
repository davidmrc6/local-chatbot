import express from 'express';
import axios from 'axios';
import cors from 'cors';

const PORT = 3000;
const OLLAMA_URL = 'http://localhost:11434/api/generate';

const app = express();

app.use(cors());
app.use(express.json());

// Message history configuration
const conversationStore = new Map();
const MAX_HISTORY = 12;
const SYSTEM_PROMPT = "You are a helpful AI Assistant."; // Introduce initial prompt here

function formatConversationHistory(messages) {
    return messages.map(msg =>
        `${msg.role}: ${msg.content}`
    ).join('\n\n');
}

// Endpoint to handle LLM requests
app.post('/ask', async (req, res) => {
    try {

        const { prompt, model = 'llama3', sessionId } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        if (!sessionId) {
            return res.status(400).json({ error: 'Session ID is required ' });
        }

        if (!conversationStore.has(sessionId)) {
            conversationStore.set(sessionId, [{
                role: 'system',
                content: SYSTEM_PROMPT
            }]);
        }

        const conversationHistory = conversationStore.get(sessionId);

        // Add user message to history
        conversationHistory.push({
            role: 'user',
            content: prompt
        });

        // Maintain sliding window of messages
        if (conversationHistory.length > MAX_HISTORY) {
            const systemPrompt = conversationHistory[0];
            conversationHistory.splice(1, conversationHistory.length - MAX_HISTORY);
            if (!conversationHistory.includes(systemPrompt)) {
                conversationHistory.unshift(systemPrompt);
            }
        }

        // Format full prompt
        const fullPrompt = formatConversationHistory(conversationHistory);

        // Headers for server-sent requests
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const response = await axios.post(OLLAMA_URL, {
            model: model,
            prompt: fullPrompt,
            stream: true
        }, {
            responseType: 'stream'
        });

        let assistantResponse = '';

        // Forward streaming response
        response.data.on('data', (chunk) => {
            try {
                const lines = chunk.toString().split('\n').filter(Boolean);
                lines.forEach(line => {
                    const parsedData = JSON.parse(line);

                    if (parsedData.done) {
                        conversationHistory.push({
                            role: 'assistant',
                            content: assistantResponse
                        });

                        res.write('{"done": true}\n\n');
                        res.end();
                        return;
                    }

                    if (parsedData.response) {
                        assistantResponse += parsedData.response;
                        res.write(`data: ${JSON.stringify({ text: parsedData.response })}\n\n`);
                    }
                });
            } catch (error) {
                console.error('Error parsing chunk:', error);
            }
        });

        // Handle client disconnmect
        req.on('close', () => {
            response.data.destroy();
        });

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({
            error: 'Failed to process request',
            details: error.message
        });
    }
});

// Endpoint to clear conversation history
app.post('/clear-history', (req, res) => {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
    }

    conversationStore.delete(sessionId);
    res.json({ message: 'Conversation history cleared' });
});


// Endpoint to get conversation history
app.get('/history/:sessionId', (req, res) => {
    const { sessionId } = req.params;

    if (!conversationStore.has(sessionId)) {
        return res.status(404).json({ error: 'Session not found' });
    }

    res.json(conversationStore.get(sessionId));
});


// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});


// Start server
app.listen(PORT, () => {
    console.log(`App listening at http://localhost:${PORT}`);
})
