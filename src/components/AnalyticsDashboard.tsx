import React, { useState } from 'react';
import { useAgentStore } from '../store/agentStore';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Chat } from './ai/Chat';
import type { Message } from '../types/ai';
import type { Agent } from '../types/agent';

interface PerformanceData {
    name: string;
    value: number;
}

const AnalyticsDashboard: React.FC = () => {
    const { agents } = useAgentStore();
    const [messages, setMessages] = useState<Message[]>([]);

    // Transform agent metrics into performance data
    const performanceData: PerformanceData[] = [
        { 
            name: 'Average Performance', 
            value: agents.reduce((acc: number, agent: Agent) => acc + agent.metrics.performance, 0) / agents.length 
        },
        { 
            name: 'Average Response Time', 
            value: agents.reduce((acc: number, agent: Agent) => acc + agent.metrics.responseTime, 0) / agents.length 
        },
        { 
            name: 'Success Rate', 
            value: agents.reduce((acc: number, agent: Agent) => acc + agent.metrics.successRate * 100, 0) / agents.length 
        }
    ];

    const handleSend = async (message: Message) => {
        setMessages(prev => [...prev, message]);
        // Here you would typically call your analytics AI service
        // For now, we'll just echo back a response
        const response: Message = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'I can help you analyze the performance metrics and provide insights.',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, response]);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
                    {agents.map((agent: Agent) => (
                        <div key={agent.id} className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                            <h4 className="font-medium">{agent.name}</h4>
                            <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <p>Performance: {agent.metrics.performance}%</p>
                                <p>Response Time: {agent.metrics.responseTime}ms</p>
                                <p>Success Rate: {(agent.metrics.successRate * 100).toFixed(1)}%</p>
                                <p>Tasks: {agent.metrics.tasks.completed}/{agent.metrics.tasks.total}</p>
                                <p>Last Updated: {new Date(agent.metrics.lastUpdated).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Analytics Assistant</h3>
                <Chat
                    messages={messages}
                    onSend={handleSend}
                    placeholder="Ask about analytics insights..."
                    className="h-[400px]"
                />
            </div>
        </div>
    );
};

export default AnalyticsDashboard; 