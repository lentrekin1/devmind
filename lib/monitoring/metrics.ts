export interface DevMindMetrics {
  workflows: {
    executed: number;
    successful: number;
    failed: number;
    averageExecutionTime: number;
  };
  agents: {
    codeReview: {
      reviewsCompleted: number;
      averageReviewTime: number;
      issuesFound: number;
    };
    testing: {
      testsGenerated: number;
      testsPassed: number;
      coverageImprovement: number;
    };
    deployment: {
      deploymentsCompleted: number;
      successRate: number;
      rollbacks: number;
    };
    security: {
      scansCompleted: number;
      vulnerabilitiesFound: number;
      criticalIssues: number;
    };
  };
  performance: {
    apiResponseTime: number;
    throughput: number;
    errorRate: number;
    uptime: number;
  };
  users: {
    activeUsers: number;
    newSignups: number;
    sessionDuration: number;
  };
}

export class MetricsCollector {
  private metrics: DevMindMetrics;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): DevMindMetrics {
    return {
      workflows: {
        executed: 0,
        successful: 0,
        failed: 0,
        averageExecutionTime: 0,
      },
      agents: {
        codeReview: {
          reviewsCompleted: 0,
          averageReviewTime: 0,
          issuesFound: 0,
        },
        testing: {
          testsGenerated: 0,
          testsPassed: 0,
          coverageImprovement: 0,
        },
        deployment: {
          deploymentsCompleted: 0,
          successRate: 0,
          rollbacks: 0,
        },
        security: {
          scansCompleted: 0,
          vulnerabilitiesFound: 0,
          criticalIssues: 0,
        },
      },
      performance: {
        apiResponseTime: 0,
        throughput: 0,
        errorRate: 0,
        uptime: 0,
      },
      users: {
        activeUsers: 0,
        newSignups: 0,
        sessionDuration: 0,
      },
    };
  }

  recordWorkflowExecution(duration: number, success: boolean): void {
    this.metrics.workflows.executed++;
    if (success) {
      this.metrics.workflows.successful++;
    } else {
      this.metrics.workflows.failed++;
    }
    
    // Update average execution time
    const total = this.metrics.workflows.averageExecutionTime * (this.metrics.workflows.executed - 1) + duration;
    this.metrics.workflows.averageExecutionTime = total / this.metrics.workflows.executed;
  }

  recordCodeReview(duration: number, issuesFound: number): void {
    this.metrics.agents.codeReview.reviewsCompleted++;
    this.metrics.agents.codeReview.issuesFound += issuesFound;
    
    const total = this.metrics.agents.codeReview.averageReviewTime * 
                 (this.metrics.agents.codeReview.reviewsCompleted - 1) + duration;
    this.metrics.agents.codeReview.averageReviewTime = total / this.metrics.agents.codeReview.reviewsCompleted;
  }

  recordSecurityScan(vulnerabilities: number, critical: number): void {
    this.metrics.agents.security.scansCompleted++;
    this.metrics.agents.security.vulnerabilitiesFound += vulnerabilities;
    this.metrics.agents.security.criticalIssues += critical;
  }

  recordAPICall(responseTime: number, success: boolean): void {
    // Update response time average
    const totalCalls = this.metrics.workflows.executed + 1;
    const total = this.metrics.performance.apiResponseTime * (totalCalls - 1) + responseTime;
    this.metrics.performance.apiResponseTime = total / totalCalls;

    // Update error rate
    if (!success) {
      this.metrics.performance.errorRate = 
        (this.metrics.performance.errorRate * (totalCalls - 1) + 1) / totalCalls;
    } else {
      this.metrics.performance.errorRate = 
        (this.metrics.performance.errorRate * (totalCalls - 1)) / totalCalls;
    }
  }

  getMetrics(): DevMindMetrics {
    // Calculate uptime
    this.metrics.performance.uptime = (Date.now() - this.startTime) / 1000;
    
    return { ...this.metrics };
  }

  exportPrometheusMetrics(): string {
    const metrics = this.getMetrics();
    
    return `
# HELP devmind_workflows_total Total number of workflows executed
# TYPE devmind_workflows_total counter
devmind_workflows_total{status="success"} ${metrics.workflows.successful}
devmind_workflows_total{status="failed"} ${metrics.workflows.failed}

# HELP devmind_workflow_duration_seconds Average workflow execution time
# TYPE devmind_workflow_duration_seconds gauge
devmind_workflow_duration_seconds ${metrics.workflows.averageExecutionTime}

# HELP devmind_code_reviews_total Total code reviews completed
# TYPE devmind_code_reviews_total counter
devmind_code_reviews_total ${metrics.agents.codeReview.reviewsCompleted}

# HELP devmind_security_vulnerabilities_total Total vulnerabilities found
# TYPE devmind_security_vulnerabilities_total counter
devmind_security_vulnerabilities_total{severity="critical"} ${metrics.agents.security.criticalIssues}
devmind_security_vulnerabilities_total{severity="all"} ${metrics.agents.security.vulnerabilitiesFound}

# HELP devmind_api_response_time_seconds Average API response time
# TYPE devmind_api_response_time_seconds gauge
devmind_api_response_time_seconds ${metrics.performance.apiResponseTime}

# HELP devmind_uptime_seconds System uptime in seconds
# TYPE devmind_uptime_seconds gauge
devmind_uptime_seconds ${metrics.performance.uptime}
`.trim();
  }

  reset(): void {
    this.metrics = this.initializeMetrics();
    this.startTime = Date.now();
  }
}

// Singleton instance
export const metricsCollector = new MetricsCollector();