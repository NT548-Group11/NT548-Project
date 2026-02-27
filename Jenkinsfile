pipeline {
    agent {label "jenkins-agent"}

    stages {
        stage('Build') {
            steps {
                sh 'whoami'
                sh 'cd backend; docker build -t noseyug/gymflex-be:v0 .; cd ../frontend; docker build -t noseyug/gymflex-fe:v0 .; '
                sh 'docker image ls'
                
                
                ///
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