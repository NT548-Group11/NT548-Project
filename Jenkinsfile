pipeline {
    agent { label "jenkins-agent" }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    environment {
        BACKEND_IMAGE = "noseyug/gymflex-backend"
        FRONTEND_IMAGE = "noseyug/gymflex-frontend"
        IMAGE_TAG = "v${BUILD_ID}"
        FULL_BACKEND_IMAGE = "${BACKEND_IMAGE}:${IMAGE_TAG}"
        FULL_FRONTEND_IMAGE = "${FRONTEND_IMAGE}:${IMAGE_TAG}"
        DOCKER_CREDENTIALS_ID = 'docker-account'
        GITHUB_CREDENTIALS_ID = 'github-id'
        APPROVER_EMAIL = '23521404@gm.uit.edu.vn'   
        APPROVER_USER  = 'tanpm'    
        MANIFESTS_REPO = 'github.com/NT548-Group11/Manifests.git'
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
            tools {
                nodejs 'node-18'
            }
            steps {
                dir('frontend'){
                    sh 'CI=true npm run test:coverage || true'
                }
                dir('backend'){
                    sh 'CI=true npm run test:coverage || true'           
                }
                script {
                    def scannerHome = tool 'sonarqube'
                    withSonarQubeEnv('sonarqube') {
                        sh "${scannerHome}/bin/sonar-scanner"
                    }
                }
            }
        }
    }

    stage('Quality Gate') {   
        steps {
            timeout(time: 15, unit: 'MINUTES') {
                waitForQualityGate abortPipeline: true
            }
        }
    }

    stage('Build Images') {
        steps {
            echo "Building Backend..."
            sh "docker build -t ${FULL_BACKEND_IMAGE} ./backend"

            echo "Building Frontend..."
            sh "docker build -t ${FULL_FRONTEND_IMAGE} ./frontend"
        }
    }



    stage('Trivy Scan') {
        steps {
            sh """
                set -e

                echo "========== Scanning Backend Image =========="
                docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    -v /var/cache/trivy:/root/.cache/trivy \
                    -v \$(pwd)/.trivyignore:/.trivyignore \
                    aquasec/trivy:latest image \
                    --ignorefile /.trivyignore \
                    --exit-code 1 \
                    --severity CRITICAL,HIGH \
                    --ignore-unfixed \
                    --format table \
                    ${FULL_BACKEND_IMAGE}

                echo "========== Scanning Frontend Image =========="
                docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    -v /var/cache/trivy:/root/.cache/trivy \
                    -v \$(pwd)/.trivyignore:/.trivyignore \
                    aquasec/trivy:latest image \
                    --ignorefile /.trivyignore \
                    --exit-code 1 \
                    --severity CRITICAL,HIGH \
                    --ignore-unfixed \
                    --format table \
                    ${FULL_FRONTEND_IMAGE}
            """
        }
        post {
            failure { echo "CRITICAL/HIGH VULNERABILITIES FOUND - STOPPING PIPELINE" }
            success { echo "NO CRITICAL/HIGH VULNERABILITIES FOUND - CONTINUING PIPELINE" }
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
                '''
            }
        }
    }

    stage('Approval Before Deploy') {
        steps {
            script {
                try {
                    emailext(
                        subject: "[APPROVAL NEEDED] Deploy ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                        body: """
                            <h3>Pipeline đang chờ phê duyệt để deploy</h3>
                            <ul>
                                <li><b>Job:</b> ${env.JOB_NAME}</li>
                                <li><b>Build:</b> #${env.BUILD_NUMBER}</li>
                                <li><b>Image Tag:</b> ${IMAGE_TAG}</li>
                                <li><b>Backend Image:</b> ${FULL_BACKEND_IMAGE}</li>
                                <li><b>Frontend Image:</b> ${FULL_FRONTEND_IMAGE}</li>
                            </ul>
                            <p><b>Approve tại:</b> <a href="${env.BUILD_URL}input">${env.BUILD_URL}input</a></p>
                            <p>Console log: <a href="${env.BUILD_URL}console">${env.BUILD_URL}console</a></p>
                        """,
                        mimeType: 'text/html',
                        to: "${APPROVER_EMAIL}"
                    )
                } catch (err) {
                    echo "WARNING: Không gửi được email thông báo: ${err.getMessage()}"
                }

                timeout(time: 30, unit: 'MINUTES') {
                    def approval = input(
                        message: "Deploy to production?\n\nImage tag: ${IMAGE_TAG}",
                        ok: "Deploy",
                        submitter: "${APPROVER_USER}",
                        submitterParameter: 'APPROVED_BY'
                    )
                    echo "Deploy approved by: ${approval}"
                }
            }
        }
    }

//     stage('Update Manifests') {
//         steps {
//             withCredentials([usernamePassword(
//                 credentialsId: "${GITHUB_CREDENTIALS_ID}",
//                 usernameVariable: 'USER',
//                 passwordVariable: 'PASS'
//             )]) {
//                 sh "git clone https://${USER}:${PASS}@github.com/NT548-Group11/Manifests.git manifests"

//                 dir('manifests') {
//                     sh """
//                         echo "Updating Kubernetes Manifests..."
//                         sed -i "s|image: noseyug/gymflex-backend:.*|image: ${FULL_BACKEND_IMAGE}|g" apps/backend.yaml
//                         sed -i "s|image: noseyug/gymflex-frontend:.*|image: ${FULL_FRONTEND_IMAGE}|g" apps/frontend.yaml

//                         git config user.name "jenkins"
//                         git config user.email "jenkins@noreply.com"
//                         git add apps/backend.yaml apps/frontend.yaml

//                         if ! git diff-index --quiet HEAD; then
//                             git commit -m "cd: update image tags to ${IMAGE_TAG}"
//                             git push https://${USER}:${PASS}@github.com/NT548-Group11/Manifests.git HEAD:main
//                         else
//                             echo "No changes detected, skipping push..."
//                         fi
//                     """
//                 }
//             }
//         }
//     }
// }

    // post {
    //     always {
    //         sh """
    //             docker rmi ${FULL_BACKEND_IMAGE} || true
    //             docker rmi ${FULL_FRONTEND_IMAGE} || true
    //             docker logout || true
    //         """
    //         cleanWs()
    //     }
    //     failure {
    //         echo "Pipeline FAILED - Build ${BUILD_ID}"
    //     }
    //     success {
    //         echo "Pipeline SUCCESS - Image tag: ${IMAGE_TAG}"
    //     }
    // }
    stage('Update manifests repo') {
        steps {
            withCredentials([
                usernamePassword(
                    credentialsId: "${GITHUB_CREDENTIALS_ID}",
                    usernameVariable: 'USER',
                    passwordVariable: 'PASSWD'
                )
            ]) {
                sh '''
                    rm -rf manifests-repo
                    git clone https://${USER}:${PASSWD}@${MANIFESTS_REPO} manifests-repo

                    sed -i "s|image: ${BACKEND_IMAGE}:.*|image: ${FULL_BACKEND_IMAGE}|g" manifests-repo/apps/backend.yaml
                    sed -i "s|image: ${FRONTEND_IMAGE}:.*|image: ${FULL_FRONTEND_IMAGE}|g" manifests-repo/apps/frontend.yaml
                '''
            }
        }
    }

    stage('Push manifests repo') {
        steps {
            dir('manifests-repo') {
                withCredentials([
                    usernamePassword(
                        credentialsId: "${GITHUB_CREDENTIALS_ID}",
                        usernameVariable: 'USER',
                        passwordVariable: 'PASS'
                    )
                ]) {
                    sh '''
                        git config user.name "jenkins"
                        git config user.email "jenkins@gmail.com"

                        git add apps/backend.yaml apps/frontend.yaml
                        git commit -m "cd: update image tags to ${IMAGE_TAG}" || echo "No changes to commit"

                        git push https://${USER}:${PASS}@${MANIFESTS_REPO} HEAD:main
                    '''
                }
            }
        }
    }
    

    post {
        always {
            sh """
                docker rmi ${FULL_BACKEND_IMAGE} || true
                docker rmi ${FULL_FRONTEND_IMAGE} || true
                docker logout || true
            """
            cleanWs()
        }
        failure {
            echo "Pipeline FAILED - Build ${BUILD_ID}"
        }
        success {
            echo "Pipeline SUCCESS - Image tag: ${IMAGE_TAG}"
        }
    }
}
