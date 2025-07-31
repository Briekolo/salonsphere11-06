/**
 * Comprehensive error logger that works around Next.js console interception
 * and ensures error details are properly displayed
 */
export function logError(context: string, error: any, additionalInfo?: any) {
  // Use multiple console methods to ensure visibility
  console.log(`\n=== ERROR: ${context} ===`);
  
  // 1. Log error as string first (most reliable)
  console.log('Error toString:', String(error));
  
  // 2. Try JSON.stringify with replacer
  try {
    const stringified = JSON.stringify(error, (key, value) => {
      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name,
          stack: value.stack,
          code: (value as any).code,
          hint: (value as any).hint,
          details: (value as any).details,
          status: (value as any).status,
          statusText: (value as any).statusText
        };
      }
      return value;
    }, 2);
    console.log('Error JSON:', stringified);
  } catch (e) {
    console.log('Could not stringify error:', e);
  }
  
  // 3. Log individual properties explicitly
  console.log('Error type:', typeof error);
  console.log('Error constructor:', error?.constructor?.name);
  console.log('Error instanceof Error:', error instanceof Error);
  
  // Standard error properties
  if (error?.message !== undefined) console.log('Error message:', error.message);
  if (error?.code !== undefined) console.log('Error code:', error.code);
  if (error?.hint !== undefined) console.log('Error hint:', error.hint);
  if (error?.details !== undefined) console.log('Error details:', error.details);
  if (error?.stack !== undefined) console.log('Error stack:', error.stack);
  if (error?.name !== undefined) console.log('Error name:', error.name);
  
  // Supabase specific properties
  if (error?.status !== undefined) console.log('Error status:', error.status);
  if (error?.statusText !== undefined) console.log('Error statusText:', error.statusText);
  
  // 4. Try to get all property names
  try {
    const allProps = Object.getOwnPropertyNames(error);
    console.log('All property names:', allProps);
    
    // Log each property value
    allProps.forEach(prop => {
      try {
        const value = error[prop];
        if (typeof value !== 'function') {
          console.log(`Error.${prop}:`, value);
        }
      } catch (e) {
        console.log(`Error.${prop}: [Could not access]`);
      }
    });
  } catch (e) {
    console.log('Could not get property names');
  }
  
  // 5. Use console.dir for deep inspection (might work better in some browsers)
  console.log('Error object inspection:');
  console.dir(error, { depth: null });
  
  // 6. Log additional info if provided
  if (additionalInfo) {
    console.log('Additional context:');
    console.log(JSON.stringify(additionalInfo, null, 2));
  }
  
  console.log(`=== End ERROR: ${context} ===\n`);
}

/**
 * Simple debug logger for tracing execution flow
 */
export function debugLog(context: string, message: string, data?: any) {
  console.log(`[DEBUG] ${context}: ${message}`);
  if (data !== undefined) {
    try {
      console.log('[DEBUG] Data:', JSON.stringify(data, null, 2));
    } catch (e) {
      console.log('[DEBUG] Data (unstringifiable):', data);
    }
  }
}