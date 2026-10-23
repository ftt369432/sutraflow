import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { EmailCategoryRule, Email } from '../types';

export function useEmailCategories() {
  const [categoryRules, setCategoryRules] = useState<EmailCategoryRule[]>([]);

  const addCategoryRule = useCallback((rule: Omit<EmailCategoryRule, 'id'>) => {
    setCategoryRules(current => [...current, { ...rule, id: uuidv4() }]);
  }, []);

  const categorizeEmail = useCallback((email: Email): EmailCategory[] => {
    return categoryRules
      .filter(rule => 
        rule.conditions.every(condition => {
          const value = email[condition.field].toLowerCase();
          const test = condition.value.toLowerCase();
          
          switch (condition.operator) {
            case 'contains':
              return value.includes(test);
            case 'equals':
              return value === test;
            case 'startsWith':
              return value.startsWith(test);
            case 'endsWith':
              return value.endsWith(test);
            default:
              return false;
          }
        })
      )
      .map(rule => rule.category);
  }, [categoryRules]);

  return {
    categoryRules,
    addCategoryRule,
    categorizeEmail
  };
} 