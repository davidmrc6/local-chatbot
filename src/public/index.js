const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const submitButton = document.getElementById('submitButton');
const chatContainer = document.getElementById('chatContainer');

// Create message
function addMessage(message, isUser = false, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'} ${isError ? 'error-message' : ''}`;
    messageDiv.textContent = message;
    return messageDiv;
}

chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message = userInput.value.trim();
    if (!message) return;

    chatContainer.appendChild(addMessage(message, true));

    const botMessageDiv = addMessage('');
    chatContainer.appendChild(botMessageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Disable input while processing
    userInput.value = '';
    userInput.disabled = true;
    submitButton.disabled = true;

    try {
        const response = await fetch('http://localhost:3000/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: message,
                sessionId: '1'
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP returned an error with status ${response.status}.`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) {
                break;
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);

                    const parsedData = JSON.parse(data);
                    fullResponse += parsedData.text;
                    botMessageDiv.textContent = fullResponse;
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
        botMessageDiv.textContent = `Error: ${error.message}`;
        botMessageDiv.classList.add('error-message');
    } finally {
        userInput.disabled = false;
        submitButton.disabled = false;
        userInput.focus();
    }
})
