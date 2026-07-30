# Connection Pool Monitoring Runbook

## Overview

This runbook covers monitoring and alerting for the Supabase connection pool to prevent connection exhaustion.

## Configuration

### Threshold
- **Alert threshold**: 48 of 60 connections (80% of direct connections)
- **Current baseline**: 12 in use (as of 2026-07-30)
- **max_connections**: 60

### Why This Threshold?
- The original requirement was "80% of pool" 
- With max_connections = 60, 80% = 48 direct connections
- Connection storms (Vercel-serverless + Mastra) are the real failure mode, not gradual growth
- Alerting on rate of change, not just level

## Accessing Monitoring Tools

### Grafana Cloud Dashboard
1. Open Supabase Dashboard
2. Navigate to **Integrations** → **Grafana Cloud**
3. Click "Connect" if not already enabled (one-click setup, no credit card required)
4. Pre-built dashboard with 200+ metrics automatically configured

### Database Reports
1. Open Dashboard → **Reports** → **Database connections**
2. View historical connection data
3. Breakdown by service type (PostgREST, Auth, Storage, etc.)

### Connection Charts
1. Open Dashboard → **Database** → **Metrics**
2. View real-time connection pool metrics
3. Monitor active/idle connections

## Interpreting Metrics

### Key Metrics to Monitor
- **Active connections**: Currently in use
- **Idle connections**: Available in pool
- **Connection wait time**: Time spent waiting for available connection
- **Connection errors**: Failed connection attempts

### Normal Operating Range
- **Normal**: 0-30 connections (0-50%)
- **Warning**: 31-47 connections (50-79%)
- **Critical**: 48+ connections (80%+) - alert triggers

### Connection Types
- **Direct connections**: Standard PostgreSQL connections
- **Supavisor transaction-mode**: Transaction pooling
- **Supavisor session-mode**: Session pooling
- Each type has different ceilings

## Alert Configuration

### Alert Setup
1. Navigate to "Client Connections" graph in Grafana dashboard
2. Set alert when pool usage exceeds 48/60 (80%)
3. Configure notification channels:
   - **Email**: ops@ipix.ai
   - **Slack**: #alerts-infrastructure
4. Test alert configuration

### Alert Owner
- **Primary**: [Owner Name TBD]
- **Backup**: [Backup Owner TBD]
- **Escalation**: [Escalation Contact TBD]

## Response Procedures

### When Alert Fires

#### Immediate Actions (Within 5 minutes)
1. **Acknowledge alert** in Grafana
2. **Check Grafana dashboard** for connection spike pattern
3. **Identify source** - which service is consuming connections
4. **Check recent deployments** - did a new release cause the spike?

#### Investigation (Within 15 minutes)
1. **Review Database Reports** for historical patterns
2. **Check Vercel logs** for serverless function scaling
3. **Check Mastra agent runs** for concurrent execution spikes
4. **Review Supabase logs** for connection errors

#### Mitigation Actions (If needed)
1. **Scale up connection pool** in Supabase settings (if available)
2. **Throttle incoming requests** at application layer
3. **Kill long-running queries** via Supabase SQL Editor
4. **Restart affected services** if connection leak suspected

### Escalation Procedures

#### Level 1: Standard Alert
- **Owner**: Primary owner
- **Response time**: 15 minutes
- **Action**: Investigate and mitigate

#### Level 2: Sustained High Usage (>30 minutes)
- **Owner**: Primary + Backup owner
- **Response time**: 10 minutes
- **Action**: Escalate to engineering team

#### Level 3: Connection Exhaustion (60/60)
- **Owner**: Engineering lead + CTO
- **Response time**: 5 minutes
- **Action**: Emergency incident response

## Prevention

### Best Practices
1. **Use connection pooling** in application code
2. **Set appropriate timeouts** for database queries
3. **Monitor connection usage** during development
4. **Test load scenarios** before production deployments
5. **Review connection patterns** weekly

### Related Issues
- IPI-740 (MASTRA-OPS-001) — Fixed Mastra-specific pool exhaustion
- IPI-855 (SB-MON-001) — This monitoring configuration

## References

- [Supabase Grafana Cloud Blog](https://supabase.com/blog/observability-for-every-supabase-project-with-grafana-cloud)
- [Connection Management Guide](https://supabase.com/docs/guides/database/connection-management)
- [Telemetry Reports](https://supabase.com/docs/guides/telemetry/reports)

## Testing

### Alert Testing
1. **Test alert fires**: Simulate connection spike (coordinate with team)
2. **Test notification delivery**: Verify email/Slack receives alert
3. **Test acknowledgment**: Verify alert can be acknowledged in Grafana
4. **Test escalation**: Verify escalation chain works

### Runbook Testing
1. **Verify dashboard access**: All team members can access Grafana
2. **Verify runbook accuracy**: Steps match actual UI
3. **Verify contact info**: Owner/backup contacts are current
4. **Schedule monthly review**: Update runbook as needed

## Changelog

| Date | Change | Author |
|------|--------|--------|
| 2026-07-30 | Initial runbook creation | S K |
