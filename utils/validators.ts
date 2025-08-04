// UPC validation
export const validateUPC = (upc: string): boolean => {
  // Remove any non-digit characters
  const cleanUpc = upc.replace(/\D/g, '');
  
  // Check if it's a valid UPC-A (12 digits)
  if (cleanUpc.length === 12) {
    return validateUPCA(cleanUpc);
  }
  
  // Check if it's a valid UPC-E (8 digits)
  if (cleanUpc.length === 8) {
    return validateUPCE(cleanUpc);
  }
  
  // Check if it's a valid EAN-13 (13 digits)
  if (cleanUpc.length === 13) {
    return validateEAN13(cleanUpc);
  }
  
  // Check if it's a valid EAN-8 (8 digits)
  if (cleanUpc.length === 8) {
    return validateEAN8(cleanUpc);
  }
  
  return false;
};

// UPC-A validation (12 digits)
const validateUPCA = (upc: string): boolean => {
  if (upc.length !== 12) return false;
  
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(upc[i]) * (i % 2 === 0 ? 3 : 1);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(upc[11]);
};

// UPC-E validation (8 digits)
const validateUPCE = (upc: string): boolean => {
  if (upc.length !== 8) return false;
  
  // Convert UPC-E to UPC-A for validation
  const upcA = expandUPCE(upc);
  return validateUPCA(upcA);
};

// EAN-13 validation (13 digits)
const validateEAN13 = (ean: string): boolean => {
  if (ean.length !== 13) return false;
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(ean[i]) * (i % 2 === 0 ? 1 : 3);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(ean[12]);
};

// EAN-8 validation (8 digits)
const validateEAN8 = (ean: string): boolean => {
  if (ean.length !== 8) return false;
  
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(ean[i]) * (i % 2 === 0 ? 3 : 1);
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(ean[7]);
};

// Helper function to expand UPC-E to UPC-A
const expandUPCE = (upcE: string): string => {
  const digit1 = upcE[0];
  const digit2 = upcE[1];
  const digit3 = upcE[2];
  const digit4 = upcE[3];
  const digit5 = upcE[4];
  const digit6 = upcE[5];
  const digit7 = upcE[6];
  const digit8 = upcE[7];
  
  let upcA = digit1;
  
  switch (digit7) {
    case '0':
    case '1':
    case '2':
      upcA += digit2 + digit3 + digit7 + '0000' + digit4 + digit5 + digit6;
      break;
    case '3':
      upcA += digit2 + digit3 + digit4 + '00000' + digit5 + digit6;
      break;
    case '4':
      upcA += digit2 + digit3 + digit4 + digit5 + '00000' + digit6;
      break;
    default:
      upcA += digit2 + digit3 + digit4 + digit5 + digit6 + '0000' + digit7;
      break;
  }
  
  upcA += digit8;
  return upcA;
};

// Validate item fields
export const validateItem = (item: any): string[] => {
  const errors: string[] = [];
  
  // Internal ID is required
  if (!item.internal || item.internal.trim() === '') {
    errors.push('Internal ID is required');
  }
  
  // Quantity must be a non-negative number
  if (item.qty === undefined || isNaN(item.qty) || item.qty < 0) {
    errors.push('Quantity must be a non-negative number');
  }
  
  // Min must be a non-negative number if provided
  if (item.min !== undefined && (isNaN(item.min) || item.min < 0)) {
    errors.push('Min must be a non-negative number');
  }
  
  // Max must be a non-negative number if provided
  if (item.max !== undefined && (isNaN(item.max) || item.max < 0)) {
    errors.push('Max must be a non-negative number');
  }
  
  // Min must be less than or equal to Max if both are provided
  if (item.min !== undefined && item.max !== undefined && item.min > item.max) {
    errors.push('Min must be less than or equal to Max');
  }
  
  // UPC must be valid if provided
  if (item.upc && !validateUPC(item.upc)) {
    errors.push('UPC is invalid');
  }
  
  return errors;
};

// Check for duplicate UPC in items array
export const isDuplicateUPC = (upc: string, items: any[], excludeInternal?: string): boolean => {
  if (!upc) return false;
  
  return items.some(item => 
    item.upc === upc && (!excludeInternal || item.internal !== excludeInternal)
  );
};