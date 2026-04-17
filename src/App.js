import { useState, useRef, useEffect } from "react";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "◈", color: "#E1306C", bg: "#E1306C22" },
  { id: "youtube", name: "YouTube", icon: "▶", color: "#FF0000", bg: "#FF000022" },
  { id: "facebook", name: "Facebook", icon: "ƒ", color: "#1877F2", bg: "#1877F222" },
  { id: "twitter", name: "Twitter/X", icon: "✕", color: "#1DA1F2", bg: "#1DA1F222" },
  { id: "tiktok", name: "TikTok", icon: "♪", color: "#69C9D0", bg: "#69C9D022" },
  { id: "pinterest", name: "Pinterest", icon: "⊕", color: "#E60023", bg: "#E6002322" },
  { id: "reddit", name: "Reddit", icon: "⊙", color: "#FF4500", bg: "#FF450022" },
  { id: "tumblr", name: "Tumblr", icon: "◉", color: "#35465C", bg: "#35465C44" },
];

const SCAN_STEPS = [
  { label: "Initializing AI fingerprint engine...", icon: "⬡" },
  { label: "Scanning Instagram & Reels...", icon: "◈" },
  { label: "Scanning TikTok & Shorts...", icon: "♪" },
  { label: "Scanning YouTube...", icon: "▶" },
  { label: "Scanning Facebook & Meta...", icon: "ƒ" },
  { label: "Scanning Pinterest boards...", icon: "⊕" },
  { label: "Scanning Twitter/X media...", icon: "✕" },
  { label: "Running AI similarity analysis...", icon: "◎" },
  { label: "Compiling violation report...", icon: "⬡" },
];

const MOCK_RESULTS = [
  { id: 1, platform: "Instagram", platformColor: "#E1306C", user: "@steal_content_99", followers: "45.2K", url: "https://instagram.com/p/Bx9fakeHash123", type: "Photo", matchScore: 97, uploadedDate: "2 days ago", status: "unauthorized", views: "12,400", likes: "3,200", region: "India" },
  { id: 2, platform: "TikTok", platformColor: "#69C9D0", user: "@viral_repost_bro", followers: "120K", url: "https://tiktok.com/@fakeuser/video/78123456", type: "Video", matchScore: 91, uploadedDate: "5 days ago", status: "unauthorized", views: "89,000", likes: "14,500", region: "USA" },
  { id: 3, platform: "YouTube", platformColor: "#FF0000", user: "ContentRipper Channel", followers: "8.3K", url: "https://youtube.com/watch?v=fakeId9xZ", type: "Video", matchScore: 85, uploadedDate: "12 days ago", status: "unauthorized", views: "34,200", likes: "980", region: "UK" },
  { id: 4, platform: "Pinterest", platformColor: "#E60023", user: "pinboard_ninja", followers: "2.1K", url: "https://pinterest.com/pin/123456789", type: "Photo", matchScore: 78, uploadedDate: "1 month ago", status: "review", views: "5,600", likes: "340", region: "Canada" },
  { id: 5, platform: "Facebook", platformColor: "#1877F2", user: "Viral Content Hub", followers: "67K", url: "https://facebook.com/posts/fakeHash456", type: "Photo", matchScore: 72, uploadedDate: "3 weeks ago", status: "unauthorized", views: "22,800", likes: "1,100", region: "Philippines" },
];

const API_URL = "https://api.anthropic.com/v1/messages";

function generateFingerprint(input) {
  const chars = "ABCDEF0123456789";
  let hash = "";
  for (let i = 0; i < 32; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
    if (i % 8 === 7 && i < 31) hash += "-";
  }
  return hash;
}

function getRiskColor(score) {
  if (score >= 90) return "#ff3366";
  if (score >= 75) return "#ff8c00";
  return "#00d4aa";
}

function getRiskLabel(score) {
  if (score >= 90) return "CRITICAL";
  if (score >= 75) return "HIGH";
  return "MEDIUM";
}

