import Stripe from 'stripe';

export interface UsageMetrics {
  workflowExecutions: number;
  aiAgentCalls: number;
  vectorSearches: number;
  storageGB: number;
  computeHours: number;
  apiCalls: number;
}

export interface TierLimits {
  workflowExecutions: number;
  aiAgentCalls: number;
  vectorSearches: number;
  storageGB: number;
  computeHours: number;
  apiCalls: number;
  users: number;
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  limits: TierLimits;
  features: string[];
  supportLevel: 'community' | 'business' | 'enterprise';
}

export class EnterpriseBillingManager {
  private stripe: Stripe;
  private pricingTiers: PricingTier[] = [
    {
      id: 'developer',
      name: 'Developer',
      description: 'Perfect for individual developers and small teams',
      monthlyPrice: 49,
      limits: {
        workflowExecutions: 1000,
        aiAgentCalls: 5000,
        vectorSearches: 10000,
        storageGB: 10,
        computeHours: 50,
        apiCalls: 25000,
        users: 5
      },
      features: [
        'Basic AI agents (Code Review, Testing)',
        'Standard workflow orchestration',
        'Community support',
        'Basic analytics',
        '99% uptime SLA'
      ],
      supportLevel: 'community'
    },
    {
      id: 'team',
      name: 'Team',
      description: 'Ideal for growing development teams',
      monthlyPrice: 249,
      limits: {
        workflowExecutions: 10000,
        aiAgentCalls: 50000,
        vectorSearches: 100000,
        storageGB: 100,
        computeHours: 500,
        apiCalls: 250000,
        users: 25
      },
      features: [
        'All AI agents (Code Review, Testing, Deployment, Security)',
        'Advanced workflow orchestration',
        'Team collaboration features',
        'Advanced analytics and reporting',
        'Slack/Teams integration',
        '99.5% uptime SLA',
        'Business hours support'
      ],
      supportLevel: 'business'
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large organizations requiring advanced features',
      monthlyPrice: 1249,
      limits: {
        workflowExecutions: 100000,
        aiAgentCalls: 500000,
        vectorSearches: 1000000,
        storageGB: 1000,
        computeHours: 5000,
        apiCalls: 2500000,
        users: 250
      },
      features: [
        'All AI agents + Custom agents',
        'Enterprise workflow orchestration',
        'Advanced security and compliance',
        'SSO and LDAP integration',
        'Dedicated infrastructure',
        'Custom integrations',
        'Advanced analytics and insights',
        '99.9% uptime SLA',
        '24/7 enterprise support',
        'Dedicated customer success manager'
      ],
      supportLevel: 'enterprise'
    },
    {
      id: 'enterprise_plus',
      name: 'Enterprise Plus',
      description: 'Maximum scale for enterprise organizations',
      monthlyPrice: 4999,
      limits: {
        workflowExecutions: 1000000,
        aiAgentCalls: 5000000,
        vectorSearches: 10000000,
        storageGB: 10000,
        computeHours: 50000,
        apiCalls: 25000000,
        users: 2500
      },
      features: [
        'Unlimited AI agents and custom models',
        'White-label deployment options',
        'Multi-region deployment',
        'Advanced compliance (SOC 2, HIPAA, FedRAMP)',
        'On-premises deployment available',
        'Professional services included',
        'Custom SLA up to 99.99%',
        '24/7 dedicated support team',
        'Quarterly business reviews'
      ],
      supportLevel: 'enterprise'
    }
  ];

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
  }

  calculateMonthlyBill(usage: UsageMetrics, tierId: string): {
    baseCost: number;
    overageCost: number;
    totalCost: number;
    breakdown: any;
  } {
    const tier = this.pricingTiers.find(t => t.id === tierId);
    if (!tier) throw new Error('Invalid pricing tier');

    const baseCost = tier.monthlyPrice;
    let overageCost = 0;
    const breakdown: any = {};

    // Calculate overage costs
    const overageRates = {
      workflowExecutions: 0.05, // $0.05 per execution
      aiAgentCalls: 0.01, // $0.01 per call
      vectorSearches: 0.002, // $0.002 per search
      storageGB: 2.0, // $2.00 per GB per month
      computeHours: 5.0, // $5.00 per compute hour
      apiCalls: 0.0001 // $0.0001 per API call
    };

    Object.entries(usage).forEach(([metric, value]) => {
      if (metric === 'users') return; // Users handled separately
      
      const limit = tier.limits[metric as keyof TierLimits] as number;
      const overage = Math.max(0, value - limit);
      const overageCostForMetric = overage * overageRates[metric as keyof typeof overageRates];
      
      breakdown[metric] = {
        used: value,
        limit: limit,
        overage: overage,
        overageCost: overageCostForMetric
      };
      
      overageCost += overageCostForMetric;
    });

    return {
      baseCost,
      overageCost,
      totalCost: baseCost + overageCost,
      breakdown
    };
  }

  async createSubscription(customerId: string, tierId: string): Promise<any> {
    const tier = this.pricingTiers.find(t => t.id === tierId);
    if (!tier) throw new Error('Invalid pricing tier');

    try {
      const subscription = await this.stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `DevMind ${tier.name} Plan`,
              description: tier.description
            },
            unit_amount: tier.monthlyPrice * 100, // Convert to cents
            recurring: {
              interval: 'month'
            }
          }
        }],
        metadata: {
          tier: tierId,
          features: JSON.stringify(tier.features),
          limits: JSON.stringify(tier.limits)
        }
      });

      return subscription;
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  async recordUsage(customerId: string, metrics: UsageMetrics): Promise<void> {
    // Record usage metrics for billing calculation
    // This would typically be stored in a time-series database
    const timestamp = new Date().toISOString();
    
    // Store usage data (implementation would depend on your database)
    console.log(`Recording usage for customer ${customerId} at ${timestamp}:`, metrics);
  }

  getUsageAlerts(usage: UsageMetrics, tierId: string): string[] {
    const tier = this.pricingTiers.find(t => t.id === tierId);
    if (!tier) return [];

    const alerts: string[] = [];
    const warningThreshold = 0.8; // Alert at 80% of limit
    const criticalThreshold = 0.95; // Critical alert at 95% of limit

    Object.entries(usage).forEach(([metric, value]) => {
      if (metric === 'users') return;
      
      const limit = tier.limits[metric as keyof TierLimits] as number;
      const usagePercent = value / limit;

      if (usagePercent >= criticalThreshold) {
        alerts.push(`🔴 CRITICAL: ${metric} usage at ${Math.round(usagePercent * 100)}% of limit (${value}/${limit})`);
      } else if (usagePercent >= warningThreshold) {
        alerts.push(`⚠️ WARNING: ${metric} usage at ${Math.round(usagePercent * 100)}% of limit (${value}/${limit})`);
      }
    });

    return alerts;
  }

  generateInvoicePreview(usage: UsageMetrics, tierId: string): string {
    const billing = this.calculateMonthlyBill(usage, tierId);
    const tier = this.pricingTiers.find(t => t.id === tierId)!;
    
    return `
💳 **DevMind Invoice Preview - ${tier.name} Plan**

**Billing Period:** ${new Date().toLocaleDateString()} - ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}

**Base Subscription:** $${billing.baseCost.toFixed(2)}
${tier.name} Plan - ${tier.description}

**Usage Details:**
${Object.entries(billing.breakdown).map(([metric, data]: [string, any]) => {
  const metricName = metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  return `• ${metricName}: ${data.used.toLocaleString()} (Limit: ${data.limit.toLocaleString()})${data.overage > 0 ? ` - Overage: ${data.overage.toLocaleString()} (+$${data.overageCost.toFixed(2)})` : ''}`;
}).join('\n')}

**Overage Charges:** $${billing.overageCost.toFixed(2)}
**Total Amount:** $${billing.totalCost.toFixed(2)}

**Payment Method:** •••• •••• •••• 4242 (Visa)
**Next Billing Date:** ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}

**Support Level:** ${tier.supportLevel.charAt(0).toUpperCase() + tier.supportLevel.slice(1)}
**Uptime SLA:** ${tier.features.find(f => f.includes('uptime')) || 'Standard SLA'}

Need to upgrade? Contact sales@devmind.ai
Questions? support@devmind.ai | +1 (555) 123-4567
`;
  }

  getPricingTiers(): PricingTier[] {
    return this.pricingTiers;
  }

  getTierRecommendation(usage: UsageMetrics): string {
    // Find the most cost-effective tier for current usage
    let bestTier = this.pricingTiers[0];
    let bestCost = Infinity;

    this.pricingTiers.forEach(tier => {
      const billing = this.calculateMonthlyBill(usage, tier.id);
      if (billing.totalCost < bestCost) {
        bestCost = billing.totalCost;
        bestTier = tier;
      }
    });

    return `
🎯 **Recommended Plan: ${bestTier.name}**

**Estimated Monthly Cost:** $${bestCost.toFixed(2)}
**Plan Benefits:**
${bestTier.features.map(f => `• ${f}`).join('\n')}

**Your Usage vs. Limits:**
• Workflow Executions: ${usage.workflowExecutions.toLocaleString()} / ${bestTier.limits.workflowExecutions.toLocaleString()}
• AI Agent Calls: ${usage.aiAgentCalls.toLocaleString()} / ${bestTier.limits.aiAgentCalls.toLocaleString()}
• Vector Searches: ${usage.vectorSearches.toLocaleString()} / ${bestTier.limits.vectorSearches.toLocaleString()}
• Storage: ${usage.storageGB}GB / ${bestTier.limits.storageGB}GB
• Compute Hours: ${usage.computeHours} / ${bestTier.limits.computeHours}

Ready to upgrade? Visit https://devmind.ai/pricing
`;
  }
}

export const billingManager = new EnterpriseBillingManager();