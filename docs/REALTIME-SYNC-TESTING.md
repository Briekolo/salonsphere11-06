# Real-time Salon Profile Sync - Testing Documentatie

## Overzicht
Dit document beschrijft hoe je kunt testen of de automatische synchronisatie tussen admin settings en client module correct werkt.

## Geïmplementeerde Functionaliteit

### 🔄 Real-time Data Sync
- **Admin → Client**: Wijzigingen in salon profiel worden direct doorgestuurd naar client interface
- **Components**: Logo, naam, beschrijving, contact info, theme kleuren
- **Technologie**: Supabase Realtime + React Query cache invalidation

### 📡 Realtime Infrastructure
1. **useTenantRealtime Hook** - Monitort `tenants` tabel updates
2. **TenantProvider** - Client-side real-time subscriptions
3. **ClientHeader** - Optimized React Query caching
4. **Cache Management** - Smart invalidation strategie

## Test Procedure

### Stap 1: Open Beide Modules
1. **Admin Module**: `/admin/settings` (Salon Profiel pagina)
2. **Client Module**: `/[domain]/` (bv. `/brieks-salon/`)

### Stap 2: Controleer Console Logs
Zorg dat je Developer Tools open hebt om de console berichten te zien:

```javascript
// Verwachte logs bij opstarten:
[TenantProvider] Setting up realtime subscription for tenant: {tenant-id}
[useTenantRealtime] Tenant data updated, invalidating caches
```

### Stap 3: Test Real-time Updates
In admin settings pagina:

1. **Logo Upload**: Upload een nieuw logo
   - ✅ Logo moet onmiddellijk verschijnen in client header
   
2. **Salon Naam**: Wijzig salon naam
   - ✅ Naam moet direct updaten in client header
   
3. **Beschrijving**: Voeg of wijzig beschrijving toe
   - ✅ Beschrijving moet zichtbaar worden onder logo
   
4. **Contact Info**: Update telefoon/adres
   - ✅ Contact info moet updaten in top bar

### Stap 4: Verificatie Console Berichten
Bij elke wijziging verwacht je deze logs:

```javascript
// In Admin Settings:
[Admin Settings] Tenant data updated - real-time subscribers should be notified

// In Client Module:
[useTenantRealtime] Tenant data updated, invalidating caches
[TenantProvider] Tenant updated, refreshing data: {payload}
[TenantProvider] Tenant data updated successfully
```

## Troubleshooting

### ❌ Updates komen niet door
1. **Check Console**: Zoek naar error berichten
2. **Reload Client**: Vernieuw client pagina
3. **Check Tenant ID**: Zorg dat beide modules dezelfde tenant ID gebruiken

### ❌ Cache Updates Traag
- **Normale Vertraging**: 1-3 seconden is normaal
- **Te Traag**: Check staleTime instellingen (30 sec max)

### ❌ Subscription Errors
```javascript
// Check voor deze error patterns:
Error: subscription failed
Error: realtime connection lost
```

## Performance Monitoring

### Cache Stats
- **staleTime**: 30 seconden (was 5 minuten)
- **Invalidation**: Real-time bij tenant updates
- **Fallback**: Context data als backup

### Network Traffic
- **Minimal**: Alleen bij daadwerkelijke wijzigingen
- **Efficient**: Smart cache invalidation
- **Reliable**: Fallback mechanisme

## Geavanceerd Testen

### Multi-Tab Test
1. Open client module in meerdere tabs
2. Wijzig admin settings
3. Alle tabs moeten synchron updaten

### Network Offline Test
1. Zet network offline
2. Wijzig admin settings
3. Zet network online
4. Updates moeten alsnog doorkomen

### Performance Test
1. Maak snel achter elkaar meerdere wijzigingen
2. Check of alle updates correct doorkomen
3. Verify geen memory leaks in console

## Implementatie Details

### Query Keys
```typescript
'business-info': Salon basis informatie
'tenant': Tenant context data  
'client-tenant-data': Client-specific caching
'tenant-resolver': Domain-based tenant lookup
```

### Subscription Channels
```typescript
`tenant_realtime_${tenantId}`: Staff module subscriptions
`tenant_updates_${tenantId}`: Client module subscriptions
```

### Database Triggers
- **Table**: `tenants`
- **Events**: `UPDATE` only
- **Filter**: `id=eq.${tenantId}`

## Resultaat Verwachting

Na succesvolle implementatie:
- ⚡ **Instant Updates**: < 3 seconden
- 🔄 **Bi-directional Sync**: Admin ↔ Client
- 💪 **Robust**: Werkt met netwerk issues
- 🎯 **Accurate**: Geen data inconsistentie
- 📱 **Responsive**: Werkt op alle apparaten

## Support & Debug

### Log Levels
```javascript
console.log('[TenantProvider]', message)    // Client updates
console.log('[useTenantRealtime]', message) // Cache invalidation
console.log('[Admin Settings]', message)    // Admin actions
```

### Common Issues
1. **Missing ReactQueryProvider**: Client module needs React Query
2. **Wrong Tenant ID**: Admin/Client using different tenants
3. **RLS Policies**: Database permissions voor real-time
4. **Stale Cache**: Browser cache interference

---

**Status**: ✅ Geïmplementeerd en ready voor testing
**Laatst Updated**: 31 juli 2025