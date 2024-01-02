# Production Environment Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_production environment_cluster" "main" {
  name     = "devmind-production environment-${var.environment}"
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
    Name = "devmind-production environment"
    Type = "enterprise"
  })
}