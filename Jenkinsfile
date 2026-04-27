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
                            subject: "🚀 [APPROVAL NEEDED] Deploy ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                            from: "GymFlex CI/CD <manhtan06120@gmail.com>",
                            replyTo: "noreply@gymflex.com",
                            body: """
                                <div style="font-family: -apple-system, Segoe UI, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                                    <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 24px;">
                                        <h2 style="margin: 0;">🚀 Deployment Approval Required</h2>
                                        <p style="margin: 8px 0 0; opacity: 0.9;">Pipeline đang chờ phê duyệt để deploy lên production</p>
                                    </div>
                                    
                                    <div style="padding: 24px; background: #fafafa;">
                                        <table style="width: 100%; border-collapse: collapse;">
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;"><b>📦 Job:</b></td>
                                                <td style="padding: 8px 0;">${env.JOB_NAME}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;"><b>🔢 Build:</b></td>
                                                <td style="padding: 8px 0;">#${env.BUILD_NUMBER}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;"><b>🏷️ Tag:</b></td>
                                                <td style="padding: 8px 0;"><code style="background:#eee; padding:2px 6px; border-radius:3px;">${IMAGE_TAG}</code></td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;"><b>🐳 Backend:</b></td>
                                                <td style="padding: 8px 0; font-family: monospace; font-size: 13px;">${FULL_BACKEND_IMAGE}</td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; color: #666;"><b>🎨 Frontend:</b></td>
                                                <td style="padding: 8px 0; font-family: monospace; font-size: 13px;">${FULL_FRONTEND_IMAGE}</td>
                                            </tr>
                                        </table>
                                    </div>
                                    
                                    <div style="padding: 24px; text-align: center; background: white;">
                                        <a href="${env.BUILD_URL}input" 
                                        style="display: inline-block; background: #28a745; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; font-weight: 600;">
                                            ✅ Approve Deployment
                                        </a>
                                        <p style="margin: 16px 0 0; font-size: 13px; color: #888;">
                                            Hoặc xem chi tiết tại 
                                            <a href="${env.BUILD_URL}console">Console Log</a>
                                        </p>
                                    </div>
                                    
                                    <div style="padding: 12px 24px; background: #f0f0f0; font-size: 11px; color: #999; text-align: center;">
                                        Sent by Jenkins CI/CD • GymFlex Project
                                    </div>
                                </div>
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
