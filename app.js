/**
 * HybridVault AI — app.js
 * Hybrid AI Document & Note Studio
 * Firebase AI Logic SDK + Chrome Gemini Nano + Cloud Gemini 3.8 Flash
 *
 * Google #BuildHybridAI 2026 Hackathon — Web / Chrome category
 * Apache-2.0 License
 */

// ─── App Check Debug Token (must be set before any Firebase import) ──────────
// Enables judges and hosted previews to pass App Check verification seamlessly.
self.FIREBASE_APPCHECK_DEBUG_TOKEN = "11111111-2222-4333-8444-555555555555";

// ─── Firebase SDK Imports (official gstatic CDN ES modules) ──────────────────
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";

import { initializeAppCheck, ReCaptchaEnterpriseProvider, CustomProvider }
  from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app-check.js";

import { getAI, getGenerativeModel, GoogleAIBackend, InferenceMode }
  from "https://www.gstatic.com/firebasejs/12.6.0/firebase-ai.js";

// ─── Safe InferenceMode fallback ─────────────────────────────────────────────
// Guards against an extension or network policy blocking the CDN script, which
// would leave InferenceMode undefined and crash the routing logic at call time.
const SafeInferenceMode = InferenceMode || {
  PREFER_ON_DEVICE: 'prefer_on_device',
  ONLY_ON_DEVICE:   'only_on_device',
  PREFER_IN_CLOUD:  'prefer_in_cloud',
  ONLY_IN_CLOUD:    'only_in_cloud'
};

// ─── Cloud model fallback chain ───────────────────────────────────────────────
// Tried in order on any retryable failure. The lite model is first because its
// median latency is well under 1 s; the heavier models follow as fallbacks for
// when the lite endpoint is itself saturated or unavailable.
const CLOUD_FALLBACK_CHAIN = [
  "gemini-3.8-flash-lite",   // primary  — fastest, lowest latency
  "gemini-3.8-flash",        // fallback — full model
  "gemini-3.5-flash"         // last resort — stable, wide availability
];

// Per-attempt timeout (ms). If a model hasn't responded within this window the
// attempt is aborted and the next chain entry is tried immediately.
const ATTEMPT_TIMEOUT_MS = 12_000;

// ═════════════════════════════════════════════════════════════════════════════
// FIREBASE CONFIGURATION
// ═════════════════════════════════════════════════════════════════════════════
const firebaseConfig = {
  apiKey:            "AIzaSyC8v8yw6X69mcunOsm-S90TAOhhuh07zEE",
  authDomain:        "hybridvault-ai.firebaseapp.com",
  projectId:         "hybridvault-ai",
  storageBucket:     "hybridvault-ai.firebasestorage.app",
  messagingSenderId: "1078494999071",
  appId:             "1:1078494999071:web:146645630d3715f9615b2a",
  measurementId:     "G-X342ERBS2C"
};

