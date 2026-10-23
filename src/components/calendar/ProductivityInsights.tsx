import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Separator } from "../ui/Separator";
import { useCalendarStore } from '../../store/calendarStore';
import { useTaskStore } from '../../store/taskStore';
import { 
  Award, 
  BarChart2, 
  BrainCircuit, 
  Calendar as CalendarIcon, 
  Clock, 
  Lightbulb, 
  Settings, 
  Sparkles, 
  TrendingUp,
  ChevronRight 
} from 'lucide-react';
import { format, startOfWeek, addDays, eachDayOfInterval, isSameDay, isWithinInterval, parseISO, differenceInMinutes } from 'date-fns';
import { cn } from '../../lib/utils';

interface ProductivityInsightsProps {
  className?: string;
}

// Color constants
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const FOCUS_COLORS = {
  'deep-work': '#4f46e5', // indigo
  'meeting': '#0891b2', // cyan
  'admin': '#6366f1',  // blue
  'learning': '#8b5cf6', // violet
  'break': '#d946ef'   // fuchsia
};

export function ProductivityInsights({ className }: ProductivityInsightsProps) {
  const { events, timeBlocks } = useCalendarStore();
  const { tasks } = useTaskStore();
  const [selectedTab, setSelectedTab] = useState('week');
  const [focusScore, setFocusScore] = useState(0);
  const [taskScore, setTaskScore] = useState(0);
  const [productivityScore, setProductivityScore] = useState(0);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [focusDistribution, setFocusDistribution] = useState<any[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);
  
  useEffect(() => {
    // Calculate weekly data and metrics when events, time blocks, or tasks change
    calculateWeeklyStats();
    calculateMetrics();
    generateInsights();
  }, [events, timeBlocks, tasks, selectedTab]);
  
  const calculateWeeklyStats = () => {
    // Get start of the current week
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
    
    // Create array for each day of the week
    const days = eachDayOfInterval({
      start: startDate,
      end: addDays(startDate, 6)
    });
    
    // For each day, count events, time blocks, and completed tasks
    const dayData = days.map(day => {
      // Count events on this day
      const dayEvents = events.filter(event => 
        isSameDay(parseISO(event.start), day)
      );
      
      // Count time blocks on this day
      const dayTimeBlocks = timeBlocks.filter(block => 
        isSameDay(parseISO(block.start), day)
      );
      
      // Calculate focus time in minutes
      const focusMinutes = dayTimeBlocks.reduce((total, block) => {
        if (block.type === 'deep-work') {
          return total + differenceInMinutes(parseISO(block.end), parseISO(block.start));
        }
        return total;
      }, 0);
      
      // Calculate meeting time in minutes
      const meetingMinutes = [...dayEvents, ...dayTimeBlocks].reduce((total, item) => {
        if ('type' in item && item.type === 'meeting' || 'category' in item && item.category === 'meeting') {
          return total + differenceInMinutes(parseISO(item.end), parseISO(item.start));
        }
        return total;
      }, 0);
      
      // Count completed tasks for this day
      const completedTasks = tasks.filter(task => 
        task.completed && task.completedAt && isSameDay(parseISO(task.completedAt), day)
      ).length;
      
      // Calculate productive hours based on focus time and completed tasks
      // This is a simplified model - you might want a more sophisticated calculation
      const productiveHours = (focusMinutes / 60) + (completedTasks * 0.5);
      
      return {
        name: format(day, 'EEE'),
        date: format(day, 'MMM dd'),
        events: dayEvents.length,
        focusBlocks: dayTimeBlocks.filter(block => block.type === 'deep-work').length,
        focusMinutes,
        meetingMinutes,
        tasks: completedTasks,
        productiveHours: Math.round(productiveHours * 10) / 10
      };
    });
    
    setWeeklyData(dayData);
    
    // Calculate focus distribution
    const allTimeBlocks = timeBlocks.filter(block => {
      const blockDate = parseISO(block.start);
      return isWithinInterval(blockDate, {
        start: startDate,
        end: addDays(startDate, 6)
      });
    });
    
    // Group by block type and count minutes
    const distribution = allTimeBlocks.reduce((acc: Record<string, number>, block) => {
      const type = block.type || 'other';
      const minutes = differenceInMinutes(parseISO(block.end), parseISO(block.start));
      
      if (!acc[type]) {
        acc[type] = 0;
      }
      
      acc[type] += minutes;
      return acc;
    }, {});
    
    // Convert to array for the pie chart
    const focusData = Object.entries(distribution).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace('-', ' '),
      value,
      color: (FOCUS_COLORS as any)[name] || '#d1d5db'
    }));
    
    setFocusDistribution(focusData);
  };
  
  const calculateMetrics = () => {
    // Focus score: percentage of time blocks that are "deep work" compared to total
    const deepWorkBlocks = timeBlocks.filter(block => block.type === 'deep-work').length;
    const totalBlocks = timeBlocks.length || 1; // Avoid division by zero
    const calculatedFocusScore = Math.round((deepWorkBlocks / totalBlocks) * 100);
    
    // Task score: percentage of completed tasks compared to total tasks
    const completedTaskCount = tasks.filter(task => task.completed).length;
    const totalTasks = tasks.length || 1; // Avoid division by zero
    const calculatedTaskScore = Math.round((completedTaskCount / totalTasks) * 100);
    
    // Productivity score: weighted average of focus and task scores
    const calculatedProductivityScore = Math.round((calculatedFocusScore * 0.6) + (calculatedTaskScore * 0.4));
    
    setFocusScore(calculatedFocusScore);
    setTaskScore(calculatedTaskScore);
    setProductivityScore(calculatedProductivityScore);
  };
  
  const generateInsights = () => {
    // Generate insights based on the data
    const newInsights: string[] = [];
    const newImprovements: string[] = [];
    
    // Analyze weekly data
    if (weeklyData.length > 0) {
      // Find most productive day
      const mostProductiveDay = [...weeklyData].sort((a, b) => b.productiveHours - a.productiveHours)[0];
      newInsights.push(`${mostProductiveDay.date} (${mostProductiveDay.name}) was your most productive day with ${mostProductiveDay.productiveHours} productive hours.`);
      
      // Find day with most focus blocks
      const mostFocusDay = [...weeklyData].sort((a, b) => b.focusBlocks - a.focusBlocks)[0];
      if (mostFocusDay.focusBlocks > 0) {
        newInsights.push(`You had the most focus blocks on ${mostFocusDay.name} with ${mostFocusDay.focusBlocks} deep work sessions.`);
      }
      
      // Find day with most completed tasks
      const mostTasksDay = [...weeklyData].sort((a, b) => b.tasks - a.tasks)[0];
      if (mostTasksDay.tasks > 0) {
        newInsights.push(`You completed the most tasks on ${mostTasksDay.name} with ${mostTasksDay.tasks} tasks finished.`);
      }
      
      // Analyze meeting vs focus time
      const totalMeetingMinutes = weeklyData.reduce((sum, day) => sum + day.meetingMinutes, 0);
      const totalFocusMinutes = weeklyData.reduce((sum, day) => sum + day.focusMinutes, 0);
      
      if (totalMeetingMinutes > totalFocusMinutes * 1.5) {
        newImprovements.push("You're spending significantly more time in meetings than in focused work. Consider blocking off more focus time.");
      }
      
      // Look for days with no focus blocks
      const daysWithoutFocus = weeklyData.filter(day => day.focusBlocks === 0);
      if (daysWithoutFocus.length > 2) {
        newImprovements.push(`You had no focus blocks on ${daysWithoutFocus.length} days. Try to schedule at least one focus block each day.`);
      }
      
      // Check focus balance
      if (focusDistribution.length > 0) {
        const deepWorkMinutes = focusDistribution.find(item => item.name === 'Deep work')?.value || 0;
        const meetingMinutes = focusDistribution.find(item => item.name === 'Meeting')?.value || 0;
        const adminMinutes = focusDistribution.find(item => item.name === 'Admin')?.value || 0;
        
        const totalMinutes = focusDistribution.reduce((sum, item) => sum + item.value, 0) || 1;
        
        if ((deepWorkMinutes / totalMinutes) < 0.3) {
          newImprovements.push("Your deep work time is less than 30% of your scheduled time. Aim for at least 40% deep work for optimal productivity.");
        }
        
        if ((meetingMinutes / totalMinutes) > 0.4) {
          newImprovements.push("Meetings are taking up more than 40% of your scheduled time. Consider reducing meeting time or making meetings more efficient.");
        }
      }
    }
    
    // Generic insights if we couldn't generate specific ones
    if (newInsights.length === 0) {
      newInsights.push("Start tracking your time to get personalized productivity insights.");
    }
    
    if (newImprovements.length === 0) {
      newImprovements.push("Use the AI time blocking feature to optimize your schedule and improve productivity.");
    }
    
    setInsights(newInsights);
    setImprovements(newImprovements);
  };
  
  const getProductivityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const formatMinutes = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded-md shadow-md">
          <p className="font-medium">{payload[0].payload.date}</p>
          <p className="text-sm text-muted-foreground">Productive Hours: <span className="font-medium">{payload[0].value}</span></p>
          <div className="text-xs text-muted-foreground mt-1">
            <p>Focus time: {formatMinutes(payload[0].payload.focusMinutes)}</p>
            <p>Tasks completed: {payload[0].payload.tasks}</p>
          </div>
        </div>
      );
    }
  
    return null;
  };
  
  return (
    <Card className={cn("w-full shadow-md", className)}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Productivity Insights
          </CardTitle>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          Track your focus, productivity, and work patterns
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="week" value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">
              <CalendarIcon className="h-4 w-4 mr-2" />
              This Week
            </TabsTrigger>
            <TabsTrigger value="insights">
              <Sparkles className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="week" className="space-y-4 mt-4">
            {/* Productivity Score */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Productivity Score</p>
                <h3 className={cn("text-3xl font-bold", getProductivityScoreColor(productivityScore))}>
                  {productivityScore}%
                </h3>
              </div>
              
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Focus</p>
                  <span className="text-lg font-semibold">{focusScore}%</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Tasks</p>
                  <span className="text-lg font-semibold">{taskScore}%</span>
                </div>
              </div>
            </div>
            
            {/* Weekly Productivity Chart */}
            <div className="h-64 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={weeklyData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    fontSize={12}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="productiveHours" 
                    fill="#8884d8" 
                    radius={[4, 4, 0, 0]}
                    minPointSize={3}
                  >
                    {weeklyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Focus Distribution */}
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <Clock className="mr-2 h-4 w-4 text-primary" />
                Time Distribution
              </h4>
              
              <div className="flex items-center">
                <div className="w-1/2 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={focusDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        fill="#8884d8"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {focusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [formatMinutes(value), 'Time']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="w-1/2 pl-4">
                  <ul className="space-y-2">
                    {focusDistribution.map((entry, index) => (
                      <li key={`legend-${index}`} className="flex items-center text-sm">
                        <span 
                          className="inline-block w-3 h-3 mr-2 rounded-full" 
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="flex-1">{entry.name}</span>
                        <span className="font-medium">{formatMinutes(entry.value)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="insights" className="mt-4 space-y-4">
            {/* Key Insights */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <Lightbulb className="mr-2 h-4 w-4 text-yellow-500" />
                Key Insights
              </h4>
              
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={`insight-${index}`} className="flex items-start bg-muted/40 p-3 rounded-md">
                    <Award className="h-4 w-4 text-primary mr-2 mt-0.5" />
                    <span className="text-sm">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator className="my-4" />
            
            {/* Suggestions for Improvement */}
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center">
                <BrainCircuit className="mr-2 h-4 w-4 text-purple-500" />
                AI Recommendations
              </h4>
              
              <ul className="space-y-2">
                {improvements.map((improvement, index) => (
                  <li key={`improvement-${index}`} className="flex items-start bg-muted/40 p-3 rounded-md">
                    <Sparkles className="h-4 w-4 text-purple-500 mr-2 mt-0.5" />
                    <span className="text-sm">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Call to Action */}
            <div className="mt-6">
              <Button className="w-full" variant="outline">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Optimized Schedule
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 