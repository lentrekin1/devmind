# CI/CD Pipeline Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_ci/cd pipeline_cluster" "main" {
  name     = "devmind-ci/cd pipeline-${var.environment}"
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
    Name = "devmind-ci/cd pipeline"
    Type = "enterprise"
  })
}