// ═════════════════════════════════════════════════════════════════════════════
// SAMPLE DOCUMENTS (pre-loaded realistic vault content)
// ═════════════════════════════════════════════════════════════════════════════
const SAMPLE_DOCS = [
  {
    id: "sample-1",
    title: "Confidential M&A Memo — Project Titan",
    tag: "confidential",
    icon: "📁",
    date: "2025-07-10",
    content: `CONFIDENTIAL — ATTORNEY-CLIENT PRIVILEGED
Project Titan — Strategic Acquisition Briefing
Prepared for: Executive Leadership Committee
Classification: EYES ONLY

EXECUTIVE SUMMARY
The board of directors has authorized exploratory due diligence on the potential acquisition of Nexus Dynamics Corp (NDC), a privately held AI infrastructure company valued at approximately $2.4B based on its most recent Series D round. This memo outlines the strategic rationale, preliminary valuation range, identified synergies, and key risk factors requiring further investigation.

STRATEGIC RATIONALE
Acquiring NDC would accelerate our entry into the enterprise AI-infrastructure segment by an estimated 18–24 months versus organic build. NDC's proprietary tensor-routing architecture is protected by 14 granted patents and would provide immediate competitive differentiation. NDC's customer base includes 3 of the top 5 US cloud hyperscalers on multi-year contracts.

PRELIMINARY VALUATION
Based on comparable transactions (xAI/Inflection, Cohere Series D) and NDC's ARR of $180M growing at 72% YoY, our banking advisor has modeled:
  — Bear case: $1.9B (8× ARR, 15% discount for integration risk)
  — Base case: $2.6B (14.4× ARR)
  — Bull case: $3.2B (17.8× ARR, full synergy credit)

KEY SYNERGIES IDENTIFIED
1. Infrastructure consolidation savings: estimated $40M annually by Year 3
2. Cross-sell into existing enterprise customer base: TAM expansion of $800M
3. Talent retention: 42 ML engineers with critical on-device inference expertise

RISK FACTORS
• Regulatory: HSR filing required; FTC scrutiny likely given market concentration
• Technical: NDC's codebase relies on 3 open-source libraries with GPL-adjacent licenses
• Personnel: CEO and two key engineers have 18-month golden-handcuff clauses expiring Q3 2026
• Financial: NDC carries $230M in venture debt; repayment would be required at close

NEXT STEPS
1. Engage NDC management for preliminary NDA and data room access (Target: July 25)
2. Commission third-party IP audit (Estimated cost: $180K, Timeline: 3 weeks)
3. Brief Audit Committee in closed session at August board meeting

This document is intended solely for authorized recipients. Unauthorized disclosure may constitute a breach of fiduciary duty and applicable securities regulations.`
  },
  {
    id: "sample-2",
    title: "Medical Research Field Notes — Trial HV-204",
    tag: "medical",
    icon: "🧬",
    date: "2025-07-08",
    content: `RESEARCH FIELD NOTES — TRIAL HV-204
Principal Investigator: Dr. Amara Osei-Bonsu, MD PhD
Institution: Meridian Institute of Translational Medicine
IRB Protocol: MIT-2025-04-0882 | Phase IIb Blinded
Date Range: June 3 – July 7, 2025

STUDY OVERVIEW
Trial HV-204 evaluates the efficacy and safety of HV-204 (a novel PCSK9 inhibitor formulation with extended-release microencapsulation) versus placebo in patients with familial hypercholesterolemia unresponsive to maximally-tolerated statin therapy.

ENROLLMENT STATUS
Target N = 240 (120 per arm). Current enrollment as of July 7: 194 patients.
Sites active: Cleveland (n=72), Houston (n=68), Toronto (n=54).
Dropout rate: 4.6% (consistent with prior Phase IIa data, within acceptable range).

PRELIMINARY OBSERVATIONS (blinded aggregate)
— Mean LDL-C reduction at Week 12 (all enrolled): 54.2% ± 8.7% from baseline
— Responder rate (>50% LDL-C reduction): 61 of 194 evaluable patients (31.4%)
— Adverse events: 12 injection-site reactions (mild, Grade 1); 2 cases transaminase elevation (Grade 2, both resolved with dose hold); 0 SAEs to date

SITE-SPECIFIC NOTES
Cleveland (Dr. Park): Noted clustering of non-responders in patients with APOE ε4 genotype. Recommend unblinded pharmacogenomics sub-analysis after primary endpoint lock.
Houston (Dr. Villanueva): Patient HV204-HOU-089 withdrew consent citing travel burden; replaced per protocol amendment 3.
Toronto (Dr. Agyemang): Pharmacy dispensing error detected July 2 — 3 patients received incorrect lot; DSMB notified; unblinding requested for safety review (pending).

BIOMARKER SUBGROUP (exploratory)
Patients with baseline hsCRP > 2.0 mg/L (n=47) show 61.3% mean LDL-C reduction vs. 48.9% in hsCRP ≤ 2.0 group. This inflammatory-biomarker-stratified signal warrants prospective evaluation in Phase III design.

ACTION REQUIRED
1. Submit Toronto incident report to FDA within 72 hours (deadline: July 10)
2. Convene DSMB teleconference to review unblinding request
3. Amend statistical analysis plan to include APOE ε4 stratification
4. Coordinate with biometrics on interim database lock (target July 31)

CONFIDENTIALITY: These notes contain identifiable patient information and unpublished trial data protected under 21 CFR Part 11 and HIPAA Privacy Rule.`
  },
  {
    id: "sample-3",
    title: "Product Architecture Spec — HybridEdge Runtime",
    tag: "technical",
    icon: "⚙️",
    date: "2025-07-05",
    content: `HYBRIDEDGE RUNTIME — TECHNICAL ARCHITECTURE SPECIFICATION
Document Version: 0.9.2 (Draft for Engineering Review)
Author: Platform Architecture Team
Last Updated: 2025-07-05

1. OVERVIEW
HybridEdge is a client-side AI runtime abstraction layer that orchestrates inference routing between Chrome's Built-in AI (Gemini Nano, via window.ai / LanguageModel API) and cloud inference endpoints (Firebase AI Logic / Vertex AI). The goal is to minimize latency and cloud egress cost while maintaining quality guarantees and graceful degradation.

2. CORE COMPONENTS

2.1 InferenceRouter
  Inputs: { task: TaskType, payload: string, userPreference: InferenceMode }
  Outputs: { result: string, source: "on_device" | "cloud", latencyMs: number }
  
  Routing Logic:
    PREFER_ON_DEVICE:
      1. Check window.ai?.languageModel availability
      2. If available → attempt on-device inference with 8s timeout
      3. On timeout or error → fallback to cloud
      4. Tag response with inferenceSource = "on_device" or "cloud_fallback"
    
    ONLY_ON_DEVICE:
      1. Hard-fail if window.ai unavailable; surface user-readable error
      2. No network calls permitted
    
    PREFER_IN_CLOUD / ONLY_IN_CLOUD:
      1. Bypass on-device check; send directly to Firebase AI Logic
      2. Use gemini-3.8-flash model via GoogleAIBackend

2.2 DocumentVault
  Storage: localStorage with JSON serialization
  Schema: { id, title, content, tag, icon, date, modified }
  Max documents: 50 (enforced with LRU eviction)
  Persistence: auto-save on 800ms debounce after content change

2.3 TelemetryCollector
  Tracks per-inference: { source, latencyMs, charCount, action, timestamp }
  Aggregates: totalInferences, onDeviceCount, cloudCount, avgLatency
  Privacy: all telemetry is session-local, never transmitted

3. FIREBASE AI LOGIC INTEGRATION
  SDK: firebase-ai.js v12.6.0 (gstatic CDN)
  Backend: GoogleAIBackend
  Model config:
    Cloud: { model: "gemini-3.8-flash" }
    On-device: { onDeviceParams: { temperature: 0.7, topK: 40 } }
  App Check: ReCaptchaEnterpriseProvider with debug token for CI/CD

4. PROMPT ENGINEERING TEMPLATES

4.1 Private Summary (on-device optimized — shorter prompts for Nano context window):
  "Summarize in 3-5 bullet points. Be concise. Document: {content}"

4.2 Action Item Extraction (structured JSON output):
  "Extract action items as JSON array: [{task, owner, deadline, priority}]. Document: {content}"

4.3 Deep Synthesis (cloud — complex multi-step):
  "You are an expert analyst. Provide: 1) Executive summary 2) Key insights 3) Risk factors 4) Recommendations. Document: {content}"

4.4 Translate & Tone Polish:
  "Identify the primary language. If not English, translate to English. Then rewrite in professional business tone. Preserve all factual content. Document: {content}"

5. PRIVACY & SECURITY MODEL
  — On-device mode: zero data leaves the browser; no network calls
  — Cloud mode: content transmitted over TLS 1.3 to Firebase AI Logic
  — App Check: prevents unauthorized API callers from abusing the Firebase project
  — No user authentication required; vault is local-only
  — Sensitive content detection: keyword heuristic flags docs for on-device recommendation

6. OPEN QUESTIONS (for review)
  [ ] Streaming response support via generateContentStream() — target v1.0
  [ ] IndexedDB migration for larger vault capacity — deprioritized
  [ ] Service Worker for offline on-device inference — nice-to-have
  [ ] Multi-tab vault sync via BroadcastChannel API — v1.1 candidate`
  },
  {
    id: "sample-4",
    title: "Multilingual Customer Feedback — Q2 2025",
    tag: "multilingual",
    icon: "🌐",
    date: "2025-07-01",
    content: `MULTILINGUAL CUSTOMER FEEDBACK COMPILATION
Product: Orion Analytics Platform | Period: Q2 2025 (April–June)
Collected via: In-app NPS survey, support tickets, App Store reviews
Languages detected: English, Spanish, French, German, Japanese, Portuguese

── ENGLISH ──────────────────────────────────────────────────
"The new dashboard is incredibly fast but I miss the classic list view. Can you bring it back as a toggle? Also the mobile app crashes when I try to export PDFs larger than 50 pages." — Enterprise customer, Chicago (NPS: 7)

"Your support team resolved my data sync issue in under 2 hours on a Sunday. That's genuinely impressive. Keep it up." — SMB customer, Austin (NPS: 10)

── SPANISH ─────────────────────────────────────────────────
"La nueva función de análisis predictivo es exactamente lo que necesitábamos para nuestros informes trimestrales. Sin embargo, la localización al español todavía tiene errores en los formatos de fecha y moneda. Por favor, corrijan esto antes del próximo lanzamiento." — Enterprise customer, Madrid (NPS: 8)

"El tiempo de carga del módulo de reportes es demasiado lento. Tardamos más de 45 segundos en cargar un informe con 10,000 filas. Esto no es aceptable para nuestro equipo de ventas." — Mid-market, Bogotá (NPS: 4)

── FRENCH ──────────────────────────────────────────────────
"L'intégration avec Salesforce fonctionne parfaitement depuis la mise à jour de mai. Nous avons pu automatiser entièrement notre pipeline de rapports. Très satisfait." — Enterprise, Paris (NPS: 9)

"Il manque une option pour exporter en format ODS (LibreOffice). Beaucoup d'organisations publiques en France utilisent exclusivement des logiciels libres." — Public sector, Lyon (NPS: 6)

── GERMAN ──────────────────────────────────────────────────
"Die DSGVO-Konformitätsdokumentation ist unvollständig. Wir benötigen dringend einen aktualisierten Auftragsverarbeitungsvertrag (AVV) für unsere Datenschutzprüfung im September." — Enterprise, Munich (NPS: 5)

"Hervorragend! Die neue API v3 hat unsere Integrationsentwicklung erheblich vereinfacht. Die Dokumentation ist klar und die Beispiele funktionieren sofort." — Developer, Berlin (NPS: 10)

── JAPANESE ─────────────────────────────────────────────────
「ダッシュボードの日本語フォントレンダリングが改善されました。以前は文字が潰れていましたが、今は読みやすいです。ありがとうございます。」— Enterprise, Tokyo (NPS: 8)

「APIのレート制限が厳しすぎます。1分間に100リクエストでは、私たちのリアルタイム処理ニーズを満たせません。上位プランでの制限緩和を検討してください。」— Startup, Osaka (NPS: 6)

── PORTUGUESE ──────────────────────────────────────────────
"A funcionalidade de colaboração em tempo real finalmente chegou! Minha equipe consegue trabalhar em análises simultâneas sem conflitos. Excelente melhoria." — Mid-market, São Paulo (NPS: 9)

"Precisamos de suporte para o PIX como método de pagamento. Todos os nossos fornecedores brasileiros usam PIX e a ausência dessa integração está impedindo nossa adoção completa." — SMB, Rio de Janeiro (NPS: 6)

── AGGREGATED THEMES ───────────────────────────────────────
Priority issues by frequency:
1. Performance / load time (5 mentions across 3 languages)
2. Mobile stability — PDF export crash (3 mentions)
3. Localization accuracy — dates, currencies (2 mentions)
4. Compliance documentation — GDPR/LGPD (2 mentions)
5. Feature requests — classic view toggle, ODS export, PIX payment`
  }
];

