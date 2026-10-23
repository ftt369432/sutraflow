import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, Stethoscope, Users, ArrowRight } from 'lucide-react';

const modules = [
  {
    id: 'legal',
    name: 'Legal Module',
    description: 'AI-powered legal document analysis and case management',
    icon: Briefcase,
    status: 'available',
    features: [
      'Document analysis and summarization',
      'Case law research assistance',
      'Automated document generation',
      'Client communication management',
    ],
  },
  {
    id: 'real-estate',
    name: 'Real Estate Module',
    description: 'Streamline property management and documentation',
    icon: Building2,
    status: 'coming-soon',
    features: [
      'Property analysis automation',
      'Contract generation',
      'Market analysis tools',
      'Client portal integration',
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare Module',
    description: 'Enhance patient care and practice management',
    icon: Stethoscope,
    status: 'coming-soon',
    features: [
      'Patient documentation assistance',
      'Scheduling optimization',
      'Treatment plan analysis',
      'Compliance monitoring',
    ],
  },
  {
    id: 'corporate',
    name: 'Corporate Module',
    description: 'Optimize business operations and workflow',
    icon: Users,
    status: 'coming-soon',
    features: [
      'Workflow automation',
      'Document processing',
      'Meeting summarization',
      'Project management',
    ],
  },
];

export default function ModulesPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-blue-600 dark:text-blue-400">
            Industry Solutions
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Choose Your AI Module
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
            Select from our specialized AI modules, each designed to address the unique challenges of your industry.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-2">
          {modules.map((module) => (
            <div
              key={module.id}
              className="flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center gap-x-4">
                  <module.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold leading-7 tracking-tight text-gray-900 dark:text-white">
                    {module.name}
                  </h3>
                  {module.status === 'coming-soon' && (
                    <span className="inline-flex items-center rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-2 py-1 text-xs font-medium text-yellow-800 dark:text-yellow-500">
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-500 dark:text-gray-400">
                  {module.description}
                </p>
                <ul className="mt-6 space-y-3">
                  {module.features.map((feature, index) => (
                    <li key={index} className="flex gap-x-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
                      <span className="text-blue-600 dark:text-blue-400">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-auto flex border-t border-gray-200 dark:border-gray-700">
                <Link
                  to={module.status === 'available' ? `/modules/${module.id}` : '#'}
                  className={`flex items-center gap-x-2 flex-1 px-6 py-4 text-sm font-semibold leading-6 ${
                    module.status === 'available'
                      ? 'text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {module.status === 'available' ? 'Learn more' : 'Coming soon'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}