// ====== State ======
let token = '';
const BACKEND_URL = 'https://healthcare-bot-1vky.onrender.com';
let chatSessions = [];
let currentSessionIndex = -1;
let currentUser = null;
let isHistoryVisible = false;
let sessionScrollPositions = {};

// ====== DOM Elements ======
const authModal = document.getElementById('authModal');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const authMsg = document.getElementById('authMsg');

const sidebar = document.getElementById('sidebar');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const menuToggleBtn = document.getElementById('menuToggleBtn');
const overlay = document.getElementById('overlay');
const logoutBtn = document.getElementById('logoutBtn');

const chatbox = document.getElementById('chatbox');
const userInfo = document.getElementById('userInfo');
const chatArea = document.getElementById('chatArea');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');
const newChatBtn = document.getElementById('newChatBtn');
const historyToggleBtn = document.getElementById('historyToggleBtn');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const scrollToBottomBtn = document.getElementById('scrollToBottomBtn');

// ====== Auth Messages ======
function showMessage(message, type = 'info') {
  authMsg.textContent = message;
  authMsg.className = `auth-msg ${type}`;
  authMsg.style.display = 'block';
  setTimeout(() => {
    authMsg.style.display = 'none';
  }, 3000);
}

// ====== Sidebar Toggle ======
menuToggleBtn.addEventListener('click', () => {
  sidebar.classList.add('active');
  overlay.classList.add('active');
});

closeSidebarBtn.addEventListener('click', () => {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
});

// ====== Logout ======
logoutBtn.addEventListener('click', () => {
  token = '';
  currentUser = null;
  chatSessions = [];
  currentSessionIndex = -1;
  sessionScrollPositions = {};

  // 🔐 Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');

  sidebar.classList.remove('active');
  chatbox.classList.remove('active');
  authModal.style.display = 'block';
});

// ====== Scroll Helpers ======
function updateScrollButtonVisibility() {
  const isAtBottom = chatArea.scrollHeight - chatArea.scrollTop - chatArea.clientHeight < 1;
  scrollToBottomBtn.style.display = isAtBottom ? 'none' : 'block';
}

function scrollToBottom() {
  chatArea.scrollTo({ top: chatArea.scrollHeight, behavior: 'smooth' });
  scrollToBottomBtn.style.display = 'none';
}

function saveScrollPosition() {
  if (currentSessionIndex !== -1) {
    sessionScrollPositions[currentSessionIndex] = chatArea.scrollTop;
  }
}

// ====== Sidebar Sessions ======
function addSessionToSidebar(title = 'New Chat', index) {
  const li = document.createElement('div');
  li.className = 'history-item';
  li.setAttribute('data-index', index);
  li.innerHTML = `
    <div class="history-text">${title}</div>
    <button class="delete-btn" onclick="deleteSession(${index})">🗑️</button>
  `;
  li.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) return;
    loadSession(index);
  });
  historyList.appendChild(li);
}

function updateSidebarTitle(index, newTitle) {
  const historyItems = document.querySelectorAll('.history-item');
  const item = historyItems[index];
  if (item) {
    const titleSpan = item.querySelector('.history-text');
    titleSpan.textContent = newTitle.length > 30 ? newTitle.slice(0, 30) + '...' : newTitle;
  }
}

// ====== Chat Sessions ======
function newChatSession() {
  chatSessions.push([]);
  currentSessionIndex = chatSessions.length - 1;
  addSessionToSidebar('New Chat', currentSessionIndex);
  chatArea.innerHTML = `
    <div class="chat-bubble bot">
      Hello! I'm your healthcare assistant. How can I help you today?
    </div>
    <div class="chat-meta">HealthBot • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
  `;
  promptInput.value = '';
  scrollToBottom();
}

function displayChatMessages(messages) {
  saveScrollPosition();
  chatArea.innerHTML = '';
  messages.forEach(msg => {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${msg.sender}`;
    bubble.textContent = msg.text;
    chatArea.appendChild(bubble);

    const meta = document.createElement('div');
    meta.className = 'chat-meta';
    meta.textContent = `${msg.sender === 'user' ? 'You' : 'HealthBot'} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    chatArea.appendChild(meta);
  });

  if (sessionScrollPositions[currentSessionIndex] !== undefined) {
    chatArea.scrollTo({ top: sessionScrollPositions[currentSessionIndex], behavior: 'smooth' });
  } else {
    scrollToBottom();
  }

  updateScrollButtonVisibility();
}

