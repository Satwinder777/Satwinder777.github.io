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
      linkedin: "https://www.linkedin.com/in/satwinder-singh-809a6b256",
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
  // ------------------------------------------------------------
  //  3. Grounded Intelligence Engine (Multi-Case Intent Matcher)
  // ------------------------------------------------------------
  function generateLocalResponse(query, history) {
    const q = query.toLowerCase().trim();

    // 1. Greetings & Casual Introductions
    if (/^(hi|hello|hey|namaste|sat sri akaal|hola|greetings|good morning|good afternoon|good evening|yo)\b/i.test(q)) {
      return {
        text: `Hello! 👋 Welcome to **Satwinder Singh's Portfolio Assistant**.\n\nSatwinder is a **Senior Flutter Engineer & System Architect** with 3+ years of experience delivering 10+ production apps with 99.9% crash-free uptime.\n\nHow can I help you today? You can ask about his **skills**, **flagship projects**, **clean architecture**, or **how to hire him**.`,
        followUps: [
          "What are his core technical skills?",
          "Tell me about his top projects",
          "What is his experience with Flutter & BLoC?",
          "How can I contact or hire Satwinder?"
        ]
      };
    }

    // 2. Specific Project: Vibe Real-Time Collaboration
    if (/vibe/i.test(q)) {
      return {
        text: `**Vibe Real-Time Collaboration Platform** 🚀\n\n- **Overview:** Full-stack reactive mobile and web platform engineered for ultra-low latency team collaboration.\n- **Architecture:** Rigid **Clean Architecture** driven by **BLoC & Cubit** state management.\n- **Real-Time Engine:** Bi-directional **WebSockets** state synchronization delivering sub-50ms event updates across connected clients.\n- **Offline-First:** Local caching using SQLite & Hive with **optimistic UI updates** and automated conflict resolution upon network reconnection.\n- **Key Outcome:** Shipped with seamless real-time CMS sync, zero-latency reactive canvas, and 99.9% session stability.`,
        followUps: [
          "Tell me about Satcraft",
          "What state management does he prefer?",
          "How does he handle offline sync in Flutter?",
          "How can I hire him for a project?"
        ]
      };
    }

    // 3. Specific Project: Satcraft Resume Suite
    if (/satcraft/i.test(q)) {
      return {
        text: `**Satcraft Resume & Portfolio Suite** 📄⚡\n\n- **Overview:** High-performance reactive web application designed for instant, dynamic ATS-compliant document generation.\n- **Tech Stack:** **TypeScript, Vite, React, Tailwind CSS**, and client-side vector PDF generation engines.\n- **Engineering Feat:** Replaced slow server-side PDF render pipelines with instant client-side vector generation (via jsPDF & Canvas), eliminating server latency and cloud compute costs.\n- **User Experience:** Live interactive split-pane preview, customizable typography, and sub-second export times.`,
        followUps: [
          "Tell me more about Vibe's architecture",
          "What are his core technical skills?",
          "Can I download his CV?",
          "How can I contact Satwinder?"
        ]
      };
    }

    // 4. Specific Project: Enterprise Multi-Tenant Mobile Suite
    if (/enterprise|multi-tenant|tenant|100k|workload/i.test(q)) {
      return {
        text: `**Enterprise Multi-Tenant Mobile Suite** 🏢📱\n\n- **Scale:** Engineered for high-concurrency enterprise workloads serving **100,000+ monthly active users**.\n- **State & Architecture:** Modular multi-package architecture built with **Riverpod**, custom Render Objects, and strict separation of concerns.\n- **Dynamic White-Labeling:** Multi-flavor runtime configuration allowing clients to run branded themes, feature flags, and custom tenant workflows from a single codebase.\n- **Reliability:** Maintained a strict **99.9% crash-free rate** backed by automated Fastlane CI/CD and regression testing suites.`,
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
        text: `**Satwinder's State Management Philosophy:** 🧠\n\n- **Enterprise Scale — BLoC / Cubit:** His primary choice for mission-critical enterprise applications. BLoC enforces strict **unidirectional data flow (Events → States)**, ensures complete UI decoupling, and enables 100% deterministic unit testing.\n- **Reactive Modern Apps — Riverpod:** Extensively used for apps requiring compile-time safety, auto-dispose lifecycle management, and clean dependency injection without ` + "`BuildContext`" + ` limitations.\n- **Pragmatic Exposure — GetX & Provider:** Proficient in both for rapid prototyping or maintaining legacy systems, but advocates BLoC/Riverpod for scalable, testable architectures.`,
        followUps: [
          "How does he structure Clean Architecture?",
          "Tell me more about Vibe's architecture",
          "What makes his Flutter apps crash-free?"
        ]
      };
    }

    // 6. Offline-First Architecture & Synchronization
    if (/offline|sync|caching|cache|connectivity|sqlite|hive|isar|network loss/i.test(q)) {
      return {
        text: `**Offline-First Architecture & Synchronization:** 📡💾\n\nSatwinder designs mobile systems that work effortlessly regardless of network conditions:\n\n1. **Local Single Source of Truth:** The UI always binds to local reactive stores (**Hive, Isar, or SQLite**), never directly blocking on HTTP requests.\n2. **Optimistic UI Updates:** User interactions reflect immediately on screen while mutation operations are dispatched to a persistent queue.\n3. **Resilient Background Sync Queue:** Network mutations are retried automatically with exponential backoff via background workers.\n4. **Conflict Resolution:** Employs timestamp-based reconciliation and idempotent API endpoints to prevent data duplication.\n5. **Reactive Connectivity Listeners:** Instant transition between online and offline states without disrupting user sessions.`,
        followUps: [
          "What makes his Flutter apps crash-free?",
          "Tell me more about Vibe's architecture",
          "What state management does he prefer?"
        ]
      };
    }

    // 7. 99.9% Crash-Free Stability & Error Boundaries
    if (/crash|99\.9|stability|reliable|error handling|sentry|crashlytics|bugs/i.test(q)) {
      return {
        text: `**How Satwinder Achieves 99.9% Crash-Free Rates:** 🛡️\n\nAcross 10+ shipped production apps and 100K+ active users, he guarantees stability through:\n\n- **Strict Defensive Null-Safety:** Never uses risky force-unwraps (` + "`!`" + `) in production code; every asynchronous response and model field is safely guarded.\n- **Layered Error Boundaries:** Application wrapped in ` + "`runZonedGuarded`" + ` and ` + "`FlutterError.onError`" + ` catching unhandled asynchronous microtask errors and rendering graceful user fallbacks.\n- **Real-Time Telemetry:** Integrated **Firebase Crashlytics** and **Sentry** with custom breadcrumbs and user journey tags for sub-15-minute bug triage.\n- **Defensive API Circuit Breakers:** Graceful fallbacks for network drops, malformed JSON payloads, and server timeouts.`,
        followUps: [
          "How does he optimize 60 FPS rendering?",
          "What is his testing strategy?",
          "How can I contact or hire Satwinder?"
        ]
      };
    }

    // 8. Performance Optimization & 60/120 FPS Rendering
    if (/performance|fps|jank|speed|frame|profiling|isolate|optimize|rendering|lag/i.test(q)) {
      return {
        text: `**Performance Tuning & 60/120 FPS Rendering:** ⚡🎬\n\nSatwinder has optimized Flutter rendering pipelines reducing frame jank from 18% down to **under 1.2%**:\n\n- **DevTools Timeline Profiling:** Continuous profiling of UI and Raster threads to eliminate frame drops and expensive layout passes.\n- **Dart Isolates (Multi-Threading):** Offloads heavy JSON parsing, cryptography, and image compression completely off the UI thread.\n- **Rebuild Minimization:** Aggressive use of ` + "`const`" + ` constructors, granular ` + "`BlocBuilder`" + ` scoping, and ` + "`RepaintBoundary`" + ` to prevent unnecessary subtree repaints.\n- **Image & Memory Management:** Pre-caching asset bundles, downsampling textures, and leak detection via DevTools Memory Snapshots.`,
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

    // 10. Native Android & iOS Bridges (Method Channels / Kotlin / Swift)
    if (/native|kotlin|swift|method channel|event channel|platform channel|java|bridge|android native|ios native/i.test(q)) {
      return {
        text: `**Native Android & iOS Engineering Depth:** 📱⚙️\n\nUnlike pure cross-platform wrappers, Satwinder bridges deep into native platform layers:\n\n- **Native Android (Kotlin/Java):** 3+ years writing background services, BroadcastReceivers, Jetpack components, and custom native Views.\n- **Native iOS (Swift):** Custom MethodChannels, AppDelegate lifecycle hooks, and CoreLocation / StoreKit integration.\n- **Bidirectional Channels:** EventChannels for continuous sensor and audio streams; MethodChannels for synchronous native hardware execution.\n- **Third-Party SDKs:** Seamless native bridging for biometric auth, payment SDKs, and BLE (Bluetooth Low Energy) hardware devices.`,
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
        text: `**Testing & Automated CI/CD Pipelines:** 🧪🚀\n\n- **Unit Testing:** Comprehensive test coverage for Domain use cases and BLoC state streams using ` + "`package:test`" + ` and ` + "`mocktail`" + `.\n- **Widget & Component Testing:** Golden tests and interaction simulations ensuring responsive rendering across varied screen densities.\n- **Automated CI/CD with Fastlane:** Scripted pipelines in **GitHub Actions** executing static analysis (` + "`dart analyze`" + `), test suites, keystore code signing, and 1-click deployments to **Google Play Console** and **Apple TestFlight**.`,
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
        text: `**Why Hire Satwinder Singh?** ⭐\n\n1. **Architectural Discipline:** He builds with Clean Architecture and strict separation of concerns, ensuring codebases remain maintainable as teams scale.\n2. **Rock-Solid Stability:** Proven **99.9% crash-free rate** across 100K+ monthly active users.\n3. **Native Depth:** Native Android Kotlin skills enable him to write custom hardware drivers and MethodChannels without third-party limitations.\n4. **End-to-End Ownership:** From initial architectural design to Fastlane CI/CD automated deployment on App Store & Google Play.`,
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
        text: `**Location & Timezone Availability:** 🌍\n\n- **Base:** Punjab / Amritsar, India (IST — UTC+5:30).\n- **Remote Flexibility:** Experienced working with distributed international teams across **US (EST/PST), UK/Europe (GMT/CET), and APAC** timezones with reliable daily overlap.\n- **Setup:** High-speed gigabit fiber connection, professional testing lab with physical Android & iOS devices.`,
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
        text: `**Satwinder's Career Trajectory (3+ Years Experience):** 💼📈\n\n- **Senior Software Developer @ ToXSL Technologies** *(Jan 2025 – Present)*\n  Leading mobile architectures, performance optimization, CI/CD pipeline automation, and mentoring engineering teams in Clean Architecture.\n- **Flutter Developer @ Seraphic Infosolutions** *(Jun 2024 – Jun 2025)*\n  Engineered cross-platform mobile apps with Flutter & Dart, complex UI animations, MethodChannels, and REST APIs.\n- **Android Developer @ Blocvibe Technologies** *(Oct 2023 – Jun 2024)*\n  Developed responsive native Android apps using Kotlin and Jetpack components.\n- **Android Developer @ Possibility Solutions** *(Jan 2022 – Jan 2024)*\n  Handled native Java/Kotlin modules, UI debugging, and system integration.`,
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
        text: `**Satwinder Singh — Senior Flutter Engineer Resume:** 📄\n\n- **Experience:** 3+ Years in Mobile Engineering & System Architecture\n- **Delivered:** 10+ Production Apps | 99.9% Crash-Free | 60+ FPS Rendering\n- **Core Stack:** Flutter, Dart, Android (Kotlin), Clean Architecture, BLoC, Riverpod, Fastlane CI/CD.\n\nTo view or download his official resume, click the **"Download CV"** button in the hero section or email him directly at [${portfolioKnowledge.contact.email}](mailto:${portfolioKnowledge.contact.email}).`,
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
        text: `**Satwinder is Actively Available for High-Impact Roles!** 🚀\n\n- **Target Roles:** Senior Flutter Engineer, Staff Mobile Architect, or Technical Mobile Lead.\n- **Engagement Types:** Full-time roles, contract architecture consulting, or high-value freelance projects.\n- **Working Mode:** Remote globally with full timezone alignment for US, UK, Europe, and APAC teams.\n- **Direct Contact:**\n  - **Email:** [${portfolioKnowledge.contact.email}](mailto:${portfolioKnowledge.contact.email})\n  - **WhatsApp:** [${portfolioKnowledge.contact.whatsapp}](https://wa.me/919877995250)\n  - **GitHub:** [${portfolioKnowledge.contact.github}](${portfolioKnowledge.contact.github})\n\nYou can also click the **"Get In Touch"** button on this page to initiate an interview!`,
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
        text: `**Get in Touch with Satwinder Singh:** 📬\n\n- **Email:** [${portfolioKnowledge.contact.email}](mailto:${portfolioKnowledge.contact.email})\n- **WhatsApp:** [${portfolioKnowledge.contact.whatsapp}](https://wa.me/919877995250)\n- **GitHub:** [${portfolioKnowledge.contact.github}](${portfolioKnowledge.contact.github})\n- **LinkedIn:** [linkedin.com/in/satwinder-singh-809a6b256](https://www.linkedin.com/in/satwinder-singh-809a6b256)\n- **Location:** Punjab, India (Open to Remote Globally)\n\nHe typically responds to serious inquiries within a few hours!`,
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
        text: `Here are **Satwinder's flagship engineering projects**:\n\n1. **Vibe Real-Time Platform:** Full-stack reactive collaboration app with real-time CMS, offline caching, and instant WebSocket state synchronization.\n2. **Satcraft Resume Suite:** High-performance web app built with TypeScript, Vite, and client-side vector PDF generation.\n3. **Enterprise Multi-Tenant Mobile Suite:** Production Flutter architecture serving 100K+ monthly active users with strict 99.9% crash-free uptime.`,
        followUps: [
          "Tell me more about Vibe's architecture",
          "Tell me about Satcraft",
          "How can I hire him for a project?"
        ]
      };
    }

    // 19. Technical Arsenal / Skills Breakdown
    if (/\b(skills?|tech\s*stack|stack|arsenal|languages?|frameworks?|tools?|what does he know)\b/i.test(q)) {
      return {
        text: `**Satwinder's Core Technical Arsenal:** 🛠️\n\n- **Mobile Engineering:** Expert in **Flutter & Dart**, with native bridges into **Android (Kotlin/Java)** and **iOS (Swift)**.\n- **State Management:** Production mastery of **BLoC, Cubit, and Riverpod**.\n- **Architecture:** Domain-Driven Design (DDD), Clean Architecture, Modular Packages, Isolates.\n- **Backend & Real-Time:** Firebase (Firestore, Auth, Rules), WebSockets, REST APIs, and Offline-First synchronization.\n- **Testing & DevOps:** Fastlane CI/CD, GitHub Actions, and high-frequency UI/Unit testing suites.`,
        followUps: [
          "What state management does he prefer?",
          "How does he optimize 60 FPS rendering?",
          "Tell me about his top projects"
        ]
      };
    }

    // 20. Default Conversational Fallback
    return {
      text: `Thanks for asking! As **Satwinder's AI Assistant**, I can help you evaluate his fit for your engineering team.\n\nSatwinder is a **Senior Flutter Engineer & Architect** with 3+ years experience, 10+ shipped production apps, and proven expertise in Clean Architecture and 60 FPS performance.\n\nWhat would you like to know more about?`,
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
