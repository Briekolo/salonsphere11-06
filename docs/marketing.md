# Marketing Module Analysis

## Current Structure

### Pages
- `/app/marketing/page.tsx` - Main marketing page wrapper
- No separate sjablonen (templates) page exists

### Components

#### Main Components
1. **MarketingContent.tsx** - Main container with tab navigation
   - Tab navigation: Campagnes | Sjablonen | Klanten
   - Currently renders different components based on active tab

2. **CampaignList.tsx** - Campaign management interface
   - Shows list of campaigns with status, metrics
   - Includes "Nieuwe Campagne" button that opens CampaignBuilder
   - Contains MarketingStats component at the top
   - Has actions: view details, edit, pause/resume, delete

3. **CampaignBuilder.tsx** - Multi-step campaign creation wizard
   - 5 steps: Basis → Sjabloon → Doelgroep → Planning → Review
   - Template selection in step 2 (shows existing templates)
   - Recently updated to remove custom template creation
   - Has "Install Default Templates" button when no templates exist

4. **EmailTemplates.tsx** - Template management view
   - Currently shows hardcoded template data (not from database)
   - Has preview cards with usage statistics
   - Categories: Afspraken, Promoties, Onboarding, etc.

5. **CustomerSegmentation.tsx** - Customer segment management
   - Create and manage customer segments for targeting

6. **MarketingStats.tsx** - Dashboard statistics
   - Shows campaign performance metrics

7. **CampaignDetail.tsx** - Detailed campaign view
   - Shows campaign analytics and recipient details

### Database Schema

#### Tables (from migration)
1. **marketing_campaigns** - Campaign data
2. **email_templates** - Email template storage
3. **customer_segments** - Customer segment definitions
4. **campaign_recipients** - Campaign recipient tracking
5. **email_metrics** - Email event tracking
6. **email_queue** - Scheduled email queue
7. **unsubscribes** - Unsubscribe management

### Services & Hooks

#### Services
- `campaignService.ts` - Campaign CRUD operations
- `emailTemplateService.ts` - Template management (includes 8 default templates)
- `emailService.ts` - Email sending functionality

#### Hooks
- `useCampaigns.ts` - Campaign data fetching and mutations
- `useEmailTemplates.ts` - Template data fetching and mutations
- `useCustomerSegments.ts` - Segment management
- `useCampaignAnalytics.ts` - Campaign analytics data

### Current Template System

#### Default Templates (in EmailTemplateService)
1. Welkom E-mail (automated)
2. Lente Aanbieding (promotional)
3. Maandelijkse Nieuwsbrief (newsletter)
4. Verjaardag Wensen (automated)
5. Herinnering Afspraak (transactional)
6. Bedankt voor uw Bezoek (transactional)
7. Nieuwe Behandeling Beschikbaar (promotional)
8. Feestdagen Groet (promotional)

### Issues with Current Implementation

1. **EmailTemplates component shows hardcoded data** - Not connected to database
2. **Tab navigation separates templates from campaigns** - User wants them on same page
3. **Complex navigation flow** - Too many steps to create a campaign
4. **Duplicate template data** - Templates exist in both component and service

## Proposed New Structure

### Single Page Layout

```
Marketing Page
├── Header with "Nieuwe Campagne" button
├── Active/Ongoing Campaigns Section
│   ├── Campaign cards with status and quick actions
│   └── Real-time metrics
└── Template Selection Section
    ├── Template grid with preview
    └── Quick "Use Template" → Campaign Builder
```

### Benefits
1. **Streamlined workflow** - See campaigns and templates in one view
2. **Faster campaign creation** - Direct template selection
3. **Better overview** - Monitor active campaigns while planning new ones
4. **Reduced complexity** - Remove unnecessary tab navigation

### Implementation Requirements
1. Merge CampaignList and EmailTemplates components
2. Update EmailTemplates to use database data
3. Simplify campaign creation flow
4. Remove tab navigation from MarketingContent
5. Add template preview/selection at bottom of campaign list