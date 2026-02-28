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
        stage('Deploy to Kubernetes') {
            steps {
                sh '''
                kubectl get nodes
                #kubectl set image deployment/gymflex-backend gymflex-backend=$FULL_BACKEND_IMAGE --namespace=default
                #kubectl set image deployment/gymflex-frontend gymflex-frontend=$FULL_FRONTEND_IMAGE --namespace=default
                '''
            }
        }
         stage('Cleanup') {
            steps {
                sh '''
                docker rmi $FULL_BACKEND_IMAGE || true
                docker rmi $FULL_FRONTEND_IMAGE || true
                docker builder prune -af
                '''
            }
        }
    }
}