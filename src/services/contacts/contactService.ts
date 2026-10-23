import type { Contact } from '../../types';

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Tech Corp',
    tags: ['client']
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    company: 'Design Inc',
    tags: ['partner']
  }
];

export class ContactService {
  static async fetchContacts(): Promise<Contact[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockContacts), 500);
    });
  }
}

// Keep the original function for backward compatibility
export async function fetchContacts(): Promise<Contact[]> {
  return ContactService.fetchContacts();
}