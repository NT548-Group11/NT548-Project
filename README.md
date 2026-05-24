# GymFlex — NT548 Project

Monorepo for the GymFlex application [NT548 course project].

- Backend: Node.js + Express API 
- Frontend: React + Redux
- Containerization: Docker
- Orchestration: Kubernetes (k3s)
- CI/CD: Jenkins pipeline with SonarQube and Trivy
- GitOps: ArgoCD 
- Infrastructure: Terraform 

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
├── backend/               # Node.js API (Express)
├── frontend/              # React app 
├── k8s/
│   ├── apps/              # Manifests: backend.yaml, frontend.yaml, mongodb.yaml
│   └── infra/             # Manifests: Prometheus, Mimir, MongoDB PVC
├── argocd/                # ArgoCD application manifests (app, nodeport, prometheus, grafana)
├── terraform/             # IaC AWS: VPC + EC2 modules
├── Jenkinsfile            # Main pipeline 
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
## Quick Start local 

**Frontend:**

```bash
cd frontend
npm ci
npm start           
```

**Backend:**

```bash
cd backend
npm ci
# Copy example env (Unix)
cp .env.example .env
# Windows PowerShell
copy .env.example .env
npm run dev          # nodemon src/server.js (default port 4000)
```

## Environment variables

Copy `.env.example` to `.env` and fill values:

```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/<db>
PORT=4000
JWT_SECRET=your_jwt_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
NODE_ENV=development
```

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

Hạ tầng được dựng trên AWS bằng Terraform, gồm 1 mạng VPC và 4 máy chủ EC2:

**Mạng (module `vpc`):**

- 1 VPC
- 1 Public Subnet
- 1 Internet Gateway (IGW)
- 1 Route Table định tuyến ra Internet

**Máy chủ (module `ec2`, dùng chung cho cả 4 instance):**

| Instance        | Vai trò                                        |
|-----------------|------------------------------------------------|
| `jenkins-server`| Jenkins master — điều phối pipeline CI/CD        |
| `jenkins-agent` | Jenkins agent — build, test, build/push Docker  |
| `sonarqube`     | Server SonarQube cho phân tích chất lượng code  |
| `k3s`           | Cluster Kubernetes (k3s) để deploy ứng dụng     |

Mỗi instance được gán private IP cố định, security group mở các cổng riêng (`*_ingress_ports`) và dung lượng ổ đĩa riêng (`*_volume_size`) qua biến trong `terraform.tfvars`.

```
terraform/
├── main.tf            # Root module: 1 module vpc + 4 module ec2
├── variables.tf
├── outputs.tf
├── terraform.tfvars   # Fill values before running
└── modules/
    ├── vpc/           # Tạo VPC, subnet, IGW, route table
    └── ec2/           # Tạo EC2 instance (tái dùng cho 4 server)
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

