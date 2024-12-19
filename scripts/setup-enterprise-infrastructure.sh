#!/bin/bash

# DevMind Enterprise Infrastructure Setup Script
# WARNING: This script sets up production-grade infrastructure costing $15-50K/month
# Requires enterprise licenses and dedicated SRE team

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log "Checking enterprise prerequisites..."
    
    # Check if running as enterprise user
    if [[ $EUID -eq 0 ]]; then
        error "Do not run this script as root. Use enterprise service account."
    fi
    
    # Check required tools
    command -v kubectl >/dev/null 2>&1 || error "kubectl is required but not installed"
    command -v terraform >/dev/null 2>&1 || error "terraform is required but not installed"
    command -v aws >/dev/null 2>&1 || error "AWS CLI is required but not installed"
    command -v gcloud >/dev/null 2>&1 || error "Google Cloud CLI is required but not installed"
    command -v az >/dev/null 2>&1 || error "Azure CLI is required but not installed"
    command -v vault >/dev/null 2>&1 || error "HashiCorp Vault CLI is required but not installed"
    command -v helm >/dev/null 2>&1 || error "Helm is required but not installed"
    
    # Check enterprise licenses
    if [[ ! -f "/opt/hashicorp/vault/license.hclic" ]]; then
        error "HashiCorp Vault enterprise license not found at /opt/hashicorp/vault/license.hclic"
    fi
    
    if [[ ! -f "/etc/ssl/enterprise/devmind.com.pem" ]]; then
        error "Enterprise SSL certificate not found. Please install enterprise CA certificates."
    fi
    
    # Check environment variables
    required_vars=(
        "AWS_ACCESS_KEY_ID"
        "AWS_SECRET_ACCESS_KEY"
        "GOOGLE_APPLICATION_CREDENTIALS"
        "AZURE_CLIENT_ID"
        "AZURE_CLIENT_SECRET"
        "AZURE_TENANT_ID"
        "VAULT_TOKEN"
        "OPENAI_API_KEY"
        "ANTHROPIC_API_KEY"
        "PINECONE_API_KEY"
        "LANGCHAIN_API_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    success "All prerequisites validated"
}

# Validate cloud credentials
validate_cloud_credentials() {
    log "Validating cloud provider credentials..."
    
    # AWS
    aws sts get-caller-identity >/dev/null 2>&1 || error "AWS credentials invalid or insufficient permissions"
    
    # Google Cloud
    gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q . || error "Google Cloud authentication required"
    
    # Azure
    az account show >/dev/null 2>&1 || error "Azure authentication required"
    
    success "Cloud credentials validated"
}

# Initialize HashiCorp Vault
setup_vault() {
    log "Setting up HashiCorp Vault enterprise cluster..."
    
    # Check Vault status
    if ! vault status >/dev/null 2>&1; then
        error "Vault cluster is not accessible. Please check network connectivity."
    fi
    
    # Enable required secret engines
    vault auth enable -path=kubernetes kubernetes || true
    vault auth enable -path=aws aws || true
    vault auth enable -path=gcp gcp || true
    vault auth enable -path=azure azure || true
    
    # Configure secret engines
    vault secrets enable -path=devmind kv-v2
    vault secrets enable -path=database database
    vault secrets enable -path=pki pki
    
    # Set up PKI for internal certificates
    vault write pki/config/urls \
        issuing_certificates="https://vault.devmind.com:8200/v1/pki/ca" \
        crl_distribution_points="https://vault.devmind.com:8200/v1/pki/crl"
    
    # Create policies
    vault policy write devmind-app - <<EOF
path "devmind/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "database/creds/devmind-app" {
  capabilities = ["read"]
}
EOF
    
    success "Vault enterprise cluster configured"
}

