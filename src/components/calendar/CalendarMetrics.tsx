import React from 'react';

interface CalendarMetricsProps {}

const CalendarMetrics: React.FC<CalendarMetricsProps> = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-xl font-semibold mb-4">Calendar Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Events This Week</p>
              <p className="text-2xl font-bold text-blue-600">12</p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <div className="p-4 bg-green-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Hours Scheduled</p>
              <p className="text-2xl font-bold text-green-600">24.5</p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-purple-600">89%</p>
            </div>
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-medium mb-3">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Client Meeting - ABC Corp</span>
            </div>
            <span className="text-xs text-gray-500">2:00 PM</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">Contract Review</span>
            </div>
            <span className="text-xs text-gray-500">4:30 PM</span>
          </div>
          <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm">Team Standup</span>
            </div>
            <span className="text-xs text-gray-500">Tomorrow 9:00 AM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarMetrics;
