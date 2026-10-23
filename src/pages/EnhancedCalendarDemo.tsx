import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Space, Divider, Typography } from 'antd';
import { SettingOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { EnhancedCalendarComponent } from '../components/Calendar/Enhanced';
import { EnhancedCalendarService } from '../services/calendar/enhanced';
import { getIndustryConfig, getAvailableIndustries } from '../services/calendar/enhanced';
import { CalendarEvent, IndustryConfig } from '../types/calendar.types';

const { Option } = Select;
const { Title, Paragraph } = Typography;

const EnhancedCalendarDemo: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('legal');
  const [industryConfig, setIndustryConfig] = useState<IndustryConfig>(getIndustryConfig('legal'));
  const [calendarService, setCalendarService] = useState<EnhancedCalendarService | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Initialize calendar service when industry changes
  useEffect(() => {
    const config = getIndustryConfig(selectedIndustry);
    setIndustryConfig(config);

    const service = new EnhancedCalendarService({
      industryConfig: config,
      enableGoogleCalendar: true,
      enableOutlook: true,
      enableEmailProcessing: selectedIndustry === 'legal', // Only enable for legal
      enableNotifications: true
    });

    setCalendarService(service);

    // Generate sample events for demonstration
    generateSampleEvents(config).then(setEvents);
  }, [selectedIndustry]);

  const generateSampleEvents = async (config: IndustryConfig): Promise<CalendarEvent[]> => {
    const sampleEvents: CalendarEvent[] = [];
    const today = dayjs();

    if (config.id === 'legal') {
      sampleEvents.push(
        {
          id: 'legal-1',
          title: 'Court Hearing - Smith vs. Jones',
          eventType: 'hearing',
          date: today.add(2, 'days'),
          time: '09:00',
          duration: 120,
          description: 'Civil lawsuit hearing regarding property dispute',
          location: 'Courtroom 3A, Downtown Courthouse',
          participants: ['Judge Williams', 'Attorney Smith', 'Client Jones'],
          priority: 'high',
          caseNumber: 'CV-2024-001234',
          clientName: 'John Jones',
          tags: ['civil', 'property'],
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'legal-2',
          title: 'Client Meeting - Estate Planning',
          eventType: 'client-meeting',
          date: today.add(1, 'days'),
          time: '14:00',
          duration: 60,
          description: 'Initial consultation for estate planning services',
          location: 'Conference Room B',
          participants: ['Client Miller', 'Attorney Brown'],
          priority: 'normal',
          clientName: 'Sarah Miller',
          tags: ['estate-planning', 'consultation'],
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'legal-3',
          title: 'Filing Deadline - Motion for Summary Judgment',
          eventType: 'deadline',
          date: today.add(5, 'days'),
          time: '17:00',
          duration: 0,
          description: 'Deadline to file motion for summary judgment',
          priority: 'urgent',
          caseNumber: 'CV-2024-005678',
          tags: ['deadline', 'motion'],
          createdAt: today,
          updatedAt: today
        }
      );
    } else if (config.id === 'medical') {
      sampleEvents.push(
        {
          id: 'medical-1',
          title: 'Patient Appointment - Dr. Johnson',
          eventType: 'appointment',
          date: today.add(1, 'days'),
          time: '10:30',
          duration: 30,
          description: 'Routine checkup and consultation',
          location: 'Room 205',
          participants: ['Dr. Johnson', 'Patient Wilson'],
          priority: 'normal',
          customFields: {
            patientId: 'PT-12345',
            department: 'cardiology'
          },
          tags: ['routine', 'checkup'],
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'medical-2',
          title: 'Surgery - Cardiac Bypass',
          eventType: 'surgery',
          date: today.add(3, 'days'),
          time: '07:00',
          duration: 240,
          description: 'Coronary artery bypass surgery',
          location: 'Operating Room 2',
          participants: ['Dr. Smith', 'Dr. Lee', 'Nurse Johnson'],
          priority: 'urgent',
          customFields: {
            patientId: 'PT-67890',
            department: 'cardiology'
          },
          tags: ['surgery', 'cardiac'],
          createdAt: today,
          updatedAt: today
        }
      );
    } else if (config.id === 'mortgage') {
      sampleEvents.push(
        {
          id: 'mortgage-1',
          title: 'Home Closing - 123 Main St',
          eventType: 'closing',
          date: today.add(2, 'days'),
          time: '15:00',
          duration: 120,
          description: 'Final closing for home purchase',
          location: 'Title Company Office',
          participants: ['Buyer Thompson', 'Seller Davis', 'Loan Officer'],
          priority: 'high',
          customFields: {
            loanNumber: 'LN-789123',
            propertyAddress: '123 Main St, Anytown USA',
            loanAmount: '$350,000'
          },
          tags: ['closing', 'purchase'],
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'mortgage-2',
          title: 'Property Appraisal - 456 Oak Ave',
          eventType: 'appraisal',
          date: today.add(1, 'days'),
          time: '11:00',
          duration: 90,
          description: 'Professional property appraisal',
          location: '456 Oak Ave, Anytown USA',
          participants: ['Appraiser Johnson', 'Loan Officer'],
          priority: 'normal',
          customFields: {
            loanNumber: 'LN-456789',
            propertyAddress: '456 Oak Ave, Anytown USA'
          },
          tags: ['appraisal', 'valuation'],
          createdAt: today,
          updatedAt: today
        }
      );
    } else {
      // Generic events
      sampleEvents.push(
        {
          id: 'generic-1',
          title: 'Team Meeting - Project Review',
          eventType: 'meeting',
          date: today.add(1, 'days'),
          time: '10:00',
          duration: 60,
          description: 'Weekly project status review meeting',
          location: 'Conference Room A',
          participants: ['Team Lead', 'Developer 1', 'Developer 2'],
          priority: 'normal',
          tags: ['meeting', 'project'],
          createdAt: today,
          updatedAt: today
        },
        {
          id: 'generic-2',
          title: 'Project Deadline - Phase 1 Completion',
          eventType: 'deadline',
          date: today.add(7, 'days'),
          time: '17:00',
          duration: 0,
          description: 'Complete Phase 1 of the project',
          priority: 'high',
          tags: ['deadline', 'project'],
          createdAt: today,
          updatedAt: today
        }
      );
    }

    return sampleEvents;
  };

  const handleEventCreate = async (event: CalendarEvent) => {
    if (calendarService) {
      try {
        const createdEvent = await calendarService.createEvent(event);
        setEvents(prev => [...prev, createdEvent]);
      } catch (error) {
        console.error('Error creating event:', error);
      }
    }
  };

  const handleEventUpdate = async (event: CalendarEvent) => {
    if (calendarService) {
      try {
        await calendarService.updateEvent(event.id, event);
        setEvents(prev => prev.map(e => e.id === event.id ? event : e));
      } catch (error) {
        console.error('Error updating event:', error);
      }
    }
  };

  const handleEventDelete = async (eventId: string) => {
    if (calendarService) {
      try {
        await calendarService.deleteEvent(eventId);
        setEvents(prev => prev.filter(e => e.id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const availableIndustries = getAvailableIndustries();

  return (
    <div className="enhanced-calendar-demo">
      <Card className="demo-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={2}>
              <CalendarOutlined /> Enhanced Calendar System
            </Title>
            <Paragraph>
              Configurable, industry-agnostic calendar system that adapts to different business needs.
              Switch between industries to see how the calendar adapts its functionality.
            </Paragraph>
          </div>
          
          <Space direction="vertical" align="end">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SettingOutlined />
              <span>Industry Configuration:</span>
              <Select
                value={selectedIndustry}
                onChange={setSelectedIndustry}
                style={{ width: 200 }}
              >
                {availableIndustries.map(industry => (
                  <Option key={industry.id} value={industry.id}>
                    {industry.name}
                  </Option>
                ))}
              </Select>
            </div>
            
            <div style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>
              <div><strong>Current:</strong> {industryConfig.name}</div>
              <div>{industryConfig.description}</div>
            </div>
          </Space>
        </div>
      </Card>

      <Divider />

      {/* Industry Configuration Summary */}
      <Card title="Current Industry Configuration" size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <div>
            <strong>Event Types:</strong>
            <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
              {industryConfig.eventTypes.map(type => (
                <li key={type.id}>{type.name} - {type.description}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <strong>Features:</strong>
            <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
              <li>Google Calendar: {industryConfig.integrations?.googleCalendar ? '✓' : '✗'}</li>
              <li>Outlook: {industryConfig.integrations?.outlook ? '✓' : '✗'}</li>
              <li>Email Processing: {industryConfig.integrations?.emailProcessing ? '✓' : '✗'}</li>
              <li>Document Management: {industryConfig.integrations?.documentManagement ? '✓' : '✗'}</li>
            </ul>
          </div>
          
          <div>
            <strong>Notifications:</strong>
            <ul style={{ margin: '4px 0', paddingLeft: 16 }}>
              <li>Email Reminders: {industryConfig.notifications?.emailReminders ? '✓' : '✗'}</li>
              <li>SMS Reminders: {industryConfig.notifications?.smsReminders ? '✓' : '✗'}</li>
              <li>Push Notifications: {industryConfig.notifications?.pushNotifications ? '✓' : '✗'}</li>
              <li>Default Reminder: {industryConfig.notifications?.defaultReminderMinutes || 15} minutes</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Main Calendar Component */}
      <EnhancedCalendarComponent
        industryConfig={industryConfig}
        events={events}
        onEventCreate={handleEventCreate}
        onEventUpdate={handleEventUpdate}
        onEventDelete={handleEventDelete}
        allowManualEntry={true}
        showStats={true}
        showFilters={true}
        showQuickActions={true}
        className="demo-calendar"
      />

      {/* Demo Instructions */}
      <Card title="Demo Instructions" style={{ marginTop: 16 }}>
        <Paragraph>
          <strong>How to use this demo:</strong>
        </Paragraph>
        <ol>
          <li><strong>Switch Industries:</strong> Use the dropdown above to see how the calendar adapts to different industries (Legal, Medical, Mortgage, Generic)</li>
          <li><strong>View Events:</strong> Sample events are automatically generated for each industry to demonstrate the different event types</li>
          <li><strong>Create Events:</strong> Click "New Event" or use the Quick Actions to create industry-specific events</li>
          <li><strong>Filter Events:</strong> Use the filters panel to search and filter events by various criteria</li>
          <li><strong>View Statistics:</strong> The stats panel shows analytics specific to each industry</li>
          <li><strong>Edit Events:</strong> Click on any event to edit or delete it</li>
        </ol>
        
        <Divider />
        
        <Paragraph>
          <strong>Key Features Demonstrated:</strong>
        </Paragraph>
        <ul>
          <li><strong>Industry Adaptability:</strong> The same calendar components adapt to different industries with specific event types, fields, and workflows</li>
          <li><strong>Configurable UI:</strong> Event forms, filters, and statistics change based on industry configuration</li>
          <li><strong>Extensible Architecture:</strong> Easy to add new industries, event types, and custom fields</li>
          <li><strong>Preserve Original System:</strong> This enhanced system works alongside the existing hard-coded legal calendar system</li>
          <li><strong>Email Integration:</strong> Automatic event processing from emails (enabled for legal industry)</li>
          <li><strong>Multiple Calendar Views:</strong> Month, Week, and Agenda views</li>
          <li><strong>Advanced Filtering:</strong> Search, date ranges, tags, priorities, and industry-specific filters</li>
        </ul>
      </Card>
    </div>
  );
};

export default EnhancedCalendarDemo;
