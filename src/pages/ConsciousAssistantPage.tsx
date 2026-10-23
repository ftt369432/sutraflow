import React, { useState, useEffect } from 'react';
import { DailyGreeting } from '../components/conscious/DailyGreeting';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useUser } from '@supabase/auth-helpers-react';
import { personalContextService } from '../services/personalContextService';
import {
  Brain,
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Star,
  Heart,
  Zap,
  Settings,
  BarChart3,
  BookOpen,
  Sparkles
} from 'lucide-react';
import type { UserAspiration, DailyGoal } from '../types/conscious-assistant';

export function ConsciousAssistantPage() {
  const user = useUser();
  const [activeTab, setActiveTab] = useState<'greeting' | 'aspirations' | 'goals' | 'insights'>('greeting');
  const [aspirations, setAspirations] = useState<UserAspiration[]>([]);
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [showCreateAspiration, setShowCreateAspiration] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user?.id]);

  const loadUserData = async () => {
    if (!user?.id) return;

    try {
      const [userAspirations, todayGoals] = await Promise.all([
        personalContextService.getUserAspirations(user.id),
        personalContextService.getTodayGoals(user.id)
      ]);

      setAspirations(userAspirations);
      setGoals(todayGoals);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const tabs = [
    { id: 'greeting', label: 'Daily Check-in', icon: Brain },
    { id: 'aspirations', label: 'Aspirations', icon: Target },
    { id: 'goals', label: 'Daily Goals', icon: Calendar },
    { id: 'insights', label: 'Insights', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 via-blue-600 to-indigo-700 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Conscious Assistant
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your personal AI companion that learns, reasons, and grows with you
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-white dark:bg-gray-800 rounded-xl p-1 shadow-lg backdrop-blur-sm border border-gray-200 dark:border-gray-700">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? 'default' : 'ghost'}
                onClick={() => setActiveTab(id as any)}
                className={`rounded-lg px-6 py-3 flex items-center space-x-2 transition-all duration-200 ${
                  activeTab === id 
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg' 
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'greeting' && (
            <div className="space-y-6">
              <DailyGreeting onInteractionComplete={(id) => console.log('Interaction completed:', id)} />
            </div>
          )}

          {activeTab === 'aspirations' && (
            <div className="space-y-6">
              {/* Aspirations Header */}
              <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Aspirations</h2>
                      <p className="text-gray-600 dark:text-gray-400">Long-term goals that drive your daily actions</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowCreateAspiration(true)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Aspiration
                  </Button>
                </div>
              </Card>

              {/* Aspirations List */}
              <div className="grid gap-6">
                {aspirations.map((aspiration) => (
                  <AspirationCard key={aspiration.id} aspiration={aspiration} onUpdate={loadUserData} />
                ))}

                {aspirations.length === 0 && (
                  <Card className="p-8 text-center">
                    <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No aspirations yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start by adding your first long-term goal or aspiration
                    </p>
                    <Button 
                      onClick={() => setShowCreateAspiration(true)}
                      className="bg-gradient-to-r from-amber-500 to-orange-600"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Create Your First Aspiration
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'goals' && (
            <div className="space-y-6">
              {/* Goals Header */}
              <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Today's Goals</h2>
                      <p className="text-gray-600 dark:text-gray-400">Daily actions that move you toward your aspirations</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowCreateGoal(true)}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Goal
                  </Button>
                </div>
              </Card>

              {/* Goals List */}
              <div className="space-y-4">
                {goals.map((goal) => (
                  <GoalCard key={goal.id} goal={goal} onUpdate={loadUserData} />
                ))}

                {goals.length === 0 && (
                  <Card className="p-8 text-center">
                    <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No goals for today</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Set your daily goals to stay focused and make progress
                    </p>
                    <Button 
                      onClick={() => setShowCreateGoal(true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Set Your First Goal
                    </Button>
                  </Card>
                )}
              </div>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Personal Insights</h2>
                    <p className="text-gray-600 dark:text-gray-400">AI-powered analysis of your patterns and progress</p>
                  </div>
                </div>

                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-blue-300 dark:text-blue-600 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Insights Coming Soon</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your conscious assistant is learning your patterns. Check back after a few days of interaction!
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Aspiration Card Component
function AspirationCard({ aspiration, onUpdate }: { aspiration: UserAspiration; onUpdate: () => void }) {
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ElementType> = {
      career: TrendingUp,
      health: Heart,
      personal: Star,
      relationships: Heart,
      financial: Target,
      spiritual: Sparkles,
      creative: Zap,
      learning: BookOpen
    };
    return icons[category] || Target;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      career: 'from-blue-500 to-indigo-600',
      health: 'from-red-500 to-pink-600',
      personal: 'from-purple-500 to-indigo-600',
      relationships: 'from-pink-500 to-rose-600',
      financial: 'from-green-500 to-emerald-600',
      spiritual: 'from-purple-500 to-violet-600',
      creative: 'from-orange-500 to-yellow-600',
      learning: 'from-blue-500 to-cyan-600'
    };
    return colors[category] || 'from-gray-500 to-slate-600';
  };

  const Icon = getCategoryIcon(aspiration.category);

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-200 border-2 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700">
      <div className="flex items-start space-x-4">
        <div className={`p-3 bg-gradient-to-br ${getCategoryColor(aspiration.category)} rounded-lg flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{aspiration.title}</h3>
              {aspiration.description && (
                <p className="text-gray-600 dark:text-gray-400 text-sm">{aspiration.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-1">
              {Array.from({ length: aspiration.priority }, (_, i) => (
                <Star key={i} className="w-4 h-4 fill-current text-yellow-400" />
              ))}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>Progress</span>
              <span>{aspiration.progress_percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={`bg-gradient-to-r ${getCategoryColor(aspiration.category)} h-2 rounded-full transition-all duration-300`}
                style={{ width: `${aspiration.progress_percentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span className="capitalize">{aspiration.category.replace('_', ' ')}</span>
            {aspiration.target_date && (
              <span>Target: {new Date(aspiration.target_date).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// Goal Card Component
function GoalCard({ goal, onUpdate }: { goal: DailyGoal; onUpdate: () => void }) {
  const handleStatusChange = async (newStatus: DailyGoal['status']) => {
    await personalContextService.updateGoalStatus(goal.id, newStatus);
    onUpdate();
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'from-red-500 to-pink-600';
    if (priority >= 3) return 'from-yellow-500 to-orange-600';
    return 'from-green-500 to-emerald-600';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'text-gray-600 dark:text-gray-400',
      in_progress: 'text-blue-600 dark:text-blue-400',
      completed: 'text-green-600 dark:text-green-400',
      skipped: 'text-red-600 dark:text-red-400'
    };
    return colors[status] || 'text-gray-600 dark:text-gray-400';
  };

  return (
    <Card className={`p-4 transition-all duration-200 ${
      goal.status === 'completed' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : ''
    }`}>
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleStatusChange(goal.status === 'completed' ? 'pending' : 'completed')}
          className={`p-2 rounded-full ${
            goal.status === 'completed'
              ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-100 dark:hover:text-green-400'
          }`}
        >
          <Target className="w-5 h-5" />
        </Button>

        <div className="flex-1">
          <h3 className={`font-medium ${
            goal.status === 'completed' 
              ? 'line-through text-gray-500 dark:text-gray-400' 
              : 'text-gray-900 dark:text-white'
          }`}>
            {goal.title}
          </h3>
          {goal.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
          )}
        </div>

        <div className="flex items-center space-x-3 text-sm">
          {goal.estimated_duration && (
            <span className="text-gray-500 dark:text-gray-400">{goal.estimated_duration}m</span>
          )}
          <div className="flex">
            {Array.from({ length: goal.priority }, (_, i) => (
              <Star key={i} className="w-3 h-3 fill-current text-yellow-400" />
            ))}
          </div>
          <span className={`capitalize font-medium ${getStatusColor(goal.status)}`}>
            {goal.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    </Card>
  );
}