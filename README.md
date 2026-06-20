# GymFlex DevOps Platform

<p align="center">
  <img src="https://img.shields.io/badge/Project-NT548-blue.svg" alt="NT548 Project" />
  <img src="https://img.shields.io/badge/CI%2FCD-Jenkins%20%7C%20SonarQube%20%7C%20Trivy-f59e0b.svg" alt="CI/CD" />
  <img src="https://img.shields.io/badge/GitOps-ArgoCD-326ce5.svg" alt="GitOps" />
  <img src="https://img.shields.io/badge/Orchestration-Kubernetes%20%7C%20k3s-4f46e5.svg" alt="Kubernetes" />
  <img src="https://img.shields.io/badge/IaC-Terraform-7b42bc.svg" alt="Infrastructure as Code" />
</p>

GymFlex is a DevOps-focused project that demonstrates how to build, secure, package, deploy, and manage a full-stack application using modern delivery practices. The repository combines application code with CI/CD automation, containerization, Kubernetes deployment, GitOps workflows, observability components, and Terraform-based AWS infrastructure.

## Architecture

![Architecture](https://github.com/user-attachments/assets/817fbba2-55db-44ff-bfd3-1a5ec2d85316)

```text
Source Code -> Jenkins -> SonarQube -> Trivy -> Docker Hub -> ArgoCD -> Kubernetes (k3s)
User -> Ingress -> Frontend (Nginx) -> Backend API -> MongoDB
```

## DevOps Focus

- Automated build and test pipeline with Jenkins
- Static analysis and quality gate with SonarQube
- Container vulnerability scanning with Trivy
- Docker image build and publish workflow
- Kubernetes deployment on k3s
- GitOps deployment through ArgoCD
- Infrastructure provisioning with Terraform on AWS

## Platform Components

- Frontend: React + Redux
- Backend: Node.js + Express + Mongoose
- Database: MongoDB / MongoDB Atlas
- Deployment: Docker, Kubernetes, ArgoCD
- CI/CD: Jenkins, SonarQube, Trivy
- Infrastructure: Terraform on AWS

## Repository Structure

```text
NT548/
├── backend/              # Express API and business logic
├── frontend/             # React client
├── k8s/                  # Kubernetes manifests
├── argocd/               # ArgoCD application manifests
├── terraform/            # AWS infrastructure as code
├── Jenkinsfile           # CI/CD pipeline
└── sonar-project.properties
```

## CI/CD Pipeline

The `Jenkinsfile` implements the following stages:

1. Clean workspace and checkout source
2. Install dependencies
3. Build frontend
4. Run frontend and backend tests with coverage
5. Run SonarQube analysis
6. Enforce quality gate
7. Build Docker images
8. Scan images with Trivy
9. Push images to Docker Hub
10. Request manual approval before deployment
11. Update GitOps manifests repository
12. Push updated manifests

## Kubernetes Deployment

The Kubernetes manifests are organized under `k8s/`:

- `k8s/apps/` for application workloads
- `k8s/infra/` for supporting infrastructure resources

Deployment details:

- Frontend container runs on port `80`
- Backend container runs on port `4000`
- Backend Service exposes port `5000` inside the cluster and targets `4000`
- Frontend is exposed through an Ingress

## GitOps

ArgoCD manages deployment from the GitOps manifests repository:

- [`NT548-Group11/Manifests`](https://github.com/NT548-Group11/Manifests.git)

## Infrastructure as Code

Terraform provisions the AWS infrastructure used by the platform, including:

- VPC networking
- Jenkins server
- Jenkins agent
- SonarQube server
- k3s host

## Quality and Security

- SonarQube is configured in `sonar-project.properties`
- Coverage reports are collected from both frontend and backend
- Trivy scans container images for high and critical vulnerabilities
- The pipeline includes a manual approval step before deployment

## Local Run

### Frontend

```bash
cd frontend
npm ci
npm start
```

### Backend

```bash
cd backend
npm ci
copy ..\.env.example .env
npm run dev
```

Local ports:

- Frontend: `3000`
- Backend: `4000`

## Backend API

The backend exposes routes for:

- `/api/user`
- `/api/product`
- `/api/blog`
- `/api/categories`
- `/api/exercise`
- `/api/order`
- `/api/cart`
- `/api/coupon`
- `/api/address`
- `/api/reviews`

## Project Value

- End-to-end delivery from code commit to Kubernetes deployment
- CI/CD, quality gates, security scanning, and GitOps
- Infrastructure automation with Terraform
- A realistic multi-service application used to validate the platform
