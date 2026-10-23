import React, { useState, useEffect } from 'react';
import { consciousAssistantService } from '../../services/consciousAssistantService';
import { personalContextService } from '../../services/personalContextService';
import { useUser } from '@supabase/auth-helpers-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import {
  Sun,
  Moon,
  Star,
  Target,
  Heart,
  CheckCircle,
  Clock,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Calendar,
  Zap,
  Brain
} from 'lucide-react';
import type { ConsciousGreeting, DailyGoal, FollowUpQuestion } from '../../types/conscious-assistant';

interface DailyGreetingProps {
  onInteractionComplete?: (interactionId: string) => void;
}

export function DailyGreeting({ onInteractionComplete }: DailyGreetingProps) {
  const user = useUser();
  const [greeting, setGreeting] = useState<ConsciousGreeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [showMoodCheck, setShowMoodCheck] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDailyGreeting();
    }
  }, [user?.id]);

  const loadDailyGreeting = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const dailyGreeting = await consciousAssistantService.generateDailyGreeting(user.id);
      setGreeting(dailyGreeting);
      
      // Set interaction ID for tracking responses
      setInteractionId(`greeting_${user.id}_${Date.now()}`);
    } catch (error) {
      console.error('Failed to load daily greeting:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionResponse = async (questionId: string, response: any) => {
    const newResponses = { ...responses, [questionId]: response };
    setResponses(newResponses);

    if (interactionId) {
      await consciousAssistantService.processUserResponse(
        user!.id!,
        { question_id: questionId, response },
        interactionId
      );
    }

    // Move to next question or complete
    if (currentQuestionIndex < (greeting?.follow_up_questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered
      onInteractionComplete?.(interactionId!);
    }
  };

  const handleMoodResponse = async (moodData: any) => {
    if (!user?.id) return;

    await personalContextService.recordEmotionalState({
      user_id: user.id,
      mood_score: moodData.mood_score,
      energy_level: moodData.energy_level,
      stress_level: moodData.stress_level,
      motivation_level: moodData.motivation_level,
      context_tags: ['morning_checkin'],
      metadata: { source: 'daily_greeting' }
    });

    setShowMoodCheck(false);
  };

  const getTimeIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return <Sun className="w-6 h-6 text-yellow-500" />;
    if (hour >= 17 && hour < 22) return <Moon className="w-6 h-6 text-blue-400" />;
    return <Star className="w-6 h-6 text-purple-400" />;
  };

  const getGoalPriorityColor = (priority: number) => {
    if (priority >= 4) return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
    if (priority >= 3) return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
    return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
  };

  const handleGoalComplete = async (goalId: string) => {
    if (!user?.id) return;
    
    await personalContextService.updateGoalStatus(goalId, 'completed', 'Completed via daily greeting');
    
    // Refresh greeting to update goal list
    await loadDailyGreeting();
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center space-x-4">
          <div className="animate-spin">
            <Brain className="w-8 h-8 text-purple-500" />
          </div>
          <div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse mb-2"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!greeting) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Unable to load your daily greeting. Please try again.</p>
        <Button onClick={loadDailyGreeting} className="mt-4" variant="outline">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Greeting Card */}
      <Card className="p-8 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-purple-900/20 dark:via-blue-900/20 dark:to-indigo-900/20 border-0 shadow-lg backdrop-blur-sm">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0 p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full shadow-lg">
            {getTimeIcon()}
          </div>
          
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 leading-relaxed">
              {greeting.greeting_message}
            </h2>
            
            {greeting.aspiration_reminder && (
              <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                <Target className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-amber-800 dark:text-amber-200 font-medium">
                  {greeting.aspiration_reminder}
                </p>
              </div>
            )}

            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>{greeting.daily_goals.length} goals today</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Daily Goals */}
      {greeting.daily_goals.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Today's Priorities</h3>
          </div>

          <div className="space-y-3">
            {greeting.daily_goals.map((goal) => (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${getGoalPriorityColor(goal.priority)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleGoalComplete(goal.id)}
                      disabled={goal.status === 'completed'}
                      className={`p-1 rounded-full ${
                        goal.status === 'completed' 
                          ? 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30' 
                          : 'text-gray-400 hover:text-green-600 hover:bg-green-100 dark:hover:text-green-400 dark:hover:bg-green-900/30'
                      }`}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </Button>
                    
                    <div>
                      <h4 className={`font-medium ${
                        goal.status === 'completed' 
                          ? 'line-through text-gray-500 dark:text-gray-400' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {goal.title}
                      </h4>
                      {goal.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{goal.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    {goal.estimated_duration && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{goal.estimated_duration}m</span>
                      </div>
                    )}
                    <div className="flex">
                      {Array.from({ length: goal.priority }, (_, i) => (
                        <Star key={i} className="w-3 h-3 fill-current text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Follow-up Questions */}
      {greeting.follow_up_questions.length > 0 && currentQuestionIndex < greeting.follow_up_questions.length && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Check-in</h3>
          </div>

          <FollowUpQuestionComponent
            question={greeting.follow_up_questions[currentQuestionIndex]}
            onResponse={(response) => handleQuestionResponse(greeting.follow_up_questions[currentQuestionIndex].id, response)}
          />
        </Card>
      )}

      {/* Mood Check */}
      {greeting.mood_check && !showMoodCheck && (
        <Card className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-lg">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How are you feeling?</h3>
                <p className="text-gray-600 dark:text-gray-400">Help me understand your mood to provide better support</p>
              </div>
            </div>
            <Button onClick={() => setShowMoodCheck(true)} className="bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Share Mood
            </Button>
          </div>
        </Card>
      )}

      {showMoodCheck && (
        <MoodCheckComponent onMoodSubmit={handleMoodResponse} onSkip={() => setShowMoodCheck(false)} />
      )}
    </div>
  );
}

// Follow-up Question Component
interface FollowUpQuestionComponentProps {
  question: FollowUpQuestion;
  onResponse: (response: any) => void;
}

function FollowUpQuestionComponent({ question, onResponse }: FollowUpQuestionComponentProps) {
  const [response, setResponse] = useState<any>('');

  const handleSubmit = () => {
    if (response) {
      onResponse(response);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-700 dark:text-gray-300 font-medium">{question.question}</p>

      {question.expected_response_type === 'selection' && question.options && (
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <Button
              key={index}
              variant={response === option ? 'default' : 'outline'}
              onClick={() => setResponse(option)}
              className="w-full justify-start"
            >
              {option}
            </Button>
          ))}
          {response && (
            <Button onClick={handleSubmit} className="w-full mt-4 bg-gradient-to-r from-blue-500 to-cyan-600">
              Continue
            </Button>
          )}
        </div>
      )}

      {question.expected_response_type === 'rating' && question.options && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            {question.options.map((option, index) => (
              <Button
                key={index}
                variant={response === option ? 'default' : 'outline'}
                onClick={() => {
                  setResponse(option);
                  setTimeout(() => onResponse(option), 300);
                }}
                className="flex-1"
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      )}

      {question.expected_response_type === 'text' && (
        <div className="space-y-3">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
            rows={3}
          />
          <Button 
            onClick={handleSubmit} 
            disabled={!response.trim()}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-600"
          >
            Share Response
          </Button>
        </div>
      )}
    </div>
  );
}

// Mood Check Component
interface MoodCheckComponentProps {
  onMoodSubmit: (moodData: any) => void;
  onSkip: () => void;
}

function MoodCheckComponent({ onMoodSubmit, onSkip }: MoodCheckComponentProps) {
  const [mood, setMood] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [stress, setStress] = useState(5);
  const [motivation, setMotivation] = useState(5);

  const handleSubmit = () => {
    onMoodSubmit({
      mood_score: mood,
      energy_level: energy,
      stress_level: stress,
      motivation_level: motivation
    });
  };

  const RatingSlider = ({ 
    label, 
    value, 
    onChange, 
    icon: Icon, 
    color 
  }: { 
    label: string; 
    value: number; 
    onChange: (value: number) => void; 
    icon: React.ElementType; 
    color: string;
  }) => (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className={`text-sm font-bold ${color}`}>{value}/10</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
      />
    </div>
  );

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg">
          <Heart className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How are you feeling right now?</h3>
      </div>

      <div className="space-y-6">
        <RatingSlider
          label="Overall Mood"
          value={mood}
          onChange={setMood}
          icon={Heart}
          color="text-pink-500"
        />
        <RatingSlider
          label="Energy Level"
          value={energy}
          onChange={setEnergy}
          icon={Zap}
          color="text-yellow-500"
        />
        <RatingSlider
          label="Stress Level"
          value={stress}
          onChange={setStress}
          icon={TrendingUp}
          color="text-red-500"
        />
        <RatingSlider
          label="Motivation"
          value={motivation}
          onChange={setMotivation}
          icon={Star}
          color="text-blue-500"
        />

        <div className="flex space-x-3 pt-4">
          <Button onClick={handleSubmit} className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600">
            Submit
          </Button>
          <Button onClick={onSkip} variant="outline" className="px-6">
            Skip
          </Button>
        </div>
      </div>
    </Card>
  );
}