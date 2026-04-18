pipeline {
    agent { label "jenkins-agent" }

    environment {
        BACKEND_IMAGE = "noseyug/gymflex-backend"
        FRONTEND_IMAGE = "noseyug/gymflex-frontend"
        IMAGE_TAG = "v${BUILD_ID}"
        FULL_BACKEND_IMAGE = "${BACKEND_IMAGE}:${IMAGE_TAG}"
        FULL_FRONTEND_IMAGE = "${FRONTEND_IMAGE}:${IMAGE_TAG}"
        DOCKER_CREDENTIALS_ID = 'docker-account'
    }

    stages {
        stage('Cleanup') {
            steps {
                cleanWs()
            }
        }
        
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Build') {
            tools {
                nodejs 'node-18'
            }
            steps {
                dir('frontend') {
                    echo "Building Frontend..."
                    sh 'npm ci'
                    sh 'CI=false npm run build'
                }
                dir('backend') {
                    echo "Installing Backend Dependencies..."
                    sh 'npm ci'
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonarqube'
                    withSonarQubeEnv('sonarqube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }

        stage('Build Images') {
            steps {
                echo "Building Backend..."
                sh "docker build --no-cache -t $FULL_BACKEND_IMAGE ./backend"
                echo "Building Frontend..."
                sh "docker build --no-cache -t $FULL_FRONTEND_IMAGE ./frontend"
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    echo "========== Scanning Backend Image =========="
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v $HOME/.cache/trivy:/root/.cache/trivy \
                        aquasec/trivy:latest image \
                        --exit-code 1 \
                        --severity CRITICAL \
                        --ignore-unfixed \
                        --format table \
                        $FULL_BACKEND_IMAGE

                    echo "========== Scanning Frontend Image =========="
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v $HOME/.cache/trivy:/root/.cache/trivy \
                        aquasec/trivy:latest image \
                        --exit-code 1 \
                        --severity CRITICAL \
                        --ignore-unfixed \
                        --format table \
                        $FULL_FRONTEND_IMAGE
                '''
            }
            post {
                failure { echo "HAVE CRITICAL ERROR, STOP PIPELINE" }
                success { echo "NO HAVE CRITICAL ERROR, CONTINUE PIPELINE" }
            }
        }

        stage('Push Images') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS_ID}",
                    usernameVariable: 'USER',
                    passwordVariable: 'PASSWD'
                )]) {
                    sh '''
                    echo $PASSWD | docker login -u $USER --password-stdin
                    docker push $FULL_BACKEND_IMAGE
                    docker push $FULL_FRONTEND_IMAGE
                    docker rmi -f $(docker images -aq) 2>/dev/null || true
                    docker builder prune -af
                    '''
                }
            }
        }

        stage('Update Manifests') {
            steps {  
                // Clone repo manifests
                sh "git clone https://github.com/NT548-Group11/Manifests.git manifests"
        
                dir('manifests') {
                    script {
                        sh """
                        echo "Updating Kubernetes Manifests..."
                        sed -i "s|image: noseyug/gymflex-backend:.*|image: ${FULL_BACKEND_IMAGE}|g" apps/backend.yaml
                        sed -i "s|image: noseyug/gymflex-frontend:.*|image: ${FULL_FRONTEND_IMAGE}|g" apps/frontend.yaml
                        """

                    // 2. Push lên GitHub sử dụng Credentials
                    withCredentials([usernamePassword(credentialsId: 'github-id', passwordVariable: 'GIT_PASS', usernameVariable: 'GIT_USER')]) {
                        sh """

                            git config user.name "jenkins"
                             config user.email "jenkins@gmail.com"
                            git add apps/backend.yaml apps/frontend.yaml
                        
                            if ! git diff-index --quiet HEAD; then
                                git commit -m "Update image tags to ${IMAGE_TAG}"
                                git push https://${GIT_USER}:${GIT_PASS}@github.com/NT548-Group11/Manifests.git HEAD:main
                            else
                                echo "No changes detected, skipping push."
                            fi
                        """
                        }
                    }
                }
            }
        }
    }
}