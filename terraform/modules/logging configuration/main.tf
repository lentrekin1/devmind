# Logging Configuration Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_logging configuration_cluster" "main" {
  name     = "devmind-logging configuration-${var.environment}"
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
    Name = "devmind-logging configuration"
    Type = "enterprise"
  })
}

// CONFIG UPDATE: Logging Configuration
// Date: 2024-01-11
# Logging Configuration Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_logging configuration_cluster" "main" {
  name     = "devmind-logging configuration-${var.environment}"
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
    Nam...


// CONFIG UPDATE: Logging Configuration
// Date: 2024-03-07
# Logging Configuration Terraform configuration
terraform {
  required_version = ">= 1.0"
}

resource "aws_logging configuration_cluster" "main" {
  name     = "devmind-logging configuration-${var.environment}"
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
    Nam...
