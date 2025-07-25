# Security Policies Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_security policies_cluster" "main" {
  name     = "devmind-security policies-${var.environment}"
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
    Name = "devmind-security policies"
    Type = "enterprise"
  })
}

// CONFIG UPDATE: Security Policies
// Date: 2024-01-25
# Security Policies Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_security policies_cluster" "main" {
  name     = "devmind-security policies-${var.environment}"
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


// CONFIG UPDATE: Security Policies
// Date: 2024-03-28
# Security Policies Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_security policies_cluster" "main" {
  name     = "devmind-security policies-${var.environment}"
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
