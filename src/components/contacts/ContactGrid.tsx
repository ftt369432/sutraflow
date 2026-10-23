import React from 'react';
import { Mail, Building2, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Contact } from '../../types';

interface ContactGridProps {
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
}

export function ContactGrid({ contacts, onSelect }: ContactGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          onClick={() => onSelect(contact)}
          className="bg-white p-4 rounded-lg shadow-sm hover:shadow cursor-pointer"
        >
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
              {contact.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{contact.name}</h3>
              <div className="mt-1 space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail size={14} className="mr-2" />
                  {contact.email}
                </div>
                {contact.company && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Building2 size={14} className="mr-2" />
                    {contact.company}
                  </div>
                )}
              </div>
              {contact.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {contact.lastInteraction && (
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <Calendar size={12} className="mr-1" />
                  Last interaction: {formatDistanceToNow(contact.lastInteraction, { addSuffix: true })}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}