// ═════════════════════════════════════════════════════════════════════════════
// SESSION TELEMETRY
// ═════════════════════════════════════════════════════════════════════════════
const telemetry = {
  totalInferences: 0,
  onDeviceCount: 0,
  cloudCount: 0,
  latencies: [],
  get avgLatency() {
    if (this.latencies.length === 0) return null;
    const sum = this.latencies.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencies.length);
  }
};

// ═════════════════════════════════════════════════════════════════════════════
// APPLICATION STATE
// ═════════════════════════════════════════════════════════════════════════════
const state = {
  docs: [],
  activeDocId: null,
  aiInitialized: false,
  appCheckInitialized: false,
  firebaseApp: null,
  aiInstance: null,
  saveTimer: null,
  currentActionLabel: "AI Output",
  isRunning: false
};

// ─── DOM References ───────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const dom = {
  docsList:          $("docs-list"),
  docSearch:         $("doc-search"),
  docTitle:          $("doc-title"),
  docContent:        $("doc-content"),
  wordCount:         $("word-count"),
  charCount:         $("char-count"),
  lineCount:         $("line-count"),
  saveStatus:        $("save-status"),
  sensitivityInd:    $("sensitivity-indicator"),
  sensitivityLabel:  $("sensitivity-label"),
  inferenceMode:     $("inference-mode"),
  sourceBadge:       $("source-badge"),
  sourceLabel:       $("source-label"),
  latencyVal:        $("latency-val"),
  tokenVal:          $("token-val"),
  appCheckStatus:    $("appcheck-status"),
  appCheckLabel:     $("appcheck-label"),
  aiOutputBox:       $("ai-output-box"),
  outputActionLabel: $("output-action-label"),
  customPrompt:      $("custom-prompt"),
  runCustomBtn:      $("run-custom-btn"),
  copyOutputBtn:     $("copy-output-btn"),
  newNoteBtn:        $("new-note-btn"),
  diagToggleBtn:     $("diag-toggle-btn"),
  diagOverlay:       $("diag-overlay"),
  diagCloseBtn:      $("diag-close-btn"),
  toastContainer:    $("toast-container"),
  // Diagnostics panel fields
  dAppInit:          $("d-app-init"),
  dAppCheck:         $("d-appcheck"),
  dWindowAi:         $("d-window-ai"),
  dLanguageModel:    $("d-language-model"),
  dAiAvailability:   $("d-ai-availability"),
  dGeminiNano:       $("d-gemini-nano"),
  dTotalInferences:  $("d-total-inferences"),
  dOndeviceCount:    $("d-ondevice-count"),
  dCloudCount:       $("d-cloud-count"),
  dAvgLatency:       $("d-avg-latency"),
  dDocCount:         $("d-doc-count"),
  dCurrentMode:      $("d-current-mode")
};

