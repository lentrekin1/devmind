terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }

  backend "s3" {
    bucket         = "devmind-terraform-state-enterprise"
    key            = "production/terraform.tfstate"
    region         = "us-west-2"
    encrypt        = true
    kms_key_id     = "alias/devmind-terraform-state"
    dynamodb_table = "devmind-terraform-state-lock"
  }
}

# Multi-cloud provider configuration
provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Environment   = "production"
      Project       = "devmind"
      ManagedBy     = "terraform"
      CostCenter    = "engineering"
      Compliance    = "SOC2-HIPAA-FedRAMP"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = true
    }
    key_vault {
      purge_soft_delete_on_destroy = false
    }
  }
}

# AWS Infrastructure
module "aws_infrastructure" {
  source = "./modules/aws"
  
  # EKS Cluster Configuration
  cluster_name     = "devmind-production"
  cluster_version  = "1.28"
  node_groups = {
    compute_optimized = {
      instance_types = ["c6i.4xlarge", "c6i.8xlarge"]
      min_size      = 10
      max_size      = 100
      desired_size  = 25
    }
    memory_optimized = {
      instance_types = ["r6i.4xlarge", "r6i.8xlarge"]
      min_size      = 5
      max_size      = 50
      desired_size  = 15
    }
    gpu_accelerated = {
      instance_types = ["p4d.24xlarge", "g5.48xlarge"]
      min_size      = 2
      max_size      = 20
      desired_size  = 8
    }
  }
  
  # RDS Configuration (Multi-AZ PostgreSQL)
  db_instance_class    = "db.r6g.4xlarge"
  db_allocated_storage = 10000
  db_max_allocated_storage = 50000
  db_backup_retention_period = 35
  db_multi_az = true
  db_read_replicas = 3
  
  # ElastiCache Redis Cluster
  redis_node_type = "cache.r7g.4xlarge"
  redis_num_cache_clusters = 6
  redis_parameter_group_name = "default.redis7.cluster.on"
  
  # VPC Configuration
  vpc_cidr = "10.0.0.0/16"
  availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
  
  # Security Groups
  enable_waf = true
  enable_shield_advanced = true
  
  tags = local.common_tags
}

# Google Cloud Platform Infrastructure
module "gcp_infrastructure" {
  source = "./modules/gcp"
  
  # GKE Cluster Configuration
  cluster_name = "devmind-gcp-production"
  location     = var.gcp_region
  
  node_pools = {
    general_purpose = {
      machine_type = "e2-standard-16"
      min_count    = 5
      max_count    = 50
      disk_size_gb = 500
    }
    high_memory = {
      machine_type = "n2-highmem-16"
      min_count    = 3
      max_count    = 30
      disk_size_gb = 1000
    }
  }
  
  # Cloud SQL PostgreSQL
  db_tier = "db-custom-16-104857600" # 16 vCPU, 100GB RAM
  db_disk_size = 5000
  db_backup_configuration = {
    enabled                        = true
    start_time                    = "03:00"
    point_in_time_recovery_enabled = true
    backup_retention_settings = {
      retained_backups = 365
    }
  }
  
  # Memorystore Redis
  redis_memory_size_gb = 500
  redis_tier          = "STANDARD_HA"
  
  project_id = var.gcp_project_id
  region     = var.gcp_region
}

# Azure Infrastructure
module "azure_infrastructure" {
  source = "./modules/azure"
  
  # AKS Cluster Configuration
  cluster_name        = "devmind-azure-production"
  kubernetes_version  = "1.28"
  
  node_pools = {
    system = {
      vm_size    = "Standard_D8s_v5"
      node_count = 3
      min_count  = 3
      max_count  = 10
    }
    compute = {
      vm_size    = "Standard_F16s_v2"
      node_count = 10
      min_count  = 5
      max_count  = 100
    }
  }
  
  # Azure Database for PostgreSQL
  db_sku_name = "GP_Standard_D16s"
  db_storage_mb = 5120000 # 5TB
  db_backup_retention_days = 35
  
  # Azure Cache for Redis
  redis_capacity = 26  # Premium P5 (26GB)
  redis_family   = "P"
  redis_sku_name = "Premium"
  
  resource_group_name = "devmind-production-rg"
  location           = var.azure_region
}

# Monitoring and Observability
module "monitoring" {
  source = "./modules/monitoring"
  
