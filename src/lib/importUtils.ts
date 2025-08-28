import * as XLSX from 'xlsx';
import { CustomerFormData } from '../types/customer';
import { bulkImportCustomers } from './customerService';

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errors: Array<{
    row: number;
    error: string;
    data?: CustomerFormData;
  }>;
}

// Parse Excel/CSV file and extract customer data
export const parseCustomerFile = async (file: File): Promise<CustomerFormData[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;
        
        if (file.name.endsWith('.csv')) {
          // Parse CSV
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          // Parse Excel
          workbook = XLSX.read(data, { type: 'array' });
        }
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const customers = parseCustomerData(jsonData as unknown[][]);
        resolve(customers);
      } catch {
        reject(new Error('Failed to parse file'));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    
    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

// Parse raw data into CustomerFormData format
const parseCustomerData = (data: unknown[][]): CustomerFormData[] => {
  if (data.length === 0) return [];
  
  // Get headers from first row
  const headers = data[0].map((header: unknown) => 
    String(header).toLowerCase().trim().replace(/\s+/g, '_')
  );
  
  const customers: CustomerFormData[] = [];
  
  // Process each row (skip header)
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    
    try {
      const customer = parseCustomerRow(headers, row);
      if (customer.name && customer.email) {
        customers.push(customer);
      }
    } catch {
      console.warn(`Error parsing row ${i + 1}`);
    }
  }
  
  return customers;
};