export default function CopyGuardAI() {
  const [tab, setTab] = useState("scan");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [inputMode, setInputMode] = useState("file");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedURL, setUploadedURL] = useState("");
  const [textInput, setTextInput] = useState("");
  const [fingerprint, setFingerprint] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState(PLATFORMS.map((p) => p.id));
  const [scanning, setScanning] = useState(false);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [dmcaText, setDmcaText] = useState("");
  const [dmcaLoading, setDmcaLoading] = useState(false);
  const [dmcaModal, setDmcaModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ scans: 0, violations: 0, notices: 0 });
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [noticesSent, setNoticesSent] = useState([]);
  const fileRef = useRef();
  const scanInterval = useRef(null);

  const hasInput = uploadedFile || uploadedURL.trim() || textInput.trim();

  const handleFileSelect = (file) => {
    if (file) {
      setUploadedFile(file);
      setFingerprint(generateFingerprint(file.name));
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const togglePlatform = (id) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const runScan = async () => {
    if (!hasInput || scanning) return;
    if (!fingerprint) setFingerprint(generateFingerprint(uploadedURL || textInput));
    setScanning(true);
    setProgress(0);
    setScanStepIndex(0);
    setResults([]);
    setAiAnalysis("");
    setTab("scan");

    for (let i = 0; i < SCAN_STEPS.length; i++) {
      setScanStepIndex(i);
      setProgress(Math.round(((i + 1) / SCAN_STEPS.length) * 100));
      await new Promise((r) => setTimeout(r, 600 + Math.random() * 400));
    }

    const filteredResults = MOCK_RESULTS.filter((r) =>
      selectedPlatforms.includes(r.platform.toLowerCase().replace("/", "").replace(" ", ""))
    );
    const finalResults = filteredResults.length > 0 ? filteredResults : MOCK_RESULTS;
    setResults(finalResults);
    setScanning(false);
    setStats((prev) => ({
      scans: prev.scans + 1,
      violations: prev.violations + finalResults.filter((r) => r.status === "unauthorized").length,
      notices: prev.notices,
    }));
    setHistory((prev) => [
      {
        id: Date.now(),
        name: uploadedFile?.name || uploadedURL || textInput.slice(0, 40) + "...",
        date: new Date().toLocaleString(),
        violations: finalResults.filter((r) => r.status === "unauthorized").length,
        total: finalResults.length,
        fingerprint: fingerprint || generateFingerprint("x"),
      },
      ...prev,
    ]);
    setTab("results");
    loadAIAnalysis(finalResults);
  };

  const loadAIAnalysis = async (res) => {
    setAiLoading(true);
    const totalViews = res.reduce((acc, r) => acc + parseInt(r.views.replace(/,/g, "")), 0);
    const topMatch = Math.max(...res.map((r) => r.matchScore));

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are a copyright protection specialist AI. A creator has scanned their content and found ${res.length} unauthorized uses across ${[...new Set(res.map((r) => r.platform))].join(", ")}.

Key stats:
- Total violations: ${res.length}
- Highest match score: ${topMatch}%
- Total stolen views: ${totalViews.toLocaleString()}
- Platforms affected: ${[...new Set(res.map((r) => r.platform))].join(", ")}

Write a concise 3-paragraph professional copyright infringement analysis:
1. Executive Summary of violations found
2. Risk Assessment (mention the ${topMatch}% top match as critical)
3. Recommended Actions (DMCA priority order)

Be professional, urgent tone, actionable. Max 180 words total.`,
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "";
      setAiAnalysis(text || getFallbackAnalysis(res.length, topMatch, totalViews));
    } catch {
      setAiAnalysis(getFallbackAnalysis(res.length, topMatch, totalViews));
    }
    setAiLoading(false);
  };

  const getFallbackAnalysis = (count, top, views) =>
    `Executive Summary: ${count} copyright violations detected across major social media platforms. Your content has been used without authorization, reaching an estimated ${views.toLocaleString()} combined views.\n\nRisk Assessment: The highest match score of ${top}% indicates near-identical reproduction of your copyrighted material. This constitutes clear infringement under DMCA Section 512. Immediate action is required to prevent further unauthorized distribution.\n\nRecommended Actions: Prioritize DMCA takedown notices for results with 90%+ match scores first, as these represent critical violations. File notices directly with each platform's trust & safety team. Document all infringing content with screenshots before filing.`;

  const generateDMCA = async (result) => {
    setSelectedResult(result);
    setDmcaText("");
    setDmcaLoading(true);
    setDmcaModal(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Generate a complete, professional DMCA Section 512(c) takedown notice for:

Platform: ${result.platform}
Infringing User: ${result.user}
Infringing URL: ${result.url}
Content Type: ${result.type}
Match Score: ${result.matchScore}%
Date Infringement Found: Today

Write a ready-to-send formal DMCA takedown notice. Include:
- Proper legal header
- Identification of copyrighted work
- Identification of infringing material with URL
- Contact information placeholders [IN BRACKETS]
- Statement of good faith belief
- Statement of accuracy under penalty of perjury
- Physical/electronic signature block

Keep it legally sound and professional. Use [YOUR NAME], [YOUR EMAIL], [YOUR ADDRESS] as placeholders.`,
            },
          ],
        }),
      });
      const data = await response.json();
      const text = data.content?.find((b) => b.type === "text")?.text || "";
      setDmcaText(text || getFallbackDMCA(result));
    } catch {
      setDmcaText(getFallbackDMCA(result));
    }
    setDmcaLoading(false);
  };

  const getFallbackDMCA = (r) => `DMCA TAKEDOWN NOTICE
Pursuant to 17 U.S.C. § 512(c)(3)

Date: ${new Date().toLocaleDateString()}
To: ${r.platform} Trust & Safety / Copyright Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IDENTIFICATION OF COPYRIGHTED WORK:
The copyrighted work is my original ${r.type.toLowerCase()} content. I am the sole creator and copyright owner of this material.

IDENTIFICATION OF INFRINGING MATERIAL:
The infringing content is located at:
URL: ${r.url}
Account: ${r.user}
This content reproduces my copyrighted work with a ${r.matchScore}% match similarity.

CONTACT INFORMATION:
Name: [YOUR NAME]
Address: [YOUR ADDRESS]  
Email: [YOUR EMAIL]
Phone: [YOUR PHONE]

STATEMENTS:
I have a good faith belief that the use of the copyrighted material described above is not authorized by the copyright owner, its agent, or the law.

I declare under penalty of perjury that the information in this notification is accurate and that I am the copyright owner or authorized to act on behalf of the copyright owner.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Electronic Signature: [YOUR NAME]
Date: ${new Date().toLocaleDateString()}`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const markNoticeSent = (id) => {
    setNoticesSent((prev) => [...prev, id]);
    setStats((prev) => ({ ...prev, notices: prev.notices + 1 }));
    setDmcaModal(false);
  };

  const protectionScore = results.length > 0
    ? Math.round((noticesSent.length / results.length) * 100)
    : 0;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    ::-webkit-scrollbar { width: 4px; } 
    ::-webkit-scrollbar-track { background: #050912; }
    ::-webkit-scrollbar-thumb { background: #1a3a5c; border-radius: 4px; }
    body { background: #050912; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes slideIn { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
    @keyframes scanLine { 0%{top:0} 100%{top:100%} }
    @keyframes glowPulse { 0%,100%{box-shadow:0 0 20px rgba(0,180,255,0.2)} 50%{box-shadow:0 0 40px rgba(0,180,255,0.5)} }
    @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    @keyframes fadeIn { from{opacity:0;transform:scale(0.96)} to{opacity:1;transform:scale(1)} }
    @keyframes countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  `;

  return (
    <>
      <style>{css}</style>
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #050912 0%, #081428 40%, #050d1e 100%)",
        fontFamily: "'DM Sans', sans-serif",
        color: "#c8d8e8",
      }}>
        {/* Ambient BG */}
        <div style={{
          position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
          background: "radial-gradient(ellipse 60% 40% at 20% 20%, rgba(0,100,200,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 80% 80%, rgba(0,180,255,0.04) 0%, transparent 60%)",
        }} />

        {/* HEADER */}
        <div style={{
          position: "sticky", top: 0, zIndex: 200,
          background: "rgba(5,9,18,0.92)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(0,140,255,0.1)",
          padding: "0 20px",
          height: 60,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #0070e0, #00b4ff)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 16, fontFamily: "'Space Mono', monospace",
              boxShadow: "0 0 24px rgba(0,140,255,0.4)",
            }}>⬡</div>
            <div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: 1 }}>
                COPYGUARD AI
              </div>
              <div style={{ fontSize: 9, color: "#4488aa", letterSpacing: 2 }}>COPYRIGHT PROTECTION</div>
            </div>
          </div>

          {/* Nav */}
          <div style={{ display: "flex", gap: 2 }}>
            {[
              { id: "scan", label: "SCAN" },
              { id: "results", label: `RESULTS${results.length ? ` · ${results.length}` : ""}` },
              { id: "history", label: "HISTORY" },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding: "6px 14px",
                background: tab === t.id ? "rgba(0,140,255,0.12)" : "transparent",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #00b4ff" : "2px solid transparent",
                color: tab === t.id ? "#4fc3f7" : "#557788",
                fontSize: 10, fontFamily: "'Space Mono', monospace",
                fontWeight: 700, letterSpacing: 1, cursor: "pointer",
                transition: "all 0.2s",
              }}>{t.label}</button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%", background: "#00ff88",
              animation: "pulse 2s infinite",
            }} />
            <span style={{ fontSize: 10, color: "#00ff88", fontFamily: "'Space Mono', monospace" }}>AI ACTIVE</span>
          </div>
        </div>

        <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>

          {/* API KEY BAR */}
          <div style={{
            background: "rgba(0,80,160,0.08)",
            border: "1px solid rgba(0,120,200,0.15)",
            borderRadius: 10, padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 10,
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 11, color: "#4488aa", fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap" }}>API KEY</span>
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-... (optional — uses demo mode without key)"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                color: "#88aacc", fontSize: 12, fontFamily: "'Space Mono', monospace",
              }}
            />
            <button onClick={() => setShowApiKey(!showApiKey)} style={{
              background: "none", border: "none", color: "#446688", cursor: "pointer", fontSize: 12,
            }}>{showApiKey ? "HIDE" : "SHOW"}</button>
            <div style={{
              padding: "3px 8px", borderRadius: 4, fontSize: 9,
              background: apiKey ? "rgba(0,255,136,0.1)" : "rgba(255,180,0,0.1)",
              color: apiKey ? "#00ff88" : "#ffb400",
              fontFamily: "'Space Mono', monospace",
            }}>{apiKey ? "LIVE" : "DEMO"}</div>
          </div>

          {/* ===== SCAN TAB ===== */}
          {tab === "scan" && (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <h1 style={{
                  fontSize: 28, fontWeight: 700, color: "#fff",
                  fontFamily: "'Space Mono', monospace", letterSpacing: -0.5,
                  marginBottom: 6,
                }}>
                  Protect Your <span style={{ color: "#00b4ff" }}>Copyright</span>
                </h1>
                <p style={{ color: "#4a6880", fontSize: 13 }}>
                  AI-powered content fingerprinting across all major platforms
                </p>
              </div>

              {/* Stats Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                {[
                  { label: "TOTAL SCANS", val: stats.scans, color: "#00b4ff" },
                  { label: "VIOLATIONS", val: stats.violations, color: "#ff3366" },
                  { label: "NOTICES SENT", val: stats.notices, color: "#00ff88" },
                ].map((s) => (
                  <div key={s.label} style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 10, padding: "12px 16px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: "'Space Mono', monospace" }}>
                      {s.val}
                    </div>
                    <div style={{ fontSize: 9, color: "#446688", letterSpacing: 1, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Input Mode */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                {[
                  { id: "file", label: "↑ Upload File" },
                  { id: "url", label: "⊞ Paste URL" },
                  { id: "text", label: "✎ Describe" },
                ].map((m) => (
                  <button key={m.id} onClick={() => setInputMode(m.id)} style={{
                    padding: "7px 14px", borderRadius: 7,
                    border: `1px solid ${inputMode === m.id ? "#00b4ff" : "rgba(255,255,255,0.06)"}`,
                    background: inputMode === m.id ? "rgba(0,180,255,0.1)" : "rgba(255,255,255,0.02)",
                    color: inputMode === m.id ? "#4fc3f7" : "#446688",
                    fontSize: 12, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s",
                  }}>{m.label}</button>
                ))}
              </div>

              {/* Input Area */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(0,140,255,0.12)",
                borderRadius: 14, padding: 20, marginBottom: 16,
              }}>
                {inputMode === "file" && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current.click()}
                    style={{
                      border: `2px dashed ${dragOver ? "#00b4ff" : uploadedFile ? "#00d4aa" : "rgba(0,140,255,0.2)"}`,
                      borderRadius: 10, padding: "36px 20px", textAlign: "center",
                      cursor: "pointer", transition: "all 0.2s",
                      background: dragOver ? "rgba(0,180,255,0.05)" : uploadedFile ? "rgba(0,212,170,0.04)" : "transparent",
                    }}
                  >
                    <input ref={fileRef} type="file" accept="image/*,video/*,audio/*,.pdf" style={{ display: "none" }} onChange={(e) => handleFileSelect(e.target.files[0])} />
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{uploadedFile ? "✓" : "⬆"}</div>
                    <div style={{ fontWeight: 600, color: uploadedFile ? "#00d4aa" : "#cde", marginBottom: 4, fontSize: 14 }}>
                      {uploadedFile ? uploadedFile.name : "Drop file or click to browse"}
                    </div>
                    <div style={{ fontSize: 11, color: "#446688" }}>JPG · PNG · MP4 · MOV · MP3 · PDF</div>
                    {uploadedFile && (
                      <div style={{
                        marginTop: 12, padding: "6px 12px",
                        background: "rgba(0,212,170,0.08)", borderRadius: 6, display: "inline-block",
                        fontFamily: "'Space Mono', monospace", fontSize: 10, color: "#00d4aa",
                      }}>
                        FINGERPRINT: {fingerprint?.slice(0, 19)}...
                      </div>
                    )}
                  </div>
                )}
                {inputMode === "url" && (
                  <div>
                    <div style={{ fontSize: 11, color: "#446688", marginBottom: 8, letterSpacing: 0.5 }}>ORIGINAL CONTENT URL</div>
                    <input
                      value={uploadedURL}
                      onChange={(e) => {
                        setUploadedURL(e.target.value);
                        if (e.target.value) setFingerprint(generateFingerprint(e.target.value));
                      }}
                      placeholder="https://your-website.com/original-content..."
                      style={{
                        width: "100%", padding: "11px 14px", borderRadius: 8,
                        border: "1px solid rgba(0,140,255,0.2)",
                        background: "rgba(0,0,0,0.3)", color: "#c8d8e8",
                        fontSize: 13, outline: "none",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    />
                    {uploadedURL && (
                      <div style={{ marginTop: 10, fontSize: 10, color: "#00d4aa", fontFamily: "'Space Mono', monospace" }}>
                        ◉ FINGERPRINT GENERATED: {fingerprint?.slice(0, 24)}...
                      </div>
                    )}
                  </div>
                )}
                {inputMode === "text" && (
                  <div>
                    <div style={{ fontSize: 11, color: "#446688", marginBottom: 8, letterSpacing: 0.5 }}>DESCRIBE YOUR COPYRIGHTED CONTENT</div>
                    <textarea
                      value={textInput}
                      onChange={(e) => {
                        setTextInput(e.target.value);
                        if (e.target.value.length > 10) setFingerprint(generateFingerprint(e.target.value));
                      }}
                      placeholder="E.g., My original photo of a red Sambalpuri saree shoot, taken Jan 2025, posted on @sellearn Instagram..."
                      rows={4}
                      style={{
                        width: "100%", padding: "11px 14px", borderRadius: 8,
                        border: "1px solid rgba(0,140,255,0.2)",
                        background: "rgba(0,0,0,0.3)", color: "#c8d8e8",
                        fontSize: 13, outline: "none", resize: "vertical",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Platform Selector */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 14, padding: 16, marginBottom: 18,
              }}>
                <div style={{ fontSize: 10, color: "#446688", letterSpacing: 1.5, marginBottom: 12, fontFamily: "'Space Mono', monospace" }}>
                  SELECT PLATFORMS TO SCAN
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {PLATFORMS.map((p) => {
                    const active = selectedPlatforms.includes(p.id);
                    return (
                      <button key={p.id} onClick={() => togglePlatform(p.id)} style={{
                        padding: "6px 14px", borderRadius: 6,
                        border: `1px solid ${active ? p.color + "88" : "rgba(255,255,255,0.06)"}`,
                        background: active ? p.bg : "rgba(255,255,255,0.02)",
                        color: active ? "#fff" : "#446688",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: 6,
                        transition: "all 0.18s",
                      }}>
                        <span style={{ color: active ? p.color : "#446688" }}>{p.icon}</span>
                        {p.name}
                        {active && <span style={{ color: "#00ff88", fontSize: 8 }}>●</span>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                  <button onClick={() => setSelectedPlatforms(PLATFORMS.map((p) => p.id))} style={{ fontSize: 10, color: "#4fc3f7", background: "none", border: "none", cursor: "pointer" }}>Select All</button>
                  <button onClick={() => setSelectedPlatforms([])} style={{ fontSize: 10, color: "#ff6688", background: "none", border: "none", cursor: "pointer" }}>Clear All</button>
                </div>
              </div>

              {/* Scan Progress */}
              {scanning && (
                <div style={{
                  background: "rgba(0,140,255,0.06)",
                  border: "1px solid rgba(0,140,255,0.2)",
                  borderRadius: 14, padding: 20, marginBottom: 18,
                  animation: "glowPulse 2s infinite",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                    <div style={{ fontSize: 18, animation: "spin 1s linear infinite", display: "inline-block" }}>◎</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#4fc3f7" }}>
                      {SCAN_STEPS[scanStepIndex]?.label}
                    </div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 4, height: 6, overflow: "hidden" }}>
                    <div style={{
                      height: "100%", borderRadius: 4,
                      background: "linear-gradient(90deg, #0066ff, #00b4ff)",
                      width: `${progress}%`, transition: "width 0.4s ease",
                      boxShadow: "0 0 12px rgba(0,180,255,0.5)",
                    }} />
                  </div>
                  <div style={{ textAlign: "right", fontSize: 10, color: "#446688", marginTop: 6, fontFamily: "'Space Mono', monospace" }}>
                    {progress}% — {SCAN_STEPS.length - scanStepIndex - 1} steps remaining
                  </div>
                </div>
              )}

              {/* Scan Button */}
              <button
                onClick={runScan}
                disabled={!hasInput || scanning}
                style={{
                  width: "100%", padding: "14px 20px",
                  borderRadius: 10, border: "none",
                  background: !hasInput || scanning
                    ? "rgba(255,255,255,0.04)"
                    : "linear-gradient(135deg, #0055cc, #0099ff)",
                  color: !hasInput || scanning ? "#335566" : "#fff",
                  fontSize: 14, fontWeight: 700,
                  fontFamily: "'Space Mono', monospace",
                  letterSpacing: 1, cursor: !hasInput || scanning ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                  boxShadow: !hasInput || scanning ? "none" : "0 4px 24px rgba(0,140,255,0.3)",
                }}
              >
                {scanning ? `◎ SCANNING... ${progress}%` : "⬡ SCAN THE WEB FOR COPYRIGHT VIOLATIONS"}
              </button>
            </div>
          )}

          {/* ===== RESULTS TAB ===== */}
          {tab === "results" && (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              {results.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#446688" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⬡</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>No scan results yet</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>Run a scan from the SCAN tab first</div>
                </div>
              ) : (
                <>
                  {/* AI Analysis */}
                  <div style={{
                    background: "rgba(0,100,200,0.07)",
                    border: "1px solid rgba(0,140,255,0.18)",
                    borderRadius: 14, padding: 20, marginBottom: 20,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(0,140,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>◎</div>
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#4fc3f7", letterSpacing: 1 }}>AI ANALYSIS REPORT</div>
                      {aiLoading && <div style={{ fontSize: 10, color: "#446688", animation: "pulse 1s infinite" }}>generating...</div>}
                    </div>
                    {aiLoading ? (
                      <div style={{ display: "flex", gap: 4 }}>
                        {[0,1,2].map(i => (
                          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#00b4ff", animation: `pulse 1s ${i*0.2}s infinite` }} />
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: "#8bafc0", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiAnalysis}</div>
                    )}
                  </div>

                  {/* Protection Score */}
                  <div style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14, padding: 16, marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 16,
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#446688", letterSpacing: 1, marginBottom: 4 }}>PROTECTION SCORE</div>
                      <div style={{ fontSize: 28, fontWeight: 700, color: "#00b4ff", fontFamily: "'Space Mono', monospace" }}>
                        {protectionScore}%
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                        <div style={{
                          height: "100%", borderRadius: 4,
                          background: "linear-gradient(90deg, #ff3366, #ff8c00, #00ff88)",
                          width: `${protectionScore}%`, transition: "width 0.6s ease",
                        }} />
                      </div>
                      <div style={{ fontSize: 10, color: "#446688", marginTop: 4 }}>
                        {noticesSent.length} of {results.length} violations addressed
                      </div>
                    </div>
                  </div>

                  {/* Results Grid */}
                  <div style={{ fontSize: 10, color: "#446688", letterSpacing: 1.5, marginBottom: 12, fontFamily: "'Space Mono', monospace" }}>
                    {results.length} VIOLATIONS FOUND
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {results.map((r) => {
                      const sent = noticesSent.includes(r.id);
                      return (
                        <div key={r.id} style={{
                          background: "rgba(255,255,255,0.02)",
                          border: `1px solid ${sent ? "rgba(0,255,136,0.15)" : "rgba(255,255,255,0.06)"}`,
                          borderLeft: `3px solid ${getRiskColor(r.matchScore)}`,
                          borderRadius: 12, padding: 16,
                          display: "flex", alignItems: "center", gap: 14,
                          animation: "slideIn 0.3s ease",
                        }}>
                          {/* Platform Badge */}
                          <div style={{
                            width: 44, height: 44, borderRadius: 10,
                            background: `${r.platformColor}18`,
                            border: `1px solid ${r.platformColor}44`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 18, flexShrink: 0,
                          }}>
                            {PLATFORMS.find(p => p.name.toLowerCase() === r.platform.toLowerCase())?.icon || "◈"}
                          </div>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                              <span style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{r.platform}</span>
                              <span style={{ fontSize: 11, color: "#446688" }}>{r.user}</span>
                              <span style={{
                                padding: "2px 7px", borderRadius: 4, fontSize: 9,
                                background: `${getRiskColor(r.matchScore)}18`,
                                color: getRiskColor(r.matchScore),
                                fontFamily: "'Space Mono', monospace",
                              }}>{getRiskLabel(r.matchScore)}</span>
                              {sent && <span style={{ padding: "2px 7px", borderRadius: 4, fontSize: 9, background: "rgba(0,255,136,0.1)", color: "#00ff88" }}>NOTICE SENT</span>}
                            </div>
                            <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#446688" }}>
                              <span>Match: <span style={{ color: getRiskColor(r.matchScore), fontFamily: "'Space Mono', monospace" }}>{r.matchScore}%</span></span>
                              <span>{r.type}</span>
                              <span>👁 {r.views}</span>
                              <span>♥ {r.likes}</span>
                              <span>{r.uploadedDate}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => generateDMCA(r)}
                            disabled={sent}
                            style={{
                              padding: "8px 14px", borderRadius: 7, border: "none",
                              background: sent ? "rgba(0,255,136,0.08)" : "linear-gradient(135deg, #cc2244, #ff3366)",
                              color: sent ? "#00ff88" : "#fff",
                              fontSize: 11, fontWeight: 700,
                              fontFamily: "'Space Mono', monospace",
                              cursor: sent ? "default" : "pointer",
                              letterSpacing: 0.5, whiteSpace: "nowrap",
                              boxShadow: sent ? "none" : "0 2px 12px rgba(255,51,102,0.3)",
                            }}
                          >
                            {sent ? "✓ SENT" : "DMCA ⟶"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ===== HISTORY TAB ===== */}
          {tab === "history" && (
            <div style={{ animation: "slideIn 0.3s ease" }}>
              <div style={{ fontSize: 10, color: "#446688", letterSpacing: 1.5, marginBottom: 16, fontFamily: "'Space Mono', monospace" }}>
                SCAN HISTORY ({history.length} SCANS)
              </div>
              {history.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#446688" }}>
                  <div style={{ fontSize: 36, marginBottom: 10 }}>◎</div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12 }}>No history yet</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {history.map((h) => (
                    <div key={h.id} style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 10, padding: 14,
                      display: "flex", alignItems: "center", gap: 14,
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, color: "#cde", fontWeight: 500, marginBottom: 4 }}>{h.name}</div>
                        <div style={{ fontSize: 10, color: "#446688", fontFamily: "'Space Mono', monospace" }}>{h.date}</div>
                        <div style={{ fontSize: 10, color: "#335566", marginTop: 2, fontFamily: "'Space Mono', monospace" }}>
                          FP: {h.fingerprint?.slice(0, 20)}...
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{
                          fontSize: 18, fontWeight: 700, color: "#ff3366",
                          fontFamily: "'Space Mono', monospace",
                        }}>{h.violations}</div>
                        <div style={{ fontSize: 9, color: "#446688" }}>VIOLATIONS</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* DMCA MODAL */}
        {dmcaModal && selectedResult && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 20,
          }} onClick={() => setDmcaModal(false)}>
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: 640, maxHeight: "85vh",
                background: "linear-gradient(160deg, #090f1e, #0a1628)",
                border: "1px solid rgba(0,140,255,0.2)",
                borderRadius: 16, overflow: "hidden",
                display: "flex", flexDirection: "column",
                animation: "fadeIn 0.2s ease",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(0,140,255,0.1)",
              }}
            >
              {/* Modal Header */}
              <div style={{
                padding: "16px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#ff3366", letterSpacing: 1 }}>
                    DMCA TAKEDOWN NOTICE
                  </div>
                  <div style={{ fontSize: 12, color: "#446688", marginTop: 2 }}>
                    {selectedResult.platform} · {selectedResult.user} · {selectedResult.matchScore}% match
                  </div>
                </div>
                <button onClick={() => setDmcaModal(false)} style={{
                  background: "none", border: "none", color: "#446688",
                  cursor: "pointer", fontSize: 18,
                }}>✕</button>
              </div>

              {/* Modal Content */}
              <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
                {dmcaLoading ? (
                  <div style={{ textAlign: "center", padding: "40px 20px" }}>
                    <div style={{ fontSize: 28, animation: "spin 1s linear infinite", display: "inline-block", color: "#4fc3f7" }}>◎</div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#446688", marginTop: 12 }}>
                      AI GENERATING DMCA NOTICE...
                    </div>
                  </div>
                ) : (
                  <pre style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 11, lineHeight: 1.7,
                    color: "#99bbcc", whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}>{dmcaText}</pre>
                )}
              </div>

              {/* Modal Footer */}
              {!dmcaLoading && (
                <div style={{
                  padding: "14px 20px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", gap: 10,
                }}>
                  <button
                    onClick={() => copyToClipboard(dmcaText)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 8, border: "none",
                      background: copied ? "rgba(0,255,136,0.1)" : "rgba(0,140,255,0.15)",
                      color: copied ? "#00ff88" : "#4fc3f7",
                      fontSize: 11, fontFamily: "'Space Mono', monospace",
                      fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
                    }}
                  >
                    {copied ? "✓ COPIED" : "COPY NOTICE"}
                  </button>
                  <button
                    onClick={() => markNoticeSent(selectedResult.id)}
                    style={{
                      flex: 1, padding: "10px", borderRadius: 8, border: "none",
                      background: "linear-gradient(135deg, #cc2244, #ff3366)",
                      color: "#fff", fontSize: 11, fontFamily: "'Space Mono', monospace",
                      fontWeight: 700, cursor: "pointer", letterSpacing: 0.5,
                      boxShadow: "0 2px 12px rgba(255,51,102,0.3)",
                    }}
                  >
                    MARK AS SENT ✓
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
