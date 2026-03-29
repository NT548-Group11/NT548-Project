###############################################################################
# Terraform AWS Infrastructure
# - 1 VPC, 1 Public Subnet, 1 IGW, 1 Route Table
# - 4 EC2: Jenkins Server, Jenkins Agent, SonarQube, K3S
###############################################################################

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# =============================================================================
# Module: VPC
# =============================================================================
module "vpc" {
  source = "./modules/vpc"

  vpc_cidr           = var.vpc_cidr
  public_subnet_cidr = var.public_subnet_cidr
  availability_zone  = var.availability_zone
  project_name       = var.project_name
}

# =============================================================================
# Module: Jenkins Server
# =============================================================================
module "jenkins_server" {
  source = "./modules/ec2"

  instance_name = "jenkins-server"
  ami           = var.ami
  instance_type = var.jenkins_server_instance_type
  subnet_id     = module.vpc.public_subnet_id
  vpc_id        = module.vpc.vpc_id
  private_ip    = var.private_ips[0]
  key_name      = var.key_name
  volume_size   = var.jenkins_agent_volume_size
  ingress_ports = var.jenkins_server_ingress_ports
}

# =============================================================================
# Module: Jenkins Agent
# =============================================================================
module "jenkins_agent" {
  source = "./modules/ec2"

  instance_name = "jenkins-agent"
  ami           = var.ami
  instance_type = var.jenkins_agent_instance_type
  subnet_id     = module.vpc.public_subnet_id
  vpc_id        = module.vpc.vpc_id
  private_ip    = var.private_ips[1]
  key_name      = var.key_name
  volume_size   = var.jenkins_agent_volume_size
  ingress_ports = var.jenkins_agent_ingress_ports
}

# =============================================================================
# Module: SonarQube
# =============================================================================
module "sonarqube" {
  source = "./modules/ec2"

  instance_name = "sonarqube"
  ami           = var.ami
  instance_type = var.sonarqube_instance_type
  subnet_id     = module.vpc.public_subnet_id
  vpc_id        = module.vpc.vpc_id
  private_ip    = var.private_ips[2]
  key_name      = var.key_name
  volume_size   = var.sonarqube_volume_size
  ingress_ports = var.sonarqube_ingress_ports
}

# =============================================================================
# Module: K3S
# =============================================================================
module "k3s" {
  source = "./modules/ec2"

  instance_name = "k3s"
  ami           = var.ami
  instance_type = var.k3s_instance_type
  subnet_id     = module.vpc.public_subnet_id
  vpc_id        = module.vpc.vpc_id
  private_ip    = var.private_ips[3]
  key_name      = var.key_name
  volume_size   = var.k3s_volume_size
  ingress_ports = var.k3s_ingress_ports
}
