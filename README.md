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
