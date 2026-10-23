import React, { useState } from 'react';
import { trainAgent } from '../services/trainingService';

const TrainingForm = ({ agentId }) => {
    const [input, setInput] = useState('');
    const [expectedOutput, setExpectedOutput] = useState('');
    const [feedback, setFeedback] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trainingData = { input, expectedOutput, feedback, timestamp: new Date() };
        await trainAgent(agentId, trainingData);
        // Clear the form or provide feedback to the user
    };

    return (
        <form onSubmit={handleSubmit}>
            <input 
                type="text" 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="User Input" 
                required 
            />
            <input 
                type="text" 
                value={expectedOutput} 
                onChange={(e) => setExpectedOutput(e.target.value)} 
                placeholder="Expected Output" 
                required 
            />
            <input 
                type="text" 
                value={feedback} 
                onChange={(e) => setFeedback(e.target.value)} 
                placeholder="Feedback" 
                required 
            />
            <button type="submit">Submit Training Data</button>
        </form>
    );
};

export default TrainingForm; 