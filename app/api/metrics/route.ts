import { NextRequest, NextResponse } from 'next/server';
import { metricsCollector } from '@/lib/monitoring/metrics';

export async function GET(request: NextRequest) {
  try {
    const format = request.nextUrl.searchParams.get('format') || 'json';
    
    if (format === 'prometheus') {
      const prometheusMetrics = metricsCollector.exportPrometheusMetrics();
      
      return new NextResponse(prometheusMetrics, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
    
    // Default JSON format
    const metrics = metricsCollector.getMetrics();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics,
    });
    
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve metrics', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    switch (action) {
      case 'workflow_execution':
        metricsCollector.recordWorkflowExecution(data.duration, data.success);
        break;
        
      case 'code_review':
        metricsCollector.recordCodeReview(data.duration, data.issuesFound);
        break;
        
      case 'security_scan':
        metricsCollector.recordSecurityScan(data.vulnerabilities, data.critical);
        break;
        
      case 'api_call':
        metricsCollector.recordAPICall(data.responseTime, data.success);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Unknown metric action' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      message: `Recorded ${action} metric`,
    });
    
  } catch (error) {
    console.error('Metrics recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record metric', details: error.message },
      { status: 500 }
    );
  }
}