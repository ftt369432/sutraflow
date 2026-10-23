import React from 'react';
import { Check, HelpCircle } from 'lucide-react';
import type { Plan } from '../../services/payment/plans';

interface PlanCardProps {
  plan: Plan;
  isYearly: boolean;
  isCurrentPlan: boolean;
  onSubscribe: (planId: string) => void;
  loading?: boolean;
}

export function PlanCard({
  plan,
  isYearly,
  isCurrentPlan,
  onSubscribe,
  loading
}: PlanCardProps) {
  const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
  const period = isYearly ? '/year' : '/month';

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-200">
      <div className="p-6">
        <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
        <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
        <p className="mt-4">
          <span className="text-3xl font-bold text-gray-900">${price}</span>
          <span className="text-sm text-gray-500">{period}</span>
        </p>
        {plan.maxUsers && (
          <p className="mt-2 text-sm text-gray-500">
            Up to {plan.maxUsers} users
            {plan.pricePerExtraUser && (
              <span> (${plan.pricePerExtraUser}/extra user)</span>
            )}
          </p>
        )}
        <button
          onClick={() => onSubscribe(plan.id)}
          disabled={loading || isCurrentPlan}
          className={`mt-8 block w-full px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white ${
            isCurrentPlan
              ? 'bg-green-600 cursor-default'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isCurrentPlan ? (
            'Current Plan'
          ) : loading ? (
            'Processing...'
          ) : (
            'Subscribe Now'
          )}
        </button>
      </div>
      <div className="px-6 pt-6 pb-8">
        <h4 className="text-sm font-medium text-gray-900">Features</h4>
        <ul className="mt-6 space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="flex-shrink-0 h-5 w-5 text-green-500 mt-0.5" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {feature.title}
                </p>
                <p className="text-sm text-gray-500">
                  {feature.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}