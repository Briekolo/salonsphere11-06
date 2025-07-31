# SalonSphere.be Domain Implementation Plan

## Overview
Complete roadmap voor het implementeren van www.salonsphere.be met tenant subdomains zoals `brieks-salon.salonsphere.be` via Easyhost hosting.

## Phase 1: DNS & Hosting Infrastructure (Easyhost Setup)

### 1.1 Domain Configuration bij Easyhost
- **Hoofddomein**: www.salonsphere.be registreren/configureren
- **Wildcard DNS**: `*.salonsphere.be` A-record naar server IP
- **DNS Records Setup**:
  ```
  A     @              → [Server IP]
  A     www            → [Server IP]  
  A     *              → [Server IP]  (Wildcard voor alle subdomains)
  CNAME brieks-salon   → salonsphere.be
  ```

### 1.2 SSL Certificaat Management
- **Wildcard SSL**: `*.salonsphere.be` certificaat via Let's Encrypt of Easyhost
- **Auto-renewal**: Automatische vernieuwing configureren
- **Security**: HTTPS-only redirect voor alle subdomains

### 1.3 Hosting Environment
- **Server Requirements**: Node.js 18+ support bij Easyhost
- **Database**: Supabase connection strings configureren
- **Environment Variables**: Production env vars voor salonsphere.be

## Phase 2: Application Code Modifications

### 2.1 Domain Detection Enhancement
- **Update `tenant-resolver.ts`**: Echte domain parsing vs development path-based
- **Middleware Enhancement**: Real hostname detection in production
- **Host Header Validation**: Security tegen host header injection

### 2.2 Next.js Configuration Updates
- **`next.config.js`**: Domain whitelisting en security headers
- **Middleware**: Production-ready domain routing
- **Asset Optimization**: CDN paths voor salonsphere.be assets

### 2.3 Database Schema Updates
- **Migration**: Ensure `domain_verified` defaults
- **Indexes**: Performance indexes op `subdomain` en `custom_domain`
- **Constraints**: Unique constraints voor domain fields

## Phase 3: Real DNS Verification System

### 3.1 DNS Lookup Implementation
- **Real DNS Library**: Implementeer `dns.resolve()` in `/api/domain/verify`
- **CNAME Validation**: Verificeer dat `brieks-salon.salonsphere.be` → correcte target
- **TTL Management**: Proper DNS caching en TTL handling

### 3.2 Domain Verification Workflow
- **Automated Checks**: Scheduled jobs voor domain re-verification
- **Status Updates**: Real-time status updates in admin panel
- **Error Handling**: Comprehensive error messages voor DNS issues

## Phase 4: Production Deployment Strategy

### 4.1 Environment Setup
- **Production Build**: `npm run build` optimizations
- **Static Generation**: ISR voor client pages performance
- **Caching Strategy**: Redis/memory caching voor tenant data

### 4.2 Monitoring & Security
- **Health Checks**: `/api/health` endpoint voor uptime monitoring
- **Rate Limiting**: Protect tegen abuse van subdomain checking
- **Logging**: Comprehensive logging voor domain resolution issues

## Phase 5: User Experience & Onboarding

### 5.1 Domain Onboarding Flow  
- **Setup Wizard**: Guided domain configuration voor nieuwe tenants
- **DNS Instructions**: Clear step-by-step DNS setup guide
- **Verification Feedback**: Real-time verification status updates

### 5.2 Custom Domain Support
- **Own Domain Setup**: Support voor `www.brieks-salon.be` → Supabase
- **CNAME Instructions**: Clear instructions voor custom domain setup
- **SSL Management**: Automatic SSL voor custom domains

## Technical Implementation Details

### File Changes Required:
1. **`lib/client/tenant-resolver.ts`**: Production domain parsing
2. **`middleware.ts`**: Real hostname detection  
3. **`next.config.js`**: Domain configuration
4. **`app/api/domain/verify/route.ts`**: Real DNS lookup
5. **New: `lib/services/dnsService.ts`**: DNS management utilities
6. **New: `scripts/domain-health-check.ts`**: Monitoring script

### Environment Variables:
```env
NEXT_PUBLIC_APP_DOMAIN=salonsphere.be
NEXT_PUBLIC_APP_URL=https://www.salonsphere.be
DOMAIN_VERIFICATION_ENABLED=true
DNS_RESOLVER_TIMEOUT=5000
```

### Easyhost Specific Considerations:
- **Subdomain Limits**: Check Easyhost limits voor wildcard subdomains
- **SSL Support**: Verify wildcard SSL availability  
- **Node.js Version**: Ensure Node 18+ support
- **Database Connections**: Whitelist Supabase IPs
- **File Permissions**: Ensure proper write permissions voor logs

## Timeline & Phases:
- **Phase 1**: 2-3 days (DNS setup met Easyhost)
- **Phase 2**: 3-4 days (Code modifications)  
- **Phase 3**: 2-3 days (Real DNS verification)
- **Phase 4**: 2-3 days (Production deployment)
- **Phase 5**: 1-2 days (UX polish)

**Total Estimated Time**: 10-15 days

## Success Criteria:
- ✅ `brieks-salon.salonsphere.be` resolves naar correct tenant
- ✅ Subdomain availability checking works in production
- ✅ Real DNS verification voor custom domains  
- ✅ SSL works voor alle subdomains
- ✅ Performance: < 2s load time voor tenant resolution
- ✅ Security: No subdomain hijacking possible

## Current Status
- 🟡 **Development Phase**: Foundation code implemented in domain settings
- 🔴 **Production Phase**: Waiting for salonsphere.be domain access
- 🔴 **DNS Phase**: Needs Easyhost configuration
- 🔴 **SSL Phase**: Needs wildcard certificate setup

## Next Steps when Domain is Available:
1. Contact Easyhost support voor wildcard DNS setup
2. Configure SSL certificaat voor `*.salonsphere.be`
3. Update production environment variables
4. Implement real DNS verification in `app/api/domain/verify/route.ts`
5. Test subdomain resolution: `brieks-salon.salonsphere.be`
6. Deploy to production met nieuwe domain configuration

---
*Created: 2025-01-31*  
*Last Updated: 2025-01-31*