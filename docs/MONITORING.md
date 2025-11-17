# Monitoring & Observability Guide

## Overview

This document outlines the monitoring, logging, and observability strategy for the real estate tokenization platform.

## Monitoring Stack

### Application Monitoring

**Sentry (Error Tracking)**
- Real-time error tracking and performance monitoring
- Automatic error grouping and deduplication
- Release tracking and deploy notifications
- User feedback capture

**Configuration:**
```typescript
// Already implemented in src/lib/errors/ErrorHandler.ts
Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0
});
```

### Infrastructure Monitoring

**Supabase Metrics**
- Database CPU/Memory usage
- Connection pool stats
- Query performance
- Storage usage

**Access:** Supabase Dashboard > Reports

**Netlify/Vercel Analytics**
- Build times
- Deployment success rate
- Traffic patterns
- Geographic distribution

### Custom Health Checks

**Endpoint:** `/health-check` (Edge Function)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T00:00:00Z",
  "services": {
    "database": { "status": "up", "responseTime": 45 },
    "stripe": { "status": "up" },
    "supabase": { "status": "up", "responseTime": 32 }
  },
  "uptime": 86400,
  "version": "1.0.0"
}
```

## Key Metrics

### Application Metrics

| Metric | Target | Alert Threshold |
|--------|--------|----------------|
| Availability | 99.9% | < 99.5% |
| Response Time (p95) | < 1s | > 3s |
| Error Rate | < 0.1% | > 1% |
| API Success Rate | > 99.5% | < 99% |

### Business Metrics

| Metric | Description | Tracking |
|--------|-------------|----------|
| Active Users | Daily/Monthly active users | Mixpanel |
| Transaction Volume | Daily transaction count | Database |
| Transaction Value | Total $ transacted | Database |
| Conversion Rate | Signup → First investment | Mixpanel |
| User Retention | 7-day, 30-day retention | Mixpanel |

### Performance Metrics

| Metric | Target | Source |
|--------|--------|--------|
| First Contentful Paint | < 1.5s | Web Vitals |
| Largest Contentful Paint | < 2.5s | Web Vitals |
| Time to Interactive | < 3.5s | Web Vitals |
| Cumulative Layout Shift | < 0.1 | Web Vitals |

## Logging Strategy

### Log Levels

**ERROR:** System errors requiring immediate attention
- Payment failures
- Contract transaction errors
- Authentication failures

**WARN:** Potential issues to investigate
- Rate limit warnings
- Slow query warnings
- Deprecated API usage

**INFO:** Important business events
- User registrations
- Successful transactions
- Property listings

**DEBUG:** Development information
- API calls
- State changes
- User actions

### Log Structure

```json
{
  "timestamp": "2025-01-01T12:00:00Z",
  "level": "INFO",
  "service": "api",
  "user_id": "user123",
  "action": "property_purchase",
  "property_id": "prop456",
  "amount": 1000,
  "metadata": {
    "token_amount": 10,
    "payment_method": "stripe"
  },
  "request_id": "req789",
  "duration_ms": 234
}
```

### Log Retention

| Type | Retention | Location |
|------|-----------|----------|
| Application Logs | 30 days | Sentry |
| Audit Logs | 7 years | Supabase |
| Security Events | 2 years | Supabase |
| Access Logs | 90 days | Hosting Provider |
| Error Logs | 1 year | Sentry |

## Alerting

### Critical Alerts (Page Immediately)

1. **System Down**
   - Health check fails
   - Error rate > 5%
   - Database unavailable

2. **Security Incidents**
   - Multiple failed auth attempts
   - Suspicious transaction patterns
   - Rate limit breaches

3. **Payment Failures**
   - Stripe webhook failures
   - Payment processing errors
   - Refund issues

### Warning Alerts (Investigate Next Business Day)

1. **Performance Degradation**
   - Response time > 3s
   - High database load
   - Slow queries

2. **Capacity Issues**
   - Storage > 80%
   - Rate limits approaching
   - Connection pool saturation

3. **Business Metrics**
   - Conversion rate drops
   - User churn increases
   - Transaction volume anomalies

### Alert Channels

```yaml
critical:
  - pagerduty
  - sms
  - slack: #alerts-critical

warning:
  - slack: #alerts-warning
  - email: team@company.com

info:
  - slack: #alerts-info
