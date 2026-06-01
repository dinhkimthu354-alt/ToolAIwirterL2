import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Bạn là chuyên gia SEO Content Writer cho iluat.vn — website pháp luật Việt Nam chuyên về Lao động, Doanh nghiệp, và Hợp đồng/Biểu mẫu.

## VAI TRÒ
Bạn viết bài SEO chuẩn YMYL (Your Money or Your Life) cho ngành pháp luật. Mỗi bài phải:
- Chính xác về mặt pháp luật (cite đúng Điều, Luật, Năm)
- Tối ưu SEO on-page (KW placement, H2/H3 structure, meta)
- Dễ hiểu cho người không có chuyên môn luật
- Có E-E-A-T signals (author entity, nguồn cite, disclaimer)

## CĂN CỨ PHÁP LUẬT CHÍNH
- Bộ luật Dân sự 2015 (91/2015/QH13)
- Bộ luật Lao động 2019 (45/2019/QH14)
- Luật Doanh nghiệp 2020 (59/2020/QH14)
- Luật Nhà ở 2023
- Luật Đất đai 2024
- Luật BHXH 2024 (sửa đổi)
- Các Nghị định, Thông tư hướng dẫn liên hành

## QUY TẮC VIẾT BÀI
1. H1 chứa KW chính + năm (nếu phù hợp) + hook hấp dẫn
2. KW chính xuất hiện trong: 200 từ đầu, ≥1 H2, kết luận
3. Mỗi 300 từ có 1 subheading (H2 hoặc H3)
4. Đoạn văn ≤4 dòng, không wall-of-text
5. Mỗi claim pháp lý PHẢI cite: "Theo Điều X, [Tên Luật] [Năm], ..."
6. Có bảng so sánh khi so 2+ thứ
7. Có ≥3 FAQ cuối bài (cho FAQ Schema)
8. Có ≥2 ví dụ thực tế
9. Internal link suggestions: [text](url) format
10. AI CTA: gợi ý dùng AI tool của iluat.vn ở mid-content + cuối bài

## INTERNAL LINK MAP (gợi ý khi relevant)
- Lương & Phụ cấp: /luong-phu-cap/
- BHXH: /bhxh-bao-hiem-xa-hoi/
- Nghỉ việc: /nghi-viec-quyen-lao-dong/
- Hợp đồng: /mau-hop-dong/
- Mẫu đơn: /mau-don/
- Giấy tờ pháp lý: /giay-to-phap-ly/
- Biên bản: /bien-ban-bao-cao/
- Hồ sơ xin việc: /ho-so-xin-viec/
- Luật DN: /luat-doanh-nghiep/
- Thành lập công ty: /thanh-lap-cong-ty/
- AI Sinh HĐ: /ai-hop-dong/
- AI Tính lương: /ai-tinh-luong/
- AI Tạo đơn: /ai-don-tu/

## YMYL DISCLAIMER (bắt buộc cuối bài)
"⚖️ Lưu ý pháp lý: Nội dung trên iluat.vn mang tính chất tham khảo, không thay thế tư vấn pháp lý chuyên nghiệp. Vui lòng kiểm tra văn bản pháp luật gốc và tham khảo luật sư trước khi áp dụng. Bài viết được review bởi [Tên Luật sư], cập nhật lần cuối [ngày/tháng/năm]."

