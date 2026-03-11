# IT Service Management — Meridian Bank

## Overview

This knowledge base covers Meridian Bank's IT Service Management (ITSM) processes, including incident response, change management, problem management, and service desk operations. Pace AI assists L1/L2 analysts by triaging alerts, correlating incidents, recommending resolutions, and escalating when human approval is required.

## Incident Classification

### Priority Matrix

| Priority | Response SLA | Resolution SLA | Examples |
|----------|-------------|----------------|---------|
| Critical (P1) | 15 minutes | 4 hours | Core banking down, email gateway outage, network failure |
| High (P2) | 30 minutes | 8 hours | VPN failures, authentication issues, branch system degradation |
| Medium (P3) | 2 hours | 24 hours | Printer issues, single-user access problems, app slowdowns |
| Low (P4) | 8 hours | 72 hours | Hardware requests, cosmetic UI bugs |

### Escalation Path

1. **L1 Triage** — Pace AI auto-classifies and routes
2. **L2 Engineering** — Assigned for P1/P2 incidents
3. **L3 Architecture** — Engaged for systemic or infrastructure-level failures
4. **Vendor Escalation** — For third-party platform outages (Microsoft, Cisco, Oracle)

## Common Incident Types

### Email Gateway Outages
- **Common causes**: Exchange Online throttling, MX record propagation, TLS certificate expiry, spam filter false positives
- **Diagnostic steps**: Check MX records, test SMTP relay, review Exchange admin center, validate SSL cert dates
- **Resolution**: Flush DNS, restart transport services, whitelist flagged domains, renew certificates
- **Escalation trigger**: Outage exceeds 30 minutes or affects 500+ users

### VPN Authentication Failures
- **Common causes**: RADIUS server overload, MFA token sync issues, expired AD accounts, certificate revocation
- **Diagnostic steps**: Check RADIUS logs, validate AD account status, test MFA provider connectivity
- **Resolution**: Restart RADIUS services, force MFA token resync, unlock AD accounts
- **Escalation trigger**: >50 concurrent failures or authentication infrastructure unreachable

### Database Performance Degradation
- **Common causes**: Long-running queries, index fragmentation, missing statistics, connection pool exhaustion
- **Diagnostic steps**: Run DMV queries for blocking chains, check index fragmentation %, review wait statistics
- **Resolution**: Kill blocking queries with approval, update statistics, rebuild fragmented indexes
- **Escalation trigger**: Transaction rollback risk or data integrity concerns — requires DBA sign-off

## Change Management

### Standard Changes (Pre-approved)
- Routine patch deployments (Tuesday maintenance window)
- User provisioning and deprovisioning
- SSL certificate renewals (automated)
- DNS record updates for known domains

### Normal Changes (CAB Approval Required)
- Infrastructure changes affecting >100 users
- Database schema modifications
- Firewall rule changes
- Third-party integration updates

### Emergency Changes
- Must be approved by IT Director or CISO
- Implemented within the incident window
- Post-implementation review required within 24 hours

## Service Desk

### Contact
- **Internal Helpdesk**: ext. 5000
- **Email**: itsupport@meridianbank.internal
- **Self-service portal**: itsm.meridianbank.internal

### Business Hours
- Monday–Friday: 7:00 AM – 8:00 PM ET
- Saturday: 9:00 AM – 5:00 PM ET
- 24/7 on-call for P1/P2 incidents

## Key Systems

| System | Purpose | Owner |
|--------|---------|-------|
| ServiceNow | ITSM ticketing | IT Operations |
| Microsoft Exchange Online | Email | Collaboration Team |
| Cisco AnyConnect | VPN | Network Engineering |
| Oracle DB 19c | Core banking database | DBA Team |
| Active Directory | Identity & Access | IAM Team |
| CrowdStrike | Endpoint security | Security Operations |

## SLA Compliance Targets

- P1 incidents resolved within SLA: **≥ 95%**
- P2 incidents resolved within SLA: **≥ 92%**
- First contact resolution rate: **≥ 75%**
- Customer satisfaction score: **≥ 4.2 / 5.0**
