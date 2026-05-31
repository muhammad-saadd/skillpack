# infra-gen

Generate Kubernetes manifests, CI/CD pipelines, nginx/Apache configs, and Terraform templates from plain English.

## What it replaces

The old way: Google "docker-compose to kubernetes" → read 47 Stack Overflow answers → copy-paste YAML → spend 3 hours debugging indentation → finally get it working → realize you need 3 more manifests. Or: manually write GitHub Actions workflow → forget a step → debug in production.

**skillpack replaces all of that with one command.**

## Installation

```bash
# via curl (auto-installs dependencies)
curl -fsSL https://raw.githubusercontent.com/muhammad-saadd/skillpack/main/install.sh | bash

# or clone directly
git clone https://github.com/muhammad-saadd/skillpack ~/.local/share/skillpack
ln -s ~/.local/share/skillpack/bin/skillpack ~/.local/bin/skillpack
```

## Usage Examples

### Convert docker-compose to Kubernetes
```bash
skillpack infra-gen k8s docker-compose.yml --namespace production --out k8s/
```

**Output:**
```yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: production
  labels:
    app: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: node:18-alpine
          ports:
            - containerPort: 3000
```

### Generate GitHub Actions CI/CD
```bash
skillpack infra-gen ci . --provider github-actions --deploy "push to main triggers deploy"
```

### Generate nginx reverse proxy config
```bash
skillpack infra-gen nginx "proxy /api to localhost:3000, serve /static from /var/www"
```

**Output:**
```nginx
server {
    listen 80;
    server_name _;

    location /api {
        proxy_pass localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static {
        root /var/www;
        try_files $uri $uri/ =404;
    }
}
```

### Generate Terraform infrastructure
```bash
skillpack infra-gen terraform "AWS: VPC + ECS cluster + RDS postgres + S3 bucket"
```

### Generate GitLab CI pipeline
```bash
skillpack infra-gen ci . --provider gitlab --stages "test,build,deploy"
```

## Supported Providers

| Provider | Output File |
|----------|------------|
| GitHub Actions | `.github/workflows/ci.yml` |
| GitLab CI | `.gitlab-ci.yml` |
| CircleCI | `.circleci/config.yml` |
| Bitbucket | `bitbucket-pipelines.yml` |

## Why this beats the old way

- **No more YAML headaches** — describe what you want in plain English
- **Multi-provider** — switch between CI providers with one flag
- **Kubernetes from compose** — instant migration from docker-compose
- **Terraform templates** — best-practice infrastructure from a sentence
- **Production-ready** — includes proper labels, annotations, and security headers
