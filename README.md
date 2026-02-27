## CI/CD Pipeline for Deploying an Application to Amazon EKS

This project demonstrates how to build and deploy a fullstack application (Frontend + Backend) to Amazon EKS using a CI/CD pipeline.

---

## 🏗️ Architecture Overview

User → Ingress → Frontend (Nginx) → Backend (Node.js) → MongoDB Atlas  
CI/CD → Build Docker Image → Push to Docker Hub → Deploy to EKS

---

## 🛠️ Tech Stack

- Backend: Node.js (Express)
- Frontend: React
- Containerization: Docker
- Orchestration: Kubernetes
- Cloud: Amazon EKS
- CI/CD: Jenkins
- Container Registry: Docker Hub
- Database: MongoDB Atlas

---


## 📦 Project Structure
---
Install Jenkins server

https://www.digitalocean.com/community/tutorials/how-to-install-jenkins-on-ubuntu-22-04

Step 1: Update Your System
Before installing new software, it's always best practice to update your local package index.

```sudo apt update && sudo apt upgrade -y```


Step 2: Install Java
Jenkins requires Java to run. OpenJDK 17 is the recommended version for the latest Jenkins releases.

```apt install fontconfig openjdk-17-jre -y```

Step 3: Add the Jenkins Repository
Because the version of Jenkins in the default Ubuntu repositories is often behind the latest stable release, it's best to use the official Jenkins repository.

First, download and add the GPG key to verify the integrity of the packages:

```sudo mkdir -p /etc/apt/keyrings```
```sudo wget -O /etc/apt/keyrings/jenkins-keyring.asc https://pkg.jenkins.io/debian-stable/jenkins.io-2026.key```

```echo "deb [signed-by=/etc/apt/keyrings/jenkins-keyring.asc]" https://pkg.jenkins.io/debian-stable binary/ | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null```


```sudo apt update```
```sudo apt install jenkins```

```sudo systemctl start jenkins```
```sudo systemctl status jenkins```

You can access the dashboard at: http://your_server_ip:8080


Select the Install suggested plugins option, which will immediately begin the installation process.








