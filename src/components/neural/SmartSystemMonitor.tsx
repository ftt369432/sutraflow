/**
 * 🧠 SmartSystemMonitor - Neural AI Meta-Brain Component
 * 
 * Autonomous problem detection, learning, and self-healing system
 * Implements Schmidt Principle automation within Neural AI architecture
 * 
 * Features:
 * - Real-time system health monitoring
 * - Autonomous problem detection & solution
 * - Learning from successful fixes
 * - Integration with CollectiveBrainMonitor
 * - Self-healing capabilities
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '../../lib/utils';
import { 
  Brain, Activity, AlertTriangle, CheckCircle, Zap, 
  TrendingUp, Target, Cpu, Database, Network,
  Eye, Settings, Pause, Play, RotateCcw
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Progress } from '../ui/Progress';

// Types for Neural System Monitoring
interface SystemProblem {
  id: string;
  type: 'performance' | 'error' | 'memory' | 'network' | 'ui';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detected: Date;
  context: any;
  solution?: string;
  resolved?: Date;
}

interface LearningPattern {
  id: string;
  problemType: string;
  solution: string;
  successRate: number;
  timesApplied: number;
  lastUsed: Date;
}

interface SystemMetrics {
  performance: number;
  memory: number;
  errors: number;
  responseTime: number;
  userSatisfaction: number;
}

export interface SmartSystemMonitorProps {
  isVisible: boolean;
  onClose: () => void;
  neuralAIEnabled?: boolean;
  onProblemDetected?: (problem: SystemProblem) => void;
  onSolutionApplied?: (solution: string, success: boolean) => void;
}

export function SmartSystemMonitor({ 
  isVisible, 
  onClose, 
  neuralAIEnabled = true,
  onProblemDetected,
  onSolutionApplied 
}: SmartSystemMonitorProps) {
  // Neural State
  const [isActive, setIsActive] = useState(neuralAIEnabled);
  const [currentProblems, setCurrentProblems] = useState<SystemProblem[]>([]);
  const [resolvedProblems, setResolvedProblems] = useState<SystemProblem[]>([]);
  const [learningPatterns, setLearningPatterns] = useState<LearningPattern[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    performance: 95,
    memory: 78,
    errors: 2,
    responseTime: 120,
    userSatisfaction: 92
  });
  
  // Schmidt Principle Automation
  const [isLearning, setIsLearning] = useState(true);
  const [autoFix, setAutoFix] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.8);

  // Monitoring refs
  const monitoringInterval = useRef<NodeJS.Timeout | null>(null);
  const problemCounter = useRef(0);

  /**
   * 🔍 Real-Time Problem Detection System
   * Continuously monitors system health and detects anomalies
   */
  const detectProblems = useCallback(() => {
    const problems: SystemProblem[] = [];

    // Performance monitoring
    if (metrics.performance < 80) {
      problems.push({
        id: `perf_${Date.now()}`,
        type: 'performance',
        severity: metrics.performance < 60 ? 'high' : 'medium',
        description: `Performance degraded to ${metrics.performance}%`,
        detected: new Date(),
        context: { currentPerf: metrics.performance }
      });
    }

    // Memory monitoring  
    if (metrics.memory > 90) {
      problems.push({
        id: `mem_${Date.now()}`,
        type: 'memory',
        severity: metrics.memory > 95 ? 'critical' : 'high',
        description: `High memory usage: ${metrics.memory}%`,
        detected: new Date(),
        context: { memoryUsage: metrics.memory }
      });
    }

    // Error rate monitoring
    if (metrics.errors > 5) {
      problems.push({
        id: `err_${Date.now()}`,
        type: 'error',
        severity: 'medium',
        description: `Error rate elevated: ${metrics.errors} errors/min`,
        detected: new Date(),
        context: { errorRate: metrics.errors }
      });
    }

    // Response time monitoring
    if (metrics.responseTime > 500) {
      problems.push({
        id: `resp_${Date.now()}`,
        type: 'network',
        severity: metrics.responseTime > 1000 ? 'high' : 'medium',
        description: `Slow response time: ${metrics.responseTime}ms`,
        detected: new Date(),
        context: { responseTime: metrics.responseTime }
      });
    }

    // Add new problems
    if (problems.length > 0) {
      setCurrentProblems(prev => {
        const newProblems = problems.filter(p => 
          !prev.some(existing => existing.description === p.description)
        );
        newProblems.forEach(onProblemDetected);
        return [...prev, ...newProblems];
      });
    }
  }, [metrics, onProblemDetected]);

  /**
   * 🤖 Autonomous Solution Generation
   * Uses learned patterns to generate solutions
   */
  const generateSolution = useCallback((problem: SystemProblem): string | null => {
    // Find matching learned patterns
    const matchingPatterns = learningPatterns.filter(pattern => 
      pattern.problemType === problem.type && 
      pattern.successRate >= confidenceThreshold
    );

    if (matchingPatterns.length === 0) return null;

    // Select best solution based on success rate and recency
    const bestPattern = matchingPatterns.reduce((best, current) => 
      current.successRate > best.successRate ? current : best
    );

    return bestPattern.solution;
  }, [learningPatterns, confidenceThreshold]);

  /**
   * ⚡ Autonomous Problem Resolution
   * Implements Schmidt Principle: Learn → Build → Test → Iterate
   */
  const resolveProblem = useCallback(async (problem: SystemProblem) => {
    if (!autoFix) return;

    // LEARN: Analyze the problem
    console.log('🧠 [Neural AI] Analyzing problem:', problem.description);
    
    // BUILD: Generate solution
    const solution = generateSolution(problem);
    if (!solution) {
      console.log('🤔 [Neural AI] No learned solution available, learning...');
      return;
    }

    // TEST: Apply solution
    console.log('🔧 [Neural AI] Applying solution:', solution);
    
    try {
      // Simulate solution application (replace with actual fix logic)
      const success = await applySolution(problem, solution);
      
      // ITERATE: Learn from result
      if (success) {
        // Mark problem as resolved
        setCurrentProblems(prev => prev.filter(p => p.id !== problem.id));
        setResolvedProblems(prev => [...prev, { ...problem, resolved: new Date() }]);
        
        // Update learning patterns
        updateLearningPattern(problem.type, solution, true);
        
        console.log('✅ [Neural AI] Problem resolved successfully');
        onSolutionApplied?.(solution, true);
      } else {
        // Learn from failure
        updateLearningPattern(problem.type, solution, false);
        console.log('❌ [Neural AI] Solution failed, updating learning patterns');
        onSolutionApplied?.(solution, false);
      }
    } catch (error) {
      console.error('🚨 [Neural AI] Error applying solution:', error);
      updateLearningPattern(problem.type, solution, false);
    }
  }, [autoFix, generateSolution, onSolutionApplied]);

  /**
   * 🔧 Solution Application Logic
   * Replace with actual system fix implementations
   */
  const applySolution = async (problem: SystemProblem, solution: string): Promise<boolean> => {
    // Simulate solution application
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Apply actual fixes based on problem type
    switch (problem.type) {
      case 'performance':
        // Clear caches, optimize queries, etc.
        setMetrics(prev => ({ ...prev, performance: Math.min(100, prev.performance + 15) }));
        break;
      case 'memory':
        // Garbage collection, clear unused resources
        setMetrics(prev => ({ ...prev, memory: Math.max(20, prev.memory - 20) }));
        break;
      case 'error':
        // Reset error counters, restart services
        setMetrics(prev => ({ ...prev, errors: Math.max(0, prev.errors - 3) }));
        break;
      case 'network':
        // Reconnect, optimize requests
        setMetrics(prev => ({ ...prev, responseTime: Math.max(50, prev.responseTime - 100) }));
        break;
    }
    
    return Math.random() > 0.1; // 90% success rate for simulation
  };

  /**
   * 📊 Learning Pattern Updates
   * Updates success rates and usage statistics
   */
  const updateLearningPattern = useCallback((problemType: string, solution: string, success: boolean) => {
    setLearningPatterns(prev => {
      const existing = prev.find(p => p.problemType === problemType && p.solution === solution);
      
      if (existing) {
        // Update existing pattern
        const newTimesApplied = existing.timesApplied + 1;
        const newSuccessRate = success 
          ? (existing.successRate * existing.timesApplied + 1) / newTimesApplied
          : (existing.successRate * existing.timesApplied) / newTimesApplied;
        
        return prev.map(p => 
          p.id === existing.id 
            ? { ...p, successRate: newSuccessRate, timesApplied: newTimesApplied, lastUsed: new Date() }
            : p
        );
      } else {
        // Create new pattern
        return [...prev, {
          id: `pattern_${Date.now()}`,
          problemType,
          solution,
          successRate: success ? 1.0 : 0.0,
          timesApplied: 1,
          lastUsed: new Date()
        }];
      }
    });
  }, []);

  /**
   * 🔄 Continuous Monitoring Loop
   */
  useEffect(() => {
    if (!isActive) return;

    monitoringInterval.current = setInterval(() => {
      // Simulate changing metrics (replace with real monitoring)
      setMetrics(prev => ({
        performance: Math.max(60, Math.min(100, prev.performance + (Math.random() - 0.5) * 10)),
        memory: Math.max(20, Math.min(100, prev.memory + (Math.random() - 0.4) * 5)),
        errors: Math.max(0, Math.min(20, prev.errors + (Math.random() - 0.7) * 3)),
        responseTime: Math.max(50, Math.min(2000, prev.responseTime + (Math.random() - 0.6) * 100)),
        userSatisfaction: Math.max(70, Math.min(100, prev.userSatisfaction + (Math.random() - 0.3) * 5))
      }));

      // Detect problems
      detectProblems();
    }, 3000);

    return () => {
      if (monitoringInterval.current) {
        clearInterval(monitoringInterval.current);
      }
    };
  }, [isActive, detectProblems]);

  /**
   * ⚡ Auto-resolve problems
   */
  useEffect(() => {
    currentProblems.forEach(problem => {
      if (autoFix && problem.severity !== 'low') {
        resolveProblem(problem);
      }
    });
  }, [currentProblems, autoFix, resolveProblem]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl h-[80vh] bg-background border-2 border-primary/20 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6" />
              <div>
                <h2 className="text-xl font-bold">Smart System Monitor</h2>
                <p className="text-blue-100 text-sm">Neural AI Meta-Brain • Schmidt Principle Automation</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant={isActive ? "secondary" : "outline"}
                size="sm"
                onClick={() => setIsActive(!isActive)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {isActive ? 'Pause' : 'Start'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                ×
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex h-full">
          {/* Left Panel - System Metrics */}
          <div className="w-1/3 border-r border-border p-4 space-y-4">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Health
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Performance</span>
                    <span className={metrics.performance > 80 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.performance}%
                    </span>
                  </div>
                  <Progress value={metrics.performance} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory</span>
                    <span className={metrics.memory < 80 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.memory}%
                    </span>
                  </div>
                  <Progress value={metrics.memory} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Response Time</span>
                    <span className={metrics.responseTime < 200 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.responseTime}ms
                    </span>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Errors/min</span>
                    <span className={metrics.errors < 3 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.errors}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Neural Settings
              </h3>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={isLearning}
                    onChange={(e) => setIsLearning(e.target.checked)}
                  />
                  <span className="text-sm">Learning Mode</span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    checked={autoFix}
                    onChange={(e) => setAutoFix(e.target.checked)}
                  />
                  <span className="text-sm">Auto-Fix Problems</span>
                </label>
                
                <div>
                  <label className="text-sm block mb-1">Confidence Threshold</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1"
                    step="0.1"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
                    className="w-full"
                    title="Confidence threshold for applying solutions"
                    aria-label="Confidence threshold"
                  />
                  <span className="text-xs text-muted-foreground">{Math.round(confidenceThreshold * 100)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Panel - Current Problems */}
          <div className="w-1/3 border-r border-border p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Problems ({currentProblems.length})
            </h3>
            
            <div className="space-y-2 h-64 overflow-y-auto">
              {currentProblems.map(problem => (
                <Card key={problem.id} className={cn(
                  "p-3 border-l-4",
                  problem.severity === 'critical' && 'border-l-red-500 bg-red-50',
                  problem.severity === 'high' && 'border-l-orange-500 bg-orange-50',
                  problem.severity === 'medium' && 'border-l-yellow-500 bg-yellow-50',
                  problem.severity === 'low' && 'border-l-blue-500 bg-blue-50'
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge variant="outline" className="mb-1 text-xs">
                        {problem.type}
                      </Badge>
                      <p className="text-sm">{problem.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {problem.detected.toLocaleTimeString()}
                      </p>
                    </div>
                    <Badge variant={
                      problem.severity === 'critical' ? 'destructive' : 
                      problem.severity === 'high' ? 'destructive' :
                      problem.severity === 'medium' ? 'secondary' : 'default'
                    }>
                      {problem.severity}
                    </Badge>
                  </div>
                </Card>
              ))}
              
              {currentProblems.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p>All systems healthy</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Learning Patterns */}
          <div className="w-1/3 p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Learning Patterns ({learningPatterns.length})
            </h3>
            
            <div className="space-y-2 h-64 overflow-y-auto">
              {learningPatterns
                .sort((a, b) => b.successRate - a.successRate)
                .slice(0, 10)
                .map(pattern => (
                <Card key={pattern.id} className="p-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {pattern.problemType}
                    </Badge>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {Math.round(pattern.successRate * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pattern.timesApplied} uses
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {pattern.solution}
                  </p>
                </Card>
              ))}
              
              {learningPatterns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Eye className="h-8 w-8 mx-auto mb-2" />
                  <p>Learning in progress...</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">{resolvedProblems.length}</div>
                  <div className="text-xs text-muted-foreground">Resolved</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-600">{metrics.userSatisfaction}%</div>
                  <div className="text-xs text-muted-foreground">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}