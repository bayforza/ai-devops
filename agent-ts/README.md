# Cursor SDK SRE agent (yerel)

`@cursor/sdk` ile Cursor agent döngüsünü Node sürecinde çalıştırır; model çağrıları Cursor'a gider ve kullanıcı API anahtarı planına faturalanır.

## Gereksinimler

- Node **22.13+** (`node -v`)
- `CURSOR_API_KEY` (Dashboard → API Keys)
- Demo cluster: kök dizinde `make up`, context `kind-devops-demo`
- `kubectl` PATH'te

## Kurulum

```bash
cd agent-ts
npm i
export CURSOR_API_KEY=...   # interaktif: read -s -p "Cursor key: " CURSOR_API_KEY; export CURSOR_API_KEY; echo
```

## Çalıştırma

```bash
# kök dizinden fault enjekte et, sonra agent
make fault-oom T=a && sleep 60
cd agent-ts && npm start
```

Ortam değişkenleri:

| Değişken | Varsayılan | Açıklama |
| --- | --- | --- |
| `CURSOR_API_KEY` | (zorunlu) | Cursor API anahtarı |
| `CURSOR_MODEL` | `composer-2.5` | `Cursor.models.list()` ile doğrula |
| `TENANT_NS` | `tenant-a` | Teşhis namespace'i |
| `KUBE_CONTEXT` | `kind-devops-demo` | kubectl context |
| `PROM_URL` | — | Prometheus base URL (opsiyonel) |
| `AGENT_STRICT_TOOLS=1` | kapalı | Yalnızca custom araçlar (`tools: ["mcp"]`); read/grep kapalı |

## Mimari

- **Agent wiring:** `agent.ts` — Cursor SDK, model, tool kısıtları
- **Araçlar:** `tools/kubectl_read.ts`, `tools/prom_query.ts` — runtime'dan bağımsız fonksiyonlar
- **Skill:** `skills/*.md` — prompt'a gömülen Markdown; başka SDK'ya taşınabilir

İleride Claude Agent SDK veya doğrudan model API'ye geçerken aynı `tools/` + `skills/` birkaç saatlik iş olur.

## Güvenlik notları

1. Yerel özel araçlar onaysız çalışır; sınır `kubectl_read` izin listesidir (secret engelli).
2. Demo modunda `disallowedTools: shell/edit/write/delete` — yerleşik `read`/`grep` açık kalabilir (kubeconfig okunabilir). Müşteri demosu: `AGENT_STRICT_TOOLS=1`.
3. Telemetri / prompt içeriği Cursor modellerine gider.
4. Kişisel anahtar plan kotasına yazılır; ticari kullanım için Cursor şartlarına bakın.

## Test

```bash
npm test          # allowlist birim testleri
npm run typecheck
```
