import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import { PlusOutlined, CalendarOutlined, ThunderboltOutlined, TeamOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { IndustryConfig } from '../../../types/calendar.types';

interface CalendarQuickActionsProps {
  industryConfig: IndustryConfig;
  onQuickCreate: (eventType?: string) => void;
}

export const CalendarQuickActions: React.FC<CalendarQuickActionsProps> = ({
  industryConfig,
  onQuickCreate
}) => {
  // Quick create menu items based on industry config
  const quickCreateItems: MenuProps['items'] = industryConfig.eventTypes.map(type => ({
    key: type.id,
    label: (
      <div className="quick-create-item">
        <span className="event-type-name">{type.name}</span>
        <span className="event-type-description">{type.description}</span>
      </div>
    ),
    onClick: () => onQuickCreate(type.id)
  }));

  // Common quick actions for all industries
  const commonQuickActions = [
    {
      key: 'today',
      label: 'Add Event Today',
      icon: <CalendarOutlined />,
      onClick: () => onQuickCreate()
    },
    {
      key: 'urgent',
      label: 'Create Urgent Event',
      icon: <ThunderboltOutlined />,
      onClick: () => onQuickCreate('urgent')
    },
    {
      key: 'meeting',
      label: 'Schedule Meeting',
      icon: <TeamOutlined />,
      onClick: () => onQuickCreate('meeting')
    }
  ];

  // Industry-specific quick actions
  const getIndustryQuickActions = () => {
    switch (industryConfig.id) {
      case 'legal':
        return [
          {
            key: 'hearing',
            label: 'Schedule Hearing',
            icon: <CalendarOutlined />,
            onClick: () => onQuickCreate('hearing')
          },
          {
            key: 'deadline',
            label: 'Add Deadline',
            icon: <ThunderboltOutlined />,
            onClick: () => onQuickCreate('deadline')
          },
          {
            key: 'client-meeting',
            label: 'Client Meeting',
            icon: <TeamOutlined />,
            onClick: () => onQuickCreate('client-meeting')
          }
        ];

      case 'medical':
        return [
          {
            key: 'appointment',
            label: 'Book Appointment',
            icon: <CalendarOutlined />,
            onClick: () => onQuickCreate('appointment')
          },
          {
            key: 'surgery',
            label: 'Schedule Surgery',
            icon: <ThunderboltOutlined />,
            onClick: () => onQuickCreate('surgery')
          },
          {
            key: 'consultation',
            label: 'Add Consultation',
            icon: <TeamOutlined />,
            onClick: () => onQuickCreate('consultation')
          }
        ];

      case 'mortgage':
        return [
          {
            key: 'closing',
            label: 'Schedule Closing',
            icon: <CalendarOutlined />,
            onClick: () => onQuickCreate('closing')
          },
          {
            key: 'appraisal',
            label: 'Book Appraisal',
            icon: <ThunderboltOutlined />,
            onClick: () => onQuickCreate('appraisal')
          },
          {
            key: 'inspection',
            label: 'Schedule Inspection',
            icon: <TeamOutlined />,
            onClick: () => onQuickCreate('inspection')
          }
        ];

      default:
        return [];
    }
  };

  const industryQuickActions = getIndustryQuickActions();

  return (
    <div className="calendar-quick-actions">
      <Space>
        {/* Primary create button */}
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => onQuickCreate()}
          size="large"
        >
          New Event
        </Button>

        {/* Quick create dropdown */}
        <Dropdown
          menu={{ items: quickCreateItems }}
          trigger={['click']}
          placement="bottomRight"
        >
          <Button icon={<CalendarOutlined />}>
            Quick Create
          </Button>
        </Dropdown>

        {/* Industry-specific quick actions */}
        {industryQuickActions.map(action => (
          <Button
            key={action.key}
            icon={action.icon}
            onClick={action.onClick}
            className="industry-quick-action"
          >
            {action.label}
          </Button>
        ))}

        {/* Template-based quick actions */}
        {industryConfig.quickActions?.map(quickAction => (
          <Button
            key={quickAction.id}
            icon={quickAction.icon ? React.createElement(quickAction.icon as any) : <PlusOutlined />}
            onClick={() => onQuickCreate(quickAction.eventType)}
            className="template-quick-action"
            type={quickAction.primary ? 'primary' : 'default'}
          >
            {quickAction.label}
          </Button>
        ))}
      </Space>
    </div>
  );
};

export default CalendarQuickActions;