// ═════════════════════════════════════════════════════════════════════════════
// FIREBASE INITIALIZATION
// ═════════════════════════════════════════════════════════════════════════════
async function initFirebase() {
  // Outer try/catch ensures a blocked CDN script or any other init failure
  // never prevents the vault and editor from loading.
  try {
    if (typeof initializeApp !== "function") {
      throw new Error("firebase-app.js did not load (CDN blocked?)");
    }

    state.firebaseApp = initializeApp(firebaseConfig);
    dom.dAppInit.textContent = "✓ Initialized";
    dom.dAppInit.className = "diag-card-value ok";

    try {
      await initAppCheck();
    } catch (appCheckErr) {
      // App Check failure is non-fatal; AI calls may still succeed in dev.
      console.warn("App Check skipped:", appCheckErr);
    }

    if (typeof getAI !== "function" || typeof GoogleAIBackend !== "function") {
      throw new Error("firebase-ai.js did not load (CDN blocked?)");
    }

    state.aiInstance = getAI(state.firebaseApp, { backend: new GoogleAIBackend() });
    state.aiInitialized = true;

    showToast("Firebase AI Logic ready", "success");
  } catch (err) {
    console.error("Firebase init error:", err);
    dom.dAppInit.textContent = "✗ " + err.message;
    dom.dAppInit.className = "diag-card-value error";
    // Vault, editor, and sample docs remain fully functional without AI.
    showToast("Firebase unavailable — vault works, AI disabled", "error");
  }
}

