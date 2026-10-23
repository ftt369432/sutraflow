import React, { useState } from 'react';
import { getPriorityDotClass } from '../../styles/semanticColors';
import { motion } from 'framer-motion';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ListTodo,
  Mail,
  Star,
  TrendingUp,
  AlertCircle,
  Calendar as CalendarIcon,
  AlertTriangle,
  Activity,
  Plus
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { format, isToday, isThisWeek } from 'date-fns';
import { testTasks, testEvents, testEmails } from '../../data/testData';
import { useThemeStore } from '../../store/themeStore';
import { cn } from '@/lib/utils';
import { NotificationWidget } from './NotificationWidget';

export function DashboardOverview() {
  const { style } = useThemeStore();
  const isCyberpunk = style === 'cyberpunk';

  // Calculate task statistics
  const totalTasks = testTasks.length;
  const completedTasks = testTasks.filter(task => task.completed).length;
  const urgentTasks = testTasks.filter(task => task.priority === 'high').length;
  
  // Calculate today's events
  const todayEvents = testEvents.filter(event => isToday(event.start));
  const weekEvents = testEvents.filter(event => isThisWeek(event.start));
  
  // Calculate unread emails
  const unreadEmails = testEmails.filter(email => !email.read).length;

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {completedTasks}/{totalTasks}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
              <CheckCircle2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Today's Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todayEvents.length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-full">
              <CalendarIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Urgent Tasks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {urgentTasks}
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Unread Emails</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {unreadEmails}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full">
              <Mail className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tasks Overview */}
        <Card className={cn(
          "p-6 lg:col-span-2",
          isCyberpunk && "border border-cyberpunk-neon/50"
        )}>
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn(
              "text-lg font-semibold",
              isCyberpunk ? "text-cyberpunk-neon" : "text-gray-900 dark:text-white"
            )}>Today's Tasks</h2>
            <Button 
              variant="outline" 
              size="sm" 
              className={cn(
                isCyberpunk 
                  ? "border-cyberpunk-neon/50 text-cyberpunk-neon hover:bg-cyberpunk-neon/10"
                  : "dark:border-gray-600 dark:text-gray-300"
              )}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Task
            </Button>
          </div>
          
          {/* Tasks List */}
          <div className="space-y-2">
            {testTasks.map(task => (
              <div 
                key={task.id} 
                className={cn(
                  "p-3 rounded-lg flex items-center justify-between",
                  task.completed 
                    ? "bg-gray-50 dark:bg-gray-800/50" 
                    : isCyberpunk 
                      ? "bg-cyberpunk-card-bg border border-cyberpunk-neon/30" 
                      : "bg-white dark:bg-gray-800 shadow-sm"
                )}
              >
                <div className="flex items-center">
                  <div className={cn(
                    "w-4 h-4 rounded-full mr-3",
                    getPriorityDotClass(task.priority)
                  )} />
                  <span className={cn(
                    "font-medium",
                    task.completed 
                      ? "text-gray-400 dark:text-gray-500 line-through" 
                      : "text-gray-700 dark:text-gray-200"
                  )}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center">
                  {task.dueDate && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                      {format(task.dueDate, 'MMM d')}
                    </span>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="link" 
            size="sm" 
            className={cn(
              "mt-4",
              isCyberpunk ? "text-cyberpunk-accent" : "text-blue-600 dark:text-blue-400"
            )}
          >
            View All Tasks
          </Button>
        </Card>
        
        {/* Notifications and Improvements Widget */}
        <div className="lg:col-span-1">
          <NotificationWidget />
        </div>
      </div>

      {/* Calendar Section */}
      <Card className={cn(
        "p-6",
        isCyberpunk && "border border-cyberpunk-neon/50"
      )}>
        <div className="flex items-center justify-between mb-6">
          <h2 className={cn(
            "text-lg font-semibold",
            isCyberpunk ? "text-cyberpunk-neon" : "text-gray-900 dark:text-white"
          )}>Upcoming Events</h2>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              isCyberpunk 
                ? "border-cyberpunk-neon/50 text-cyberpunk-neon hover:bg-cyberpunk-neon/10"
                : "dark:border-gray-600 dark:text-gray-300"
            )}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Event
          </Button>
        </div>
        
        {/* Events List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weekEvents.slice(0, 4).map(event => (
            <div 
              key={event.id} 
              className={cn(
                "p-4 rounded-lg",
                isCyberpunk 
                  ? "bg-cyberpunk-card-bg border border-cyberpunk-neon/30" 
                  : "bg-white dark:bg-gray-800 shadow-sm"
              )}
            >
              <div className="flex items-start">
                <div className={cn(
                  "w-12 h-12 rounded-md flex flex-col items-center justify-center mr-4",
                  isCyberpunk 
                    ? "bg-cyberpunk-neon/20 text-cyberpunk-neon" 
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                )}>
                  <span className="text-xs font-medium">
                    {format(event.start, 'MMM')}
                  </span>
                  <span className="text-lg font-bold leading-none">
                    {format(event.start, 'd')}
                  </span>
                </div>
                <div>
                  <h3 className={cn(
                    "font-medium",
                    isCyberpunk ? "text-cyberpunk-accent" : "text-gray-900 dark:text-white"
                  )}>
                    {event.title}
                  </h3>
                  <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="h-3 w-3 mr-1" />
                    {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                  </div>
                  {event.location && (
                    <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <Button 
          variant="link" 
          size="sm" 
          className={cn(
            "mt-4",
            isCyberpunk ? "text-cyberpunk-accent" : "text-blue-600 dark:text-blue-400"
          )}
        >
          View Full Calendar
        </Button>
      </Card>
    </div>
  );
} 