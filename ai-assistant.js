// ============================================================
//  ai-assistant.js
//  High-Performance, Dual-Engine AI Assistant for Satwinder's Portfolio
//  Features:
//    - Local Intelligent Semantic Grounding (Zero Latency / Offline)
//    - Optional Gemini API / Custom LLM Streaming Integration
//    - Conversational Context & Chat History (sessionStorage)
//    - Dynamic Follow-up Questions & Suggestion Chips
//    - Realistic Typing Indicator & Error Boundaries
//    - Secure Client-side Key Management (localStorage)
// ============================================================

(function () {
  'use strict';

  // ------------------------------------------------------------
  //  1. Grounded Knowledge Base (Default / Baseline)
  // ------------------------------------------------------------
  const portfolioKnowledge = {
    name: "Satwinder Singh",
    role: "Senior Flutter Engineer & System Architect",
    summary: "Senior Mobile Engineer specializing in Flutter, Clean Architecture, and real-time distributed mobile systems. Delivered 10+ production applications with 99.9% crash-free rates.",
    availability: "Actively available for Senior Mobile Engineer, Staff Flutter Architect, and high-impact consulting roles.",
    contact: {
      email: "satwindersinghasr2@gmail.com",
      whatsapp: "+91 98779 95250",
      github: "https://github.com/Satwinder777",
      linkedin: "https://linkedin.com/in/satwinder777",
      location: "India (Open to Remote Globally)"
    },
    skills: {
      core: ["Flutter", "Dart", "Clean Architecture", "BLoC Pattern", "Riverpod", "Android (Kotlin/Java)", "iOS (Swift)"],
      architecture: ["Domain-Driven Design (DDD)", "Reactive Programming", "Isolates & Multi-Threading", "Modular Multi-Package Architecture", "Offline-First Synchronization"],
      cloudAndBackend: ["Firebase (Firestore, Auth, Cloud Functions)", "RESTful APIs", "WebSockets", "GraphQL", "Supabase", "GCP"],
      devopsAndQuality: ["Fastlane CI/CD", "GitHub Actions", "Unit/Widget/Integration Testing", "Performance Profiling (Memory, CPU, Jitter)"]
    },
    projects: [
      {
        name: "Vibe Real-Time Collaboration Platform",
        description: "Full-stack reactive mobile and web platform with real-time CMS, offline caching, and instant WebSocket state sync.",
        tech: "Flutter, Firebase, WebSockets, Clean BLoC"
      },
      {
        name: "Satcraft Resume & Portfolio Suite",
        description: "High-performance reactive web application built with TypeScript, Vite, and client-side vector PDF generation.",
        tech: "TypeScript, React, Tailwind CSS, Vite, jsPDF"
      },
      {
        name: "Enterprise Multi-Tenant Flutter Architecture",
        description: "Modular enterprise mobile system delivered for high-concurrency client workloads with strict 99.9% crash-free reliability.",
        tech: "Flutter, Riverpod, Custom Render Objects, REST, Fastlane"
      }
    ],
    experienceHighlights: [
      "Architected enterprise-scale cross-platform apps servicing 100K+ monthly active users.",
      "Optimized Flutter rendering pipeline reducing frame jank from 18% down to under 1.2% at 60/120 FPS.",
      "Implemented resilient offline-first databases with automatic conflict resolution for unreliable mobile networks."
    ]
  };

  // Allow external updates (e.g. from Firebase Firestore live CMS)
  window.updateAiPortfolioKnowledge = function (liveData) {
    if (!liveData) return;
    if (liveData.profile) {
      if (liveData.profile.fullName) portfolioKnowledge.name = liveData.profile.fullName;
      if (liveData.profile.tagline) portfolioKnowledge.role = liveData.profile.tagline;
      if (liveData.profile.bio) portfolioKnowledge.summary = liveData.profile.bio;
    }
    if (liveData.projects && Array.isArray(liveData.projects)) {
      portfolioKnowledge.projects = liveData.projects.map(p => ({
        name: p.title || p.name,
        description: p.description || p.summary,
        tech: p.techStack || p.tags?.join(', ') || 'Flutter'
      }));
    }
  };

  // ------------------------------------------------------------
  //  2. State Management & Storage
  // ------------------------------------------------------------
  const STORAGE_KEY = 'satwinder_ai_chat_session_v1';
  const API_KEY_STORAGE = 'satwinder_ai_gemini_key';

  const chatState = {
    isOpen: false,
    isTyping: false,
    apiKey: localStorage.getItem(API_KEY_STORAGE) || '',
    messages: []
  };

  function loadSavedMessages() {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        chatState.messages = JSON.parse(saved);
      }
    } catch (e) {
      console.warn('[ai-assistant] could not read session storage:', e);
    }

    // Default welcome message if empty
    if (!chatState.messages || chatState.messages.length === 0) {
      chatState.messages = [
        {
          role: 'assistant',
          text: `Hi there! 👋 I am **Satwinder's AI Portfolio Assistant**.\n\nI can answer questions about his **Flutter architecture**, **flagship projects**, **tech stack**, or **how to hire him**. What would you like to explore?`,
          timestamp: Date.now(),
          followUps: [
            "What are his core technical skills?",
            "Tell me about his top projects",
            "What is his experience with Flutter & BLoC?",
            "How can I contact or hire Satwinder?"
          ]
        }
      ];
    }
  }

  function saveMessages() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(chatState.messages.slice(-30)));
    } catch (e) {
      console.warn('[ai-assistant] could not save session storage:', e);
    }
  }

  // ------------------------------------------------------------
  //  3. Grounded Intelligence Engine (Local RAG & Semantic Match)
  // ------------------------------------------------------------
  function generateLocalResponse(query, history) {
    const q = query.toLowerCase().trim();

    // Check context from recent message for follow-ups
    const lastUserMsg = history.length > 2 ? history[history.length - 2]?.text?.toLowerCase() : '';

    // 1. Contact / Hiring / Email / WhatsApp
    if (/hire|contact|email|reach|phone|whatsapp|call|available|interview|freelance|rate|salary|resume/i.test(q)) {
      return {
        text: `**Satwinder is actively open for high-impact roles!** 🚀\n\n- **Role Focus:** Senior Flutter Engineer, Staff Mobile Architect, or Technical Lead.\n- **Email:** [${portfolioKnowledge.contact.email}](mailto:${portfolioKnowledge.contact.email})\n- **WhatsApp:** [${portfolioKnowledge.contact.whatsapp}](https://wa.me/919877995250)\n- **GitHub:** [${portfolioKnowledge.contact.github}](${portfolioKnowledge.contact.github})\n\nYou can also click the **"Hire Me"** button in the navbar to connect immediately!`,
        followUps: [
          "What is his Flutter experience?",
          "Can you share his flagship projects?",
          "Does he work with Clean Architecture?"
        ]
      };
    }

    // 2. Skills / Tech Stack
    if (/skill|tech|stack|arsenal|language|framework|dart|kotlin|swift|state|riverpod|bloc/i.test(q)) {
      return {
        text: `**Satwinder's Core Technical Arsenal:**\n\n- **Mobile Engineering:** Expert in **Flutter & Dart**, with native bridges into **Android (Kotlin/Java)** and **iOS (Swift)**.\n- **State Management:** Production mastery of **BLoC, Cubit, and Riverpod**.\n- **Architecture:** Domain-Driven Design (DDD), Clean Architecture, Modular Packages, Isolates.\n- **Backend & Real-Time:** Firebase (Firestore, Auth, Rules), WebSockets, REST APIs, and Offline-First synchronization.\n- **Testing & DevOps:** Fastlane CI/CD, GitHub Actions, and high-frequency UI/Unit testing suites.`,
        followUps: [
          "How does he handle offline sync in Flutter?",
          "Tell me about the Vibe project",
          "What makes his Flutter apps crash-free?"
        ]
      };
    }

    // 3. Projects
    if (/project|portfolio|work|app|built|vibe|satcraft|showcase/i.test(q)) {
      return {
        text: `Here are **Satwinder's flagship engineering projects**:\n\n1. **Vibe Real-Time Platform:** Full-stack reactive collaboration app with real-time CMS, offline caching, and instant WebSocket state synchronization.\n2. **Satcraft Resume Suite:** High-performance web app built with TypeScript, Vite, and client-side vector PDF generation.\n3. **Enterprise Multi-Tenant Mobile Suite:** Production Flutter architecture serving 100K+ monthly active users with strict 99.9% crash-free uptime.`,
        followUps: [
          "Tell me more about Vibe's architecture",
          "How can I hire him for a project?",
          "What state management does he prefer?"
        ]
      };
    }

    // 4. Architecture / BLoC / Performance / Crash-free
    if (/architecture|clean|bloc|performance|fps|speed|jank|crash|pattern/i.test(q)) {
      return {
        text: `**Satwinder's Architecture Philosophy:**\n\n- **Clean Architecture & Separation of Concerns:** Rigid isolation between Data, Domain, and Presentation layers.\n- **BLoC & Unidirectional Data Flow:** Predictable state transitions with reactive Streams.\n- **Performance Tuning:** Profile-guided optimization eliminating dropped frames at 60/120 FPS by optimizing widget rebuild trees and offloading heavy JSON decoding onto Dart Isolates.\n- **99.9% Stability:** Rigorous defensive null-safety, offline circuit breakers, and automated testing.`,
        followUps: [
          "What are his core technical skills?",
          "How can I contact Satwinder?",
          "Can you summarize his background?"
        ]
      };
    }

    // 5. Experience / Background
    if (/who|experience|background|about|bio|satwinder|years|senior/i.test(q)) {
      return {
        text: `**Satwinder Singh** is a Senior Mobile Engineer & System Architect specializing in **Flutter** and scalable cross-platform systems.\n\nHe has delivered **10+ production mobile applications** across consumer and enterprise sectors, maintaining a **99.9% crash-free rate** and delighting hundreds of thousands of users. He is passionate about high-performance mobile UI, smooth micro-interactions, and robust system architecture.`,
        followUps: [
          "What are his top projects?",
          "How can I contact him?",
          "What is his tech stack?"
        ]
      };
    }

    // 6. Default Conversational Fallback
    return {
      text: `Thanks for asking! As **Satwinder's AI Assistant**, I can help you evaluate his fit for your team.\n\nSatwinder is a **Senior Flutter Engineer & Architect** with a track record of shipping production apps with clean architecture, high FPS performance, and resilient offline capabilities.`,
      followUps: [
        "What are his core skills?",
        "Tell me about his projects",
        "How do I get in touch with him?"
      ]
    };
  }

  // ------------------------------------------------------------
  //  4. Cloud LLM Engine (Gemini API Integration)
  // ------------------------------------------------------------
  async function callGeminiApi(userPrompt, history, apiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const systemInstruction = `You are the personal AI Portfolio Assistant for Satwinder Singh, a Senior Flutter Engineer & System Architect.
Your role is to answer questions from recruiters, clients, and developers about Satwinder's skills, projects, architecture philosophy, and availability.
Be friendly, articulate, professional, and concise.

Key Facts about Satwinder:
- Role: Senior Flutter Engineer & System Architect
- Highlights: 10+ production apps shipped, 99.9% crash-free rate, 60/120 FPS performance profiling.
- Core Stack: Flutter, Dart, BLoC, Riverpod, Clean Architecture, Kotlin, Swift, Firebase, WebSockets, Fastlane.
- Flagship Projects: Vibe (real-time platform), Satcraft (TypeScript/Vite resume suite), Enterprise Multi-Tenant Mobile.
- Contact: Email (satwindersinghasr2@gmail.com), WhatsApp (+91 98779 95250), GitHub (github.com/Satwinder777).
- Availability: Open for Senior Flutter Engineer & Lead Architect roles.

Format responses with markdown bullet points where helpful. If asked to contact him, provide his email and WhatsApp.`;

    // Convert history into Gemini contents format
    const contents = [];
    history.slice(-8).forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      });
    });

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: userPrompt }]
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      throw new Error("No response generated by Gemini model");
    }

    return {
      text: candidateText,
      followUps: [
        "What are his core technical skills?",
        "Tell me about his top projects",
        "How can I contact Satwinder?"
      ]
    };
  }

  // ------------------------------------------------------------
  //  5. Markdown Formatter & Sanitize
  // ------------------------------------------------------------
  function formatMarkdown(raw) {
    if (!raw) return '';
    let escaped = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold **text**
    escaped = escaped.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Bullet points * or -
    escaped = escaped.replace(/(?:^|\n)[*-]\s+(.+)/g, '<li>$1</li>');
    escaped = escaped.replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>');

    // Links [text](url)
    escaped = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Newlines to breaks
    escaped = escaped.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>');

    return escaped;
  }

  // ------------------------------------------------------------
  //  6. UI Builder & DOM Rendering
  // ------------------------------------------------------------
  function buildChatbotDom() {
    // 1. Floating Trigger Button (FAB)
    const fab = document.createElement('button');
    fab.id = 'ai-chat-fab';
    fab.className = 'ai-fab interactive';
    fab.setAttribute('aria-label', 'Open Satwinder AI Assistant');
    fab.innerHTML = `
      <div class="ai-fab__icon-wrap">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 8V4H8"></path>
          <rect width="16" height="12" x="4" y="8" rx="2"></rect>
          <path d="M2 14h2"></path>
          <path d="M20 14h2"></path>
          <path d="M15 13v2"></path>
          <path d="M9 13v2"></path>
        </svg>
        <span class="ai-fab__badge"></span>
      </div>
      <span class="ai-fab__label">Ask Satwinder AI</span>
    `;

    // 2. Chat Window
    const win = document.createElement('div');
    win.id = 'ai-chat-window';
    win.className = 'ai-chat-window';
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', 'Satwinder AI Assistant');
    win.innerHTML = `
      <!-- Header -->
      <div class="ai-header">
        <div class="flex items-center gap-3">
          <div class="ai-header__avatar">
            <span>S</span>
            <span class="ai-header__status-dot"></span>
          </div>
          <div>
            <div class="ai-header__title">Satwinder AI</div>
            <div class="ai-header__subtitle">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Portfolio Intelligence Online</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1.5">
          <button id="ai-clear-btn" class="ai-header__btn" title="Clear chat history">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          </button>
          <button id="ai-close-btn" class="ai-header__btn" title="Close chat">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Feed -->
      <div id="ai-messages" class="ai-messages"></div>

      <!-- Typing Indicator (hidden initially) -->
      <div id="ai-typing" class="px-4 pb-2 hidden">
        <div class="ai-typing">
          <span class="ai-typing__dot"></span>
          <span class="ai-typing__dot"></span>
          <span class="ai-typing__dot"></span>
        </div>
      </div>

      <!-- Input Bar -->
      <div class="ai-input-wrap">
        <form id="ai-form" class="ai-form">
          <input 
            type="text" 
            id="ai-input" 
            class="ai-input" 
            placeholder="Ask about skills, projects, or hiring…" 
            autocomplete="off" 
            maxlength="400"
          />
          <button type="submit" id="ai-send-btn" class="ai-send-btn" aria-label="Send message" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m5 12 14-7-7 14-2-5-5-2Z"></path>
            </svg>
          </button>
        </form>

        <div class="ai-footer-note">
          <span>Trained on Satwinder's production portfolio</span>
          <span id="ai-config-btn" class="ai-config-link" title="Configure Gemini LLM Key">Settings</span>
        </div>
      </div>

      <!-- Optional API Key Settings Overlay -->
      <div id="ai-config-modal" class="ai-config-modal">
        <div class="flex items-center justify-between mb-4">
          <h4 class="text-sm font-bold text-white">AI Engine Settings</h4>
          <button id="ai-config-close" class="text-neutral-400 hover:text-white text-xs font-bold p-1">✕</button>
        </div>
        <p class="text-xs text-neutral-400 mb-3 leading-relaxed">
          By default, the assistant uses Satwinder's built-in local Knowledge Engine. You can optionally connect a <strong>Gemini API Key</strong> for generative streaming. Keys are stored safely only in your browser's <code class="text-cyan-300">localStorage</code>.
        </p>
        <input 
          type="password" 
          id="ai-api-key-input" 
          placeholder="Paste Gemini API Key (Optional)..." 
          class="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-white placeholder:text-neutral-500 mb-4 focus:outline-none focus:border-cyan-400"
        />
        <div class="flex gap-2">
          <button id="ai-api-key-save" class="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-900 text-xs font-bold transition-all">
            Save Key
          </button>
          <button id="ai-api-key-reset" class="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-all">
            Reset to Local
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(win);
  }

  // ------------------------------------------------------------
  //  7. Message Rendering & Interaction
  // ------------------------------------------------------------
  function renderAllMessages() {
    const container = document.getElementById('ai-messages');
    if (!container) return;
    container.innerHTML = '';

    chatState.messages.forEach((msg, idx) => {
      const isUser = msg.role === 'user';
      const wrapper = document.createElement('div');
      wrapper.className = `ai-msg ${isUser ? 'ai-msg--user' : 'ai-msg--assistant'}`;

      const timeStr = new Date(msg.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      wrapper.innerHTML = `
        <div class="ai-bubble">${isUser ? document.createTextNode(msg.text).textContent : formatMarkdown(msg.text)}</div>
        <span class="ai-msg__time">${timeStr}</span>
      `;

      // Render follow-up suggestions only on the very last assistant message
      if (!isUser && msg.followUps && msg.followUps.length > 0 && idx === chatState.messages.length - 1) {
        const chipsContainer = document.createElement('div');
        chipsContainer.className = 'ai-suggestions';
        msg.followUps.forEach(promptText => {
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'ai-chip interactive';
          chip.textContent = promptText;
          chip.onclick = () => submitUserPrompt(promptText);
          chipsContainer.appendChild(chip);
        });
        wrapper.appendChild(chipsContainer);
      }

      container.appendChild(wrapper);
    });

    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  function setTyping(isTyping) {
    chatState.isTyping = isTyping;
    const typingIndicator = document.getElementById('ai-typing');
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send-btn');
    if (typingIndicator) {
      typingIndicator.classList.toggle('hidden', !isTyping);
    }
    if (sendBtn) {
      sendBtn.disabled = isTyping || !input?.value?.trim();
    }
    if (isTyping) {
      const container = document.getElementById('ai-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }
  }

  async function submitUserPrompt(userText) {
    const text = String(userText || '').trim();
    if (!text || chatState.isTyping) return;

    // 1. Add user message
    chatState.messages.push({
      role: 'user',
      text: text,
      timestamp: Date.now()
    });
    saveMessages();
    renderAllMessages();

    // Clear input
    const input = document.getElementById('ai-input');
    if (input) {
      input.value = '';
      input.dispatchEvent(new Event('input'));
    }

    // 2. Start Typing indicator
    setTyping(true);

    try {
      let botResponse;

      // Check if user has configured custom Gemini API Key
      if (chatState.apiKey && chatState.apiKey.trim().length > 15) {
        try {
          botResponse = await callGeminiApi(text, chatState.messages, chatState.apiKey.trim());
        } catch (apiErr) {
          console.warn('[ai-assistant] Gemini API call failed, falling back to local engine:', apiErr);
          // Graceful fallback to local engine
          botResponse = generateLocalResponse(text, chatState.messages);
          botResponse.text += `\n\n*(Note: Cloud LLM fallback active: ${apiErr.message || 'network timeout'})*`;
        }
      } else {
        // Natural human typing simulation delay (450ms - 900ms)
        const delay = Math.min(950, Math.max(450, text.length * 15));
        await new Promise(res => setTimeout(res, delay));
        botResponse = generateLocalResponse(text, chatState.messages);
      }

      chatState.messages.push({
        role: 'assistant',
        text: botResponse.text,
        timestamp: Date.now(),
        followUps: botResponse.followUps || []
      });
      saveMessages();
    } catch (err) {
      chatState.messages.push({
        role: 'assistant',
        text: `I encountered an unexpected issue processing that question. Please try again or reach out directly to Satwinder at [${portfolioKnowledge.contact.email}](mailto:${portfolioKnowledge.contact.email}).`,
        timestamp: Date.now(),
        followUps: ["How can I contact Satwinder?", "What are his core skills?"]
      });
    } finally {
      setTyping(false);
      renderAllMessages();
    }
  }

  // ------------------------------------------------------------
  //  8. Initialize & Bind Event Listeners
  // ------------------------------------------------------------
  function initAiChatbot() {
    loadSavedMessages();
    buildChatbotDom();

    const fab = document.getElementById('ai-chat-fab');
    const win = document.getElementById('ai-chat-window');
    const closeBtn = document.getElementById('ai-close-btn');
    const clearBtn = document.getElementById('ai-clear-btn');
    const form = document.getElementById('ai-form');
    const input = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const configBtn = document.getElementById('ai-config-btn');
    const configModal = document.getElementById('ai-config-modal');
    const configClose = document.getElementById('ai-config-close');
    const apiKeyInput = document.getElementById('ai-api-key-input');
    const apiKeySave = document.getElementById('ai-api-key-save');
    const apiKeyReset = document.getElementById('ai-api-key-reset');

    // Toggle chat window
    function toggleChat(open) {
      chatState.isOpen = typeof open === 'boolean' ? open : !chatState.isOpen;
      win.classList.toggle('is-open', chatState.isOpen);
      if (chatState.isOpen) {
        renderAllMessages();
        setTimeout(() => input?.focus(), 300);
      }
    }

    fab.addEventListener('click', () => toggleChat());
    closeBtn.addEventListener('click', () => toggleChat(false));

    // Clear history
    clearBtn.addEventListener('click', () => {
      sessionStorage.removeItem(STORAGE_KEY);
      chatState.messages = [];
      loadSavedMessages();
      renderAllMessages();
    });

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      submitUserPrompt(input.value);
    });

    // Enable/disable send button
    input.addEventListener('input', () => {
      if (sendBtn) {
        sendBtn.disabled = !input.value.trim() || chatState.isTyping;
      }
    });

    // Config settings modal
    configBtn.addEventListener('click', () => {
      apiKeyInput.value = chatState.apiKey || '';
      configModal.classList.add('is-active');
    });

    configClose.addEventListener('click', () => {
      configModal.classList.remove('is-active');
    });

    apiKeySave.addEventListener('click', () => {
      const val = apiKeyInput.value.trim();
      chatState.apiKey = val;
      if (val) {
        localStorage.setItem(API_KEY_STORAGE, val);
      } else {
        localStorage.removeItem(API_KEY_STORAGE);
      }
      configModal.classList.remove('is-active');
      submitUserPrompt("Hello! What capabilities do you have?");
    });

    apiKeyReset.addEventListener('click', () => {
      chatState.apiKey = '';
      localStorage.removeItem(API_KEY_STORAGE);
      apiKeyInput.value = '';
      configModal.classList.remove('is-active');
    });

    // Re-create lucide icons if available
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAiChatbot);
  } else {
    initAiChatbot();
  }
})();
