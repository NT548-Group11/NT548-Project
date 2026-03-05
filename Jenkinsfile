pipeline {
    agent {label "jenkins-agent"}

    environment {
    BACKEND_IMAGE = "noseyug/gymflex-backend"
    FRONTEND_IMAGE = "noseyug/gymflex-frontend"

    IMAGE_TAG = "v${BUILD_ID}"

    FULL_BACKEND_IMAGE = "${BACKEND_IMAGE}:${IMAGE_TAG}"
    FULL_FRONTEND_IMAGE = "${FRONTEND_IMAGE}:${IMAGE_TAG}"

    GIT_CREDENTIALS_ID = 'docker-account'
    }
    
    stages {
        stage('Cleanup') {
            steps {
                sh '''
                docker rmi -f $(docker images -aq) 2>/dev/null || true
                docker builder prune -af
                '''
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
                    credentialsId: "${GIT_CREDENTIALS_ID}",
                    usernameVariable: 'USER',
                    passwordVariable: 'PASSWD'
                )]) {
                    sh '''
                    echo $PASSWD | docker login -u $USER --password-stdin
                    docker push $FULL_BACKEND_IMAGE
                    docker push $FULL_FRONTEND_IMAGE
                    '''
                }
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                kubectl set image deployment/gymflex-backend-deployment \
                gymflex-backend=$FULL_BACKEND_IMAGE -n gymflex

                kubectl set image deployment/gymflex-frontend-deployment \
                gymflex-frontend=$FULL_FRONTEND_IMAGE -n gymflex

                kubectl rollout status deployment/gymflex-backend-deployment -n gymflex
                kubectl rollout status deployment/gymflex-frontend-deployment -n gymflex
                '''
            }
        }
        stage('Deploy') {
            steps {
                sh '''
                kubectl set image deployment/gymflex-backend-deployment \
                gymflex-backend=$FULL_BACKEND_IMAGE -n gymflex

                kubectl set image deployment/gymflex-frontend-deployment \
                gymflex-frontend=$FULL_FRONTEND_IMAGE -n gymflex

                kubectl rollout status deployment/gymflex-backend-deployment -n gymflex
                kubectl rollout status deployment/gymflex-frontend-deployment -n gymflex
                '''
            }
        }
    }
}