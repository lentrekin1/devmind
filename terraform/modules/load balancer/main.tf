# Load Balancer Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_load balancer_cluster" "main" {
  name     = "devmind-load balancer-${var.environment}"
  version  = var.cluster_version
  
  vpc_config {
    subnet_ids = var.subnet_ids
    security_group_ids = [aws_security_group.cluster.id]
  }
  
  encryption_config {
    resources = ["secrets"]
    provider {
      key_id = var.kms_key_id
    }
  }
  
  tags = merge(var.tags, {
    Name = "devmind-load balancer"
    Type = "enterprise"
  })
}

// CONFIG UPDATE: Load Balancer
// Date: 2024-04-13
# Load Balancer Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_load balancer_cluster" "main" {
  name     = "devmind-load balancer-${var.environment}"
  version  = var.cluster_version
  
  vpc_config {
    subnet_ids = var.subnet_ids
    security_group_ids = [aws_security_group.cluster.id]
  }
  
  encryption_config {
    resources = ["secrets"]
    provider {
      key_id = var.kms_key_id
    }
  }
  
  tags = merge(var.tags, {
    Name = "devmind-load balanc...
