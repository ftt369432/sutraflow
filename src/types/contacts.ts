export interface Contact {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  // Add other relevant fields
} 