function deleteSession(index) {
  if (confirm('Delete this chat?')) {
    chatSessions.splice(index, 1);
    delete sessionScrollPositions[index];
    historyList.removeChild(historyList.children[index]);

    Array.from(historyList.children).forEach((li, idx) => {
      li.setAttribute('data-index', idx);
      li.querySelector('button').setAttribute('onclick', `deleteSession(${idx})`);
      li.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        loadSession(idx);
      });
    });

    if (currentSessionIndex === index) {
      newChatSession();
    } else if (currentSessionIndex > index) {
      currentSessionIndex--;
    }
  }
}

function loadSession(index) {
  saveScrollPosition();
  currentSessionIndex = index;
  displayChatMessages(chatSessions[index]);
}

// ====== Register (No auto-login) ======
async function register() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showMessage('Enter both email and password', 'error');
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    showMessage(data.msg || 'Registered successfully!', 'success');
  } catch (err) {
    console.error('Register Error:', err);
    showMessage('Registration failed.', 'error');
  }
}

// ====== Login ======
async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    showMessage('Enter both email and password', 'error');
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();

    if (data.token) {
      token = data.token;
      currentUser = { email };

      // ✅ Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));

      authModal.style.display = 'none';
      sidebar.classList.add('active');
      chatbox.classList.add('active');
      userInfo.innerHTML = `<strong>Welcome, ${email}!</strong> How can I help you today?`;

      await loadChatHistoryFromBackend();
      if (chatSessions.length === 0) newChatSession();
    } else {
      showMessage('Login failed.', 'error');
    }
  } catch (err) {
    console.error('Login Error:', err);
    showMessage('Login failed.', 'error');
  }
}

// ====== Chat API Send ======
async function sendPrompt() {
  const prompt = promptInput.value.trim();
  if (!prompt) return;

  const userMsg = { sender: 'user', text: prompt };
  if (currentSessionIndex === -1) newChatSession();
  chatSessions[currentSessionIndex].push(userMsg);
  displayChatMessages(chatSessions[currentSessionIndex]);

  if (chatSessions[currentSessionIndex].length === 1) {
    updateSidebarTitle(currentSessionIndex, prompt);
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();
    const botMsg = { sender: 'bot', text: data.response || 'No response.' };
    chatSessions[currentSessionIndex].push(botMsg);
    displayChatMessages(chatSessions[currentSessionIndex]);
  } catch (err) {
    console.error('Chat Error:', err);
    chatSessions[currentSessionIndex].push({ sender: 'bot', text: 'Error occurred. Try again.' });
    displayChatMessages(chatSessions[currentSessionIndex]);
  }

  promptInput.value = '';
  scrollToBottom();
}

// ====== Load Chat History ======
async function loadChatHistoryFromBackend() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await res.json();

    if (Array.isArray(data.chats)) {
      const grouped = {};
      data.chats.forEach(chat => {
        const key = chat.question.slice(0, 30);
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(
          { sender: 'user', text: chat.question },
          { sender: 'bot', text: chat.response }
        );
      });

      Object.entries(grouped).forEach(([title, messages]) => {
        chatSessions.push(messages);
        currentSessionIndex = chatSessions.length - 1;
        addSessionToSidebar(title, currentSessionIndex);
      });

      if (chatSessions.length > 0) loadSession(chatSessions.length - 1);
    }
  } catch (err) {
    console.error('Load History Error:', err);
    showMessage('Failed to load chat history.', 'error');
  }
}

// ====== Event Listeners ======
loginBtn.addEventListener('click', login);
registerBtn.addEventListener('click', register);
sendBtn.addEventListener('click', sendPrompt);
resetBtn.addEventListener('click', () => {
  if (confirm('Reset chat?')) newChatSession();
});
newChatBtn.addEventListener('click', newChatSession);
scrollToBottomBtn.addEventListener('click', scrollToBottom);
promptInput.addEventListener('scroll', updateScrollButtonVisibility);

historyToggleBtn.addEventListener('click', () => {
  isHistoryVisible = !isHistoryVisible;
  historySection.classList.toggle('active', isHistoryVisible);
  historyToggleBtn.innerHTML = isHistoryVisible ?
    '<span>📋</span> Hide History' :
    '<span>📋</span> Chat History';
});

promptInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendPrompt();
  }
});

promptInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// ====== Auto-login on Refresh ======
window.addEventListener('DOMContentLoaded', async () => {
  const savedToken = localStorage.getItem('token');
  const savedUser = localStorage.getItem('currentUser');

  if (savedToken && savedUser) {
    token = savedToken;
    currentUser = JSON.parse(savedUser);

    authModal.style.display = 'none';
    sidebar.classList.add('active');
    chatbox.classList.add('active');
    userInfo.innerHTML = `<strong>Welcome, ${currentUser.email}!</strong> How can I help you today?`;

    await loadChatHistoryFromBackend();
    if (chatSessions.length === 0) newChatSession();
  } else {
    authModal.style.display = 'block';
  }
});
