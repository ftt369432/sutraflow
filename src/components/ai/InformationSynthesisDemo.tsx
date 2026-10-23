import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Brain, Search, FileText, Mail, Calendar, Users, Lightbulb, TrendingUp } from 'lucide-react';

export interface InformationSynthesisDemoProps {
  onTryExample: (query: string) => void;
}

export const InformationSynthesisDemo: React.FC<InformationSynthesisDemoProps> = ({ onTryExample }) => {
  const [selectedExample, setSelectedExample] = useState<string | null>(null);

  const examples = [
    {
      id: 'legal-research',
      title: 'Legal Research',
      query: 'synthesize: What are the key legal precedents for contract disputes in employment law?',
      description: 'Combines legal documents, case law, and regulations',
      icon: <FileText className="h-5 w-5" />,
      sources: ['Legal Documents', 'Case Law', 'Regulations', 'Legal Briefs'],
      complexity: 'High'
    },
    {
      id: 'client-preparation',
      title: 'Client Meeting Prep',
      query: 'research: Prepare comprehensive briefing for Johnson vs. Smith case meeting tomorrow',
      description: 'Synthesizes case files, emails, calendar events, and contact information',
      icon: <Users className="h-5 w-5" />,
      sources: ['Case Files', 'Email History', 'Calendar', 'Contact Records'],
      complexity: 'Medium'
    },
    {
      id: 'market-analysis',
      title: 'Market Analysis',
      query: 'synthesize: Current trends in legal tech adoption by mid-size law firms',
      description: 'Analyzes industry reports, news articles, and research papers',
      icon: <TrendingUp className="h-5 w-5" />,
      sources: ['Industry Reports', 'News Articles', 'Research Papers', 'Market Data'],
      complexity: 'Medium'
    },
    {
      id: 'compliance-review',
      title: 'Compliance Review',
      query: 'research: What are the latest GDPR compliance requirements for legal data processing?',
      description: 'Reviews regulatory updates, compliance guides, and best practices',
      icon: <Search className="h-5 w-5" />,
      sources: ['Regulatory Updates', 'Compliance Guides', 'Best Practices', 'Legal Opinions'],
      complexity: 'High'
    }
  ];

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'High': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-blue-900 dark:text-blue-100">
                Information Synthesis Service
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                Combine data from multiple sources to get comprehensive insights
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">How to Use:</h4>
              <ul className="text-sm space-y-1 text-blue-800 dark:text-blue-200">
                <li>• Type <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">synthesize: your query</code></li>
                <li>• Or use <code className="bg-blue-200 dark:bg-blue-800 px-1 rounded">research: your query</code></li>
                <li>• The system will analyze multiple data sources</li>
                <li>• Get comprehensive insights with confidence scores</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">Data Sources:</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  <FileText className="h-3 w-3 mr-1" />
                  Documents
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Mail className="h-3 w-3 mr-1" />
                  Emails
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  Calendar
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  Contacts
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  <Brain className="h-3 w-3 mr-1" />
                  Knowledge Base
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Examples */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Try These Examples:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {examples.map((example) => (
            <Card 
              key={example.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedExample === example.id 
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400' 
                  : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
              }`}
              onClick={() => setSelectedExample(selectedExample === example.id ? null : example.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {example.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{example.title}</CardTitle>
                      <Badge className={`text-xs mt-1 ${getComplexityColor(example.complexity)}`}>
                        {example.complexity} Complexity
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTryExample(example.query);
                    }}
                    className="gleaming-silver-button"
                  >
                    Try It
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {example.description}
                </p>
                
                {selectedExample === example.id && (
                  <div className="space-y-3 border-t pt-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Query:
                      </h5>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded block">
                        {example.query}
                      </code>
                    </div>
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Sources Analyzed:
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {example.sources.map((source, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {source}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            What You&apos;ll Get
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg inline-block">
                <Brain className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold">Comprehensive Insights</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                AI-powered synthesis of information from multiple sources
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg inline-block">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold">Confidence Scores</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Know how reliable the synthesized information is
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg inline-block">
                <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold">Actionable Items</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get specific tasks and follow-up actions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 