pipeline {
    agent {label "jenkins-agent"}

    environment {
        PROJECT_NAME = 'gymflex'

    }

    stages {
        stage('Prepare') {
            steps {
                script {
                    env.TAG = env.GIT_COMMIT.take(6)
                }
            }
        }
        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-account',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh '''
                    echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
                    '''
                }
                sh '''
                echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
                '''
            }
        }
        stage('Build') {
            steps { 
                dir('backend') {
                    sh 'docker build -t $DOCKER_USERNAME/$PROJECT_NAME-backend:$TAG .'
                }
                dir('frontend') {
                    sh 'docker build -t $DOCKER_USERNAME/$PROJECT_NAME-frontend:$TAG .'
                }
            }
        }
        stage('Docker Push') {
            steps {
                sh 'docker push $DOCKER_USERNAME/$PROJECT_NAME-backend:$TAG'
                sh 'docker push $DOCKER_USERNAME/$PROJECT_NAME-frontend:$TAG'
            }
        }
         stage('Cleanup') {
            steps {
                sh '''
                docker rmi $DOCKER_USERNAME/$PROJECT_NAME-backend:$TAG || true
                docker rmi $DOCKER_USERNAME/$PROJECT_NAME-frontend:$TAG || true
                docker builder prune -af
                '''

                ///
                
                ///
            }
        }
    }
}