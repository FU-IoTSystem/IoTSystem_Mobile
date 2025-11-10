// Polyfill fix for "TypeError: cannot assign to property 'protocol/pathname' which has only a getter"
// This is a known issue with React Native's fetch implementation and URL handling
// Common causes: whatwg-fetch, axios polyfills, fetch polyfills, or URL manipulation libraries

// List of read-only URL properties that libraries might try to modify
const readOnlyURLProperties = [
  'protocol',
  'pathname',
  'hash',
  'search',
  'host',
  'hostname',
  'port',
  'origin',
  'href'
];

// Fix read-only URL property issues
if (typeof URL !== 'undefined' && URL.prototype) {
  readOnlyURLProperties.forEach(propName => {
    try {
      const descriptor = Object.getOwnPropertyDescriptor(URL.prototype, propName);
      
      // If property is read-only (has getter but no setter), make it writable
      if (descriptor && descriptor.get && !descriptor.set) {
        // Store original getter
        const originalGetter = descriptor.get;
        
        // Redefine property with both getter and setter
        Object.defineProperty(URL.prototype, propName, {
          get: function() {
            return originalGetter.call(this);
          },
          set: function(value) {
            // Silently ignore attempts to set read-only properties
            // This prevents the error when libraries like whatwg-fetch try to modify them
            // The property will still return the original value via the getter
          },
          enumerable: true,
          configurable: true
        });
      }
    } catch (e) {
      // Silently fail if we can't patch a specific property
      // This is not critical for app functionality
      if (__DEV__) {
        console.warn(`Could not patch URL.prototype.${propName}:`, e.message);
      }
    }
  });
}

export default {};

