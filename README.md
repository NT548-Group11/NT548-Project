# GymFlex — NT548 Project

Monorepo for the GymFlex application (NT548 course project).

- Backend: Node.js + Express API (connects to MongoDB Atlas)
- Frontend: React (Create React App) + Redux
- Containerization: Docker
- Orchestration: Kubernetes (k3s)
- CI/CD: Jenkins pipeline with SonarQube and Trivy
- GitOps: ArgoCD (tracks a separate Manifests repository)
- Infrastructure: Terraform (VPC + EC2 modules on AWS)

---

## Architecture

```
User → Ingress → Frontend (Nginx, port 80) → Backend (Node.js, port 5000) → MongoDB Atlas
CI/CD: Jenkins → SonarQube → Trivy → Docker Hub → ArgoCD → k3s
```

---

## Repository layout

```
NT548-Project/
├── backend/               # Node.js API (Express), entry: src/server.js
├── frontend/              # React app (Create React App)
├── k8s/
│   ├── apps/              # Manifests: backend.yaml, frontend.yaml, mongodb.yaml
│   └── infra/             # Manifests: Prometheus, Mimir, MongoDB PVC
├── argocd/                # ArgoCD application manifests (app, nodeport, prometheus, grafana)
├── terraform/             # IaC AWS: VPC + EC2 modules
├── docker-compose.yaml    # Local compose file (optional)
├── Jenkinsfile            # Main pipeline (approval + email + Trivy .trivyignore)
├── Jenkinsfile2           # Secondary pipeline (no approval, CRITICAL-only Trivy)
├── sonar-project.properties
└── .trivyignore
```

---

## Prerequisites

- Node.js v18
- npm
- Docker
- kubectl
- Access to a Kubernetes cluster (k3s) for real deployments
- Jenkins with credentials: `docker-account`, `github-id`
- SonarQube server (tool name: `sonarqube`)

---

## Local development

**Frontend:**

```bash
cd frontend
npm ci
npm start            # development server at http://localhost:3000
```

**Backend:**

```bash
cd backend
npm ci
npm run dev          # nodemon src/server.js (default port 4000)
```

Create a `.env` file in the project root (or `backend/`) with:

```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>
```

---

## Test & Coverage

**Backend:**

```bash
cd backend
npm test
npm run test:coverage   # generates lcov report at backend/coverage/lcov.info
```

**Frontend:**

```bash
cd frontend
npm test
npm run test:coverage   # generates lcov report at frontend/coverage/lcov.info
```

---

## Build & Push Docker images

```bash
docker build -t noseyug/gymflex-backend:<tag> ./backend
docker build -t noseyug/gymflex-frontend:<tag> ./frontend
docker push noseyug/gymflex-backend:<tag>
docker push noseyug/gymflex-frontend:<tag>
```

---

## Kubernetes

Apply the manifests to your cluster (choose namespace/context as appropriate):

```bash
kubectl apply -f k8s/apps/backend.yaml
kubectl apply -f k8s/apps/frontend.yaml
kubectl apply -f k8s/apps/mongodb.yaml
```

Infra manifests (Prometheus, Mimir, PVC):

```bash
kubectl apply -f k8s/infra/
```

---

## CI/CD — Jenkins

The `Jenkinsfile` implements the pipeline stages:

- Cleanup: clear workspace
- Checkout: clone source
- Install & Build: `npm ci` for frontend/backend and `npm run build` for frontend
- SonarQube Analysis: run tests/coverage and `sonar-scanner`
- Quality Gate: wait for SonarQube quality gate
- Build Images: `docker build` backend + frontend
- Trivy Scan: scan for CRITICAL and HIGH (uses `.trivyignore`)
- Push Images: push to Docker registry
- Approval Before Deploy: manual approval step via Jenkins input
- Update Manifests Repo: update image tags in Manifests repo and push

`Jenkinsfile2` is a secondary pipeline with no approval and CRITICAL-only Trivy scanning.

Pipeline environment variables used in `Jenkinsfile` include:

- `BACKEND_IMAGE` / `FRONTEND_IMAGE` — base image names
- `IMAGE_TAG` — tag generated from the Jenkins build id
- `DOCKER_CREDENTIALS_ID`, `GITHUB_CREDENTIALS_ID`, `APPROVER_EMAIL`, `APPROVER_USER`, `MANIFESTS_REPO`

---

## SonarQube

Configuration in `sonar-project.properties`:

- Project key/name: `gym_flex`
- Sources: `frontend/src`, `backend/src`
- Coverage reports: `frontend/coverage/lcov.info`, `backend/coverage/lcov.info`

---

## Infrastructure (Terraform)

```
terraform/
├── main.tf            # Root module: calls vpc + ec2 modules
├── variables.tf
├── outputs.tf
├── terraform.tfvars   # Fill values before running
└── modules/
    ├── vpc/           # Creates VPC, subnets, IGW, route tables
    └── ec2/           # Creates EC2 instances (Jenkins agent, etc.)
```

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

---

## ArgoCD

Manifests in `argocd/`:

- `argocd-app.yaml` — ArgoCD Application that tracks `NT548-Group11/Manifests`
- `argocd-nodeport.yaml` — Expose ArgoCD server via NodePort
- `argocd-prometheus.yaml` — ArgoCD Application for Prometheus
- `argocd-grafana.yaml` — ArgoCD Application for Grafana

---

## Contributing

1. Fork the repository and create a feature branch.
2. Run tests locally and ensure changes are working.
3. Open a pull request describing your change.

## License

If a `LICENSE` file is not present, please check with the maintainers.

---

This README is a concise guide to get you started — edit or extend it for project-specific needs.
