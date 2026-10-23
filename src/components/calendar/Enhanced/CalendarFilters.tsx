import React from 'react';
import { Card, Select, DatePicker, Input, Switch, Tag, Button } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { IndustryConfig, CalendarFilters as ICalendarFilters } from '../../../types/calendar.types';

const { Option } = Select;
const { RangePicker } = DatePicker;

interface CalendarFiltersProps {
  filters: ICalendarFilters;
  industryConfig: IndustryConfig;
  onFilterChange: (filters: Partial<ICalendarFilters>) => void;
}

export const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  filters,
  industryConfig,
  onFilterChange
}) => {
  const handleFilterChange = (key: keyof ICalendarFilters, value: any) => {
    onFilterChange({ [key]: value });
  };

  const handleClearFilters = () => {
    onFilterChange({
      eventTypes: [],
      priorities: [],
      participants: [],
      dateRange: undefined,
      searchText: '',
      tags: [],
      showCompleted: true,
      customFilters: {}
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.eventTypes?.length) count++;
    if (filters.priorities?.length) count++;
    if (filters.participants?.length) count++;
    if (filters.dateRange) count++;
    if (filters.searchText) count++;
    if (filters.tags?.length) count++;
    if (!filters.showCompleted) count++;
    if (Object.keys(filters.customFilters || {}).length) count++;
    return count;
  };

  return (
    <Card 
      className="calendar-filters"
      title={
        <div className="filters-header">
          <span>
            <FilterOutlined /> Filters
            {getActiveFilterCount() > 0 && (
              <Tag color="blue" className="filter-count">
                {getActiveFilterCount()}
              </Tag>
            )}
          </span>
          <Button
            type="text"
            size="small"
            icon={<ClearOutlined />}
            onClick={handleClearFilters}
            disabled={getActiveFilterCount() === 0}
          >
            Clear All
          </Button>
        </div>
      }
      size="small"
    >
      <div className="filters-content">
        {/* Text Search */}
        <div className="filter-group">
          <label>Search:</label>
          <Input
            placeholder="Search events..."
            value={filters.searchText}
            onChange={(e) => handleFilterChange('searchText', e.target.value)}
            allowClear
          />
        </div>

        {/* Date Range */}
        <div className="filter-group">
          <label>Date Range:</label>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => handleFilterChange('dateRange', dates)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Event Types */}
        <div className="filter-group">
          <label>Event Types:</label>
          <Select
            mode="multiple"
            placeholder="Select event types"
            value={filters.eventTypes}
            onChange={(value) => handleFilterChange('eventTypes', value)}
            style={{ width: '100%' }}
          >
            {industryConfig.eventTypes.map((type) => (
              <Option key={type.id} value={type.id}>
                {type.name}
              </Option>
            ))}
          </Select>
        </div>

        {/* Priority */}
        <div className="filter-group">
          <label>Priority:</label>
          <Select
            mode="multiple"
            placeholder="Select priorities"
            value={filters.priorities}
            onChange={(value) => handleFilterChange('priorities', value)}
            style={{ width: '100%' }}
          >
            <Option value="low">Low</Option>
            <Option value="normal">Normal</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
        </div>

        {/* Participants */}
        <div className="filter-group">
          <label>Participants:</label>
          <Select
            mode="tags"
            placeholder="Filter by participants"
            value={filters.participants}
            onChange={(value) => handleFilterChange('participants', value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Tags */}
        <div className="filter-group">
          <label>Tags:</label>
          <Select
            mode="tags"
            placeholder="Filter by tags"
            value={filters.tags}
            onChange={(value) => handleFilterChange('tags', value)}
            style={{ width: '100%' }}
          />
        </div>

        {/* Industry-specific filters */}
        {industryConfig.id === 'legal' && (
          <>
            <div className="filter-group">
              <label>Case Number:</label>
              <Input
                placeholder="Filter by case number"
                value={filters.customFilters?.caseNumber}
                onChange={(e) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  caseNumber: e.target.value
                })}
                allowClear
              />
            </div>

            <div className="filter-group">
              <label>Court:</label>
              <Select
                placeholder="Select court"
                value={filters.customFilters?.court}
                onChange={(value) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  court: value
                })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="district">District Court</Option>
                <Option value="circuit">Circuit Court</Option>
                <Option value="supreme">Supreme Court</Option>
                <Option value="federal">Federal Court</Option>
              </Select>
            </div>
          </>
        )}

        {industryConfig.id === 'medical' && (
          <>
            <div className="filter-group">
              <label>Patient ID:</label>
              <Input
                placeholder="Filter by patient ID"
                value={filters.customFilters?.patientId}
                onChange={(e) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  patientId: e.target.value
                })}
                allowClear
              />
            </div>

            <div className="filter-group">
              <label>Department:</label>
              <Select
                placeholder="Select department"
                value={filters.customFilters?.department}
                onChange={(value) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  department: value
                })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="cardiology">Cardiology</Option>
                <Option value="orthopedics">Orthopedics</Option>
                <Option value="neurology">Neurology</Option>
                <Option value="pediatrics">Pediatrics</Option>
                <Option value="emergency">Emergency</Option>
              </Select>
            </div>
          </>
        )}

        {industryConfig.id === 'mortgage' && (
          <>
            <div className="filter-group">
              <label>Loan Number:</label>
              <Input
                placeholder="Filter by loan number"
                value={filters.customFilters?.loanNumber}
                onChange={(e) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  loanNumber: e.target.value
                })}
                allowClear
              />
            </div>

            <div className="filter-group">
              <label>Loan Stage:</label>
              <Select
                placeholder="Select loan stage"
                value={filters.customFilters?.loanStage}
                onChange={(value) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  loanStage: value
                })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="application">Application</Option>
                <Option value="processing">Processing</Option>
                <Option value="underwriting">Underwriting</Option>
                <Option value="closing">Closing</Option>
                <Option value="funded">Funded</Option>
              </Select>
            </div>
          </>
        )}

        {/* Show Completed Toggle */}
        <div className="filter-group">
          <label>
            <Switch
              checked={filters.showCompleted}
              onChange={(checked) => handleFilterChange('showCompleted', checked)}
            />
            <span style={{ marginLeft: 8 }}>Show completed events</span>
          </label>
        </div>

        {/* Custom filters from industry config */}
        {industryConfig.customFilters?.map((customFilter) => (
          <div key={customFilter.name} className="filter-group">
            <label>{customFilter.label}:</label>
            {customFilter.type === 'select' && (
              <Select
                placeholder={customFilter.placeholder}
                value={filters.customFilters?.[customFilter.name]}
                onChange={(value) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  [customFilter.name]: value
                })}
                style={{ width: '100%' }}
                allowClear
              >
                {customFilter.options?.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            )}
            {customFilter.type === 'text' && (
              <Input
                placeholder={customFilter.placeholder}
                value={filters.customFilters?.[customFilter.name]}
                onChange={(e) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  [customFilter.name]: e.target.value
                })}
                allowClear
              />
            )}
            {customFilter.type === 'switch' && (
              <Switch
                checked={filters.customFilters?.[customFilter.name]}
                onChange={(checked) => handleFilterChange('customFilters', {
                  ...filters.customFilters,
                  [customFilter.name]: checked
                })}
              />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default CalendarFilters;