// Parse individual customer row
const parseCustomerRow = (headers: string[], row: unknown[]): CustomerFormData => {
  const getValue = (possibleKeys: string[]): string => {
    for (const key of possibleKeys) {
      const index = headers.findIndex(h => h.includes(key));
      if (index !== -1 && row[index]) {
        return String(row[index]).trim();
      }
    }
    return '';
  };
  
  const getDateValue = (possibleKeys: string[]): string => {
    const value = getValue(possibleKeys);
    if (!value) return '';
    
    try {
      // Handle Excel date serial numbers
      if (!isNaN(Number(value)) && Number(value) > 25000) {
        const excelDate = XLSX.SSF.parse_date_code(Number(value));
        return `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
      }
      
      // Handle regular date strings
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch {
      console.warn('Error parsing date:', value);
    }
    
    return '';
  };
  
  const getBooleanValue = (possibleKeys: string[]): boolean => {
    const value = getValue(possibleKeys).toLowerCase();
    return ['yes', 'true', '1', 'y', 'on'].includes(value);
  };
  
  // Extract customer data with flexible column mapping
  const customer: CustomerFormData = {
    name: getValue(['name', 'customer_name', 'full_name', 'client_name']),
    email: getValue(['email', 'email_address', 'e_mail']),
    phone: getValue(['phone', 'phone_number', 'mobile', 'contact', 'telephone']),
    dateOfBirth: getDateValue(['date_of_birth', 'dob', 'birth_date', 'birthday']),
    gender: getValue(['gender', 'sex']) as 'male' | 'female' | 'other' | undefined,
    address: {
      street: getValue(['address', 'street', 'street_address', 'address_line_1']),
      city: getValue(['city', 'town']),
      state: getValue(['state', 'province', 'region']),
      zipCode: getValue(['zip', 'zip_code', 'postal_code', 'postcode'])
    },
    preferences: {
      preferredBranch: getValue(['branch', 'preferred_branch', 'location']),
      allergies: getValue(['allergies', 'allergy', 'medical_notes']),
      skinType: getValue(['skin_type', 'skin']) as 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive' | undefined || 'normal',
      notes: getValue(['notes', 'comments', 'remarks', 'additional_info'])
    },
    marketingConsent: {
      email: getBooleanValue(['email_marketing', 'email_consent', 'marketing_email']),
      sms: getBooleanValue(['sms_marketing', 'sms_consent', 'text_marketing']),
      phone: getBooleanValue(['phone_marketing', 'call_consent', 'phone_consent'])
    },
    tags: getValue(['tags', 'categories', 'labels'])
  };
  
  // Clean up empty address if all fields are empty
  if (!customer.address?.street && !customer.address?.city && !customer.address?.state && !customer.address?.zipCode) {
    customer.address = undefined;
  }
  
  // Clean up empty preferences if all fields are empty
  if (!customer.preferences?.preferredBranch && !customer.preferences?.allergies && !customer.preferences?.notes) {
    customer.preferences = {
      skinType: customer.preferences?.skinType || 'normal'
    };
  }
  
  return customer;
};

// Import customers from file
export const importCustomersFromFile = async (file: File): Promise<ImportResult> => {
  try {
    // Parse the file
    const customers = await parseCustomerFile(file);
    
    if (customers.length === 0) {
      return {
        success: false,
        totalRows: 0,
        successfulImports: 0,
        failedImports: 0,
        errors: [{ row: 0, error: 'No valid customer data found in file' }]
      };
    }
    
    // Import to Firebase
    const result = await bulkImportCustomers(customers);
    
    const successfulImports = result.successful;
    const failedImports = result.failed;
    
    const errors = result.errors.map((errorMsg, index) => {
      const rowMatch = errorMsg.match(/Row (\d+):/);
      const rowNumber = rowMatch ? parseInt(rowMatch[1]) : index + 2;
      const errorText = errorMsg.replace(/Row \d+: /, '');
      
      return {
        row: rowNumber,
        error: errorText,
        data: customers[rowNumber - 2] // -2 because row numbers start from 2 (after header)
      };
    });
    
    return {
      success: failedImports === 0,
      totalRows: customers.length,
      successfulImports,
      failedImports,
      errors
    };
  } catch (error) {
    return {
      success: false,
      totalRows: 0,
      successfulImports: 0,
      failedImports: 0,
      errors: [{ 
        row: 0, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }]
    };
  }
};

// Generate sample CSV template
export const generateSampleCSV = (): string => {
  const headers = [
    'Name',
    'Email',
    'Phone',
    'Date of Birth',
    'Gender',
    'Street Address',
    'City',
    'State',
    'ZIP Code',
    'Preferred Branch',
    'Allergies',
    'Skin Type',
    'Notes',
    'Email Marketing',
    'SMS Marketing',
    'Phone Marketing',
    'Tags'
  ];
  
  const sampleData = [
    [
      'Jane Smith',
      'jane.smith@email.com',
      '+1-555-0123',
      '1990-05-15',
      'female',
      '123 Beauty Lane',
      'Los Angeles',
      'CA',
      '90210',
      'Downtown Branch',
      'None',
      'combination',
      'Prefers evening appointments',
      'yes',
      'no',
      'yes',
      'VIP, Regular'
    ],
    [
      'John Doe',
      'john.doe@email.com',
      '+1-555-0124',
      '1985-12-03',
      'male',
      '456 Salon Street',
      'Beverly Hills',
      'CA',
      '90211',
      'Beverly Hills Branch',
      'Sensitive to fragrances',
      'sensitive',
      'First-time customer',
      'yes',
      'yes',
      'no',
      'New Customer'
    ]
  ];
  
  const csvContent = [headers, ...sampleData]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');
  
  return csvContent;
};

// Download sample CSV file
export const downloadSampleCSV = () => {
  const csvContent = generateSampleCSV();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'customer_import_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Validate file format
export const validateFileFormat = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = [
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/csv'
  ];
  
  const allowedExtensions = ['.xlsx', '.xls', '.csv'];
  
  const hasValidType = allowedTypes.includes(file.type);
  const hasValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidType && !hasValidExtension) {
    return {
      valid: false,
      error: 'Please upload a valid Excel (.xlsx, .xls) or CSV (.csv) file'
    };
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB limit
    return {
      valid: false,
      error: 'File size must be less than 10MB'
    };
  }
  
  return { valid: true };
};