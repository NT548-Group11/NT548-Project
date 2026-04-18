pipeline {
    agent {label "jenkins-agent"}

    environment {
    BACKEND_IMAGE = "noseyug/gymflex-backend"
    FRONTEND_IMAGE = "noseyug/gymflex-frontend"

    IMAGE_TAG = "v${BUILD_ID}"

    FULL_BACKEND_IMAGE = "${BACKEND_IMAGE}:${IMAGE_TAG}"
    FULL_FRONTEND_IMAGE = "${FRONTEND_IMAGE}:${IMAGE_TAG}"

    DOCKER_CREDENTIALS_ID = 'docker-account'
    }

    tools {
        nodejs 'node-18'
        //add tool
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
                //sh 'ls -la'  // verify: phải thấy frontend/ backend/ ở đây
            }
        }

        stage('Install & Build') {
            steps {
            // Chạy cho Frontend
                //sh 'ls -la'   // verify sau checkout
                dir('frontend') {
                    echo "Building Frontend..."
                    sh 'npm ci'
                    sh 'CI=false npm run build'
                    //sh 'npm run build'
                    }
            // Chạy cho Backend
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
                // Build Backend
                echo "Building Backend..."
                sh "docker build --no-cache -t $FULL_BACKEND_IMAGE ./backend"

                // Build Frontend
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
                failure {
                    echo "HAVE CRITICAL ERROR, STOP PIPELINE"
                }
                success {
                    echo "NO HAVE CRITICAL ERROR, CONTINUE PIPELINE"
                }
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
                    docker rmi -f $(docker images -aq) 2>/dev/null || true # Remove all images
                    docker builder prune -af
                    '''
                }
            }
        }
        // stage('Deploy') {
        //     steps {
        //         sh '''
        //         kubectl set image deployment/gymflex-backend-deployment \
        //         gymflex-backend=$FULL_BACKEND_IMAGE -n gymflex

        //         kubectl set image deployment/gymflex-frontend-deployment \
        //         gymflex-frontend=$FULL_FRONTEND_IMAGE -n gymflex

        //         kubectl rollout status deployment/gymflex-backend-deployment -n gymflex
        //         kubectl rollout status deployment/gymflex-frontend-deployment -n gymflex
        //         '''
        //     }
        // }
        stage('Update Manifests') {
            steps {
                dir('k8s/apps') {
                    echo "Updating Kubernetes Manifests..."
                    sed -i 's|image: hmdat1706/nt548-backend:.*|image: $FULL_BACKEND_IMAGE|g' backend.yaml
                    sed -i 's|image: hmdat1706/nt548-frontend:.*|image: $FULL_FRONTEND_IMAGE|g' frontend.yaml
                }
                sh '''
                # Commit và push changes
                git config user.name "jenkins"
                git config user.email "jenkins@gmail.com"
                git add k8s/apps/backend.yaml k8s/apps/frontend.yaml
                git commit -m "Update image tags to $IMAGE_TAG"
                git push origin HEAD:main
                '''
            }
        }
    }

}