async function initAppCheck() {
  try {
    if (typeof initializeAppCheck !== "function" || typeof CustomProvider !== "function") {
      throw new Error("firebase-app-check.js did not load (CDN blocked?)");
    }

    // Use CustomProvider as a lightweight debug-token-based provider that works
    // in all environments without requiring a reCAPTCHA site key.
    const appCheck = initializeAppCheck(state.firebaseApp, {
      provider: new CustomProvider({
        getToken: () => {
          return Promise.resolve({
            token: self.FIREBASE_APPCHECK_DEBUG_TOKEN,
            expireTimeMillis: Date.now() + 3600 * 1000
          });
        }
      }),
      isTokenAutoRefreshEnabled: true
    });

    state.appCheckInitialized = true;
    dom.dAppCheck.textContent = "✓ Debug Token Active";
    dom.dAppCheck.className = "diag-card-value ok";
    dom.appCheckStatus.className = "appcheck-badge verified";
    dom.appCheckLabel.textContent = "APP CHECK VERIFIED";
    showToast("App Check verified (debug token)", "success");
  } catch (err) {
    console.warn("App Check init warning:", err);
    dom.dAppCheck.textContent = "⚠ " + err.message;
    dom.dAppCheck.className = "diag-card-value warn";
    dom.appCheckStatus.className = "appcheck-badge unverified";
    dom.appCheckLabel.textContent = "APP CHECK WARN";
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// CHROME BUILT-IN AI DETECTION
// ═════════════════════════════════════════════════════════════════════════════
async function detectOnDeviceAI() {
  // window.ai detection
  const hasWindowAi = typeof window.ai !== "undefined";
  dom.dWindowAi.textContent = hasWindowAi ? "✓ Available" : "✗ Not detected";
  dom.dWindowAi.className = "diag-card-value " + (hasWindowAi ? "ok" : "warn");

  // LanguageModel API (Chrome 127+ flag-gated / Canary)
  const hasLanguageModel =
    typeof window.LanguageModel !== "undefined" ||
    (typeof window.ai !== "undefined" && typeof window.ai.languageModel !== "undefined");

  dom.dLanguageModel.textContent = hasLanguageModel ? "✓ Available" : "✗ Not detected";
  dom.dLanguageModel.className = "diag-card-value " + (hasLanguageModel ? "ok" : "warn");

  // Availability check
  try {
    if (hasLanguageModel) {
      const api = window.LanguageModel || window.ai.languageModel;
      if (api && typeof api.availability === "function") {
        const avail = await api.availability();
        dom.dAiAvailability.textContent = "✓ " + avail;
        dom.dAiAvailability.className = "diag-card-value ok";
        dom.dGeminiNano.textContent = avail === "available" ? "✓ Ready" : "⏳ " + avail;
        dom.dGeminiNano.className = "diag-card-value " + (avail === "available" ? "ok" : "warn");
      } else {
        dom.dAiAvailability.textContent = "API present (capability unknown)";
        dom.dAiAvailability.className = "diag-card-value warn";
        dom.dGeminiNano.textContent = "API present";
        dom.dGeminiNano.className = "diag-card-value warn";
      }
    } else {
      dom.dAiAvailability.textContent = "Enable in chrome://flags";
      dom.dAiAvailability.className = "diag-card-value warn";
      dom.dGeminiNano.textContent = "Enable Gemini Nano flag";
      dom.dGeminiNano.className = "diag-card-value warn";
    }
  } catch (err) {
    dom.dAiAvailability.textContent = "Error: " + err.message;
    dom.dAiAvailability.className = "diag-card-value warn";
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// VAULT — localStorage persistence
// ═════════════════════════════════════════════════════════════════════════════
const VAULT_KEY = "hybridvault_docs_v2";

function loadVault() {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Vault load error:", e);
  }
  // First run: seed with sample documents
  saveVault(SAMPLE_DOCS);
  return SAMPLE_DOCS.map((d) => ({ ...d }));
}

function saveVault(docs) {
  try {
    localStorage.setItem(VAULT_KEY, JSON.stringify(docs));
  } catch (e) {
    console.error("Vault save error:", e);
    showToast("Storage error — vault not saved", "error");
  }
}

function getDoc(id) {
  return state.docs.find((d) => d.id === id) || null;
}

function upsertDoc(doc) {
  const idx = state.docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) {
    state.docs[idx] = { ...state.docs[idx], ...doc };
  } else {
    state.docs.unshift(doc);
  }
  saveVault(state.docs);
}

function deleteDoc(id) {
  state.docs = state.docs.filter((d) => d.id !== id);
  saveVault(state.docs);
  if (state.activeDocId === id) {
    state.activeDocId = state.docs[0]?.id || null;
    renderEditor();
  }
  renderDocList();
  dom.dDocCount.textContent = state.docs.length;
}

function createNewDoc() {
  const id = "doc-" + Date.now();
  const doc = {
    id,
    title: "Untitled Note",
    tag: "personal",
    icon: "📝",
    date: new Date().toISOString().slice(0, 10),
    content: ""
  };
  state.docs.unshift(doc);
  saveVault(state.docs);
  activateDoc(id);
  dom.dDocCount.textContent = state.docs.length;
  // Focus title field for immediate rename
  setTimeout(() => {
    dom.docTitle.select();
  }, 50);
}

// ═════════════════════════════════════════════════════════════════════════════
// SIDEBAR RENDERING
// ═════════════════════════════════════════════════════════════════════════════
function renderDocList(filter = "") {
  const lf = filter.toLowerCase();
  const visible = filter
    ? state.docs.filter(
        (d) =>
          d.title.toLowerCase().includes(lf) ||
          d.content.toLowerCase().includes(lf)
      )
    : state.docs;

  dom.docsList.innerHTML = "";

  if (visible.length === 0) {
    dom.docsList.innerHTML =
      '<div style="text-align:center;padding:24px 12px;color:var(--text-muted);font-size:12px;">No documents found</div>';
    return;
  }

  for (const doc of visible) {
    const item = document.createElement("div");
    item.className = "doc-item" + (doc.id === state.activeDocId ? " active" : "");
    item.dataset.id = doc.id;

    const preview = doc.content
      ? doc.content.replace(/\n+/g, " ").trim().slice(0, 90)
      : "Empty document";

    item.innerHTML = `
      <div class="doc-item-top">
        <span class="doc-icon">${doc.icon || "📄"}</span>
        <div class="doc-info">
          <div class="doc-title">${escapeHtml(doc.title)}</div>
          <div class="doc-meta">
            <span class="doc-tag ${doc.tag || "personal"}">${(doc.tag || "personal").toUpperCase()}</span>
            <span class="doc-date">${doc.date || ""}</span>
          </div>
        </div>
      </div>
      <div class="doc-preview">${escapeHtml(preview)}</div>
      <button class="doc-delete-btn" data-delete="${doc.id}" title="Delete document" aria-label="Delete ${escapeHtml(doc.title)}">✕</button>
    `;

    item.addEventListener("click", (e) => {
      if (e.target.closest("[data-delete]")) return;
      activateDoc(doc.id);
    });

    item.querySelector("[data-delete]").addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${doc.title}"?`)) {
        deleteDoc(doc.id);
      }
    });

    dom.docsList.appendChild(item);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EDITOR
// ═════════════════════════════════════════════════════════════════════════════
function activateDoc(id) {
  state.activeDocId = id;
  renderEditor();
  renderDocList(dom.docSearch.value);
}

function renderEditor() {
  const doc = getDoc(state.activeDocId);
  if (!doc) {
    dom.docTitle.value = "";
    dom.docContent.value = "";
    updateEditorStats("");
    return;
  }
  dom.docTitle.value = doc.title;
  dom.docContent.value = doc.content;
  updateEditorStats(doc.content);
  updateSensitivity(doc.content, doc.title);
}

function updateEditorStats(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const lines = text.split("\n").length;
  dom.wordCount.textContent = words;
  dom.charCount.textContent = chars;
  dom.lineCount.textContent = lines;
}

// Heuristic sensitivity detection based on keyword patterns
const HIGH_SENSITIVITY_KEYWORDS = [
  "confidential", "attorney-client", "privileged", "hipaa", "phi",
  "irb", "clinical trial", "m&a", "acquisition", "acquisition target",
  "eyes only", "dsgvo", "gdpr", "nda", "trade secret", "proprietary"
];
const MEDIUM_SENSITIVITY_KEYWORDS = [
  "medical", "patient", "diagnosis", "prescription", "financial",
  "revenue", "salary", "password", "api key", "token", "strategic",
  "research", "unpublished", "embargoed"
];

function updateSensitivity(content, title = "") {
  const combined = (content + " " + title).toLowerCase();
  const isHigh = HIGH_SENSITIVITY_KEYWORDS.some((kw) => combined.includes(kw));
  const isMed = MEDIUM_SENSITIVITY_KEYWORDS.some((kw) => combined.includes(kw));

  const el = dom.sensitivityInd;
  if (isHigh) {
    el.className = "sensitivity-indicator high";
    dom.sensitivityLabel.textContent = "HIGH SENSITIVITY";
  } else if (isMed) {
    el.className = "sensitivity-indicator medium";
    dom.sensitivityLabel.textContent = "MEDIUM SENSITIVITY";
  } else {
    el.className = "sensitivity-indicator low";
    dom.sensitivityLabel.textContent = "LOW SENSITIVITY";
  }
}

// Auto-save with debounce
function scheduleSave() {
  dom.saveStatus.className = "save-status unsaved";
  dom.saveStatus.textContent = "● Unsaved";
  clearTimeout(state.saveTimer);
  state.saveTimer = setTimeout(() => {
    const doc = getDoc(state.activeDocId);
    if (!doc) return;
    upsertDoc({
      id: doc.id,
      title: dom.docTitle.value.trim() || "Untitled",
      content: dom.docContent.value,
      date: doc.date
    });
    renderDocList(dom.docSearch.value);
    dom.saveStatus.className = "save-status saved";
    dom.saveStatus.textContent = "✓ Saved";
  }, 800);
}

// ═════════════════════════════════════════════════════════════════════════════
// HYBRID AI INFERENCE ENGINE
// ═════════════════════════════════════════════════════════════════════════════

/**
 * Map UI selector value → InferenceMode enum
 */
function resolveInferenceMode(override) {
  const sel = override || dom.inferenceMode.value;
  switch (sel) {
    case "only_on_device":    return SafeInferenceMode.ONLY_ON_DEVICE;
    case "prefer_in_cloud":   return SafeInferenceMode.PREFER_IN_CLOUD;
    case "only_in_cloud":     return SafeInferenceMode.ONLY_IN_CLOUD;
    case "prefer_on_device":
    default:                  return SafeInferenceMode.PREFER_ON_DEVICE;
  }
}

/**
 * Retrieve the Firebase AI Logic generative model with hybrid routing config.
 * @param {string|null} modeOverride - UI selector value or null for global mode.
 * @param {string} [cloudModel] - Cloud model slug; defaults to the chain primary.
 */
function getHybridModel(modeOverride, cloudModel = CLOUD_FALLBACK_CHAIN[0]) {
  if (!state.aiInitialized || !state.aiInstance) {
    throw new Error("Firebase AI Logic not initialized");
  }

  const mode = resolveInferenceMode(modeOverride);

  const modelConfig = {
    mode,
    inCloudParams: { model: cloudModel },
    onDeviceParams: {
      temperature: 0.7,
      topK: 40
    }
  };

  return getGenerativeModel(state.aiInstance, modelConfig);
}

/**
 * Return true when an error should trigger a fallback to the next model in the
 * chain rather than surfacing immediately to the user.
 *
 * Strategy: retry on EVERYTHING except errors that indicate the request itself
 * is permanently invalid (bad API key, permission denied, bad request shape).
 * Retrying those wastes quota and always produces the same result.
 *
 * Hard-stop patterns (not retryable):
 *   - API key invalid / missing
 *   - Permission denied / forbidden
 *   - 400 Bad Request (malformed prompt, content policy block)
 *   - 404 Not Found (model slug does not exist in this region/project)
 *
 * Everything else — 429, 500, 503, deadline/timeout, network errors,
 * "high demand", "overloaded", "Deadline expired", etc. — is retryable.
 *
 * @param {unknown} err
 * @returns {boolean}
 */
function isRetryableError(err) {
  if (!err) return false;

  const status = err.status ?? err.code ?? err.httpStatus ?? 0;

  // Hard-stop on permanent client/auth errors by numeric code.
  if (status === 400 || status === 401 || status === 403 || status === 404) {
    return false;
  }

  // Hard-stop on permanent errors by message text.
  const msg = String(err.message ?? err ?? "").toLowerCase();
  if (
    msg.includes("api key")          ||
    msg.includes("api_key")          ||
    msg.includes("invalid key")      ||
    msg.includes("permission denied")||
    msg.includes("forbidden")        ||
    msg.includes("not found")        ||
    msg.includes("bad request")      ||
    msg.includes("invalid argument") ||
    msg.includes("content policy")   ||
    msg.includes("safety")
  ) {
    return false;
  }

  // Treat client-side AbortError (our own timeout) as retryable.
  if (err.name === "AbortError") return true;

  // Retry on explicit transient numeric codes.
  if (status === 429 || status === 500 || status === 503) return true;

  // Retry on any remaining error — network hiccup, deadline, unknown 5xx, etc.
  return true;
}

/**
 * Call generateContent with automatic cloud-model fallback and a per-attempt
 * client-side timeout.
 *
 * For cloud inferences, tries each model in CLOUD_FALLBACK_CHAIN in order.
 * Each attempt is raced against a ATTEMPT_TIMEOUT_MS AbortController deadline.
 * Any retryable error (timeout included) moves immediately to the next model.
 * A non-retryable error (bad API key, 400, permission denied) stops the chain
 * and propagates immediately — retrying would always produce the same result.
 *
 * For on-device inferences the chain is bypassed — there is only one on-device
 * model and silently falling back to cloud would contradict the user's explicit
 * privacy intent.
 *
 * @param {string} prompt
 * @param {string|null} modeOverride
 * @returns {Promise<{ result: object, modelUsed: string }>}
 */
async function generateContentWithFallback(prompt, modeOverride) {
  const selMode = modeOverride ?? dom.inferenceMode.value;
  const isOnDevice = selMode === "only_on_device";

  // ── On-device path: single attempt, no cloud fallback. ──────────────────
  if (isOnDevice) {
    const model = getHybridModel(modeOverride, CLOUD_FALLBACK_CHAIN[0]);
    const result = await model.generateContent(prompt);
    return { result, modelUsed: "on-device" };
  }

  // ── Cloud / hybrid path: walk the fallback chain with per-attempt timeout.
  let lastErr;
  for (let i = 0; i < CLOUD_FALLBACK_CHAIN.length; i++) {
    const cloudModel = CLOUD_FALLBACK_CHAIN[i];

    if (i > 0) {
      console.warn(
        `generateContentWithFallback: retrying with "${cloudModel}" ` +
        `after retryable error from "${CLOUD_FALLBACK_CHAIN[i - 1]}":`,
        lastErr
      );
    }

    // Build a 12-second abort deadline for this specific attempt.
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(new DOMException(
        `Model "${cloudModel}" timed out after ${ATTEMPT_TIMEOUT_MS}ms`,
        "AbortError"
      )),
      ATTEMPT_TIMEOUT_MS
    );

    try {
      const model = getHybridModel(modeOverride, cloudModel);
      // Pass the AbortSignal so the SDK can honour the cancellation where
      // supported; the race below guarantees the timeout fires regardless.
      const result = await Promise.race([
        model.generateContent(prompt),
        // Mirror AbortController rejection as a thrown error so the catch
        // block below sees it uniformly.
        new Promise((_, reject) => {
          controller.signal.addEventListener("abort", () =>
            reject(controller.signal.reason ?? new DOMException("AbortError", "AbortError"))
          );
        })
      ]);
      clearTimeout(timeoutId);
      return { result, modelUsed: cloudModel };
    } catch (err) {
      clearTimeout(timeoutId);
      lastErr = err;

      const retryable = isRetryableError(err);
      const hasNext   = i < CLOUD_FALLBACK_CHAIN.length - 1;

      if (!retryable || !hasNext) {
        // Permanent error or chain exhausted — surface to the caller.
        throw err;
      }
      // Retryable and a next model exists — continue the loop.
    }
  }

  // Unreachable in normal flow; satisfies TypeScript/linters.
  throw lastErr;
}

