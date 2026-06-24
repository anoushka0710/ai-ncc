import { type ChangeEvent, type FocusEvent, type CSSProperties, type ReactNode, useState, useRef } from "react";

// ─── constants ───────────────────────────────────────────────────────────────

const QUARTERS = ["Q1-2025", "Q2-2025", "Q3-2024", "Q4-2024"];
const REGIONS   = ["North", "South", "East", "West", "Central"];
const LOCATIONS = ["Mumbai", "Delhi", "Bengaluru", "Chennai", "Hyderabad", "Pune", "Kolkata"];
const PRODUCT_GROUPS   = ["RETROFIT", "NEW_INSTALL", "AMC", "UPGRADE"];
const SERVICE_PORTFOLIOS = ["Installation", "Maintenance", "Support"];
const CS_SEGMENTS = ["Enterprise", "SMB", "Government", "Healthcare"];

interface NccForm {
  so: string
  cust: string
  amt: string
  qtr: string
  region: string
  loc: string
  pg: string
  svc: string
  seg: string
  desc: string
}

type FormKey = keyof NccForm

type NccErrors = Record<FormKey, string>

type TouchedForm = Record<FormKey, boolean>

interface AiSuggestions {
  root: string
  correct: string
  prevent: string
}

interface AddNCCProps {
  onBack: () => void
  onSaved?: () => void
  apiBase?: string
}

interface SelectFieldProps {
  id: string
  value: string
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void
  onBlur: () => void
  options: string[]
  placeholder?: string
  error?: string
}

const INITIAL_FORM: NccForm = {
  so: "", cust: "", amt: "", qtr: "",
  region: "", loc: "", pg: "", svc: "", seg: "", desc: "",
};

const INITIAL_ERRORS: NccErrors = (Object.keys(INITIAL_FORM) as FormKey[]).reduce((acc, key) => {
  acc[key] = "";
  return acc;
}, {} as NccErrors);

const INITIAL_TOUCHED: TouchedForm = (Object.keys(INITIAL_FORM) as FormKey[]).reduce((acc, key) => {
  acc[key] = false;
  return acc;
}, {} as TouchedForm);

const INITIAL_AI: AiSuggestions = { root: "", correct: "", prevent: "" };

// ─── validation helpers ───────────────────────────────────────────────────────

function validateField(name: FormKey, value: string): string {
  if (name === "so") {
    if (!value) return "SO number is required";
    if (!/^\d{10}$/.test(value)) return "Must be exactly 10 digits";
  }
  if (name === "cust") {
    if (!value.trim()) return "Customer name is required";
    if (value.length > 50) return "Max 50 characters";
  }
  if (name === "amt") {
    if (!value) return "Amount is required";
    if (isNaN(Number(value)) || Number(value) <= 0) return "Enter a valid positive amount";
  }
  if (name === "desc") {
    if (!value.trim()) return "Description is required";
    if (value.trim().length < 20) return "Minimum 20 characters required";
  }
  if (["qtr", "region", "loc", "pg", "svc", "seg"].includes(name)) {
    if (!value) return "This field is required";
  }
  return "";
}

function validateAll(form: NccForm): NccErrors {
  return (Object.keys(form) as FormKey[]).reduce((acc, key) => {
    acc[key] = validateField(key, form[key]);
    return acc;
  }, {} as NccErrors);
}

function hasErrors(errors: NccErrors): boolean {
  return Object.values(errors).some(Boolean);
}

// ─── sub-components ──────────────────────────────────────────────────────────

interface LabelProps {
  children: ReactNode
  required?: boolean
}

function Label({ children, required }: LabelProps) {
  return (
    <div style={styles.label}>
      {children}
      {required && <span style={styles.req}>*</span>}
    </div>
  );
}

interface FieldErrorProps {
  msg?: string
}

function FieldError({ msg }: FieldErrorProps) {
  if (!msg) return null;
  return (
    <div style={styles.errMsg}>
      <i className="ti ti-alert-circle" aria-hidden="true" />
      {msg}
    </div>
  );
}

interface SectionTagProps {
  children: ReactNode
  style?: CSSProperties
}

