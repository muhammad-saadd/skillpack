---
name: infra-gen
version: 1.0.0
description: Generate Kubernetes manifests, CI/CD pipelines, nginx/Apache configs, and Terraform templates from plain English
inputs: [yaml, docker-compose, text]
outputs: [yaml, hcl, conf]
tools: [bash, read_file, write_file, pdftotext, jq, awk, sed]
---

## What this skill does
Generates Kubernetes manifests from docker-compose files, creates CI/CD pipeline YAML for GitHub Actions, GitLab CI, CircleCI, and Bitbucket, produces nginx/Apache reverse proxy configurations, and builds Terraform/OpenTofu templates from natural language infrastructure descriptions.

## Trigger phrases
- generate kubernetes manifests
- convert docker-compose to kubernetes
- create CI/CD pipeline
- GitHub Actions workflow
- GitLab CI config
- nginx reverse proxy config
- Apache config
- generate Terraform
- create k8s deployment
- infrastructure as code
- container orchestration
- deploy pipeline
- kubernetes yaml
- terraform aws

## Usage
```bash
skillpack infra-gen k8s docker-compose.yml --namespace production --out k8s/
skillpack infra-gen ci . --provider github-actions --deploy "push to main triggers deploy"
skillpack infra-gen nginx "proxy /api to localhost:3000, serve /static from /var/www"
skillpack infra-gen terraform "AWS: VPC + ECS cluster + RDS postgres + S3 bucket"
skillpack infra-gen ci . --provider gitlab --stages "test,build,deploy"
```

## Steps
1. Parse subcommand (k8s, ci, nginx, apache, terraform)
2. For k8s: parse docker-compose.yml, convert services to deployments/services/configmaps
3. For ci: generate pipeline YAML based on provider and requirements
4. For nginx/apache: parse natural language config description, generate config file
5. For terraform: parse infrastructure requirements, generate HCL templates
6. Write output to --out directory or stdout

## Output
Infrastructure configuration files in YAML (k8s, CI/CD), HCL (Terraform), or conf (nginx/Apache) format.
