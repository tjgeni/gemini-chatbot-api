document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const sendButton = chatForm.querySelector('button');

  /**
   * Appends a message to the chat box.
   * @param {string} sender - Who sent the message ('user' or 'bot').
   * @param {string} message - The message content.
   */
  function addMessage(sender, message) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', `${sender}-message`);

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('bubble');
    messageBubble.textContent = message;

    messageContainer.appendChild(messageBubble);
    chatBox.appendChild(messageContainer);
    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to the latest message
  }

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    addMessage('user', userMessage);
    userInput.value = '';

    // Disable form controls while waiting for a response
    userInput.disabled = true;
    sendButton.disabled = true;

    // Show a thinking indicator
    const thinkingIndicator = document.createElement('div');
    thinkingIndicator.classList.add('message', 'bot-message');
    thinkingIndicator.innerHTML = '<div class="bubble">Thinking...</div>';
    chatBox.appendChild(thinkingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      // This is the fetch() function to connect to your backend
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: 'Server returned an error.' }));
        throw new Error(errorData.message || 'Network response was not ok.');
      }

      const data = await response.json();
      // The backend returns a JSON object like { reply: "..." }
      const botMessage = data.reply;
      console.log(botMessage);

      chatBox.removeChild(thinkingIndicator);
      addMessage('bot', botMessage);
    } catch (error) {
      console.error('Error fetching from /api/chat:', error);
      chatBox.removeChild(thinkingIndicator);
      addMessage('bot', `Sorry, something went wrong: ${error.message}`);
    } finally {
      // Re-enable form controls
      userInput.disabled = false;
      sendButton.disabled = false;
      userInput.focus();
    }
  });
});