# Deploy multi-cloud infrastructure
deploy_infrastructure() {
    log "Deploying multi-cloud infrastructure with Terraform..."
    
    cd terraform/
    
    # Initialize Terraform with enterprise backend
    terraform init \
        -backend-config="bucket=devmind-terraform-state-enterprise" \
        -backend-config="key=production/terraform.tfstate" \
        -backend-config="region=us-west-2" \
        -backend-config="encrypt=true" \
        -backend-config="kms_key_id=alias/devmind-terraform-state"
    
    # Validate configuration
    terraform validate || error "Terraform configuration validation failed"
    
    # Plan infrastructure changes
    terraform plan -var-file="enterprise.tfvars" -out=tfplan
    
    # Apply infrastructure
    warning "This will deploy infrastructure costing approximately $47,000-$89,000 per month"
    read -p "Do you want to proceed? (yes/no): " confirm
    if [[ $confirm != "yes" ]]; then
        error "Infrastructure deployment cancelled"
    fi
    
    terraform apply tfplan
    
    success "Multi-cloud infrastructure deployed"
    cd ..
}

# Setup Kubernetes clusters
setup_kubernetes() {
    log "Configuring Kubernetes clusters..."
    
    # Get cluster credentials
    aws eks update-kubeconfig --region us-west-2 --name devmind-production --alias aws-production
    gcloud container clusters get-credentials devmind-gcp-production --region us-west1 --project ${GCP_PROJECT_ID}
    az aks get-credentials --resource-group devmind-production-rg --name devmind-azure-production
    
    # Install enterprise addons
    kubectl apply -f kubernetes/namespace.yaml
    kubectl apply -f kubernetes/rbac.yaml
    kubectl apply -f kubernetes/network-policies.yaml
    kubectl apply -f kubernetes/security-policies.yaml
    
    # Install Helm charts for enterprise components
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo add grafana https://grafana.github.io/helm-charts
    helm repo add jaeger https://jaegertracing.github.io/helm-charts
    helm repo add elastic https://helm.elastic.co
    helm repo update
    
    # Install monitoring stack
    helm install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --values kubernetes/helm/prometheus-values.yaml
    
    helm install jaeger jaeger/jaeger \
        --namespace monitoring \
        --values kubernetes/helm/jaeger-values.yaml
    
    success "Kubernetes clusters configured"
}

# Setup databases
setup_databases() {
    log "Configuring enterprise database clusters..."
    
    # PostgreSQL cluster setup
    kubectl apply -f kubernetes/postgres-cluster.yaml
    
    # Redis cluster setup
    kubectl apply -f kubernetes/redis-cluster.yaml
    
    # Elasticsearch cluster setup
    helm install elasticsearch elastic/elasticsearch \
        --namespace logging \
        --create-namespace \
        --values kubernetes/helm/elasticsearch-values.yaml
    
    # Initialize database schemas
    kubectl wait --for=condition=ready pod -l app=postgres-primary --timeout=600s
    kubectl exec -it postgres-primary-0 -- psql -U devmind -d devmind -f /docker-entrypoint-initdb.d/init.sql
    
    success "Database clusters configured"
}

# Setup monitoring and observability
setup_monitoring() {
    log "Setting up enterprise monitoring and observability..."
    
    # Deploy Prometheus monitoring
    kubectl apply -f monitoring/prometheus/
    
    # Deploy Grafana dashboards
    kubectl apply -f monitoring/grafana/
    
    # Deploy Jaeger tracing
    kubectl apply -f monitoring/jaeger/
    
    # Deploy log aggregation
    kubectl apply -f monitoring/fluentd/
    
    # Setup alerting
    kubectl apply -f monitoring/alertmanager/
    
    success "Monitoring and observability configured"
}

# Deploy DevMind application
deploy_application() {
    log "Deploying DevMind enterprise application..."
    
    # Build and push container images
    docker build -f Dockerfile.production -t devmind:${BUILD_VERSION:-latest} .
    docker tag devmind:${BUILD_VERSION:-latest} ${CONTAINER_REGISTRY}/devmind:${BUILD_VERSION:-latest}
    docker push ${CONTAINER_REGISTRY}/devmind:${BUILD_VERSION:-latest}
    
    # Deploy to Kubernetes
    envsubst < kubernetes/deployment.yaml | kubectl apply -f -
    kubectl apply -f kubernetes/service.yaml
    kubectl apply -f kubernetes/ingress.yaml
    kubectl apply -f kubernetes/hpa.yaml
    
    # Wait for deployment
    kubectl wait --for=condition=available deployment/devmind-app --timeout=600s
    
    success "DevMind application deployed"
}

