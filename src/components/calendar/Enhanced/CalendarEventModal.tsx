import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, Select, Switch, Button, Tabs, Tag } from 'antd';
import { DeleteOutlined, CopyOutlined, CalendarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { CalendarEvent, IndustryConfig, EventType } from '../../../types/calendar.types';

const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface CalendarEventModalProps {
  isOpen: boolean;
  event?: CalendarEvent | null;
  industryConfig: IndustryConfig;
  onSave: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onClose: () => void;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  event,
  industryConfig,
  onSave,
  onDelete,
  onClose
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const isEditing = !!event?.id;

  useEffect(() => {
    if (isOpen && event) {
      form.setFieldsValue({
        title: event.title,
        eventType: event.eventType,
        date: event.date,
        time: event.time ? dayjs(event.time, 'HH:mm') : null,
        duration: event.duration || 60,
        description: event.description,
        location: event.location,
        participants: event.participants,
        priority: event.priority || 'normal',
        isRecurring: event.isRecurring || false,
        reminderMinutes: event.reminderMinutes || 15,
        tags: event.tags || [],
        caseNumber: event.caseNumber,
        clientName: event.clientName,
        customFields: event.customFields || {}
      });
    } else if (isOpen) {
      // Reset form for new event
      form.resetFields();
      form.setFieldsValue({
        date: dayjs(),
        duration: 60,
        priority: 'normal',
        reminderMinutes: 15,
        isRecurring: false
      });
    }
  }, [isOpen, event, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      const eventData: CalendarEvent = {
        id: event?.id || `evt_${Date.now()}`,
        title: values.title,
        eventType: values.eventType,
        date: values.date,
        time: values.time?.format('HH:mm'),
        duration: values.duration,
        description: values.description,
        location: values.location,
        participants: values.participants || [],
        priority: values.priority,
        isRecurring: values.isRecurring,
        reminderMinutes: values.reminderMinutes,
        tags: values.tags || [],
        caseNumber: values.caseNumber,
        clientName: values.clientName,
        customFields: values.customFields || {},
        createdAt: event?.createdAt || dayjs(),
        updatedAt: dayjs()
      };

      onSave(eventData);
      onClose();
    } catch (error) {
      console.error('Form validation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (event?.id && onDelete) {
      onDelete(event.id);
      onClose();
    }
  };

  const handleDuplicate = () => {
    if (event) {
      const duplicatedEvent = {
        ...event,
        id: undefined,
        title: `Copy of ${event.title}`,
        date: dayjs().add(1, 'day')
      };
      
      form.setFieldsValue({
        ...duplicatedEvent,
        date: duplicatedEvent.date,
        time: duplicatedEvent.time ? dayjs(duplicatedEvent.time, 'HH:mm') : null
      });
    }
  };

  return (
    <Modal
      title={
        <div className="modal-header">
          <span>
            {isEditing ? 'Edit Event' : 'Create New Event'}
          </span>
          {isEditing && (
            <div className="modal-actions">
              <Button
                type="text"
                icon={<CopyOutlined />}
                onClick={handleDuplicate}
                title="Duplicate Event"
              />
              {onDelete && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  title="Delete Event"
                />
              )}
            </div>
          )}
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          onClick={handleSave}
          icon={<CalendarOutlined />}
        >
          {isEditing ? 'Update Event' : 'Create Event'}
        </Button>
      ]}
    >
      <Form
        form={form}
        layout="vertical"
        className="event-form"
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Basic Details" key="basic">
            <Form.Item
              name="title"
              label="Event Title"
              rules={[{ required: true, message: 'Please enter event title' }]}
            >
              <Input placeholder="Enter event title" />
            </Form.Item>

            <Form.Item
              name="eventType"
              label="Event Type"
              rules={[{ required: true, message: 'Please select event type' }]}
            >
              <Select placeholder="Select event type">
                {industryConfig.eventTypes.map((type: EventType) => (
                  <Option key={type.id} value={type.id}>
                    <div className="event-type-option">
                      <span className="event-type-name">{type.name}</span>
                      <span className="event-type-description">{type.description}</span>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div className="form-row">
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
                className="form-item-half"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                name="time"
                label="Time"
                className="form-item-half"
              >
                <TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                  placeholder="Select time"
                />
              </Form.Item>
            </div>

            <div className="form-row">
              <Form.Item
                name="duration"
                label="Duration (minutes)"
                className="form-item-half"
              >
                <Select>
                  <Option value={15}>15 minutes</Option>
                  <Option value={30}>30 minutes</Option>
                  <Option value={60}>1 hour</Option>
                  <Option value={90}>1.5 hours</Option>
                  <Option value={120}>2 hours</Option>
                  <Option value={180}>3 hours</Option>
                  <Option value={240}>4 hours</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="priority"
                label="Priority"
                className="form-item-half"
              >
                <Select>
                  <Option value="low">Low</Option>
                  <Option value="normal">Normal</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item name="description" label="Description">
              <TextArea
                rows={3}
                placeholder="Add event description..."
              />
            </Form.Item>

            <Form.Item name="location" label="Location">
              <Input placeholder="Event location" />
            </Form.Item>
          </TabPane>

          <TabPane tab="Participants & Details" key="participants">
            <Form.Item name="participants" label="Participants">
              <Select
                mode="tags"
                placeholder="Add participants..."
                style={{ width: '100%' }}
              />
            </Form.Item>

            {/* Industry-specific fields */}
            {industryConfig.id === 'legal' && (
              <>
                <Form.Item name="caseNumber" label="Case Number">
                  <Input placeholder="Enter case number" />
                </Form.Item>

                <Form.Item name="clientName" label="Client Name">
                  <Input placeholder="Enter client name" />
                </Form.Item>
              </>
            )}

            {industryConfig.id === 'medical' && (
              <>
                <Form.Item name="patientId" label="Patient ID">
                  <Input placeholder="Enter patient ID" />
                </Form.Item>

                <Form.Item name="appointmentType" label="Appointment Type">
                  <Select placeholder="Select appointment type">
                    <Option value="consultation">Consultation</Option>
                    <Option value="followup">Follow-up</Option>
                    <Option value="procedure">Procedure</Option>
                    <Option value="surgery">Surgery</Option>
                  </Select>
                </Form.Item>
              </>
            )}

            {industryConfig.id === 'mortgage' && (
              <>
                <Form.Item name="loanNumber" label="Loan Number">
                  <Input placeholder="Enter loan number" />
                </Form.Item>

                <Form.Item name="propertyAddress" label="Property Address">
                  <Input placeholder="Enter property address" />
                </Form.Item>
              </>
            )}

            <Form.Item name="tags" label="Tags">
              <Select
                mode="tags"
                placeholder="Add tags..."
                style={{ width: '100%' }}
              />
            </Form.Item>
          </TabPane>

          <TabPane tab="Settings" key="settings">
            <Form.Item name="reminderMinutes" label="Reminder">
              <Select>
                <Option value={0}>No reminder</Option>
                <Option value={5}>5 minutes before</Option>
                <Option value={15}>15 minutes before</Option>
                <Option value={30}>30 minutes before</Option>
                <Option value={60}>1 hour before</Option>
                <Option value={120}>2 hours before</Option>
                <Option value={1440}>1 day before</Option>
              </Select>
            </Form.Item>

            <Form.Item name="isRecurring" valuePropName="checked">
              <Switch checkedChildren="Recurring" unCheckedChildren="One-time" />
            </Form.Item>

            {/* Custom fields based on industry config */}
            {industryConfig.customFields?.map((field) => (
              <Form.Item
                key={field.name}
                name={['customFields', field.name]}
                label={field.label}
              >
                {field.type === 'text' && (
                  <Input placeholder={field.placeholder} />
                )}
                {field.type === 'select' && (
                  <Select placeholder={field.placeholder}>
                    {field.options?.map((option) => (
                      <Option key={option.value} value={option.value}>
                        {option.label}
                      </Option>
                    ))}
                  </Select>
                )}
                {field.type === 'textarea' && (
                  <TextArea rows={2} placeholder={field.placeholder} />
                )}
                {field.type === 'switch' && (
                  <Switch />
                )}
              </Form.Item>
            ))}
          </TabPane>
        </Tabs>
      </Form>
    </Modal>
  );
};

export default CalendarEventModal;
