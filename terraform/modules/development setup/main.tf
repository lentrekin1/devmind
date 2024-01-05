# Development Setup Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_development setup_cluster" "main" {
  name     = "devmind-development setup-${var.environment}"
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
    Name = "devmind-development setup"
    Type = "enterprise"
  })
}

// CONFIG UPDATE: Development Setup
// Date: 2024-01-04
# Development Setup Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_development setup_cluster" "main" {
  name     = "devmind-development setup-${var.environment}"
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
    Name = "devmind...
