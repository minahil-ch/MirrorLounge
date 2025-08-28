export interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  preferences?: {
    preferredBranch?: string;
    preferredServices?: string[];
    allergies?: string[];
    skinType?: 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
    notes?: string;
  };
  visitHistory?: {
    totalVisits: number;
    lastVisit?: Date;
    totalSpent: number;
    favoriteServices?: string[];
  };
  loyaltyPoints?: number;
  membershipTier?: 'bronze' | 'silver' | 'gold' | 'platinum';
  referredBy?: string;
  marketingConsent?: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
  status: 'active' | 'inactive' | 'blocked';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  preferences?: {
    preferredBranch?: string;
    allergies?: string;
    skinType?: 'normal' | 'dry' | 'oily' | 'combination' | 'sensitive';
    notes?: string;
  };
  marketingConsent?: {
    email: boolean;
    sms: boolean;
    phone: boolean;
  };
  tags?: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  newCustomersThisMonth: number;
  topSpenders: Customer[];
  membershipDistribution: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
  };
}

export interface CustomerFilter {
  search?: string;
  status?: 'active' | 'inactive' | 'blocked' | 'all';
  membershipTier?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'all';
  branch?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}