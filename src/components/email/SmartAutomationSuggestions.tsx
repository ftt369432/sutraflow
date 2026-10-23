import React, { useState, useEffect, useCallback } from 'react';
import { getStatusClass, getCategoryClass } from '../../styles/semanticColors';
import { 
  Brain, 
  Folder, 
  Calendar, 
  ArrowRight, 
  Plus, 
  Sparkles,
  Filter,
  Clock,
  User,
  Building,
  Tag
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { EmailMessage } from '../../services/email/types';

interface AutomationRule {
  id: string;
  name: string;
  trigger: string;
  actions: string[];
  confidence: number;
  emailsMatched: number;
  icon: React.ReactNode;
  category: 'person' | 'court' | 'client' | 'document' | 'schedule';
}

interface SmartAutomationSuggestionsProps {
  emails: EmailMessage[];
  onCreateRule: (rule: AutomationRule) => void;
  onPreviewRule: (rule: AutomationRule) => void;
}

export function SmartAutomationSuggestions({ 
  emails, 
  onCreateRule, 
  onPreviewRule 
}: SmartAutomationSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AutomationRule[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Analyze email patterns and generate smart suggestions
  useEffect(() => {
    if (!emails || emails.length === 0) return;
    
    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      const analyzedSuggestions = analyzeEmailPatterns(emails);
      setSuggestions(analyzedSuggestions);
      setIsAnalyzing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [emails]);

  const analyzeEmailPatterns = (emailList: EmailMessage[]): AutomationRule[] => {
    const patterns: Map<string, { emails: EmailMessage[], trigger: string, category: AutomationRule['category'] }> = new Map();
    
    // Analyze email senders and content patterns
    emailList.forEach(email => {
      const from = typeof email.from === 'string' ? email.from : email.from?.[0] || '';
      const subject = email.subject?.toLowerCase() || '';
      const body = email.body?.toLowerCase() || email.snippet?.toLowerCase() || '';
      
      // Pattern 1: Frequent senders (like "Allen")
      const senderName = from.split('@')[0].toLowerCase();
      const senderDomain = from.split('@')[1]?.toLowerCase() || '';
      
      if (senderName.includes('allen') || subject.includes('allen') || body.includes('allen')) {
        addPattern(patterns, 'allen_emails', email, 'Contains "Allen"', 'person');
      }
      
      // Pattern 2: Court/Legal documents
      if (subject.includes('hearing') || subject.includes('court') || subject.includes('wcab') || 
          body.includes('hearing') || body.includes('court') || body.includes('notice')) {
        addPattern(patterns, 'court_docs', email, 'Court/Hearing documents', 'court');
      }
      
      // Pattern 3: Client communications
      if (senderDomain.includes('gmail.com') || senderDomain.includes('yahoo.com') || 
          subject.includes('question') || subject.includes('help') || body.includes('client')) {
        addPattern(patterns, 'client_emails', email, 'Client communications', 'client');
      }
      
      // Pattern 4: Medical records
      if (subject.includes('medical') || subject.includes('records') || subject.includes('doctor') ||
          body.includes('medical') || body.includes('records') || body.includes('treatment')) {
        addPattern(patterns, 'medical_docs', email, 'Medical records/documents', 'document');
      }
      
      // Pattern 5: Scheduling/Calendar emails
      if (subject.includes('meeting') || subject.includes('appointment') || subject.includes('schedule') ||
          body.includes('meeting') || body.includes('appointment') || body.includes('time')) {
        addPattern(patterns, 'schedule_emails', email, 'Scheduling/Meeting requests', 'schedule');
      }
    });

    // Convert patterns to automation suggestions
    const suggestions: AutomationRule[] = [];
    
    patterns.forEach((data, patternId) => {
      if (data.emails.length >= 2) { // Only suggest if pattern appears multiple times
        const rule = createAutomationRule(patternId, data.trigger, data.emails, data.category);
        suggestions.push(rule);
      }
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  };

  const addPattern = (
    patterns: Map<string, { emails: EmailMessage[], trigger: string, category: AutomationRule['category'] }>, 
    key: string, 
    email: EmailMessage, 
    trigger: string,
    category: AutomationRule['category']
  ) => {
    if (!patterns.has(key)) {
      patterns.set(key, { emails: [], trigger, category });
    }
    patterns.get(key)!.emails.push(email);
  };

  const createAutomationRule = (
    id: string, 
    trigger: string, 
    matchedEmails: EmailMessage[],
    category: AutomationRule['category']
  ): AutomationRule => {
    const confidence = Math.min(95, 60 + (matchedEmails.length * 5));
    
    const categoryConfig = {
      person: {
        icon: <User className="h-4 w-4" />,
        actions: [`📁 Move to "${trigger}" folder`, '📅 Auto-calendar if contains dates', '🔔 Set priority: High']
      },
      court: {
        icon: <Building className="h-4 w-4" />,
        actions: ['📁 Move to "Legal/Court" folder', '📅 Auto-calendar hearings', '⚠️ Set priority: Urgent', '📋 Create case tasks']
      },
      client: {
        icon: <User className="h-4 w-4" />,
        actions: ['📁 Move to "Clients" folder', '🔔 Set priority: Medium', '📅 Schedule follow-up reminder']
      },
      document: {
        icon: <Tag className="h-4 w-4" />,
        actions: ['📁 Move to "Documents/Medical" folder', '📎 Extract attachments', '📅 Set review reminder']
      },
      schedule: {
        icon: <Clock className="h-4 w-4" />,
        actions: ['📁 Move to "Meetings" folder', '📅 Auto-calendar events', '🔔 Set reminder 1 hour before']
      }
    };

    return {
      id,
      name: `Auto-process ${trigger}`,
      trigger,
      actions: categoryConfig[category].actions,
      confidence,
      emailsMatched: matchedEmails.length,
      icon: categoryConfig[category].icon,
      category
    };
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'badge-active';
    if (confidence >= 60) return 'badge-warning';
    return 'badge-critical';
  };

  const getCategoryColor = (category: AutomationRule['category']) =>
    getCategoryClass(category);

  if (isAnalyzing) {
    return (
      <Card className="card-metallic">
        <CardHeader>
          <CardTitle className="text-sm flex items-center text-blue-400">
            <Brain className="h-4 w-4 mr-2 animate-pulse" />
            Analyzing Email Patterns...
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-400">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm">Discovering automation opportunities</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card className="card-metallic">
        <CardHeader>
          <CardTitle className="text-sm flex items-center text-blue-400">
            <Brain className="h-4 w-4 mr-2" />
            Smart Automation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <p className="text-sm text-gray-400 mb-3">No automation patterns detected yet.</p>
          <p className="text-xs text-gray-500">Process more emails to get smart suggestions!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-metallic">
      <CardHeader>
        <CardTitle className="text-sm flex items-center text-blue-400">
          <Brain className="h-4 w-4 mr-2" />
          Smart Automation Suggestions
          <Badge className="ml-2 bg-blue-600 text-xs">{suggestions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id}
            className="p-3 bg-blue-dark-metallic-800/50 rounded-lg border border-blue-dark-metallic-600"
          >
            {/* Rule Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded ${getCategoryColor(suggestion.category)}`}>
                  {suggestion.icon}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-white">{suggestion.name}</h4>
                  <p className="text-xs text-gray-400">"{suggestion.trigger}"</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${getConfidenceColor(suggestion.confidence)} text-xs`}>
                  {suggestion.confidence}% match
                </Badge>
                <Badge className="bg-gray-600 text-xs">
                  {suggestion.emailsMatched} emails
                </Badge>
              </div>
            </div>

            {/* Actions Preview */}
            <div className="space-y-1 mb-3">
              {suggestion.actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 text-xs text-gray-300">
                  <ArrowRight className="h-3 w-3 text-blue-400" />
                  <span>{action}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => onCreateRule(suggestion)}
                className="btn-blue-metallic text-xs flex-1"
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Rule
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPreviewRule(suggestion)}
                className="text-xs"
              >
                <Filter className="h-3 w-3 mr-1" />
                Preview
              </Button>
            </div>
          </div>
        ))}

        {/* Help Text */}
        <div className="text-xs text-gray-500 pt-2 border-t border-blue-dark-metallic-700">
          💡 <strong>Pro Tip:</strong> Smart suggestions appear based on your email patterns. 
          The more emails you process, the better the suggestions become!
        </div>
      </CardContent>
    </Card>
  );
} 