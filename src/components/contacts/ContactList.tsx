import React from 'react';
import { Mail, Building2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Contact } from '../../types';
import { groupContactsByFirstLetter } from '../../services/contacts/contactManager';

interface ContactListProps {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
}

export function ContactList({ contacts, onSelect }: ContactListProps) {
  const groupedContacts = groupContactsByFirstLetter(contacts);
  const letters = Array.from(groupedContacts.keys()).sort();

  return (
    <div className="space-y-6">
      {letters.map(letter => (
        <div key={letter}>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">{letter}</h3>
          <div className="space-y-2">
            {groupedContacts.get(letter)?.map(contact => (
              <div
                key={contact.id}
                onClick={() => onSelect(contact)}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow cursor-pointer"
              >
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                    {contact.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">{contact.name}</h4>
                      {contact.lastInteraction && (
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {formatDistanceToNow(contact.lastInteraction, { addSuffix: true })}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Mail size={14} className="mr-1" />
                        {contact.email}
                      </span>
                      {contact.company && (
                        <span className="flex items-center">
                          <Building2 size={14} className="mr-1" />
                          {contact.company}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {contact.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {contact.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}