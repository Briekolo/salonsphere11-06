/**
 * Utility to properly serialize error objects for logging
 * Handles Supabase errors and other error types that don't serialize well
 */
export function serializeError(error: any): any {
  if (!error) return { message: 'No error object provided' };
  
  const errorInfo: any = {};
  
  // Try to get standard error properties
  if (error.message !== undefined) errorInfo.message = error.message;
  if (error.code !== undefined) errorInfo.code = error.code;
  if (error.hint !== undefined) errorInfo.hint = error.hint;
  if (error.details !== undefined) errorInfo.details = error.details;
  if (error.stack !== undefined) errorInfo.stack = error.stack;
  if (error.name !== undefined) errorInfo.name = error.name;
  
  // Supabase specific error properties
  if (error.status !== undefined) errorInfo.status = error.status;
  if (error.statusText !== undefined) errorInfo.statusText = error.statusText;
  
  // Try to get all enumerable properties
  try {
    const enumProps = Object.keys(error);
    if (enumProps.length > 0) {
      errorInfo.enumerableProperties = enumProps;
      enumProps.forEach(prop => {
        if (!(prop in errorInfo)) {
          errorInfo[prop] = error[prop];
        }
      });
    }
  } catch (e) {
    errorInfo.enumerablePropsError = 'Could not get enumerable properties';
  }
  
  // Try to get all properties including non-enumerable
  try {
    const allProps = Object.getOwnPropertyNames(error);
    if (allProps.length > 0) {
      errorInfo.allProperties = allProps;
      allProps.forEach(prop => {
        if (!(prop in errorInfo)) {
          try {
            const value = error[prop];
            if (typeof value !== 'function') {
              errorInfo[prop] = value;
            }
          } catch (e) {
            // Property might be a getter that throws
          }
        }
      });
    }
  } catch (e) {
    errorInfo.allPropsError = 'Could not get all properties';
  }
  
  // Try JSON.stringify as last resort
  try {
    errorInfo.stringified = JSON.stringify(error, (key, value) => {
      if (typeof value === 'function') return '[Function]';
      if (value instanceof Error) {
        const errorObj: any = {};
        if (value.message) errorObj.message = value.message;
        if (value.name) errorObj.name = value.name;
        if (value.stack) errorObj.stack = value.stack;
        // Add other properties without overwriting
        Object.keys(value).forEach(key => {
          if (!(key in errorObj)) {
            errorObj[key] = value[key];
          }
        });
        return errorObj;
      }
      return value;
    }, 2);
  } catch (e) {
    errorInfo.stringifyError = 'Could not stringify error';
  }
  
  // If we still have no useful info, convert to string
  if (Object.keys(errorInfo).length === 0) {
    errorInfo.toString = String(error);
  }
  
  return errorInfo;
}