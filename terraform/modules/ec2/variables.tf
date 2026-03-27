variable "instance_name" {
  description = "Name tag for the EC2 instance"
  type        = string
}

variable "ami" {
  description = "AMI ID for the EC2 instance"
  type        = string
}

variable "instance_type" {
  description = "Instance type for the EC2 instance"
  type        = string
  default     = "t2.micro"
}

variable "subnet_id" {
  description = "Subnet ID to launch the instance in"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the security group"
  type        = string
}

variable "private_ip" {
  description = "Private IP address for the EC2 instance"
  type        = string
  default     = null 
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
}

variable "ingress_ports" {
  description = "List of ingress ports to allow"
  type        = list(number)
  default     = [22]
}

variable "volume_size" {
  description = "Root volume size in GB"
  type        = number
  default     = 20
}
