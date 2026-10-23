import React, { useState } from 'react';
import { ArrowLeft, Mail, Building2, Calendar, Tag, Save, Trash2 } from 'lucide-react';
import type { Contact } from '../../types';
import { format } from 'date-fns';

interface ContactDetailProps {
  contact: Contact;
  onBack: () => void;
  onSave: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
}

export function ContactDetail({ contact, onBack, onSave, onDelete }: ContactDetailProps) {
  const [editedContact, setEditedContact] = useState(contact);
  const [newTag, setNewTag] = useState('');

  const handleAddTag = () => {
    if (newTag && !editedContact.tags.includes(newTag)) {
      setEditedContact({
        ...editedContact,
        tags: [...editedContact.tags, newTag]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedContact({
      ...editedContact,
      tags: editedContact.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="ml-2 text-lg font-medium">Contact Details</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onSave(editedContact)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Save size={16} className="mr-2" />
            Save
          </button>
          <button
            onClick={() => onDelete(contact.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={editedContact.name}
              onChange={(e) => setEditedContact({ ...editedContact, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={editedContact.email}
              onChange={(e) => setEditedContact({ ...editedContact, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={editedContact.company || ''}
              onChange={(e) => setEditedContact({ ...editedContact, company: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Add
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {editedContact.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {editedContact.lastInteraction && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Last Interaction</h3>
            <p className="text-sm text-gray-600">
              {format(editedContact.lastInteraction, 'PPP')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}