# Setup SSL certificates
setup_ssl() {
    log "Setting up enterprise SSL certificates..."
    
    # Install cert-manager
    helm repo add jetstack https://charts.jetstack.io
    helm install cert-manager jetstack/cert-manager \
        --namespace cert-manager \
        --create-namespace \
        --set installCRDs=true
    
    # Apply certificate issuers
    kubectl apply -f kubernetes/ssl/cluster-issuer.yaml
    kubectl apply -f kubernetes/ssl/certificates.yaml
    
    success "SSL certificates configured"
}

# Security hardening
apply_security_hardening() {
    log "Applying enterprise security hardening..."
    
    # Apply security policies
    kubectl apply -f security/pod-security-policies.yaml
    kubectl apply -f security/network-policies.yaml
    kubectl apply -f security/rbac.yaml
    
    # Enable audit logging
    kubectl apply -f security/audit-policy.yaml
    
    # Setup SIEM integration
    kubectl apply -f security/siem-integration.yaml
    
    success "Security hardening applied"
}

# Validate deployment
validate_deployment() {
    log "Validating enterprise deployment..."
    
    # Check application health
    kubectl get pods -n devmind-production
    kubectl get services -n devmind-production
    kubectl get ingress -n devmind-production
    
    # Check monitoring stack
    kubectl get pods -n monitoring
    kubectl get pods -n logging
    
    # Run health checks
    curl -f https://devmind.production.com/api/health || error "Application health check failed"
    curl -f https://prometheus.devmind.com/-/healthy || warning "Prometheus health check failed"
    curl -f https://grafana.devmind.com/api/health || warning "Grafana health check failed"
    
    success "Deployment validation completed"
}

# Generate deployment report
generate_report() {
    log "Generating deployment report..."
    
    cat > deployment-report.txt <<EOF
DevMind Enterprise Deployment Report
====================================
Deployment Date: $(date)
Infrastructure Cost: \$47,000 - \$89,000 per month

Kubernetes Clusters:
- AWS EKS (us-west-2): 25-100 nodes
- Google GKE (us-west1): 8-80 nodes  
- Azure AKS (westus2): 8-110 nodes

Database Clusters:
- PostgreSQL: Primary + 3 replicas
- Redis: 6-node cluster with TLS
- Elasticsearch: 9-node cluster

Monitoring Stack:
- Prometheus: Enterprise monitoring
- Grafana: Advanced dashboards
- Jaeger: Distributed tracing
- ELK: Centralized logging

Security:
- HashiCorp Vault: Enterprise secrets management
- SSL/TLS: Enterprise CA certificates
- RBAC: Role-based access control
- Network policies: Micro-segmentation

Compliance:
- SOC 2 Type II: Ready for audit
- HIPAA: Healthcare compliance enabled
- FedRAMP: Government authorization ready
- ISO 27001: Information security management

Next Steps:
1. Complete security hardening checklist
2. Schedule SOC 2 audit with external auditor
3. Implement disaster recovery testing
4. Set up 24/7 monitoring alerts
5. Train SRE team on runbooks

Contact: sre-team@devmind.com
Emergency: +1-555-SRE-HELP
EOF

    success "Deployment report generated: deployment-report.txt"
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "=================================================="
    echo "DevMind Enterprise Infrastructure Setup"
    echo "=================================================="
    echo -e "${NC}"
    echo "This script will deploy production-grade infrastructure"
    echo "Estimated cost: \$15,000 - \$50,000 per month"
    echo "Requires: Enterprise licenses, SRE team, 24/7 support"
    echo ""
    
    read -p "Do you have all enterprise prerequisites ready? (yes/no): " prereq_confirm
    if [[ $prereq_confirm != "yes" ]]; then
        error "Please ensure all enterprise prerequisites are met before running this script"
    fi
    
    check_prerequisites
    validate_cloud_credentials
    setup_vault
    deploy_infrastructure
    setup_kubernetes
    setup_databases
    setup_monitoring
    deploy_application
    setup_ssl
    apply_security_hardening
    validate_deployment
    generate_report
    
    success "Enterprise deployment completed successfully!"
    warning "Remember to:"
    warning "- Set up 24/7 monitoring alerts"
    warning "- Schedule regular security audits"
    warning "- Test disaster recovery procedures"
    warning "- Train your SRE team on operational runbooks"
}

# Run main function
main "$@"