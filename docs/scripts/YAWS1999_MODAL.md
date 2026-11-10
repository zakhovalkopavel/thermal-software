# Yaws OCR on Modal (Surya)

Run handbook page OCR on **Modal** GPUs instead of the local `llama-server`. Backend and **full model id** are configured via environment variables (see `.env.example`).

## Prerequisites

1. Modal account: https://modal.com  
2. API token from the Modal dashboard (Settings → API tokens)  
3. Hugging Face token with access to download the OCR weights  

**Never commit** `MODAL_TOKEN_ID`, `MODAL_TOKEN_SECRET`, or `HF_TOKEN`.

## Host / `.env` setup

In the project `.env` (gitignored):

```bash
YAWS_OCR_BACKEND=modal
YAWS_OCR_MODEL=datalab-to/surya-ocr-2.5-gguf
YAWS_OCR_QUANT=bf16
YAWS_MODAL_GPU=T4
YAWS_MODAL_APP=yaws-surya-ocr
YAWS_MODAL_CLASS=SuryaOcr
YAWS_MODAL_LLAMA_RELEASE=b12061
YAWS_MODAL_LLAMA_FLAVOR=ubuntu-cuda-12.8-x64

MODAL_TOKEN_ID=ak-...          # your token — do not commit
MODAL_TOKEN_SECRET=as-...      # your secret — do not commit
```

Alternatively on a bare host (not Docker): `pip install modal && python -m modal setup` writes `~/.modal.toml`. Inside Compose, prefer the env vars above.

Rebuild the python image once (Dockerfile installs `modal>=1.6`, which supports
Python 3.14). The `python_packages` volume can hide new image packages —
`make yaws1999-modal-deploy` pip-installs `modal` into that volume if missing:

```bash
docker compose build python
```

## Hugging Face token (optional)

The default Surya GGUF repo is **public** — Modal can download it with no `HF_TOKEN`.
Weights land in a Modal volume on first cold start.

Create secret **`hf-secret`** (`HF_TOKEN=…`) only if you hit Hub rate limits or switch to a gated model:

```bash
docker compose run --rm -it python modal secret create hf-secret HF_TOKEN=hf_...
```

## Deploy the OCR app

From the repo (tokens must already be in the environment / `.env`):

```bash
make yaws1999-modal-deploy
```

This runs `modal deploy -m yaws1999.modal_surya_app` in the python container. GPU / model / app name are read from `.env` at deploy time and **baked into the Modal image** (remote workers do not see your local `.env`). After changing those vars, **redeploy**.

## Run a parse

```bash
YAWS_OCR_BACKEND=modal make yaws1999-parse TABLE=2-2 FORCE=1
# writes pages/page-NNNN.txt and pages/page-NNNN.modal.json (raw Modal response)
```

Pages are still rendered locally (`ddjvu`); **one PNG per Modal call** (no multi-page batch). Dumps resume as usual under `tmp/reports/python/yaws1999/pages/`.

## Switch model later

Set the complete model id and redeploy:

```bash
YAWS_OCR_MODEL=datalab-to/surya-ocr-2.5-gguf   # or another supported id
make yaws1999-modal-deploy
YAWS_OCR_BACKEND=modal make yaws1999-parse TABLE=1-1
```

Local backend ignores Modal tokens and uses the image’s `llama-server`:

```bash
YAWS_OCR_BACKEND=local make yaws1999-parse TABLE=1-1
```

## Notes

- First call after idle: cold T4 + container enter (starts `llama-server` / loads GGUF). Later pages on a warm worker are inference-only.  
- **GPU path:** `YAWS_MODAL_GPU` (e.g. T4) + CUDA `llama-server` + forced `llamacpp` (not vLLM).  
- **Quant:** default `YAWS_OCR_QUANT=bf16` (quality). Use `q8` for faster/cheaper T4 runs; or a stronger GPU (`A10G`, …) if bf16 feels slow.  
- Spec overview: [YAWS1999_PARSER_SPEC.md](YAWS1999_PARSER_SPEC.md)
