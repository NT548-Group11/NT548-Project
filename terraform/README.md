# NT548 - Terraform AWS Infrastructure

Dự án Terraform triển khai hạ tầng AWS theo kiểu **module**, bao gồm VPC networking và 4 EC2 instances.

## Kiến trúc hạ tầng

```
                        ┌─────────────────────────────────────────────────┐
                        │                 VPC (10.0.0.0/16)               |
                        │                                                 │
                        │   ┌─────────────────────────────────────────┐   │
                        │   │       Public Subnet (10.0.1.0/24)       │   │
                        │   │                                         │   │
  Internet ──── IGW ────│───│── Jenkins Server (8080, 50000)          │   │
                        │   │── Jenkins Agent  (22)                   │   │
                        │   │── SonarQube      (9000)                 │   │
                        │   │── K3S            (6443, 80, 443, 10250) │   │
                        │   │                                         │   │
                        │   └─────────────────────────────────────────┘   │
                        └─────────────────────────────────────────────────┘
```

## Cấu trúc thư mục

```
Terraform/
├── main.tf                    # Root: provider, gọi các modules
├── variables.tf               # Root: khai báo biến
├── outputs.tf                 # Root: outputs (IP các EC2)
├── terraform.tfvars           # Giá trị biến
│
└── modules/
    ├── vpc/                   # Module VPC + Networking
    │   ├── main.tf            # VPC, Subnet, IGW, Route Table
    │   ├── variables.tf
    │   └── outputs.tf
    │
    └── ec2/                   # Module EC2 
        ├── main.tf            # EC2 Instance, Security Group
        ├── variables.tf
        └── outputs.tf
```

## Tài nguyên AWS được tạo

### Module VPC (`modules/vpc/`)

| Tài nguyên | Mô tả |
|---|---|
| `aws_vpc` | VPC với CIDR `10.0.0.0/16`, DNS support enabled |
| `aws_subnet` | Public subnet `10.0.1.0/24`, auto-assign public IP |
| `aws_internet_gateway` | Internet Gateway gắn vào VPC |
| `aws_route_table` | Route table: `0.0.0.0/0` → IGW |
| `aws_route_table_association` | Gắn public subnet vào route table |

### Module EC2 (`modules/ec2/`)

| Tài nguyên | Mô tả |
|---|---|
| `aws_security_group` | Security group với dynamic ingress rules |
| `aws_instance` | EC2 instance với root volume GP3 |

Module EC2 được tái sử dụng cho 4 instances:

| Instance | Instance Type | Volume | Ingress Ports |
|---|---|---|---|
| **Jenkins Server** | `t3.micro` | 30 GB | 22, 8080, 50000 |
| **Jenkins Agent** | `t3.micro` | 30 GB | 22 |
| **SonarQube** | `t3.micro` | 30 GB | 22, 9000 |
| **K3S** | `t3.micro` | 30 GB | 22, 6443, 80, 443, 10250 |

## Cấu hình mặc định

| Biến | Giá trị |
|---|---|
| `aws_region` | `ap-southeast-2` (Sydney) |
| `project_name` | `NT548` |
| `key_name` | `NT548` |
| `ami` | `ami-01811d4912b4ccb26` (Ubuntu 22.04 LTS) |
| `availability_zone` | `ap-southeast-1a` |

## Yêu cầu

- [Terraform](https://www.terraform.io/downloads) >= 1.0
- AWS CLI đã cấu hình credentials
- AWS Key Pair tên `NT548` đã tạo trên region `ap-southeast-1`

## Hướng dẫn sử dụng

### 1. Khởi tạo Terraform

```bash
terraform init
```

### 2. Xem trước các thay đổi

```bash
terraform plan
```

### 3. Triển khai hạ tầng

```bash
terraform apply
```

### 4. Xem thông tin output

```bash
terraform output
```

Outputs bao gồm:
- `jenkins_server_public_ip` / `jenkins_server_private_ip`
- `jenkins_agent_public_ip` / `jenkins_agent_private_ip`
- `sonarqube_public_ip` / `sonarqube_private_ip`
- `k3s_public_ip` / `k3s_private_ip`
- `vpc_id`, `public_subnet_id`, `internet_gateway_id`

### 5. Hủy hạ tầng

```bash
terraform destroy
```