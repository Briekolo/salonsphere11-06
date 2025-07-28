// Manual cleanup script - paste this in browser console if needed
async function forceAuthCleanup() {
  console.log('🧹 Starting aggressive auth cleanup...');
  
  try {
    // 1. Clear all localStorage
    console.log('Clearing localStorage...');
    const lsKeys = Object.keys(localStorage);
    lsKeys.forEach(key => {
      console.log(`  Removing: ${key}`);
      localStorage.removeItem(key);
    });
    console.log(`✅ Cleared ${lsKeys.length} localStorage items`);
    
    // 2. Clear all sessionStorage
    console.log('Clearing sessionStorage...');
    const ssKeys = Object.keys(sessionStorage);
    ssKeys.forEach(key => {
      console.log(`  Removing: ${key}`);
      sessionStorage.removeItem(key);
    });
    console.log(`✅ Cleared ${ssKeys.length} sessionStorage items`);
    
    // 3. Clear all cookies
    console.log('Clearing cookies...');
    document.cookie.split(";").forEach(function(c) { 
      const eqPos = c.indexOf("=");
      const name = eqPos > -1 ? c.substr(0, eqPos).trim() : c.trim();
      console.log(`  Clearing cookie: ${name}`);
      // Try multiple patterns
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + window.location.hostname;
    });
    console.log('✅ Attempted to clear all cookies');
    
    // 4. Clear IndexedDB
    if ('indexedDB' in window) {
      console.log('Clearing IndexedDB...');
      const dbs = await indexedDB.databases();
      for (const db of dbs) {
        if (db.name) {
          console.log(`  Deleting database: ${db.name}`);
          await indexedDB.deleteDatabase(db.name);
        }
      }
      console.log('✅ Cleared IndexedDB');
    }
    
    // 5. Unregister service workers
    if ('serviceWorker' in navigator) {
      console.log('Unregistering service workers...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('  Unregistered a service worker');
      }
      console.log('✅ Unregistered all service workers');
    }
    
    // 6. Clear caches
    if ('caches' in window) {
      console.log('Clearing caches...');
      const names = await caches.keys();
      for (const name of names) {
        console.log(`  Deleting cache: ${name}`);
        await caches.delete(name);
      }
      console.log('✅ Cleared all caches');
    }
    
    console.log('🎉 Cleanup complete! Redirecting to sign-in...');
    setTimeout(() => {
      window.location.href = '/auth/sign-in';
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    console.log('Redirecting anyway...');
    setTimeout(() => {
      window.location.href = '/auth/sign-in';
    }, 2000);
  }
}

// Run it
forceAuthCleanup();