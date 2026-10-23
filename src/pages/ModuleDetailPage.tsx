import React from 'react';
import { useParams } from 'react-router-dom';

export default function ModuleDetailPage() {
  const { moduleId } = useParams();

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <h1>Module Detail: {moduleId}</h1>
        {/* TODO: Implement full module detail page */}
      </div>
    </div>
  );
}