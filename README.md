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

## Agent (bu kitte YOK, ayri adim)
HolmesGPT/K8sGPT'yi kurup kubeconfig'e (context: kind-devops-demo) salt okunur
yetkiyle baglayin. Kurulum adimlari icin projenin guncel dokumanina bakin.
# ai-devops