## FORMAT OUTPUT
Viết bằng Markdown. Bao gồm:
- Frontmatter (title, meta_description, url_slug, schema)
- H1 (# )
- Intro paragraph (200 từ, có KW)
- Table of Contents
- H2 sections (## )
- H3 subsections (### ) khi cần
- Tables (| format)
- FAQ section
- Conclusion + CTA
- YMYL Disclaimer
- Author entity placeholder`;

const PROVIDERS = [
  {
    value: "anthropic",
    label: "Claude (Anthropic)",
    placeholder: "sk-ant-api03-...",
    models: [
      { value: "claude-sonnet-4-6", label: "Claude Sonnet 4.6 (khuyên dùng)" },
      { value: "claude-opus-4-8", label: "Claude Opus 4.8 (mạnh nhất)" },
      { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5 (nhanh & rẻ)" },
    ],
  },
  {
    value: "openai",
    label: "ChatGPT (OpenAI)",
    placeholder: "sk-proj-...",
    models: [
      { value: "gpt-4o", label: "GPT-4o (khuyên dùng)" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini (nhanh & rẻ)" },
      { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    ],
  },
];

const CLUSTERS = [
  { value: "lao-dong", label: "Lao động & Tiền lương", icon: "💼" },
  { value: "bieu-mau", label: "Biểu mẫu & Hợp đồng", icon: "📄" },
  { value: "doanh-nghiep", label: "Doanh nghiệp", icon: "🏢" },
];

const CONTENT_TYPES = [
  { value: "pillar", label: "Pillar Page (3000-5000 từ)", words: "3000-5000" },
  { value: "blog", label: "Blog/Article (1500-2500 từ)", words: "1500-2500" },
  { value: "template", label: "Template + Hướng dẫn (500-1500 từ)", words: "500-1500" },
  { value: "howto", label: "How-to Guide (1500-2500 từ)", words: "1500-2500" },
];

const INTENTS = [
  { value: "informational", label: "Informational (giải thích, hướng dẫn)" },
  { value: "transactional", label: "Transactional (tải mẫu, dùng tool)" },
  { value: "commercial", label: "Commercial (so sánh, đánh giá)" },
];

export default function AIContentWriter() {
  const [keyword, setKeyword] = useState("");
  const [cluster, setCluster] = useState("lao-dong");
  const [contentType, setContentType] = useState("blog");
  const [intent, setIntent] = useState("informational");
  const [kwSecondary, setKwSecondary] = useState("");
  const [audience, setAudience] = useState("");
  const [step, setStep] = useState("input");
  const [outline, setOutline] = useState("");
  const [article, setArticle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");
  const [provider, setProvider] = useState("anthropic");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("claude-sonnet-4-6");
  const [showKey, setShowKey] = useState(false);
  const articleRef = useRef(null);

  const selectedType = CONTENT_TYPES.find((t) => t.value === contentType);
  const selectedProvider = PROVIDERS.find((p) => p.value === provider);

  useEffect(() => {
    const saved = localStorage.getItem("iluat_api_key");
    const savedProvider = localStorage.getItem("iluat_provider");
    const savedModel = localStorage.getItem("iluat_model");
    if (saved) setApiKey(saved);
    if (savedProvider) setProvider(savedProvider);
    if (savedModel) setModel(savedModel);
  }, []);

  function saveSettings(newProvider, newModel, newKey) {
    localStorage.setItem("iluat_provider", newProvider);
    localStorage.setItem("iluat_model", newModel);
    localStorage.setItem("iluat_api_key", newKey);
  }

  function handleProviderChange(val) {
    const p = PROVIDERS.find((x) => x.value === val);
    const defaultModel = p.models[0].value;
    setProvider(val);
    setModel(defaultModel);
    saveSettings(val, defaultModel, apiKey);
  }

  function handleModelChange(val) {
    setModel(val);
    saveSettings(provider, val, apiKey);
  }

  function handleApiKeyChange(val) {
    setApiKey(val);
    saveSettings(provider, model, val);
  }

  async function callAPI(messages) {
    if (!apiKey.trim()) throw new Error("Vui lòng nhập API key trước khi sử dụng.");

    if (provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({ model, max_tokens: 8000, system: SYSTEM_PROMPT, messages }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `Anthropic API lỗi ${res.status}`);
      }
      const data = await res.json();
      return data.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
    }

    if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 8000,
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `OpenAI API lỗi ${res.status}`);
      }
      const data = await res.json();
      return data.choices[0]?.message?.content ?? "";
    }
  }

  async function generateOutline() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setProgress("Đang phân tích SERP intent + tạo outline...");
    setStep("outline");
    try {
      const prompt = `Tạo OUTLINE chi tiết cho bài viết SEO trên iluat.vn.

**Keyword chính:** ${keyword}
**Cluster:** ${CLUSTERS.find((c) => c.value === cluster)?.label}
**Loại content:** ${selectedType?.label} (${selectedType?.words} từ)
**Search Intent:** ${INTENTS.find((i) => i.value === intent)?.label}
${kwSecondary ? `**KW phụ/LSI:** ${kwSecondary}` : ""}
${audience ? `**Audience:** ${audience}` : ""}

Yêu cầu:
1. Viết suggested H1 (title tag ≤60 ký tự, có KW + năm nếu phù hợp)
2. Viết meta description (≤155 ký tự, có KW + CTA)
3. Suggest URL slug (ngắn, có KW, không dấu)
4. Liệt kê H2/H3 outline với mô tả ngắn mỗi section (2-3 câu về nội dung sẽ viết)
5. Gợi ý FAQ (≥3 câu hỏi)
6. Gợi ý internal links từ link map
7. Gợi ý vị trí đặt AI CTA (mid-content + cuối)
8. Gợi ý Schema markup phù hợp

Format output rõ ràng, dễ đọc.`;

      const result = await callAPI([{ role: "user", content: prompt }]);
      setOutline(result);
      setProgress("");
    } catch (err) {
      setError(err.message);
      setProgress("");
    }
    setLoading(false);
  }

  async function generateArticle() {
    setLoading(true);
    setError("");
    setProgress("Đang viết bài... (có thể mất 30-60 giây)");
    setStep("article");
    try {
      const prompt = `Dựa trên outline sau, viết BÀI VIẾT HOÀN CHỈNH bằng Markdown.

**Keyword chính:** ${keyword}
**Cluster:** ${CLUSTERS.find((c) => c.value === cluster)?.label}
**Loại content:** ${selectedType?.label} (${selectedType?.words} từ)
**Search Intent:** ${INTENTS.find((i) => i.value === intent)?.label}
${kwSecondary ? `**KW phụ/LSI:** ${kwSecondary}` : ""}

**OUTLINE ĐÃ DUYỆT:**
${outline}

**YÊU CẦU VIẾT:**
- Viết đủ ${selectedType?.words} từ
- Mỗi claim pháp lý PHẢI cite Điều + Luật + Năm
- KW chính trong 200 từ đầu + ≥1 H2 + kết luận
- Đoạn văn ≤4 dòng
- Có bảng so sánh khi relevant
- Có ≥2 ví dụ thực tế / case study
- Internal links dạng [text](/url/)
- AI CTA ở mid-content + cuối bài
- FAQ section cuối (≥3 câu, trả lời chi tiết)
- YMYL Disclaimer cuối cùng
- Frontmatter ở đầu (title, meta_description, url, schema)

Viết bài hoàn chỉnh, chuyên nghiệp, sẵn sàng publish.`;

      const result = await callAPI([
        { role: "user", content: `Đây là outline tôi muốn bạn viết thành bài:\n\n${outline}` },
        { role: "assistant", content: "Tôi đã đọc outline. Sẵn sàng viết bài hoàn chỉnh theo cấu trúc này." },
        { role: "user", content: prompt },
      ]);
      setArticle(result);
      setProgress("");
    } catch (err) {
      setError(err.message);
      setProgress("");
    }
    setLoading(false);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  function reset() {
    setStep("input");
    setOutline("");
    setArticle("");
    setError("");
    setProgress("");
  }

  function wordCount(text) {
    return text
      .replace(/[#*`|>\-\[\](){}]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 0).length;
  }

  return (
    <div style={{ fontFamily: "'Crimson Pro', Georgia, serif", maxWidth: 860, margin: "0 auto", padding: "0 16px 40px", background: "var(--bg, #faf9f6)", minHeight: "100vh", color: "var(--text, #1a1a1a)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap');
        :root { --bg: #faf9f6; --text: #1a1a1a; --accent: #1a4d2e; --accent2: #c8a951; --border: #d4cfc4; --surface: #fff; --muted: #6b6560; --danger: #9b2c2c; }
        * { box-sizing: border-box; }
        input, select, textarea { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* HEADER */}
      <div style={{ borderBottom: "3px solid var(--accent)", paddingBottom: 16, marginBottom: 32, paddingTop: 24 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)", letterSpacing: "-0.5px" }}>⚖ iluat.vn</span>
          <span style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: "var(--muted)", textTransform: "uppercase", letterSpacing: 2 }}>AI Content Writer</span>
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--muted)", margin: "8px 0 0" }}>
          Nhập keyword → Sinh outline → Duyệt → Viết bài hoàn chỉnh chuẩn SEO + YMYL
        </p>
      </div>

      {/* API KEY SETTINGS */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--muted)" }}>Cấu hình AI</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "var(--muted)" }}>(lưu tự động trong trình duyệt)</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "160px 200px 1fr", gap: 10, alignItems: "center" }}>
          <select value={provider} onChange={(e) => handleProviderChange(e.target.value)}
            style={{ padding: "8px 10px", border: "1px solid var(--border)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#faf9f6" }}>
            {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
          <select value={model} onChange={(e) => handleModelChange(e.target.value)}
            style={{ padding: "8px 10px", border: "1px solid var(--border)", fontSize: 13, fontFamily: "'DM Sans', sans-serif", background: "#faf9f6" }}>
            {selectedProvider?.models.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={selectedProvider?.placeholder || "API key..."}
              style={{ flex: 1, padding: "8px 10px", border: `1px solid ${apiKey ? "var(--accent)" : "var(--border)"}`, fontSize: 13, fontFamily: "monospace", background: "#faf9f6", outline: "none" }}
            />
            <button onClick={() => setShowKey(!showKey)}
              style={{ padding: "8px 12px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans', sans-serif", color: "var(--muted)", whiteSpace: "nowrap" }}>
              {showKey ? "Ẩn" : "Hiện"}
            </button>
          </div>
        </div>
        {!apiKey && (
          <p style={{ margin: "8px 0 0", fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#b45309" }}>
            Nhập API key để sử dụng. Key chỉ lưu trong trình duyệt của bạn, không gửi lên server nào khác ngoài {provider === "anthropic" ? "Anthropic" : "OpenAI"}.
          </p>
        )}
      </div>

      {/* STEP INDICATOR */}
      <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
        {[
          { key: "input", label: "① Nhập KW", active: step === "input" },
          { key: "outline", label: "② Outline", active: step === "outline" },
          { key: "article", label: "③ Bài viết", active: step === "article" },
        ].map((s) => (
          <div key={s.key} style={{
            flex: 1, padding: "10px 0", textAlign: "center",
            fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
            background: s.active ? "var(--accent)" : "var(--surface)",
            color: s.active ? "#fff" : "var(--muted)",
            border: `1px solid ${s.active ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 0, transition: "all 0.2s",
          }}>{s.label}</div>
        ))}
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", marginBottom: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--danger)" }}>
          {error}
        </div>
      )}

      {/* STEP 1: INPUT */}
      {step === "input" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 28 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 0, marginBottom: 24, color: "var(--accent)" }}>Thông tin bài viết</h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--muted)", marginBottom: 6 }}>Keyword chính *</label>
            <input
              type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder="VD: hợp đồng thuê nhà, đơn xin nghỉ việc, thành lập công ty..."
              style={{ width: "100%", padding: "12px 14px", border: "1px solid var(--border)", fontSize: 16, fontFamily: "'Crimson Pro', serif", outline: "none", background: "#faf9f6" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--muted)", marginBottom: 6 }}>Cluster</label>
              <select value={cluster} onChange={(e) => setCluster(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", fontSize: 14, background: "#faf9f6" }}>
                {CLUSTERS.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--muted)", marginBottom: 6 }}>Loại content</label>
              <select value={contentType} onChange={(e) => setContentType(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", fontSize: 14, background: "#faf9f6" }}>
                {CONTENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--muted)", marginBottom: 6 }}>Search Intent</label>
            <select value={intent} onChange={(e) => setIntent(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", fontSize: 14, background: "#faf9f6" }}>
              {INTENTS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--muted)", marginBottom: 6 }}>KW phụ / LSI (không bắt buộc)</label>
            <input type="text" value={kwSecondary} onChange={(e) => setKwSecondary(e.target.value)}
              placeholder="VD: mẫu hợp đồng, cách viết, tải miễn phí..."
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", fontSize: 14, outline: "none", background: "#faf9f6" }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5, color: "var(--muted)", marginBottom: 6 }}>Audience (không bắt buộc)</label>
            <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)}
              placeholder="VD: nhân viên VP, HR, chủ DN nhỏ, sinh viên..."
              style={{ width: "100%", padding: "10px 14px", border: "1px solid var(--border)", fontSize: 14, outline: "none", background: "#faf9f6" }} />
          </div>

          <button onClick={generateOutline} disabled={!keyword.trim() || loading}
            style={{
              width: "100%", padding: "14px 0", background: keyword.trim() ? "var(--accent)" : "var(--border)",
              color: "#fff", border: "none", fontSize: 15, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              cursor: keyword.trim() ? "pointer" : "not-allowed", letterSpacing: 0.5, transition: "all 0.2s",
            }}>
            {loading ? progress : "Tạo Outline →"}
          </button>
        </div>
      )}

      {/* STEP 2: OUTLINE */}
      {step === "outline" && (
        <div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 28, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--accent)" }}>
                Outline: "{keyword}"
              </h2>
              <button onClick={() => copyToClipboard(outline)}
                style={{ padding: "6px 14px", background: "transparent", border: "1px solid var(--border)", fontFamily: "'DM Sans', sans-serif", fontSize: 12, cursor: "pointer" }}>
                Copy
              </button>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ fontSize: 24, marginBottom: 12, animation: "spin 1s linear infinite" }}>⚖</div>
                <p>{progress}</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <div style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.75, fontFamily: "'DM Sans', sans-serif", color: "var(--text)", background: "#faf9f6", padding: 20, border: "1px solid var(--border)", maxHeight: 500, overflowY: "auto" }}>
                {outline}
              </div>
            )}
          </div>

          {!loading && outline && (
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={reset}
                style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid var(--border)", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer", color: "var(--muted)" }}>
                ← Sửa lại
              </button>
              <button onClick={generateArticle}
                style={{ flex: 2, padding: "12px 0", background: "var(--accent)", color: "#fff", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer", letterSpacing: 0.5 }}>
                Duyệt Outline → Viết bài hoàn chỉnh
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: ARTICLE */}
      {step === "article" && (
        <div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: 28 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "var(--accent)" }}>
                Bài viết hoàn chỉnh
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                {article && (
                  <>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "var(--muted)", padding: "6px 10px", background: "#faf9f6", border: "1px solid var(--border)" }}>
                      {wordCount(article).toLocaleString()} từ
                    </span>
                    <button onClick={() => copyToClipboard(article)}
                      style={{ padding: "6px 14px", background: "var(--accent)", color: "#fff", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Copy Markdown
                    </button>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <div style={{ padding: 60, textAlign: "center", color: "var(--muted)", fontFamily: "'DM Sans', sans-serif" }}>
                <div style={{ fontSize: 32, marginBottom: 16, animation: "spin 2s linear infinite" }}>⚖</div>
                <p style={{ fontSize: 15 }}>{progress}</p>
                <p style={{ fontSize: 12, marginTop: 8 }}>AI đang viết bài {selectedType?.words} từ với citations pháp luật...</p>
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : (
              <div ref={articleRef} style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif", color: "var(--text)", background: "#faf9f6", padding: 24, border: "1px solid var(--border)", maxHeight: 600, overflowY: "auto" }}>
                {article}
              </div>
            )}
          </div>

          {!loading && article && (
            <div style={{ marginTop: 16 }}>
              <div style={{ background: "#fef9ee", border: "1px solid var(--accent2)", padding: 16, marginBottom: 16 }}>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "var(--muted)" }}>
                  <strong style={{ color: "var(--accent)" }}>⚠ Trước khi publish:</strong> Bài viết do AI sinh — bắt buộc phải qua Bước ④ (Review pháp lý bởi Luật sư) và Bước ⑤ (SEO QC) trong SOP trước khi đăng. KHÔNG publish trực tiếp.
                </p>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={() => { setStep("outline"); setArticle(""); }}
                  style={{ flex: 1, padding: "12px 0", background: "transparent", border: "1px solid var(--border)", fontFamily: "'DM Sans', sans-serif", fontSize: 14, cursor: "pointer", color: "var(--muted)" }}>
                  ← Về Outline
                </button>
                <button onClick={reset}
                  style={{ flex: 1, padding: "12px 0", background: "var(--accent)", color: "#fff", border: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Viết bài mới
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FOOTER */}
      <div style={{ marginTop: 40, paddingTop: 16, borderTop: "1px solid var(--border)", fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "var(--muted)", textAlign: "center" }}>
        AI Content Writer for iluat.vn — Powered by Claude API — Bài viết cần review pháp lý trước khi publish
      </div>
    </div>
  );
}
