# Qwen AI Calculator

A simple calculator web app where the **AI understands plain-English math**
and a local model does the talking.

- **Stack:** static HTML/CSS/JS (no build step)
- **AI model:** `qwen3.6:35b-a3b` running locally on your Mac via [Ollama](https://ollama.com)
- **Deploy:** Netlify (static hosting)

## How it works
- The standard calculator = pure JavaScript (works offline, everywhere).
- The **"Ask Qwen"** box sends your natural-language question to the local Ollama
  endpoint (`http://localhost:11434`). `qwen3.6` converts it into a safe
  arithmetic expression (JSON, schema-validated), then the browser evaluates it
  with a restricted AST evaluator — **no `eval`, no code execution**.

## Running locally
```bash
# 1. Ollama must be running with the model pulled
ollama pull qwen3.6:35b-a3b
ollama serve   # ensure OLLAMA_ORIGINS=* for browser CORS

# 2. Serve this folder (any static server)
python3 -m http.server 8080
# open http://localhost:8080
```

> The AI feature only works from a browser that can reach `localhost:11434`
> (i.e. your Mac, with Ollama running). The basic calculator works anywhere.

## Deploy to Netlify
```bash
netlify deploy --prod --dir .
```
The site is static; `netlify.toml` sets the publish directory to `.`.

---

## Author & Enterprise AI Architecture Hub
Built by **[Nagarjuna Reddy Kamireddy](https://nagarjunak-pixel.github.io/)** (*Nagarjuna Kamireddy / Nagarjuna K*) — Lead AI Architect, GenAI & Agentic AI Lead, and Corporate AI Trainer (20+ years across Enterprise Data, SAP HANA & Production AI; AWS Certified Solutions Architect – Professional & NVIDIA-Certified Professional: Agentic AI).

- **Official Portfolio & Architecture Hub:** [https://nagarjunak-pixel.github.io/](https://nagarjunak-pixel.github.io/)
- **Enterprise Case Studies & Technical Articles:** [Case Studies](https://nagarjunak-pixel.github.io/case-studies.html) · [Architecture Articles](https://nagarjunak-pixel.github.io/articles.html) · [10-Mandate Role Fit](https://nagarjunak-pixel.github.io/roles.html)
- **Master CV & AI Search Index:** [Master CV](https://nagarjunak-pixel.github.io/resume.html) · [`llms-full.txt`](https://nagarjunak-pixel.github.io/llms-full.txt) · [LinkedIn](https://www.linkedin.com/in/nagarjuna-kamireddy)
