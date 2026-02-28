pipeline {
    agent {label "jenkins-agent"}

    environment {
        DOCKER_USERNAME = credentials('DOCKER_USERNAME')
        DOCKER_PASSWORD = credentials('DOCKER_PASSWORD')
        PROJECT_NAME = 'gymflex'
        TAG = "${env.GIT_COMMIT.take(6)}"
    }

    stages {
        stage('Docker Login') {
            steps {
                sh '''
                echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
                '''
            }
        }
        stage('Build') {
            steps { 
                sh 'cd backend; docker build -t $DOCKER_USERNAME/$PROJECT_NAME-be:$TAG .'
                sh 'cd ../frontend; docker build -t $DOCKER_USERNAME/$PROJECT_NAME-fe:$TAG .'
            }
        }
        stage('Docker Push') {
            steps {
                sh 'docker push $DOCKER_USERNAME/$PROJECT_NAME-be:$TAG'
                sh 'docker push $DOCKER_USERNAME/$PROJECT_NAME-fe:$TAG'
            }
        }
    }
}