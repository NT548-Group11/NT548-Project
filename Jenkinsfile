pipeline {
    agent {label "jenkins-agent"}

    variables {
        username = credentials('DOCKER_USERNAME')
        password = credentials('DOCKER_PASSWORD')

    }

    stages {
        stage('Docker Login') {
            steps {
                sh 'docker login -u $username -p $password'
            }
        }
        stage('Build') {
            steps {
                def tag = env.GIT_COMMIT.take(6)   
                sh 'cd backend; docker build -t noseyug/gymflex-be:${tag} .'
                sh 'cd ../frontend; docker build -t noseyug/gymflex-fe:${tag} .'
            }
        }
                stage('Docker Push') {
            steps {
                sh 'docker push noseyug/gymflex-be:${tag}'
                sh 'docker push noseyug/gymflex-fe:${tag}'
            }
        }

        // stage('Test') {
        //     steps {
        //         echo 'Testing..'
        //     }
        // }
        // stage('Deploy') {
        //     steps {
        //         echo 'Deploying....'
        //     }
        // }
    }
}