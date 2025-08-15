document.addEventListener('DOMContentLoaded', () => {
  const chatForm = document.getElementById('chat-form');
  const userInput = document.getElementById('user-input');
  const chatBox = document.getElementById('chat-box');
  const sendButton = chatForm.querySelector('button[type="submit"]');

  /**
   * Appends a message to the chat box.
   * @param {string} sender - The sender of the message ('user' or 'bot').
   * @param {string} message - The content of the message.
   */
  function addMessage(sender, message) {
    const messageContainer = document.createElement('div');
    messageContainer.classList.add('message', `${sender}-message`);

    const messageBubble = document.createElement('div');
    messageBubble.classList.add('bubble');
    // Use innerText to preserve newlines from the AI response
    messageBubble.innerText = message;

    messageContainer.appendChild(messageBubble);
    chatBox.appendChild(messageContainer);
    // Scroll to the bottom to see the latest message
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Handle form submission
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userMessage = userInput.value.trim();
    if (!userMessage) {
      return; // Don't send empty messages
    }

    // Add user's message to the chat box
    addMessage('user', userMessage);
    userInput.value = ''; // Clear the input field

    // Disable the form while waiting for the bot's response
    userInput.disabled = true;
    sendButton.disabled = true;

    // Show a temporary "Thinking..." message
    const thinkingIndicator = document.createElement('div');
    thinkingIndicator.classList.add('message', 'bot-message');
    thinkingIndicator.innerHTML = '<div class="bubble">Thinking...</div>';
    chatBox.appendChild(thinkingIndicator);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Match the backend API spec
        body: JSON.stringify({
          messages: [{ role: 'user', content: userMessage }],
        }),
      });

      // Remove the "Thinking..." indicator
      chatBox.removeChild(thinkingIndicator);

      if (!response.ok) {
        // For HTTP errors like 4xx, 5xx
        throw new Error('Failed to get response from server.');
      }

      const data = await response.json();

      // Check if the response has the 'result' property
      if (data?.result) {
        addMessage('bot', data.result);
      } else {
        // Handle cases where the response is ok, but no result is provided
        addMessage('bot', 'Sorry, no response received.');
      }
    } catch (error) {
      // This catches network errors or the error thrown above
      if (chatBox.contains(thinkingIndicator)) {
        chatBox.removeChild(thinkingIndicator);
      }
      // Display a generic error message for any failure
      addMessage('bot', error.message || 'Failed to get response from server.');
      console.error('Error sending message:', error);
    } finally {
      // Re-enable the form controls
      userInput.disabled = false;
      sendButton.disabled = false;
      userInput.focus();
    }
  });
});
