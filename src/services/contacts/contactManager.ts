import type { Contact } from '../../types';

export function sortContacts(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => a.name.localeCompare(b.name));
}

export function groupContactsByFirstLetter(contacts: Contact[]): Map<string, Contact[]> {
  const grouped = new Map<string, Contact[]>();
  
  sortContacts(contacts).forEach(contact => {
    const firstLetter = contact.name.charAt(0).toUpperCase();
    if (!grouped.has(firstLetter)) {
      grouped.set(firstLetter, []);
    }
    grouped.get(firstLetter)?.push(contact);
  });
  
  return grouped;
}

export function filterContacts(
  contacts: Contact[],
  search: string,
  tags: string[] = []
): Contact[] {
  return contacts.filter(contact => {
    const matchesSearch = search === '' || 
      contact.name.toLowerCase().includes(search.toLowerCase()) ||
      contact.email.toLowerCase().includes(search.toLowerCase()) ||
      contact.company?.toLowerCase().includes(search.toLowerCase());
      
    const matchesTags = tags.length === 0 ||
      tags.every(tag => contact.tags.includes(tag));
      
    return matchesSearch && matchesTags;
  });
}