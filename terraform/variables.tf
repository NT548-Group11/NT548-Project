variable "private_ips" {
  type    = list(string)
  default = ["10.0.1.10", "10.0.1.11", "10.0.1.12", "10.0.1.13"]
}

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project name used for tagging resources"
  type        = string
  default     = "nt548"
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
  default     = "nt548-key"
}

variable "ami" {
  description = "AMI ID for EC2 instances (Ubuntu 22.04 LTS)"
  type        = string
  default     = "ami-01811d4912b4ccb26" # Ubuntu 22.04 LTS - ap-southeast-1
}

# --- VPC Variables ---

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  description = "Availability zone for the subnet"
  type        = string
  default     = "ap-southeast-1a"
}

# --- EC2 Instance Types ---

variable "jenkins_server_instance_type" {
  description = "Instance type for Jenkins Server"
  type        = string
  default     = "t3.micro"
}

variable "jenkins_agent_instance_type" {
  description = "Instance type for Jenkins Agent"
  type        = string
  default     = "t3.micro"
}

variable "sonarqube_instance_type" {
  description = "Instance type for SonarQube"
  type        = string
  default     = "t3.micro"
}

variable "k3s_instance_type" {
  description = "Instance type for K3S"
  type        = string
  default     = "t3.micro"
}
variable "jenkins_server_ingress_ports" {
  type    = list(number)
  default = [22, 8080, 50000]
}

variable "jenkins_agent_ingress_ports" {
  type    = list(number)
  default = [22]
}

variable "sonarqube_ingress_ports" {
  type    = list(number)
  default = [22, 9000]
}

variable "k3s_ingress_ports" {
  type    = list(number)
  default = [22, 6443, 80, 443, 10250]
}

variable "jenkins_server_volume_size" {}

variable "jenkins_agent_volume_size" {}

variable "sonarqube_volume_size" {}

variable "k3s_volume_size" {}