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
                sh 'ls -la'  // verify: phải thấy frontend/ backend/ ở đây
            }
        }

        stage('Install & Build') {
        steps {
        // Chạy cho Frontend
            sh 'ls -la'   // verify sau checkout
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
        stage('SonarQube Scan') {
            environment {
                SONAR_SCANNER_HOME = tool 'sonarqube'
            }
            steps {
                withSonarQubeEnv(installationName: 'Sonarqube') {
                    sh """
                        ${SONAR_SCANNER_HOME}/bin/sonar-scanner \
                            -Dsonar.projectKey=gymflex \
                            -Dsonar.projectName=gymflex \
                            -Dsonar.sources=frontend/src,backend/src \
                            -Dsonar.exclusions=**/node_modules/**,**/build/**,**/dist/**
                    """
                }
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage('Build Images') {
            steps { 
                dir('backend') {
                    sh "docker build -t $FULL_BACKEND_IMAGE ."
                }
                dir('frontend') {
                    sh "docker build -t $FULL_FRONTEND_IMAGE ."
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
        }
    
}