  # Prometheus Configuration
  prometheus_storage_size = "1Ti"
  prometheus_retention   = "90d"
  
  # Grafana Configuration
  grafana_admin_password = var.grafana_admin_password
  
  # Jaeger Configuration
  jaeger_storage_type = "elasticsearch"
  
  # Elasticsearch Configuration
  elasticsearch_data_nodes = 9
  elasticsearch_master_nodes = 3
  elasticsearch_instance_type = "r6g.2xlarge.search"
  elasticsearch_volume_size = 1000
  
  depends_on = [
    module.aws_infrastructure,
    module.gcp_infrastructure,
    module.azure_infrastructure
  ]
}

# Security and Compliance
module "security" {
  source = "./modules/security"
  
  # HashiCorp Vault Configuration
  vault_cluster_size = 5
  vault_instance_type = "m5.2xlarge"
  vault_storage_encrypted = true
  
  # AWS Secrets Manager
  enable_secrets_manager = true
  
  # Certificate Management
  acm_domain_name = "*.devmind.com"
  
  # WAF Configuration
  enable_waf_rate_limiting = true
  waf_rate_limit = 2000
  
  depends_on = [module.aws_infrastructure]
}

# Data and ML Infrastructure
module "ml_infrastructure" {
  source = "./modules/ml"
  
  # Amazon SageMaker
  sagemaker_instance_types = ["ml.p4d.24xlarge", "ml.g5.48xlarge"]
  sagemaker_volume_size = 2000
  
  # Kubeflow on EKS
  kubeflow_namespace = "kubeflow"
  
  # MLflow Tracking Server
  mlflow_instance_type = "m5.4xlarge"
  mlflow_storage_size = 5000
  
  # Vector Database (Pinecone Alternative)
  enable_opensearch_vector = true
  opensearch_instance_type = "r6g.8xlarge.search"
  opensearch_instance_count = 12
  
  depends_on = [module.aws_infrastructure]
}

# Networking and CDN
module "networking" {
  source = "./modules/networking"
  
  # CloudFront Distribution
  cloudfront_price_class = "PriceClass_All"
  cloudfront_origin_shield = true
  
  # Route 53 Configuration
  domain_name = "devmind.com"
  
  # Global Load Balancing
  enable_global_load_balancer = true
  
  depends_on = [
    module.aws_infrastructure,
    module.gcp_infrastructure,
    module.azure_infrastructure
  ]
}

# Backup and Disaster Recovery
module "backup_dr" {
  source = "./modules/backup"
  
  # Cross-region backup configuration
  backup_regions = ["us-east-1", "eu-west-1", "ap-southeast-1"]
  backup_retention_days = 2555 # 7 years for compliance
  
  # Point-in-time recovery
  enable_pitr = true
  pitr_retention_days = 35
  
  # Disaster recovery
  enable_cross_region_dr = true
  dr_region = "us-east-1"
  
  depends_on = [
    module.aws_infrastructure,
    module.gcp_infrastructure,
    module.azure_infrastructure
  ]
}

# Variables
variable "aws_region" {
  description = "AWS region for primary deployment"
  type        = string
  default     = "us-west-2"
}

variable "gcp_project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "gcp_region" {
  description = "Google Cloud region"
  type        = string
  default     = "us-west1"
}

variable "azure_region" {
  description = "Azure region"
  type        = string
  default     = "West US 2"
}

variable "grafana_admin_password" {
  description = "Grafana admin password"
  type        = string
  sensitive   = true
}

# Outputs
output "aws_eks_cluster_endpoint" {
  value = module.aws_infrastructure.eks_cluster_endpoint
  sensitive = true
}

output "gcp_gke_cluster_endpoint" {
  value = module.gcp_infrastructure.gke_cluster_endpoint
  sensitive = true
}

output "azure_aks_cluster_endpoint" {
  value = module.azure_infrastructure.aks_cluster_endpoint
  sensitive = true
}

output "estimated_monthly_cost" {
  value = "Estimated monthly cost: $47,000 - $89,000 USD"
}

# Local values
locals {
  common_tags = {
    Environment        = "production"
    Project           = "devmind"
    Team              = "platform-engineering"
    CostCenter        = "engineering"
    ComplianceLevel   = "SOC2-HIPAA-FedRAMP"
    DataClassification = "confidential"
    BackupRequired    = "true"
    MonitoringLevel   = "comprehensive"
  }
}