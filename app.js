// ===== Qwen AI Calculator =====
// Basic calculator = pure JS (works everywhere).
// "Ask Qwen" = calls qwen3.6:35b-a3b on your local Ollama (localhost:11434).
// The model parses natural language into a safe arithmetic expression;
// we evaluate it with a restricted AST evaluator (no eval, no code exec).

const OLLAMA = "http://localhost:11434";
const MODEL = "qwen3.6:35b-a3b";

// ---------- Safe expression evaluator (AST, no eval) ----------
const OPS = {
  ast_Add: (a, b) => a + b,
  ast_Sub: (a, b) => a - b,
  ast_Mult: (a, b) => a * b,
  ast_Div: (a, b) => (b === 0 ? NaN : a / b),
  ast_Pow: (a, b) => Math.pow(a, b),
  ast_Mod: (a, b) => a % b,
  ast_USub: (a) => -a,
};

function safeEval(expr) {
  const tokens = expr.match(/\d+\.?\d*|\(|\)|\*\*|[+\-*/%]/g);
  if (!tokens) throw new Error("No tokens");
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  function pE() { // add / sub
    let l = pT();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      l = { type: op === "+" ? "add" : "sub", left: l, right: pT() };
    }
    return l;
  }
  function pT() { // mul / div / mod
    let l = pF();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = next();
      const type = op === "*" ? "mul" : op === "/" ? "div" : "mod";
      l = { type, left: l, right: pF() };
    }
    return l;
  }
  function pF() { // unary minus
    if (peek() === "-") { next(); return { type: "neg", v: pPow() }; }
    return pPow();
  }
  function pPow() { // power (right-associative)
    let base = pPrimary();
    if (peek() === "**") { next(); return { type: "pow", left: base, right: pPow() }; }
    return base;
  }
  function pPrimary() {
    const t = peek();
    if (t === "(") {
      next();
      const e = pE();
      if (peek() === ")") next();
      return e;
    }
    if (/^\d/.test(t)) { next(); return { type: "num", v: parseFloat(t) }; }
    throw new Error("Unexpected token " + t);
  }
  const ast = pE();
  if (pos !== tokens.length) throw new Error("Trailing tokens");
  return evalNode(ast);
}
function evalNode(n) {
  switch (n.type) {
    case "num": return n.v;
    case "neg": return -evalNode(n.v);
    case "add": return evalNode(n.left) + evalNode(n.right);
    case "sub": return evalNode(n.left) - evalNode(n.right);
    case "mul": return evalNode(n.left) * evalNode(n.right);
    case "div": return evalNode(n.left) / evalNode(n.right);
    case "mod": return evalNode(n.left) % evalNode(n.right);
    case "pow": return Math.pow(evalNode(n.left), evalNode(n.right));
    default: throw new Error("Bad node");
  }
}

// ---------- Standard calculator UI ----------
const exprEl = document.getElementById("expr");
const resultEl = document.getElementById("result");
let expression = "";
let lastResult = "0";

function render() {
  exprEl.textContent = expression || "";
  if (expression && !expression.endsWith(" ") && !/[+\-*/%]$/.test(expression)) {
    try { resultEl.textContent = formatNum(safeEval(expression)); }
    catch { resultEl.textContent = lastResult; }
  } else {
    resultEl.textContent = lastResult;
  }
}
function formatNum(n) {
  if (!isFinite(n)) return "Error";
  return String(Math.round(n * 1e10) / 1e10);
}
document.querySelector(".keys").addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const act = btn.dataset.act;
  const val = btn.dataset.val || "";
  if (act === "num") expression += val;
  else if (act === "op") expression += " " + val + " ";
  else if (act === "paren") expression += val;
  else if (act === "clear") { expression = ""; lastResult = "0"; }
  else if (act === "back") expression = expression.trimEnd().slice(0, -1).trimEnd();
  else if (act === "equals") {
    try {
      lastResult = formatNum(safeEval(expression));
      expression = "";
    } catch { lastResult = "Error"; }
  }
  render();
});

// ---------- AI: ask Qwen via local Ollama ----------
const askInput = document.getElementById("ask");
const askBtn = document.getElementById("askBtn");
const aiOut = document.getElementById("aiOut");
const aiMeta = document.getElementById("aiMeta");
const statusEl = document.getElementById("status");

const SCHEMA = {
  type: "object",
  properties: {
    expr: { type: "string", description: "safe arithmetic expression using + - * / ( ) ** %" },
    explain: { type: "string", description: "one short sentence of what was computed" },
  },
  required: ["expr", "explain"],
};

async function checkOllama() {
  try {
    const r = await fetch(OLLAMA + "/api/tags", { cache: "no-store" });
    if (!r.ok) throw new Error("bad status");
    statusEl.textContent = "✓ Ollama online — AI mode ready";
    statusEl.className = "status ok";
    return true;
  } catch {
    statusEl.textContent = "⚠ Ollama not reachable. The AI feature needs Ollama running on this Mac. Basic calculator still works.";
    statusEl.className = "status bad";
    return false;
  }
}

async function askQwen(query) {
  const sys = `You are a precise math parser. Convert the user's natural-language math question into ONE safe arithmetic expression using only digits, spaces, and these operators: + - * / ( ) ** (power) %. Do NOT compute. Respond ONLY with JSON matching the schema. Example: "15% of 240 plus 3 squared" -> {"expr":"240*0.15 + 3**2","explain":"15% of 240 plus 3 squared"}.`;
  const body = {
    model: MODEL,
    stream: false,
    think: false,
    format: SCHEMA,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: query },
    ],
  };
  const r = await fetch(OLLAMA + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error("Ollama error " + r.status);
  const data = await r.json();
  return data;
}

askBtn.addEventListener("click", async () => {
  const q = askInput.value.trim();
  if (!q) return;
  askBtn.disabled = true;
  aiOut.textContent = "Thinking…";
  aiMeta.textContent = "";
  const t0 = performance.now();
  try {
    const ok = await checkOllama();
    if (!ok) throw new Error("Ollama offline");
    const data = await askQwen(q);
    const parsed = JSON.parse(data.message.content);
    const value = safeEval(parsed.expr);
    const ms = (performance.now() - t0).toFixed(0);
    aiMeta.textContent = `model: ${data.model} · ${ms} ms · qwen3.6 local`;
    aiOut.innerHTML =
      `<div class="expr2">${escapeHtml(q)} → ${escapeHtml(parsed.expr)}</div>` +
      `<div><b>${isFinite(value) ? formatNum(value) : "Error"}</b></div>` +
      `<div class="expr2">${escapeHtml(parsed.explain || "")}</div>`;
  } catch (err) {
    aiOut.textContent = "Could not reach Qwen on this Mac. Make sure Ollama is running with qwen3.6:35b-a3b pulled, and you're opening this page from your Mac. (" + err.message + ")";
  } finally {
    askBtn.disabled = false;
  }
});
askInput.addEventListener("keydown", (e) => { if (e.key === "Enter") askBtn.click(); });

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// init
checkOllama();
render();