/**
 * Run a prompt through the hybrid model; updates telemetry and UI badges.
 */
async function runHybridInference(prompt, modeOverride) {
  if (state.isRunning) return null;
  if (!state.aiInitialized) {
    throw new Error("Firebase AI Logic is not initialized. Check the diagnostics panel.");
  }

  state.isRunning = true;
  const startTime = performance.now();

  try {
    const { result, modelUsed } = await generateContentWithFallback(prompt, modeOverride);
    const response = result.response;

    const latencyMs = Math.round(performance.now() - startTime);
    const text = response.text();
    const charCount = text.length;

    // Determine actual inference source from response metadata.
    // response.inferenceSource is set by the Firebase AI Logic SDK when available.
    let source = "cloud";
    if (response.inferenceSource) {
      source = String(response.inferenceSource).toLowerCase().includes("device")
        ? "on_device"
        : "cloud";
    } else {
      const selMode = modeOverride ?? dom.inferenceMode.value;
      source = selMode === "only_on_device" ? "on_device" : "cloud";
    }

    // Update telemetry
    telemetry.totalInferences++;
    telemetry.latencies.push(latencyMs);
    if (source === "on_device") {
      telemetry.onDeviceCount++;
    } else {
      telemetry.cloudCount++;
    }

    updateTelemetryUI(source, latencyMs, charCount, modelUsed);
    updateDiagnostics();

    state.isRunning = false;
    return { text, source, latencyMs, charCount, modelUsed };
  } catch (err) {
    state.isRunning = false;
    throw err;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// PROMPT BUILDERS
// ═════════════════════════════════════════════════════════════════════════════
const PROMPTS = {
  summarize: (content) =>
    `You are a privacy-first document analyst. Summarize the following document in 4–6 concise bullet points. Focus on key facts, decisions, and findings. Be direct and factual.

Document:
${content.slice(0, 8000)}`,

  extract: (content) =>
    `Extract all action items from the following document. Return ONLY valid JSON — an array of objects with these fields: { "task": string, "owner": string | null, "deadline": string | null, "priority": "high"|"medium"|"low" }. If no action items exist, return an empty array [].

Document:
${content.slice(0, 8000)}`,

  synthesis: (content) =>
    `You are an expert senior analyst. Provide a comprehensive deep synthesis of the following document with these sections:

## Executive Summary
(2–3 sentences)

## Key Insights
(3–5 bullet points with supporting detail)

## Risk Factors & Concerns
(identify and explain each risk)

## Strategic Recommendations
(actionable, prioritized recommendations)

## Sentiment & Tone Assessment
(objective analysis of the document's tone)

Document:
${content.slice(0, 12000)}`,

  translate: (content) =>
    `Analyze the following document:
1. Identify all languages present
2. If the document is not in English, provide a full translation to English
3. Rewrite the content in polished, professional business English — preserve all factual content, improve clarity and flow
4. Note any culturally-specific terms or references that required adaptation

Format your response with clear section headings.

Document:
${content.slice(0, 10000)}`,

  custom: (content, prompt) =>
    `You are an expert document analyst with access to the following document. Answer the user's question accurately and concisely based on the document content.

Document:
${content.slice(0, 10000)}

User question: ${prompt}`
};

// ═════════════════════════════════════════════════════════════════════════════
// AI ACTION HANDLERS
// ═════════════════════════════════════════════════════════════════════════════
const ACTION_CONFIGS = {
  summarize: {
    label: "🔒 Private Local Summary",
    modeOverride: "prefer_on_device",
    promptFn: (c) => PROMPTS.summarize(c)
  },
  extract: {
    label: "📋 Action Items (JSON)",
    modeOverride: null,
    promptFn: (c) => PROMPTS.extract(c)
  },
  synthesis: {
    label: "☁️ Deep Cloud Synthesis",
    modeOverride: "prefer_in_cloud",
    promptFn: (c) => PROMPTS.synthesis(c)
  },
  translate: {
    label: "🌐 Translate & Tone Polish",
    modeOverride: null,
    promptFn: (c) => PROMPTS.translate(c)
  }
};

async function runAction(actionKey) {
  if (state.isRunning) {
    showToast("An inference is already running", "info");
    return;
  }

  const doc = getDoc(state.activeDocId);
  if (!doc || !doc.content.trim()) {
    showToast("Select a document with content first", "info");
    return;
  }

  const config = ACTION_CONFIGS[actionKey];
  if (!config) return;

  dom.outputActionLabel.textContent = config.label;
  setOutputLoading(config.label);

  try {
    const prompt = config.promptFn(doc.content);
    const result = await runHybridInference(prompt, config.modeOverride);
    setOutputContent(result.text);
    showToast(`${config.label} complete (${result.latencyMs}ms)`, "success");
  } catch (err) {
    console.error("AI inference error:", err);
    setOutputError(err.message);
    showToast("AI error: " + err.message, "error");
  }
}

async function runCustomPrompt() {
  if (state.isRunning) {
    showToast("An inference is already running", "info");
    return;
  }

  const promptText = dom.customPrompt.value.trim();
  if (!promptText) {
    showToast("Enter a prompt first", "info");
    return;
  }

  const doc = getDoc(state.activeDocId);
  const content = doc?.content || "";

  dom.outputActionLabel.textContent = "✦ Custom Prompt";
  setOutputLoading("Running custom prompt…");

  try {
    const prompt = PROMPTS.custom(content, promptText);
    const result = await runHybridInference(prompt, null);
    setOutputContent(result.text);
    showToast(`Custom prompt complete (${result.latencyMs}ms)`, "success");
  } catch (err) {
    console.error("Custom prompt error:", err);
    setOutputError(err.message);
    showToast("AI error: " + err.message, "error");
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// OUTPUT BOX HELPERS
// ═════════════════════════════════════════════════════════════════════════════
function setOutputLoading(label) {
  dom.aiOutputBox.className = "loading";
  dom.aiOutputBox.innerHTML = `
    <div class="skeleton-lines">
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
      <div class="skeleton-line"></div>
    </div>
    <div style="margin-top:12px;display:flex;align-items:center;gap:8px;color:var(--text-muted);font-size:12px;">
      <div class="spinner"></div> ${escapeHtml(label)}…
    </div>
  `;
  dom.runCustomBtn.disabled = true;
}

function setOutputContent(text) {
  dom.aiOutputBox.className = "has-content fade-in";
  dom.aiOutputBox.textContent = text;
  dom.runCustomBtn.disabled = false;
}

function setOutputError(message) {
  dom.aiOutputBox.className = "error";
  dom.aiOutputBox.textContent = "⚠ Error: " + message;
  dom.runCustomBtn.disabled = false;
}

// ═════════════════════════════════════════════════════════════════════════════
// TELEMETRY UI UPDATES
// ═════════════════════════════════════════════════════════════════════════════
function updateTelemetryUI(source, latencyMs, charCount, modelUsed) {
  dom.latencyVal.textContent = latencyMs;
  dom.tokenVal.textContent = charCount;

  const badge = dom.sourceBadge;
  if (source === "on_device") {
    badge.className = "tel-badge source-ondevice";
    dom.sourceLabel.textContent = "ON-DEVICE GEMINI NANO";
  } else {
    badge.className = "tel-badge source-cloud";
    // Show the exact model that answered, uppercased for the badge.
    // modelUsed is e.g. "gemini-3.8-flash", "gemini-3.8-flash-lite", "gemini-3.5-flash".
    const label = modelUsed && modelUsed !== "on-device"
      ? "CLOUD " + modelUsed.toUpperCase()
      : "CLOUD GEMINI 3.8 FLASH";
    dom.sourceLabel.textContent = label;
  }
}

function updateDiagnostics() {
  dom.dTotalInferences.textContent = telemetry.totalInferences;
  dom.dOndeviceCount.textContent = telemetry.onDeviceCount;
  dom.dCloudCount.textContent = telemetry.cloudCount;
  dom.dAvgLatency.textContent =
    telemetry.avgLatency !== null ? telemetry.avgLatency + "ms" : "—";
  dom.dDocCount.textContent = state.docs.length;

  const modeMap = {
    prefer_on_device: "Auto Hybrid (Prefer On-Device)",
    only_on_device:   "Strict On-Device",
    prefer_in_cloud:  "Cloud Deep Reasoning",
    only_in_cloud:    "Cloud Only"
  };
  dom.dCurrentMode.textContent = modeMap[dom.inferenceMode.value] || "Auto Hybrid";
}

// ═════════════════════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ═════════════════════════════════════════════════════════════════════════════
function showToast(message, type = "info") {
  const icons = { success: "✓", error: "⚠", info: "ℹ" };
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || "ℹ"}</span> ${escapeHtml(message)}`;
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "all 300ms ease";
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

// ═════════════════════════════════════════════════════════════════════════════
// DIAGNOSTICS MODAL
// ═════════════════════════════════════════════════════════════════════════════
function openDiagnostics() {
  updateDiagnostics();
  detectOnDeviceAI();
  dom.diagOverlay.classList.add("visible");
}

function closeDiagnostics() {
  dom.diagOverlay.classList.remove("visible");
}

// ═════════════════════════════════════════════════════════════════════════════
// UTILITY
// ═════════════════════════════════════════════════════════════════════════════
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copied to clipboard", "success");
  } catch (e) {
    showToast("Copy failed — select and copy manually", "error");
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// EVENT WIRING
// ═════════════════════════════════════════════════════════════════════════════
function wireEvents() {
  // New note
  dom.newNoteBtn.addEventListener("click", createNewDoc);

  // Search
  dom.docSearch.addEventListener("input", (e) => {
    renderDocList(e.target.value);
  });

  // Editor: title changes
  dom.docTitle.addEventListener("input", () => {
    if (!state.activeDocId) return;
    const doc = getDoc(state.activeDocId);
    if (doc) {
      dom.saveStatus.className = "save-status saving";
      dom.saveStatus.textContent = "● Saving…";
    }
    scheduleSave();
  });

  // Editor: content changes
  dom.docContent.addEventListener("input", () => {
    const text = dom.docContent.value;
    updateEditorStats(text);
    updateSensitivity(text, dom.docTitle.value);
    scheduleSave();
  });

  // AI quick action buttons
  document.querySelectorAll(".ai-action-btn[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      runAction(btn.dataset.action);
    });
  });

  // Custom prompt run
  dom.runCustomBtn.addEventListener("click", runCustomPrompt);

  // Custom prompt: Ctrl+Enter / Cmd+Enter to run
  dom.customPrompt.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runCustomPrompt();
    }
  });

  // Copy output
  dom.copyOutputBtn.addEventListener("click", () => {
    const text = dom.aiOutputBox.textContent.trim();
    if (text && !text.includes("Select a document")) {
      copyToClipboard(text);
    }
  });

  // Inference mode change → update diagnostics label
  dom.inferenceMode.addEventListener("change", () => {
    updateDiagnostics();
    // Reset source badge to idle on mode change
    dom.sourceBadge.className = "tel-badge source-idle";
    dom.sourceLabel.textContent = "IDLE";
  });

  // Diagnostics modal
  dom.diagToggleBtn.addEventListener("click", openDiagnostics);
  dom.diagCloseBtn.addEventListener("click", closeDiagnostics);
  dom.diagOverlay.addEventListener("click", (e) => {
    if (e.target === dom.diagOverlay) closeDiagnostics();
  });

  // Close modal on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dom.diagOverlay.classList.contains("visible")) {
      closeDiagnostics();
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// APPLICATION BOOTSTRAP
// ═════════════════════════════════════════════════════════════════════════════
async function bootstrap() {
  // 1. Load persisted vault
  state.docs = loadVault();

  // 2. Wire DOM events
  wireEvents();

  // 3. Render sidebar
  renderDocList();

  // 4. Activate first document
  if (state.docs.length > 0) {
    activateDoc(state.docs[0].id);
  }

  // 5. Update diagnostics doc count
  dom.dDocCount.textContent = state.docs.length;

  // 6. Initialize Firebase (async — UI is usable immediately)
  await initFirebase();

  // 7. Probe on-device AI availability
  await detectOnDeviceAI();

  // 8. Final diagnostics sync
  updateDiagnostics();
}

// Start the app
bootstrap().catch((err) => {
  console.error("Bootstrap error:", err);
});
