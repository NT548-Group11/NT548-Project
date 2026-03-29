variable "private_ips" {
  type    = list(string)
  default = ["10.0.1.10", "10.0.1.11", "10.0.1.12", "10.0.1.13"]
}

variable "aws_region" {
}

variable "project_name" {
}

variable "key_name" {
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
  default     = "ap-southeast-2a"
}

# --- EC2 Instance Types ---

variable "jenkins_server_instance_type" {
}

variable "jenkins_agent_instance_type" {
}

variable "sonarqube_instance_type" {
}

variable "k3s_instance_type" {
}
variable "jenkins_server_ingress_ports" {
  type    = list(number)
}

variable "jenkins_agent_ingress_ports" {
  type    = list(number)
}

variable "sonarqube_ingress_ports" {
  type    = list(number)
}

variable "k3s_ingress_ports" {
  type    = list(number)
}

variable "jenkins_server_volume_size" {}

variable "jenkins_agent_volume_size" {}

variable "sonarqube_volume_size" {}

variable "k3s_volume_size" {}