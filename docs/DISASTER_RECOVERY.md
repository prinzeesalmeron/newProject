# Disaster Recovery & Business Continuity Plan

## Overview

This document outlines the disaster recovery (DR) and business continuity procedures for the real estate tokenization platform.

## Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| System Component | RTO | RPO | Priority |
|-----------------|-----|-----|----------|
| Database | 1 hour | 5 minutes | Critical |
| Authentication | 30 minutes | 1 minute | Critical |
| Payment Processing | 2 hours | 15 minutes | High |
| Smart Contracts | N/A (Blockchain) | N/A | Critical |
| Frontend Application | 15 minutes | N/A | Medium |

## Backup Strategy

### Database Backups

**Supabase Automatic Backups:**
- Daily automated backups (retained for 7 days on Pro plan)
- Point-in-time recovery available
- Backups stored in multiple regions

**Manual Backup Procedures:**

```bash
# Export database schema
pg_dump -h <db-host> -U postgres -s <database> > schema_backup.sql

# Export data
pg_dump -h <db-host> -U postgres -a <database> > data_backup.sql

# Export specific tables
pg_dump -h <db-host> -U postgres -t audit_logs -t security_events <database> > critical_tables.sql
```

**Backup Schedule:**
- Full backup: Daily at 2 AM UTC
- Incremental backup: Every 6 hours
- Transaction logs: Continuous replication
- Retention: 30 days rolling

### Application Backups

**Codebase:**
- Git repository (GitHub) with multiple contributors
- Main branch protected with required reviews
- Tagged releases for version control

**Configuration:**
- Environment variables stored in secure vault
- Infrastructure as Code (IaC) in version control
- Secrets backed up securely (encrypted)

### Smart Contract Backups

- Contract source code in Git
- Deployed contract addresses documented
- Contract ABIs stored in multiple locations
- Blockchain provides inherent backup (immutable)

## Disaster Scenarios & Recovery Procedures

### Scenario 1: Database Failure

**Detection:**
- Health check endpoint returns database error
- Monitoring alerts triggered
- Users unable to access data

**Recovery Steps:**

1. **Immediate (0-5 minutes):**
   ```bash
   # Check database status
   curl https://your-app.com/health-check

   # Verify Supabase dashboard
   # Check if issue is widespread or localized
   ```

2. **Switch to read replica (5-10 minutes):**
   ```bash
   # Update connection string to read replica
   export DATABASE_URL=<read-replica-url>

   # Restart application services
   ```

3. **Restore from backup (if needed):**
   ```bash
   # Via Supabase dashboard:
   # - Navigate to Database > Backups
   # - Select restore point
   # - Confirm restoration

   # Or via CLI:
   pg_restore -h <db-host> -U postgres -d <database> latest_backup.sql
   ```

4. **Verify data integrity:**
   ```sql
   -- Check critical tables
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM audit_logs;
   SELECT COUNT(*) FROM security_events;

   -- Verify recent transactions
   SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
   ```

### Scenario 2: Payment Processing Failure

**Detection:**
- Stripe webhook failures
- Payment intent creation errors
- Customer payment complaints

**Recovery Steps:**

1. **Verify Stripe status:**
   - Check https://status.stripe.com
   - Test API with simple request

2. **Enable fallback payment method:**
   - Notify users of alternative payment options
   - Manual payment processing if needed

3. **Reconcile transactions:**
   ```sql
   -- Find pending payments
   SELECT * FROM payment_transactions
   WHERE status = 'pending'
   AND created_at > NOW() - INTERVAL '1 hour';

   -- Verify with Stripe
   -- Update statuses accordingly
   ```

### Scenario 3: Authentication System Failure

**Detection:**
- Users unable to login
- Auth tokens not validating
- Supabase Auth service down

**Recovery Steps:**

1. **Check Supabase Auth status**
2. **Enable maintenance mode with graceful degradation**
3. **Communicate with users via status page**
4. **Monitor for service restoration**

### Scenario 4: Smart Contract Issues

**Detection:**
- Transaction failures
- Contract calls reverting
- Blockchain network issues

**Recovery Steps:**

1. **Verify blockchain network status:**
   - Check Etherscan/block explorer
   - Test RPC endpoint connectivity

