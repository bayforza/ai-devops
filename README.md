# DevOps agent demo kiti (MacBook)

## Gereksinimler
OrbStack (veya Docker Desktop), kind, kubectl, helm, curl:
    brew install orbstack kind kubectl helm k9s argocd trivy

## Kullanim
    make up                 # cluster + Prometheus/Grafana + Kyverno + Argo CD + tenant-a
    make up TENANTS="a b"   # iki demo musteri (>=32 GB RAM onerilir)
    make status | make grafana | make frontend T=a
    make down               # her seyi sil

## Hata senaryolari (T=a|b)
    make fault-oom      # cartservice OOMKill
    make fault-image    # frontend ImagePullBackOff
    make fault-config   # checkout -> yanlis payment adresi
    make fault-cpu      # recommendationservice CPU kisitlama
    make reset          # manifesti yeniden uygular, hepsini duzeltir

## Agent (Cursor SDK)

Yerel Node agent: [`agent-ts/`](./agent-ts/) — `@cursor/sdk`, salt okunur `kubectl_read` + opsiyonel `prom_query`.

    cd agent-ts && npm i
    export CURSOR_API_KEY=...          # Dashboard → API Keys
    make fault-oom T=a && sleep 60     # kök dizinden
    cd agent-ts && npm start

Müşteri demosunda dosya okumayı da kapatmak için `AGENT_STRICT_TOOLS=1 npm start`.
Ayrıntılar: [`agent-ts/README.md`](./agent-ts/README.md).

# ai-devops