```

## Dashboards

### Operations Dashboard

**Real-time Metrics:**
- System health status
- Active users
- Request rate
- Error rate
- Response times

**Tools:** Grafana, Supabase Dashboard, Sentry

### Business Dashboard

**Key Metrics:**
- Daily Active Users
- Transaction volume
- Revenue
- User growth
- Property listings

**Tools:** Mixpanel, Custom Dashboard

### Security Dashboard

**Monitored Events:**
- Failed login attempts
- Rate limit violations
- Suspicious transactions
- Audit log summary

**Tools:** Supabase, Custom Dashboard

## Performance Monitoring

### Web Vitals Integration

```typescript
// Already implemented in src/main.tsx
import { onCLS, onFID, onLCP } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to analytics service
  mixpanel.track('Web Vital', {
    name: metric.name,
    value: metric.value,
    rating: metric.rating
  });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
```

### API Performance

```typescript
// Automatic tracking via retry middleware
const client = createResilientClient({
  retryConfig: {
    maxAttempts: 3,
    baseDelay: 1000,
    onRetry: (attempt, error) => {
      // Log retry attempts
      logger.warn('API retry', { attempt, error });
    }
  }
});
```

## Incident Response

### Severity Levels

**P0 (Critical):**
- System completely down
- Data breach
- Payment processing failure
- Response: Immediate, 24/7

**P1 (High):**
- Major feature broken
- Performance severely degraded
- Security vulnerability
- Response: Within 1 hour

**P2 (Medium):**
- Minor feature broken
- Performance degraded
- Non-critical errors
- Response: Within 4 hours

**P3 (Low):**
- Cosmetic issues
- Enhancement requests
- Documentation
- Response: Next business day

### Incident Response Workflow

1. **Detection**
   - Automated alert triggers
   - User report
   - Monitoring dashboard

2. **Triage**
   - Assess severity
   - Identify impact
   - Assign owner

3. **Communication**
   - Update status page
   - Notify stakeholders
   - Document timeline

4. **Resolution**
   - Implement fix
   - Verify resolution
   - Monitor for regression

5. **Post-Mortem**
   - Root cause analysis
   - Lessons learned
   - Prevention measures

## Monitoring Checklist

### Daily

```
[ ] Check health endpoint
[ ] Review error rate
[ ] Monitor active users
[ ] Check transaction success rate
[ ] Review security events
```

### Weekly

```
[ ] Analyze performance trends
[ ] Review user feedback
[ ] Check storage usage
[ ] Review slow queries
[ ] Update monitoring thresholds
```

### Monthly

```
[ ] Generate uptime report
[ ] Review business metrics
[ ] Analyze user behavior
[ ] Performance audit
[ ] Security review
```

## Custom Monitoring Scripts

### Health Check

```bash
#!/bin/bash
# scripts/health-check.sh

ENDPOINT="https://your-app.com/health-check"

response=$(curl -s -w "%{http_code}" "$ENDPOINT")
status_code=$(echo "$response" | tail -n 1)

if [ "$status_code" -eq 200 ]; then
  echo "✓ Health check passed"
  exit 0
else
  echo "✗ Health check failed (HTTP $status_code)"
  exit 1
fi
```

### Database Monitoring

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Check connection count
SELECT count(*) as connections,
       state
FROM pg_stat_activity
GROUP BY state;

-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;
```

### Error Rate Monitoring

```typescript
// Automated error rate check
async function checkErrorRate() {
  const { data } = await supabase
    .from('audit_logs')
    .select('success')
    .gte('created_at', new Date(Date.now() - 3600000).toISOString());

  const errorRate = data.filter(log => !log.success).length / data.length;

  if (errorRate > 0.01) {
    await sendAlert('High error rate detected', { errorRate });
  }
}
```

## Best Practices

1. **Set Realistic Thresholds**
   - Start conservative
   - Adjust based on baseline
   - Avoid alert fatigue

2. **Monitor User Impact**
   - Focus on user-facing metrics
   - Track business outcomes
   - Prioritize customer experience

3. **Automate Everything**
   - Automated health checks
   - Auto-scaling when possible
   - Self-healing systems

4. **Document Everything**
   - Runbooks for common issues
   - Incident response procedures
   - Architecture diagrams

5. **Regular Reviews**
   - Weekly metrics review
   - Monthly capacity planning
   - Quarterly performance audits

## Resources

- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Web Vitals Guide](https://web.dev/vitals/)
- [SRE Handbook](https://sre.google/sre-book/table-of-contents/)
