import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { Task } from '../../types';

interface TaskConversionModalProps {
  onClose: () => void;
  onConvert: (task: Task) => void;
}

export function TaskConversionModal({ onClose, onConvert }: TaskConversionModalProps) {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Convert Tasks to Events</h3>
          <Button onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {/* Add task selection and conversion UI */}
      </div>
    </div>
  );
} 