import React from 'react';
import { motion, PanInfo, useAnimation } from 'framer-motion';
import { Check, X, AlertCircle, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

export interface PlanFeature {
  name: string;
  included: boolean;
  limited?: boolean;
  info?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  billingPeriod: 'monthly' | 'yearly' | 'forever';
  discountPercentage?: number;
  features: PlanFeature[];
  mostPopular?: boolean;
  color?: string;
  buttonText: string;
}

interface SwipeablePlanCardProps {
  plans: SubscriptionPlan[];
  currentPlanIndex: number;
  onPlanChange: (newIndex: number) => void;
  onSelectPlan: (planId: string) => void;
  isLoading?: boolean;
}

export function SwipeablePlanCard({
  plans,
  currentPlanIndex,
  onPlanChange,
  onSelectPlan,
  isLoading = false
}: SwipeablePlanCardProps) {
  const controls = useAnimation();
  const plan = plans[currentPlanIndex];

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100; // px
    
    if (info.offset.x < -threshold && currentPlanIndex < plans.length - 1) {
      // Swipe left, go to next plan
      onPlanChange(currentPlanIndex + 1);
    } else if (info.offset.x > threshold && currentPlanIndex > 0) {
      // Swipe right, go to previous plan
      onPlanChange(currentPlanIndex - 1);
    } else {
      // Return to initial position
      controls.start({ x: 0 });
    }
  };

  const nextPlan = () => {
    if (currentPlanIndex < plans.length - 1) {
      onPlanChange(currentPlanIndex + 1);
    }
  };

  const prevPlan = () => {
    if (currentPlanIndex > 0) {
      onPlanChange(currentPlanIndex - 1);
    }
  };

  // Helper to determine badge color based on plan
  const getBadgeColor = () => {
    if (plan.color) return plan.color;
    
    switch (plan.id) {
      case 'free':
        return 'bg-gray-500 hover:bg-gray-600';
      case 'pro':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'business':
        return 'bg-green-500 hover:bg-green-600';
      case 'enterprise':
        return 'bg-purple-500 hover:bg-purple-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Navigation Controls */}
      <div className="flex justify-between items-center mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={prevPlan}
          disabled={currentPlanIndex === 0}
          className={cn(
            "text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400",
            currentPlanIndex === 0 && "opacity-50 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Previous
        </Button>
        
        <div className="text-center">
          <Badge variant="outline" className="px-3 py-1">
            {currentPlanIndex + 1} of {plans.length}
          </Badge>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={nextPlan}
          disabled={currentPlanIndex === plans.length - 1}
          className={cn(
            "text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400",
            currentPlanIndex === plans.length - 1 && "opacity-50 cursor-not-allowed"
          )}
        >
          Next
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>

      {/* Swipeable Plan Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        animate={controls}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="touch-pan-y"
      >
        <div 
          className={cn(
            "bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg border-2",
            plan.mostPopular ? "border-blue-500 dark:border-blue-400" : "border-gray-200 dark:border-gray-700",
            "relative" // for positioning the most popular badge
          )}
        >
          {plan.mostPopular && (
            <div className="absolute top-0 right-0">
              <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                MOST POPULAR
              </div>
            </div>
          )}
          
          {/* Plan Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
            <p className="mt-1 text-gray-600 dark:text-gray-400 text-sm">{plan.description}</p>
            
            <div className="mt-4 flex items-baseline">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                {plan.price === 0 ? 'Free' : `$${plan.price}`}
              </span>
              {plan.price > 0 && (
                <span className="ml-1 text-sm text-gray-500 dark:text-gray-400">
                  /{plan.billingPeriod === 'forever' ? '' : plan.billingPeriod}
                </span>
              )}
              {plan.discountPercentage && (
                <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs font-semibold rounded-full">
                  Save {plan.discountPercentage}%
                </span>
              )}
            </div>
          </div>
          
          {/* Plan Features */}
          <div className="p-6">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">Features</h4>
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  {feature.included ? (
                    <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <X className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <span className={cn(
                    "text-sm",
                    feature.included ? "text-gray-700 dark:text-gray-300" : "text-gray-500 dark:text-gray-500"
                  )}>
                    {feature.name}
                    {feature.limited && (
                      <span className="text-yellow-600 dark:text-yellow-400"> (Limited)</span>
                    )}
                  </span>
                  {feature.info && (
                    <div className="group relative ml-1 cursor-help">
                      <AlertCircle className="h-4 w-4 text-gray-400" />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded shadow-lg w-48">
                        {feature.info}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          
          {/* Plan Action */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <Button 
              className={cn(
                "w-full", 
                getBadgeColor()
              )}
              disabled={isLoading}
              onClick={() => onSelectPlan(plan.id)}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? 'Processing...' : plan.buttonText}
            </Button>
            
            {/* Swipe Indicator */}
            <p className="text-xs text-center mt-4 text-gray-500 dark:text-gray-400">
              <span className="inline-block animate-pulse">← Swipe to compare plans →</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Plan Navigation Dots */}
      <div className="flex justify-center mt-6 space-x-2">
        {plans.map((p, idx) => (
          <button
            key={p.id}
            onClick={() => onPlanChange(idx)}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              currentPlanIndex === idx 
                ? cn("w-8 bg-blue-500 dark:bg-blue-400")
                : "bg-gray-300 dark:bg-gray-600"
            )}
            aria-label={`Go to ${p.name} plan`}
          />
        ))}
      </div>
    </div>
  );
} 