2. **Switch to backup RPC provider:**
   ```typescript
   // Update provider configuration
   const backupProvider = new ethers.providers.JsonRpcProvider(
     'https://backup-rpc-url.com'
   );
   ```

3. **Pause contract interactions if needed:**
   - Enable maintenance mode for blockchain features
   - Queue transactions for later processing

4. **Contract upgrade (if critical bug):**
   - Deploy new contract version
   - Migrate state if possible
   - Update frontend to use new addresses

### Scenario 5: Complete System Failure

**Recovery Steps:**

1. **Activate Incident Response Team**
2. **Enable status page with updates**
3. **Deploy to backup infrastructure:**
   ```bash
   # Deploy to backup hosting
   npm run build
   netlify deploy --prod --dir=dist

   # Or Vercel
   vercel --prod
   ```

4. **Restore database from latest backup**
5. **Update DNS if needed**
6. **Verify all systems operational**

## Monitoring & Alerting

### Health Checks

```bash
# Application health
curl https://your-app.com/health-check

# Database connectivity
curl https://your-app.com/api/health/database

# External services
curl https://your-app.com/api/health/services
```

### Automated Alerts

**Critical Alerts (Immediate Response):**
- Database down
- Payment processing failures
- Smart contract errors
- Security breaches

**Warning Alerts (Monitor/Investigate):**
- High error rates (>5%)
- Slow response times (>3s)
- Elevated rate limit violations
- Unusual traffic patterns

**Alert Channels:**
- Email to on-call engineer
- Slack/Discord notifications
- PagerDuty integration
- SMS for critical issues

## Testing Procedures

### Quarterly DR Drills

**Test Schedule:**
- Q1: Database backup/restore
- Q2: Complete system failover
- Q3: Payment system recovery
- Q4: Security incident response

**Test Checklist:**
```
[ ] Notify team of drill
[ ] Execute recovery procedure
[ ] Document time to recovery
[ ] Verify data integrity
[ ] Test user access
[ ] Document lessons learned
[ ] Update procedures
```

### Backup Verification

**Weekly:**
```bash
# Verify backup exists
supabase db dump --file test_restore.sql

# Test restore in isolated environment
createdb test_recovery
psql test_recovery < test_restore.sql

# Verify data
psql test_recovery -c "SELECT COUNT(*) FROM users;"
```

## Data Retention & Compliance

### Retention Policies

| Data Type | Retention Period | Reason |
|-----------|-----------------|---------|
| Audit Logs | 7 years | Compliance |
| Transaction Records | 7 years | Financial regulations |
| User Data | As long as account active | GDPR |
| Security Events | 2 years | Security analysis |
| Backups | 30 days | Recovery window |

### Compliance Requirements

- **GDPR:** User data deletion within 30 days of request
- **Financial:** Transaction records retained per regulations
- **Security:** Audit trails maintained for forensics

## Contact Information

### Emergency Contacts

**Primary On-Call Engineer:**
- Name: [Your Name]
- Phone: [Phone Number]
- Email: [Email]

**Backup On-Call:**
- Name: [Backup Name]
- Phone: [Phone Number]
- Email: [Email]

**Service Providers:**
- Supabase Support: support@supabase.com
- Stripe Support: https://support.stripe.com
- Hosting Support: [Provider contact]

## Post-Incident Procedures

1. **Document incident:**
   - Timeline of events
   - Root cause analysis
   - Impact assessment
   - Resolution steps

2. **Conduct post-mortem:**
   - What went wrong
   - What went right
   - Lessons learned
   - Action items

3. **Update procedures:**
   - Improve runbooks
   - Update automation
   - Enhance monitoring

4. **Communicate to stakeholders:**
   - Incident summary
   - Resolution status
   - Prevention measures

## Recovery Checklist

```
[ ] Incident detected and classified
[ ] Incident response team notified
[ ] Status page updated
[ ] Recovery procedure initiated
[ ] Database restored (if needed)
[ ] Application services restarted
[ ] Health checks passing
[ ] User access verified
[ ] Data integrity confirmed
[ ] Monitoring re-enabled
[ ] Stakeholders notified
[ ] Post-mortem scheduled
[ ] Documentation updated
```

## Continuous Improvement

- Review DR plan quarterly
- Update based on post-mortems
- Test new procedures
- Train team members
- Update contact information
- Verify backup integrity
- Improve automation
