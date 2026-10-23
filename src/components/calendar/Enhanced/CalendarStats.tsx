import React from 'react';
import { Card, Statistic, Progress, Tag } from 'antd';
import { CalendarOutlined, ClockCircleOutlined, UserOutlined, AlertOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { CalendarEvent, IndustryConfig } from '../../../types/calendar.types';

interface CalendarStatsProps {
  events: CalendarEvent[];
  industryConfig: IndustryConfig;
}

export const CalendarStats: React.FC<CalendarStatsProps> = ({
  events,
  industryConfig
}) => {
  // Calculate basic statistics
  const today = dayjs();
  const thisWeek = today.startOf('week');
  const thisMonth = today.startOf('month');

  const todayEvents = events.filter(event => 
    event.date.format('YYYY-MM-DD') === today.format('YYYY-MM-DD')
  );

  const thisWeekEvents = events.filter(event => 
    event.date.isBetween(thisWeek, thisWeek.add(7, 'days'), 'day', '[)')
  );

  const thisMonthEvents = events.filter(event => 
    event.date.isBetween(thisMonth, thisMonth.add(1, 'month'), 'day', '[)')
  );

  const urgentEvents = events.filter(event => event.priority === 'urgent');
  const upcomingEvents = events.filter(event => 
    event.date.isAfter(today) && event.date.isBefore(today.add(7, 'days'))
  );

  // Calculate event type distribution
  const eventTypeStats = industryConfig.eventTypes.map(type => ({
    ...type,
    count: events.filter(event => event.eventType === type.id).length
  }));

  // Calculate completion rate (if events have completed status)
  const completedEvents = events.filter(event => event.customFields?.completed === true);
  const completionRate = events.length > 0 ? (completedEvents.length / events.length) * 100 : 0;

  // Calculate average events per day this month
  const daysInMonth = thisMonth.daysInMonth();
  const avgEventsPerDay = thisMonthEvents.length / daysInMonth;

  return (
    <div className="calendar-stats">
      {/* Main Statistics Row */}
      <div className="stats-row">
        <Card className="stat-card">
          <Statistic
            title="Today's Events"
            value={todayEvents.length}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>

        <Card className="stat-card">
          <Statistic
            title="This Week"
            value={thisWeekEvents.length}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>

        <Card className="stat-card">
          <Statistic
            title="This Month"
            value={thisMonthEvents.length}
            prefix={<CalendarOutlined />}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>

        <Card className="stat-card">
          <Statistic
            title="Urgent Events"
            value={urgentEvents.length}
            prefix={<AlertOutlined />}
            valueStyle={{ color: urgentEvents.length > 0 ? '#ff4d4f' : '#8c8c8c' }}
          />
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="detailed-stats">
        <Card title="Event Distribution" className="distribution-card">
          <div className="event-type-stats">
            {eventTypeStats.map(type => (
              <div key={type.id} className="event-type-stat">
                <div className="stat-header">
                  <span className="type-name">{type.name}</span>
                  <Tag color={type.color || 'default'}>{type.count}</Tag>
                </div>
                <Progress
                  percent={events.length > 0 ? (type.count / events.length) * 100 : 0}
                  size="small"
                  strokeColor={type.color || '#1890ff'}
                  showInfo={false}
                />
              </div>
            ))}
          </div>
        </Card>

        <Card title="Performance Metrics" className="metrics-card">
          <div className="metrics-grid">
            <div className="metric-item">
              <Statistic
                title="Completion Rate"
                value={completionRate}
                precision={1}
                suffix="%"
                valueStyle={{ 
                  color: completionRate > 80 ? '#52c41a' : 
                         completionRate > 60 ? '#faad14' : '#ff4d4f'
                }}
              />
              <Progress
                percent={completionRate}
                size="small"
                strokeColor={
                  completionRate > 80 ? '#52c41a' : 
                  completionRate > 60 ? '#faad14' : '#ff4d4f'
                }
                showInfo={false}
              />
            </div>

            <div className="metric-item">
              <Statistic
                title="Avg Events/Day"
                value={avgEventsPerDay}
                precision={1}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </div>

            <div className="metric-item">
              <Statistic
                title="Upcoming (7 days)"
                value={upcomingEvents.length}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </div>
          </div>
        </Card>

        {/* Industry-specific statistics */}
        {industryConfig.id === 'legal' && (
          <Card title="Legal Metrics" className="industry-stats">
            <div className="legal-stats">
              <div className="stat-item">
                <Statistic
                  title="Court Hearings"
                  value={events.filter(e => e.eventType === 'hearing').length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </div>
              <div className="stat-item">
                <Statistic
                  title="Client Meetings"
                  value={events.filter(e => e.eventType === 'meeting').length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </div>
              <div className="stat-item">
                <Statistic
                  title="Deadlines"
                  value={events.filter(e => e.eventType === 'deadline').length}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </div>
            </div>
          </Card>
        )}

        {industryConfig.id === 'medical' && (
          <Card title="Medical Metrics" className="industry-stats">
            <div className="medical-stats">
              <div className="stat-item">
                <Statistic
                  title="Patient Appointments"
                  value={events.filter(e => e.eventType === 'appointment').length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </div>
              <div className="stat-item">
                <Statistic
                  title="Surgeries"
                  value={events.filter(e => e.eventType === 'surgery').length}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </div>
              <div className="stat-item">
                <Statistic
                  title="Consultations"
                  value={events.filter(e => e.eventType === 'consultation').length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </div>
            </div>
          </Card>
        )}

        {industryConfig.id === 'mortgage' && (
          <Card title="Mortgage Metrics" className="industry-stats">
            <div className="mortgage-stats">
              <div className="stat-item">
                <Statistic
                  title="Closings"
                  value={events.filter(e => e.eventType === 'closing').length}
                  valueStyle={{ color: '#52c41a' }}
                />
              </div>
              <div className="stat-item">
                <Statistic
                  title="Appraisals"
                  value={events.filter(e => e.eventType === 'appraisal').length}
                  valueStyle={{ color: '#1890ff' }}
                />
              </div>
              <div className="stat-item">
                <Statistic
                  title="Inspections"
                  value={events.filter(e => e.eventType === 'inspection').length}
                  valueStyle={{ color: '#722ed1' }}
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Priority Distribution */}
      <Card title="Priority Distribution" className="priority-stats">
        <div className="priority-grid">
          {['urgent', 'high', 'normal', 'low'].map(priority => {
            const count = events.filter(e => e.priority === priority).length;
            const percentage = events.length > 0 ? (count / events.length) * 100 : 0;
            
            return (
              <div key={priority} className="priority-item">
                <div className="priority-header">
                  <Tag 
                    color={
                      priority === 'urgent' ? 'red' :
                      priority === 'high' ? 'orange' :
                      priority === 'normal' ? 'blue' : 'default'
                    }
                  >
                    {priority.toUpperCase()}
                  </Tag>
                  <span className="priority-count">{count}</span>
                </div>
                <Progress
                  percent={percentage}
                  size="small"
                  strokeColor={
                    priority === 'urgent' ? '#ff4d4f' :
                    priority === 'high' ? '#faad14' :
                    priority === 'normal' ? '#1890ff' : '#d9d9d9'
                  }
                  showInfo={false}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default CalendarStats;
