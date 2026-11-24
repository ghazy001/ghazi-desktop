// Optional CI validation; deployment can be configured for the chosen host.
pipeline {
    agent any
    tools { nodejs 'Main NodeJS' }
    stages {
        stage('Checkout') { steps { checkout scm } }
        stage('Install') { steps { sh 'npm ci' } }
        stage('Build') { steps { sh 'npm run build' } }
        stage('Archive') { steps { archiveArtifacts artifacts: 'dist/**', fingerprint: true } }
    }
}
