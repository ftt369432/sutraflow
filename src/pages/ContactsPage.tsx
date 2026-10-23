import React, { useState, useEffect } from 'react';
import { Plus, Users, UserPlus } from 'lucide-react';
import { ContactGrid } from '../components/contacts/ContactGrid';
import { ContactList } from '../components/contacts/ContactList';
import { ContactForm } from '../components/contacts/ContactForm';
import { ContactFilters } from '../components/contacts/ContactFilters';
import { filterContacts } from '../services/contacts/contactManager';
import type { Contact } from '../types';

const STORAGE_KEY = 'genieflow_contacts';

export function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((c: any) => ({
          ...c,
          lastInteraction: c.lastInteraction ? new Date(c.lastInteraction) : undefined
        }));
      }
    } catch (e) {
      console.error('Failed to load contacts from storage:', e);
    }
    return [];
  });

  const [showForm, setShowForm] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    } catch (e) {
      console.error('Failed to save contacts to storage:', e);
    }
  }, [contacts]);

  const handleCreateContact = (contactData: Partial<Contact>) => {
    const newContact: Contact = {
      id: String(Date.now()),
      name: contactData.name || '',
      email: contactData.email || '',
      company: contactData.company,
      tags: contactData.tags || [],
      lastInteraction: new Date(),
    };
    setContacts([newContact, ...contacts]);
    setShowForm(false);
  };

  const handleUpdateContact = (contactData: Partial<Contact>) => {
    if (!selectedContact) return;
    setContacts(contacts.map(contact =>
      contact.id === selectedContact.id
        ? { ...contact, ...contactData }
        : contact
    ));
    setSelectedContact(null);
    setShowForm(false);
  };

  const handleTagSelect = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Get all unique tags from contacts
  const allTags = Array.from(new Set(contacts.flatMap(contact => contact.tags || [])));

  // Filter contacts based on search query and selected tags
  const filteredContacts = filterContacts(contacts, searchQuery, selectedTags);

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts & Directory</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Manage claimants, attorneys, medical examiners, and firm connections.</p>
          </div>
          <button
            onClick={() => {
              setSelectedContact(null);
              setShowForm(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center font-medium shadow-xs transition-colors"
          >
            <Plus size={18} className="mr-1.5" />
            Add Contact
          </button>
        </div>

        {contacts.length > 0 && (
          <ContactFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedTags={selectedTags}
            onTagSelect={handleTagSelect}
            availableTags={allTags}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        )}
      </div>

      {showForm && (
        <ContactForm
          onSubmit={selectedContact ? handleUpdateContact : handleCreateContact}
          onCancel={() => {
            setShowForm(false);
            setSelectedContact(null);
          }}
          initialData={selectedContact || undefined}
        />
      )}

      {filteredContacts.length > 0 ? (
        viewMode === 'grid' ? (
          <ContactGrid
            contacts={filteredContacts}
            onSelect={(contact) => {
              setSelectedContact(contact);
              setShowForm(true);
            }}
          />
        ) : (
          <ContactList
            contacts={filteredContacts}
            onSelect={(contact) => {
              setSelectedContact(contact);
              setShowForm(true);
            }}
          />
        )
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900/40">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
            <Users className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1.5">
            {contacts.length === 0 ? 'No Contacts Added Yet' : 'No Matching Contacts'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-5">
            {contacts.length === 0
              ? 'Keep your case participants, medical experts, and colleagues organized in one centralized directory.'
              : 'Try clearing your search query or tag filters to see your contacts.'}
          </p>
          {contacts.length === 0 ? (
            <button
              onClick={() => {
                setSelectedContact(null);
                setShowForm(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4 mr-1.5" />
              Add First Contact
            </button>
          ) : (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTags([]);
              }}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ContactsPage;