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
  const currentExperienceYears = () => {
    const now = new Date();
    const elapsedMonths = (now.getUTCFullYear() - 2022) * 12 + now.getUTCMonth();
    return Math.max(0, Math.floor(elapsedMonths / 12));
  };

  const portfolioKnowledge = {
    name: "Satwinder Singh",
    role: "Senior Flutter Developer",
    summary: "The portfolio highlights Flutter, Clean Architecture, Firebase, and real-time mobile development. It lists 10+ production apps and a 99.9% crash-free figure; supporting reports are not included in this repository.",
    availability: "The portfolio currently shows availability for senior roles.",
    contact: {
      email: "satwindersinghasr2@gmail.com",
      whatsapp: "+91 98779 95250",
      github: "https://github.com/Satwinder777",
      linkedin: "https://www.linkedin.com/in/satwinder-singh-809a6b256",
      location: ""
    },
    skills: {
      core: ["Flutter", "Dart", "Android", "Kotlin", "Clean Architecture", "BLoC", "Riverpod", "GetX", "MVVM"],
      architecture: ["Method Channels", "Isolates", "Custom Painters"],
      cloudAndBackend: ["Firebase", "WebSockets", "Google Maps API"],
      devopsAndQuality: ["Fastlane CI/CD"]
    },
    projects: [
      {
        name: "DropLink — Secure File Sharing",
        description: "The deployed homepage describes file sharing with encrypted cloud storage, a complimentary guest transfer, and an account-based personal vault.",
        tech: "Next.js"
      }
    ],
    experienceHighlights: [
      "Portfolio information includes work across Flutter, Dart, Android, Clean Architecture, Firebase, and WebSockets.",
      "The repository does not include benchmark reports for specific frame rates or performance improvements."
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
        tech: p.techStack || p.tags?.join(', ') || 'Not listed'
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
  // ------------------------------------------------------------
  //  3. Grounded Intelligence Engine (Multi-Case Intent Matcher)
  // ------------------------------------------------------------
  function generateLocalResponse(query, history) {
    const q = query.toLowerCase().trim();

    // 1. Greetings & Casual Introductions
    if (/^(hi|hello|hey|namaste|sat sri akaal|hola|greetings|good morning|good afternoon|good evening|yo)\b/i.test(q)) {
      return {
        text: `Hello! 👋 Welcome to **Satwinder Singh's Portfolio Assistant**.\n\nSatwinder is a **Senior Flutter Developer**. The portfolio lists 10+ production apps and a 99.9% crash-free claim; supporting reports are not included in this repository.\n\nHow can I help you today? You can ask about his **skills**, **projects**, **Clean Architecture**, or **how to contact him**.`,
        followUps: [
          "What are his core technical skills?",
          "Tell me about his top projects",
          "What is his experience with Flutter & BLoC?",
          "How can I contact or hire Satwinder?"
        ]
      };
    }

    // 2. Specific Project: DropLink (deployed under /Vibe/)
    if (/vibe/i.test(q)) {
      return {
        text: `The repository's **/Vibe/** deployment is branded **DropLink — Secure File Sharing**. Its public page describes file sharing with encrypted cloud storage, one complimentary guest transfer, and an account-based personal vault. The repository contains interface screenshots. It does not document implementation responsibilities or measured outcomes.`,
        followUps: [
          "Tell me about DropLink",
          "What projects are documented in the repository?",
          "How can I hire him for a project?"
        ]
      };
    }

    // The local checkout does not contain a verified Satcraft case study.
    if (/satcraft/i.test(q)) {
      return {
        text: `I can't verify a Satcraft project from the checked-in portfolio repository. The project information available here is limited to the public DropLink deployment and the portfolio's live CMS data.`,
        followUps: [
          "Tell me about DropLink",
          "What are his core technical skills?",
          "How can I contact Satwinder?"
        ]
      };
    }

    // 4. Other project claims are not present in checked-in case-study sources.
    if (/enterprise|multi-tenant|tenant|100k|workload/i.test(q)) {
      return {
        text: `The checked-in repository does not contain a verified case study for a multi-tenant product or its scale. The portfolio lists Flutter, Dart, Riverpod, and Clean Architecture among Satwinder's technical skills.`,
        followUps: [
          "What makes his Flutter apps crash-free?",
          "What is his testing strategy?",
          "How can I hire him for a project?"
        ]
      };
    }

    // 5. State Management Preferences (BLoC vs Riverpod vs GetX)
    if (/state\s*management|prefer|bloc|riverpod|getx|cubit|provider|which state/i.test(q)) {
      return {
        text: `The portfolio lists **BLoC, Riverpod, and GetX** among Satwinder's technical skills. The checked-in repository does not document which state-management choice he used on a specific project.`,
        followUps: [
          "How does he structure Clean Architecture?",
          "Tell me about DropLink",
          "What makes his Flutter apps crash-free?"
        ]
      };
    }

    // 6. Offline-First Architecture & Synchronization
    if (/offline|sync|caching|cache|connectivity|sqlite|hive|isar|network loss/i.test(q)) {
      return {
        text: `The portfolio describes local caching and data synchronization as areas of experience. The checked-in repository does not include a project case study specifying a storage engine, retry strategy, or conflict-resolution method.`,
        followUps: [
          "What makes his Flutter apps crash-free?",
          "Tell me about DropLink",
          "What state management does he prefer?"
        ]
      };
    }

    // 7. Portfolio reliability claim (supporting benchmark needs owner confirmation)
    if (/crash|99\.9|stability|reliable|error handling|sentry|crashlytics|bugs/i.test(q)) {
      return {
        text: `The portfolio lists **10+ production apps** and a **99.9% crash-free** figure. This repository does not include Crashlytics exports or other evidence to verify those numbers, so confirm them against the relevant project reports before relying on them.`,
        followUps: [
          "How does he approach rendering performance?",
          "What is his testing strategy?",
          "How can I contact or hire Satwinder?"
        ]
      };
    }

    // 8. Performance Optimization (no verified benchmark figures in the repository)
    if (/performance|fps|jank|speed|frame|profiling|isolate|optimize|rendering|lag/i.test(q)) {
      return {
        text: `The portfolio lists Flutter rendering and performance tuning as areas of expertise. No benchmark report is included in this repository, so it does not verify a specific frame rate or percentage improvement.`,
        followUps: [
          "What makes his Flutter apps crash-free?",
          "What state management does he prefer?",
          "Tell me about his top projects"
        ]
      };
    }

    // 9. Clean Architecture & Domain-Driven Design
    if (/clean architecture|clean|ddd|domain-driven|separation of concerns|layers|pattern/i.test(q)) {
      return {
        text: `**Clean Architecture & System Design:** 🏛️\n\nSatwinder strictly enforces separation of concerns across 3 distinct tiers:\n\n1. **Domain Layer (Core):** Pure Dart — contains **Entities**, **Use Cases / Interactors**, and **Repository Interfaces**. Zero dependencies on Flutter UI or third-party packages.\n2. **Data Layer:** Repository implementations, Data Sources (REST, WebSockets, Firebase, Local DB), and Model serialization (DTOs).\n3. **Presentation Layer:** Reactive UI widgets wired to **BLoC / Riverpod** state emitters. UI components remain pure and stateless whenever possible.\n\n**Result:** Fully testable business logic that can swap backend databases or API protocols without touching UI code.`,
        followUps: [
          "What state management does he prefer?",
          "How does he handle offline sync in Flutter?",
          "Tell me about his top projects"
        ]
      };
    }

    // 10. Native Android and Method Channels (specific iOS work is not documented)
    if (/native|kotlin|swift|method channel|event channel|platform channel|java|bridge|android native|ios native/i.test(q)) {
      return {
        text: `The portfolio lists **Android (Kotlin)** and **Method Channels** among Satwinder's skills. The checked-in repository does not document a specific native iOS implementation or app-level platform-channel example.`,
        followUps: [
          "What are his core technical skills?",
          "What is his experience with Flutter & BLoC?",
          "How can I contact Satwinder?"
        ]
      };
    }

    // 11. Testing & Automated CI/CD (Fastlane & GitHub Actions)
    if (/test|testing|unit test|widget test|integration|fastlane|ci\/cd|pipeline|github actions|automation/i.test(q)) {
      return {
        text: `Fastlane CI/CD is listed among Satwinder's skills. No application test suite or CI workflow is included in this repository, so I can't verify project-specific test coverage or deployment pipelines from this checkout.`,
        followUps: [
          "What makes his Flutter apps crash-free?",
          "How does he structure Clean Architecture?",
          "How can I hire him for a project?"
        ]
      };
    }

    // 12. Why Hire Satwinder / Key Value Proposition (Check before generic hiring)
    if (/\b(why\s+(should\s+i\s+)?hire|why\s+satwinder|strengths?|key\s+value|stand\s*out|advantage)\b/i.test(q)) {
      return {
        text: `**Satwinder Singh — Senior Flutter Developer** ⭐\n\nThe portfolio highlights Flutter, Clean Architecture, Firebase, native Android development, and Fastlane. It also lists 10+ production apps and a 99.9% crash-free figure; this repository does not contain supporting reports for those metrics.`,
        followUps: [
          "Tell me about his top projects",
          "How can I hire him for a project?",
          "What are his core technical skills?"
        ]
      };
    }

    // 13. Location & Timezone (Check before generic work)
    if (/\b(location|where\s+(is\s+he|are\s+you|is\s+satwinder)|where\s+based|timezone|time\s*zone|city|punjab|amritsar|india|remote\s+work|work\s+remote)\b/i.test(q)) {
      return {
        text: `The portfolio repository does not specify Satwinder's city, state, or timezone. Please use the contact links for location or scheduling details.`,
        followUps: [
          "How can I hire him for a project?",
          "How can I contact Satwinder?",
          "What are his core technical skills?"
        ]
      };
    }

    // 14. Career Trajectory & Work Experience / Companies (Check before projects)
    if (/\b(where\s+(has\s+he|did\s+he)\s+worked?|work(ed)?\s+(history|at|for)|experience|career|companies|company|toxsl|seraphic|blocvibe|possibility|history|trajectory|timeline|background|who is satwinder)\b/i.test(q)) {
      return {
        text: `**Satwinder's Career Trajectory (${currentExperienceYears()}+ years since Jan 2022):** 💼📈\n\n- **Senior Software Developer @ ToXSL Technologies** *(Jan 2025 – Present)*\n  Leading mobile architectures, performance optimization, CI/CD pipeline automation, and mentoring engineering teams in Clean Architecture.\n- **Flutter Developer @ Seraphic Infosolutions** *(Jun 2024 – Jun 2025)*\n  Engineered cross-platform mobile apps with Flutter & Dart, complex UI animations, MethodChannels, and REST APIs.\n- **Android Developer @ Blocvibe Technologies** *(Oct 2023 – Jun 2024)*\n  Developed responsive native Android apps using Kotlin and Jetpack components.\n- **Android Developer @ Possibility Solutions** *(Jan 2022 – Jan 2024)*\n  Handled native Java/Kotlin modules, UI debugging, and system integration.`,
        followUps: [
          "What are his core technical skills?",
          "Tell me about his top projects",
          "How can I contact or hire Satwinder?"
        ]
      };
    }

    // 15. Resume / CV Download
    if (/\b(resume|cv|curriculum|download\s+cv|download\s+resume)\b/i.test(q)) {
      return {
        text: `**Satwinder Singh — CV:** 📄\n\n- **Experience:** ${currentExperienceYears()}+ years since the Jan 2022 timeline start.\n- **Portfolio claims:** 10+ production apps and 99.9% crash-free; supporting reports are not in this repository.\n- **Core skills:** Flutter, Dart, Android (Kotlin), Clean Architecture, BLoC, Riverpod, Firebase, and Fastlane.\n\nThe CV button points to the requested local PDF path, but that PDF is not present in this repository yet. Please request the CV directly at [${portfolioKnowledge.contact.email}](mailto:${portfolioKnowledge.contact.email}).`,
        followUps: [
          "How can I contact or hire Satwinder?",
          "What are his core technical skills?",
          "Tell me about his top projects"
        ]
      };
    }

    // 16. Hiring, Rates, Availability & Working Modes
    if (/\b(hire|rates?|salary|pricing|cost|available|availability|contract|freelance|interview|notice\s*period)\b/i.test(q)) {
      return {
        text: `The portfolio currently shows **Available for Senior Roles**. For role fit and engagement details, contact Satwinder directly:\n\n- **Email:** [${portfolioKnowledge.contact.email}](mailto:${portfolioKnowledge.contact.email})\n- **WhatsApp:** [${portfolioKnowledge.contact.whatsapp}](https://wa.me/919877995250)\n- **GitHub:** [${portfolioKnowledge.contact.github}](${portfolioKnowledge.contact.github})`,
        followUps: [
          "Can I download his CV?",
          "What are his core technical skills?",
          "Tell me about his top projects"
        ]
      };
    }

    // 17. Contact Details & Socials
    if (/\b(contact|email|whatsapp|phone|call|reach|linkedin|github|instagram|social)\b/i.test(q)) {
      return {
        text: `**Get in Touch with Satwinder Singh:** 📬\n\n- **Email:** [${portfolioKnowledge.contact.email}](mailto:${portfolioKnowledge.contact.email})\n- **WhatsApp:** [${portfolioKnowledge.contact.whatsapp}](https://wa.me/919877995250)\n- **GitHub:** [${portfolioKnowledge.contact.github}](${portfolioKnowledge.contact.github})\n- **LinkedIn:** [linkedin.com/in/satwinder-singh-809a6b256](https://www.linkedin.com/in/satwinder-singh-809a6b256)\n\nThe repository does not specify a city/state or response time.`,
        followUps: [
          "What is his Flutter experience?",
          "Can I download his CV?",
          "Tell me about his top projects"
        ]
      };
    }

    // 18. Projects Showcase (Overview of all projects)
    if (/\b(projects?|portfolio|showcase|flagship|apps?\s+(shipped|built)|what\s+apps?)\b/i.test(q)) {
      return {
        text: `The checked-in repository documents one public project in detail: **DropLink — Secure File Sharing**, deployed under [/Vibe/](/Vibe/). Its homepage describes guest file transfers, encrypted cloud storage, and an account-based personal vault. Other portfolio projects are served from the live CMS and are not included in this checkout.`,
        followUps: [
          "Tell me about DropLink",
          "How can I hire him for a project?"
        ]
      };
    }

    // 19. Technical Arsenal / Skills Breakdown
    if (/\b(skills?|tech\s*stack|stack|arsenal|languages?|frameworks?|tools?|what does he know)\b/i.test(q)) {
      return {
        text: `**Satwinder's Core Technical Arsenal:** 🛠️\n\n- **Mobile Engineering:** Flutter, Dart, Android, Kotlin, and Method Channels.\n- **State Management:** BLoC, Riverpod, and GetX.\n- **Architecture:** Clean Architecture, MVVM, and Isolates.\n- **Backend & Real-Time:** Firebase, WebSockets, and REST APIs.\n- **Delivery:** Fastlane CI/CD.`,
        followUps: [
          "What state management does he prefer?",
          "How does he approach rendering performance?",
          "Tell me about his top projects"
        ]
      };
    }

    // 20. Default Conversational Fallback
    return {
        text: `Thanks for asking! As **Satwinder's AI Assistant**, I can help you explore his portfolio.\n\nSatwinder is a **Senior Flutter Developer** whose listed skills include Flutter, Dart, Android, Firebase, and Clean Architecture.\n\nWhat would you like to know more about?`,
      followUps: [
        "What are his core technical skills?",
        "Tell me about his top projects",
        "What is his experience with Flutter & BLoC?",
        "How can I contact or hire Satwinder?"
      ]
    };
  }

  // ------------------------------------------------------------
  //  4. Cloud LLM Engine (Gemini API Integration)
  // ------------------------------------------------------------
  async function callGeminiApi(userPrompt, history, apiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    const systemInstruction = `You are the personal AI Portfolio Assistant for Satwinder Singh, a Senior Flutter Developer.
Your role is to answer questions from recruiters, clients, and developers about Satwinder's skills, projects, architecture philosophy, and availability.
Be friendly, articulate, professional, and concise.

Ground answers in facts visible on the portfolio and the checked-in project sources. Do not invent project details, location, performance metrics, test coverage, client results, or qualifications. If a fact is not documented, say it is not available in the portfolio.

Key Facts about Satwinder:
- Role: Senior Flutter Developer.
- Portfolio claims: 10+ production apps and 99.9% crash-free; supporting reports are not in this repository.
- Core skills listed on the portfolio: Flutter, Dart, Android, Kotlin, BLoC, Riverpod, Clean Architecture, Firebase, WebSockets, Fastlane.
- Checked-in public project: DropLink — Secure File Sharing, deployed under /Vibe/.
- Contact: Email (satwindersinghasr2@gmail.com), WhatsApp (+91 98779 95250), GitHub (github.com/Satwinder777).
- Availability: The homepage currently shows availability for senior roles.

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
