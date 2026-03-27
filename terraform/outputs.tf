# =============================================================================
# VPC Outputs
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = module.vpc.public_subnet_id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = module.vpc.internet_gateway_id
}

# =============================================================================
# Jenkins Server Outputs
# =============================================================================

output "jenkins_server_public_ip" {
  description = "Public IP of Jenkins Server"
  value       = module.jenkins_server.public_ip
}

output "jenkins_server_private_ip" {
  description = "Private IP of Jenkins Server"
  value       = module.jenkins_server.private_ip
}

# =============================================================================
# Jenkins Agent Outputs
# =============================================================================

output "jenkins_agent_public_ip" {
  description = "Public IP of Jenkins Agent"
  value       = module.jenkins_agent.public_ip
}

output "jenkins_agent_private_ip" {
  description = "Private IP of Jenkins Agent"
  value       = module.jenkins_agent.private_ip
}

# =============================================================================
# SonarQube Outputs
# =============================================================================

output "sonarqube_public_ip" {
  description = "Public IP of SonarQube"
  value       = module.sonarqube.public_ip
}

output "sonarqube_private_ip" {
  description = "Private IP of SonarQube"
  value       = module.sonarqube.private_ip
}

# =============================================================================
# K3S Outputs
# =============================================================================

output "k3s_public_ip" {
  description = "Public IP of K3S"
  value       = module.k3s.public_ip
}

output "k3s_private_ip" {
  description = "Private IP of K3S"
  value       = module.k3s.private_ip
}