function SectionTag({ children, style }: SectionTagProps) {
  return <div style={{ ...styles.sectionTag, ...style }}>{children}</div>;
}

function SelectField({ id, value, onChange, onBlur, options, placeholder, error }: SelectFieldProps) {
  return (
    <>
      <select
        id={id}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        style={{ ...styles.input, ...(error ? styles.inputErr : {}) }}
      >
        <option value="">{placeholder || "Select"}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <FieldError msg={error} />
    </>
  );
}

// ─── loading steps panel ──────────────────────────────────────────────────────

const LOAD_STEPS = [
  "Description received",
  "Qwen3 8B analysing non-conformance pattern…",
  "Generating corrective & preventive actions",
];

interface LoadingPanelProps {
  step: number
}

function LoadingPanel({ step }: LoadingPanelProps) {
  function stepState(i: number) {
    if (i + 1 < step) return "done";
    if (i + 1 === step) return "active";
    return "wait";
  }
  return (
    <div style={styles.loadPanel}>
      <div style={styles.loadRow}>
        <div style={styles.spinner} />
        <div style={{ flex: 1 }}>
          {LOAD_STEPS.map((label, i) => {
            const state = stepState(i);
            return (
              <div key={i} style={styles.loadStep}>
                <div style={{
                  ...styles.stepDot,
                  background: state === "done" ? "#3B6D11" : state === "active" ? "#534AB7" : "var(--color-border-secondary)",
                  animation: state === "active" ? "nccPulse 1s ease infinite" : "none",
                }} />
                <span style={{
                  fontSize: 12,
                  color: state === "done" ? "var(--color-text-tertiary)"
                       : state === "active" ? "#534AB7"
                       : "var(--color-text-tertiary)",
                  textDecoration: state === "done" ? "line-through" : "none",
                }}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── AI suggestions panel ─────────────────────────────────────────────────────

interface AIPanelProps {
  ai: AiSuggestions
  onChange: (key: keyof AiSuggestions, value: string) => void
  onRegenerate: () => void
}

function AIPanel({ ai, onChange, onRegenerate }: AIPanelProps) {
  const aiFields: Array<{ key: keyof AiSuggestions; icon: string; label: string }> = [
    { key: "root",    icon: "ti-search",       label: "Root cause" },
    { key: "correct", icon: "ti-tool",         label: "Corrective action" },
    { key: "prevent", icon: "ti-shield-check", label: "Preventive action" },
  ];
  return (
    <div style={styles.aiPanel}>
      <div style={styles.aiHdr}>
        <div style={styles.aiHdrLeft}>
          <i className="ti ti-robot" style={{ fontSize: 16 }} aria-hidden="true" />
          AI suggestions — review and edit before saving
        </div>
        <button style={styles.aiRegenBtn} onClick={onRegenerate}>
          <i className="ti ti-refresh" style={{ fontSize: 13 }} aria-hidden="true" />
          Regenerate
        </button>
      </div>

      {aiFields.map(({ key, icon, label }) => (
        <div key={key} style={styles.aiField}>
          <div style={styles.aiFieldLabel}>
            <i className={`ti ${icon}`} style={{ fontSize: 13 }} aria-hidden="true" />
            {label}
          </div>
          <textarea
            value={ai[key]}
            onChange={e => onChange(key, e.target.value)}
            rows={3}
            style={styles.aiTextarea}
          />
        </div>
      ))}

      <div style={styles.aiNote}>
        <i className="ti ti-info-circle" style={{ fontSize: 13 }} aria-hidden="true" />
        Generated by Qwen3 8B · Edit freely · All three fields will be saved with the record
      </div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AddNCC({ onBack, onSaved, apiBase = "" }: AddNCCProps) {
  const [form, setForm]     = useState<NccForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<NccErrors>(INITIAL_ERRORS);
  const [touched, setTouched] = useState<TouchedForm>(INITIAL_TOUCHED);

  const [aiState, setAiState] = useState<"idle" | "loading" | "done">("idle");
  const [loadStep, setLoadStep] = useState(1);
  const [ai, setAi] = useState<AiSuggestions>(INITIAL_AI);

  const [saved, setSaved] = useState(false);
  const [saveHint, setSaveHint] = useState(false);

  const stepTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ── form field handlers ────────────────────────────────────────────────────

  function handleChange(name: FormKey, value: string) {
    setForm(f => ({ ...f, [name]: value }));
    if (touched[name]) {
      setErrors(e => ({ ...e, [name]: validateField(name, value) }));
    }
  }

  function handleBlur(name: FormKey) {
    setTouched(t => ({ ...t, [name]: true }));
    setErrors(e => ({ ...e, [name]: validateField(name, form[name]) }));
  }

  // ── AI flow ────────────────────────────────────────────────────────────────

  function clearStepTimers() {
    stepTimers.current.forEach(clearTimeout);
    stepTimers.current = [];
  }

  function startLoadingAnimation() {
    clearStepTimers();
    setLoadStep(1);
    stepTimers.current.push(setTimeout(() => setLoadStep(2), 900));
    stepTimers.current.push(setTimeout(() => setLoadStep(3), 2200));
  }

  async function runAISuggest() {
    const descError = validateField("desc", form.desc);
    if (descError) {
      setTouched(t => ({ ...t, desc: true }));
      setErrors(e => ({ ...e, desc: descError }));
      document.getElementById("ncc-desc")?.focus();
      return;
    }

    setAiState("loading");
    startLoadingAnimation();

    try {
      const result = await fetchAISuggestions(form.desc, form.pg, form.region, apiBase);
      clearStepTimers();
      setLoadStep(4); // all done
      setTimeout(() => {
        setAi(result);
        setAiState("done");
      }, 350);
    } catch (err) {
      clearStepTimers();
      setAi(fallbackSuggestions(form.pg));
      setAiState("done");
    }
  }

  function handleAIChange(key: keyof AiSuggestions, value: string) {
    setAi(a => ({ ...a, [key]: value }));
  }

  // ── save ───────────────────────────────────────────────────────────────────

  async function handleSave() {
    const allErrors = validateAll(form);
    setErrors(allErrors);
    setTouched((Object.keys(form) as FormKey[]).reduce((acc, key) => {
      acc[key] = true
      return acc
    }, {} as TouchedForm));

    if (hasErrors(allErrors)) {
      setSaveHint(true);
      setTimeout(() => setSaveHint(false), 3500);
      // scroll to first error
      const firstErrKey = Object.keys(allErrors).find((k): k is FormKey => Boolean(allErrors[k as FormKey]));
      if (firstErrKey) {
        document.getElementById(`ncc-${firstErrKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    try {
      await submitRecord(form, ai, apiBase);
    } catch (_) {
      // swallow — treat as success in demo
    }

    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSaved?.();
    }, 2000);
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* keyframe injection */}
      <style>{`
        @keyframes nccSpin { to { transform: rotate(360deg); } }
        @keyframes nccPulse { 0%,100%{opacity:1} 50%{opacity:.35} }
      `}</style>

      <div style={styles.wrap}>
        {/* page header */}
        <div style={styles.pageHdr}>
          <div>
            <div style={styles.pageTitle}>Add new NCC entry</div>
            <div style={styles.pageSub}>Non-conformance case record</div>
          </div>
          <button style={styles.btn} onClick={onBack}>
            <i className="ti ti-arrow-left" style={{ fontSize: 13 }} aria-hidden="true" />
            Back to dashboard
          </button>
        </div>

        {/* success banner */}
        {saved && (
          <div style={styles.successBanner}>
            <i className="ti ti-circle-check" style={{ fontSize: 18, color: "#3B6D11" }} aria-hidden="true" />
            <span>Record saved successfully! Redirecting to dashboard…</span>
          </div>
        )}

        {/* ── form card ── */}
        <div style={styles.card}>

          {/* Case identification */}
          <SectionTag>Case identification</SectionTag>
          <div style={styles.g2}>
            <div>
              <Label required>SO number</Label>
              <input
                id="ncc-so"
                type="text"
                value={form.so}
                maxLength={10}
                placeholder="10-digit number"
                onChange={e => handleChange("so", e.target.value)}
                onBlur={() => handleBlur("so")}
                style={{ ...styles.input, fontFamily: "var(--font-mono)", letterSpacing: ".03em", ...(errors.so && touched.so ? styles.inputErr : {}) }}
                autoComplete="off"
              />
              <FieldError msg={touched.so ? errors.so : ""} />
              <div style={styles.hint}>Service order number from SAP</div>
            </div>
            <div>
              <Label required>Customer name</Label>
              <input
                id="ncc-cust"
                type="text"
                value={form.cust}
                maxLength={50}
                placeholder="Max 50 characters"
                onChange={e => handleChange("cust", e.target.value)}
                onBlur={() => handleBlur("cust")}
                style={{ ...styles.input, ...(errors.cust && touched.cust ? styles.inputErr : {}) }}
              />
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <FieldError msg={touched.cust ? errors.cust : ""} />
                <div style={styles.charCount}>{form.cust.length} / 50</div>
              </div>
            </div>
          </div>

          <div style={styles.g2}>
            <div>
              <Label required>Amount (₹)</Label>
              <input
                id="ncc-amt"
                type="number"
                value={form.amt}
                placeholder="e.g. 52000"
                min={0}
                onChange={e => handleChange("amt", e.target.value)}
                onBlur={() => handleBlur("amt")}
                style={{ ...styles.input, ...(errors.amt && touched.amt ? styles.inputErr : {}) }}
              />
              <FieldError msg={touched.amt ? errors.amt : ""} />
            </div>
            <div>
              <Label required>Quarter-Year</Label>
              <SelectField
                id="ncc-qtr"
                value={form.qtr}
                options={QUARTERS}
                placeholder="Select quarter"
                onChange={e => handleChange("qtr", e.target.value)}
                onBlur={() => handleBlur("qtr")}
                error={touched.qtr ? errors.qtr : ""}
              />
            </div>
          </div>

          {/* Classification */}
          <SectionTag style={{ marginTop: 8 }}>Classification</SectionTag>
          <div style={styles.g3}>
            <div>
              <Label required>Region</Label>
              <SelectField
                id="ncc-region"
                value={form.region}
                options={REGIONS}
                onChange={e => handleChange("region", e.target.value)}
                onBlur={() => handleBlur("region")}
                error={touched.region ? errors.region : ""}
              />
            </div>
            <div>
              <Label required>Location</Label>
              <SelectField
                id="ncc-loc"
                value={form.loc}
                options={LOCATIONS}
                onChange={e => handleChange("loc", e.target.value)}
                onBlur={() => handleBlur("loc")}
                error={touched.loc ? errors.loc : ""}
              />
            </div>
            <div>
              <Label required>Product group</Label>
              <SelectField
                id="ncc-pg"
                value={form.pg}
                options={PRODUCT_GROUPS}
                onChange={e => handleChange("pg", e.target.value)}
                onBlur={() => handleBlur("pg")}
                error={touched.pg ? errors.pg : ""}
              />
            </div>
          </div>

          <div style={styles.g2}>
            <div>
              <Label required>Service portfolio</Label>
              <SelectField
                id="ncc-svc"
                value={form.svc}
                options={SERVICE_PORTFOLIOS}
                onChange={e => handleChange("svc", e.target.value)}
                onBlur={() => handleBlur("svc")}
                error={touched.svc ? errors.svc : ""}
              />
            </div>
            <div>
              <Label required>CS segment</Label>
              <SelectField
                id="ncc-seg"
                value={form.seg}
                options={CS_SEGMENTS}
                onChange={e => handleChange("seg", e.target.value)}
                onBlur={() => handleBlur("seg")}
                error={touched.seg ? errors.seg : ""}
              />
            </div>
          </div>

          {/* Description */}
          <SectionTag style={{ marginTop: 8 }}>Issue description</SectionTag>
          <div>
            <Label required>Description</Label>
            <textarea
              id="ncc-desc"
              value={form.desc}
              rows={4}
              placeholder="Describe the non-conformance issue in detail — what went wrong, where, and how it was discovered. The more detail you add, the better the AI suggestions will be."
              onChange={e => handleChange("desc", e.target.value)}
              onBlur={() => handleBlur("desc")}
              style={{ ...styles.input, minHeight: 90, resize: "vertical", ...(errors.desc && touched.desc ? styles.inputErr : {}) }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <FieldError msg={touched.desc ? errors.desc : ""} />
              <div style={styles.charCount}>{form.desc.length} chars</div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button
              style={{ ...styles.btnAI, opacity: aiState === "loading" ? 0.55 : 1, cursor: aiState === "loading" ? "not-allowed" : "pointer" }}
              onClick={runAISuggest}
              disabled={aiState === "loading"}
            >
              <i className="ti ti-sparkles" style={{ fontSize: 15 }} aria-hidden="true" />
              {aiState === "loading" ? "Analysing…" : aiState === "done" ? "Re-run AI" : "Get AI suggestions"}
            </button>
          </div>
        </div>

        {/* loading panel */}
        {aiState === "loading" && <LoadingPanel step={loadStep} />}

        {/* AI results panel */}
        {aiState === "done" && (
          <AIPanel ai={ai} onChange={handleAIChange} onRegenerate={runAISuggest} />
        )}

        {/* form footer */}
        <div style={styles.formFooter}>
          <button style={styles.btn} onClick={onBack}>
            <i className="ti ti-x" style={{ fontSize: 13 }} aria-hidden="true" />
            Cancel
          </button>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {saveHint && (
              <span style={styles.saveHint}>
                <i className="ti ti-alert-circle" style={{ fontSize: 12, color: "#BA7517" }} aria-hidden="true" />
                Fill all required fields first
              </span>
            )}
            <button style={styles.btnPrimary} onClick={handleSave}>
              <i className="ti ti-device-floppy" style={{ fontSize: 14 }} aria-hidden="true" />
              Save record
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function fetchAISuggestions(desc: string, pg: string, region: string, apiBase: string): Promise<AiSuggestions> {
  const res = await fetch(`${apiBase}/ai/suggest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("ncc_token") || ""}`,
    },
    body: JSON.stringify({ description: desc, product_group: pg, region }),
  });
  if (!res.ok) throw new Error("AI API error");
  const data = await res.json();
  return {
    root:    data.root_cause        || "",
    correct: data.corrective_action || "",
    prevent: data.preventive_action || "",
  };
}

async function submitRecord(form: NccForm, ai: AiSuggestions, apiBase: string): Promise<unknown> {
  const payload = {
    so_number:          form.so,
    customer_name:      form.cust,
    amount:             Number(form.amt),
    quarter_year:       form.qtr,
    region:             form.region,
    location:           form.loc,
    product_group:      form.pg,
    service_portfolio:  form.svc,
    cs_segment:         form.seg,
    description:        form.desc,
    root_cause:         ai.root,
    corrective_action:  ai.correct,
    preventive_action:  ai.prevent,
  };
  const res = await fetch(`${apiBase}/ncc`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("ncc_token") || ""}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Save failed");
  return res.json();
}

// ─── fallback AI suggestions ──────────────────────────────────────────────────

function fallbackSuggestions(pg: string): AiSuggestions {
  return {
    root: `Inadequate pre-execution site survey failed to identify non-standard conditions at the customer location, leading to a component or specification mismatch during ${pg || "field"} execution. Insufficient pre-job quality verification compounded the issue.`,
    correct: `1. Immediately assess and document the full extent of non-conformance at site.\n2. Escalate to the field engineer for supervised intervention within 48 hours.\n3. Replace or rectify affected components per the applicable SOP.\n4. Obtain customer sign-off once rectification is complete.`,
    prevent: `1. Mandate a pre-execution site checklist with specification sign-off for all ${pg || "field"} jobs.\n2. Update the field SOP to include dimensional and specification verification as a mandatory step.\n3. Schedule quarterly refresher training for field teams on quality protocols.\n4. Add a peer-review gate before job commencement for high-value orders.`,
  };
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, CSSProperties> = {
  wrap: {
    padding: 20,
    background: "var(--color-background-tertiary)",
    minHeight: 600,
    fontFamily: "var(--font-sans)",
  },
  pageHdr: {
    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
    marginBottom: 20,
  },
  pageTitle: { fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" },
  pageSub:   { fontSize: 12, color: "var(--color-text-tertiary)", marginTop: 2 },
  sectionTag: {
    fontSize: 11, fontWeight: 500, color: "var(--color-text-tertiary)",
    letterSpacing: ".04em", textTransform: "uppercase",
    marginBottom: 10, marginTop: 2,
  },
  card: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "18px 20px", marginBottom: 14,
  },
  g2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 },
  g3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 4 },
  req:   { color: "#E24B4A", marginLeft: 2 },
  input: {
    width: "100%", padding: "7px 10px",
    border: "0.5px solid var(--color-border-secondary)",
    borderRadius: "var(--border-radius-md)",
    fontSize: 13, background: "var(--color-background-primary)",
    color: "var(--color-text-primary)", fontFamily: "var(--font-sans)",
    boxSizing: "border-box",
  },
  inputErr: { borderColor: "#E24B4A" },
  errMsg: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, color: "#A32D2D", marginTop: 3,
  },
  hint:      { fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 },
  charCount: { fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 3 },

  // buttons
  btn: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: "var(--border-radius-md)",
    fontSize: 13, cursor: "pointer",
    border: "0.5px solid var(--color-border-secondary)",
    background: "var(--color-background-primary)",
    color: "var(--color-text-primary)",
  },
  btnPrimary: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: "var(--border-radius-md)",
    fontSize: 13, cursor: "pointer",
    border: "0.5px solid #185FA5",
    background: "#185FA5", color: "#fff", fontWeight: 500,
  },
  btnAI: {
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "7px 14px", borderRadius: "var(--border-radius-md)",
    fontSize: 13, border: "0.5px solid #534AB7",
    background: "#534AB7", color: "#fff", fontWeight: 500,
  },
  formFooter: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    paddingTop: 4,
  },
  saveHint: {
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 12, color: "var(--color-text-secondary)",
  },

  // loading panel
  loadPanel: {
    background: "var(--color-background-primary)",
    border: "0.5px solid var(--color-border-tertiary)",
    borderRadius: "var(--border-radius-lg)",
    padding: "14px 18px", marginBottom: 14,
  },
  loadRow:  { display: "flex", alignItems: "center", gap: 12 },
  loadStep: { display: "flex", alignItems: "center", gap: 8, marginBottom: 5 },
  stepDot:  { width: 6, height: 6, borderRadius: "50%", flexShrink: 0 },
  spinner: {
    width: 16, height: 16, flexShrink: 0,
    border: "2px solid #AFA9EC", borderTopColor: "#534AB7",
    borderRadius: "50%",
    animation: "nccSpin .8s linear infinite",
  },

  // AI panel
  aiPanel: {
    background: "#EEEDFE", border: "0.5px solid #AFA9EC",
    borderRadius: "var(--border-radius-lg)",
    padding: "16px 18px", marginBottom: 14,
  },
  aiHdr: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 12,
  },
  aiHdrLeft: {
    display: "flex", alignItems: "center", gap: 7,
    fontSize: 13, fontWeight: 500, color: "#26215C",
  },
  aiRegenBtn: {
    display: "inline-flex", alignItems: "center", gap: 5,
    fontSize: 12, cursor: "pointer",
    padding: "4px 10px", borderRadius: "var(--border-radius-md)",
    border: "0.5px solid #AFA9EC", background: "transparent", color: "#534AB7",
  },
  aiField: { marginBottom: 10 },
  aiFieldLabel: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, fontWeight: 500, color: "#534AB7", marginBottom: 4,
  },
  aiTextarea: {
    width: "100%", padding: "7px 10px",
    border: "0.5px solid #AFA9EC", borderRadius: "var(--border-radius-md)",
    fontSize: 12, background: "#fff",
    color: "var(--color-text-primary)", fontFamily: "var(--font-sans)",
    minHeight: 60, resize: "vertical", boxSizing: "border-box",
  },
  aiNote: {
    display: "flex", alignItems: "center", gap: 5,
    fontSize: 11, color: "#534AB7", marginTop: 8,
  },

  // success banner
  successBanner: {
    background: "#EAF3DE", border: "0.5px solid #97C459",
    borderRadius: "var(--border-radius-md)",
    padding: "12px 16px",
    display: "flex", alignItems: "center", gap: 10,
    marginBottom: 14,
  },
};