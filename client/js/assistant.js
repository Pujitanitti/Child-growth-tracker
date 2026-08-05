// assistant.js — AI Health Assistant chat widget. Gracefully hides itself
// if the backend reports the feature isn't configured (no API key set).

import { api, ApiError } from './api.js';

export async function checkAssistantAvailable() {
  try {
    const res = await api.get('/assistant/status');
    return res.data.available;
  } catch {
    return false;
  }
}

export async function askAssistant(childId, message) {
  const res = await api.post(`/children/${childId}/assistant/ask`, { message });
  return res.data.reply;
}

/** Mounts a floating chat widget (button + panel) into the given container. */
export function mountAssistantWidget(container, childId) {
  container.innerHTML = `
    <button class="assistant-fab" id="assistantFab" aria-label="Open AI Health Assistant" data-tooltip="Ask the AI Assistant">
      <i class="fa-solid fa-wand-magic-sparkles"></i>
    </button>
    <div class="assistant-panel hidden" id="assistantPanel" role="dialog" aria-label="AI Health Assistant">
      <div class="assistant-panel__header">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-wand-magic-sparkles text-primary"></i>
          <span class="font-semibold text-sm">AI Health Assistant</span>
        </div>
        <button class="icon-btn" id="assistantCloseBtn" aria-label="Close"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="assistant-panel__disclaimer">
        <i class="fa-solid fa-circle-info"></i> General guidance only — not a substitute for your pediatrician.
      </div>
      <div class="assistant-panel__messages" id="assistantMessages">
        <div class="assistant-msg assistant-msg--bot">Hi! I can help with general questions about growth, sleep, nutrition, or development. What's on your mind?</div>
      </div>
      <form class="assistant-panel__input" id="assistantForm">
        <input class="input" id="assistantInput" placeholder="Ask a question..." autocomplete="off">
        <button type="submit" class="btn btn-primary btn-icon" aria-label="Send"><i class="fa-solid fa-paper-plane"></i></button>
      </form>
    </div>
  `;

  const fab = document.getElementById('assistantFab');
  const panel = document.getElementById('assistantPanel');
  const messages = document.getElementById('assistantMessages');
  const form = document.getElementById('assistantForm');
  const input = document.getElementById('assistantInput');

  fab.addEventListener('click', () => panel.classList.toggle('hidden'));
  document.getElementById('assistantCloseBtn').addEventListener('click', () => panel.classList.add('hidden'));

  function addMessage(text, who) {
    const el = document.createElement('div');
    el.className = `assistant-msg assistant-msg--${who}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    addMessage(message, 'user');
    input.value = '';
    input.disabled = true;

    const typingEl = document.createElement('div');
    typingEl.className = 'assistant-msg assistant-msg--bot';
    typingEl.innerHTML = '<span class="spinner"></span>';
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;

    try {
      const reply = await askAssistant(childId, message);
      typingEl.remove();
      addMessage(reply, 'bot');
    } catch (err) {
      typingEl.remove();
      addMessage(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.', 'bot');
    } finally {
      input.disabled = false;
      input.focus();
    }
  });
}
