import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  Rating
} from '@mui/material';
import { assistantConversationService } from '../services/assistantConversationService';

interface InterviewQuestion {
  question: string;
  skillLevel: string;
  category: string;
}

interface InterviewEvaluation {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  overallFeedback: string;
}

const experienceLevels = ['Entry-level', 'Junior', 'Mid-level', 'Senior', 'Lead'];
const difficultyLevels = ['easy', 'medium', 'hard', 'mixed'];

export const InterviewWizard: React.FC = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('Mid-level');
  const [skills, setSkills] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [difficultyLevel, setDifficultyLevel] = useState<string>('mixed');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  
  const [evaluation, setEvaluation] = useState<InterviewEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleGenerateQuestions = async () => {
    if (!jobTitle.trim()) {
      setError('Please enter a job title');
      return;
    }
    
    if (!skills.trim()) {
      setError('Please enter required skills');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setQuestions([]);
      setAnswer('');
      setEvaluation(null);
      
      const skillsArray = skills.split(',').map(skill => skill.trim());
      
      const generatedQuestions = await assistantConversationService.generateInterviewQuestions({
        jobTitle,
        experienceLevel,
        skillsRequired: skillsArray,
        questionCount: questionCount,
        difficultyLevel: difficultyLevel as 'easy' | 'medium' | 'hard' | 'mixed'
      });
      
      setQuestions(generatedQuestions);
      setCurrentQuestionIndex(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating interview questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!answer.trim()) {
      setError('Please enter an answer to evaluate');
      return;
    }
    
    try {
      setIsEvaluating(true);
      setError(null);
      
      const currentQuestion = questions[currentQuestionIndex];
      
      const result = await assistantConversationService.evaluateInterviewAnswer(
        currentQuestion.question,
        answer,
        experienceLevel
      );
      
      setEvaluation(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error evaluating answer');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setAnswer('');
      setEvaluation(null);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setAnswer('');
      setEvaluation(null);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Card elevation={3}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Interview Question Generator
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Job Title"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., React Frontend Developer"
                margin="normal"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Experience Level</InputLabel>
                <Select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  label="Experience Level"
                >
                  {experienceLevels.map(level => (
                    <MenuItem key={level} value={level}>
                      {level}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Required Skills"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Enter skills separated by commas (e.g., JavaScript, React, CSS)"
                margin="normal"
                helperText="Enter skills separated by commas"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Number of Questions</InputLabel>
                <Select
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  label="Number of Questions"
                >
                  {[3, 5, 7, 10].map(count => (
                    <MenuItem key={count} value={count}>
                      {count}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Difficulty Level</InputLabel>
                <Select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  label="Difficulty Level"
                >
                  {difficultyLevels.map(level => (
                    <MenuItem key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleGenerateQuestions}
            disabled={isLoading || !jobTitle.trim() || !skills.trim()}
            fullWidth
            sx={{ mt: 3 }}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Generate Interview Questions'}
          </Button>
          
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>
      
      {questions.length > 0 && (
        <Card elevation={3} sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Typography>
              <Box>
                <Chip 
                  label={questions[currentQuestionIndex].category} 
                  color="primary" 
                  sx={{ mr: 1 }}
                />
                <Chip 
                  label={questions[currentQuestionIndex].skillLevel} 
                  color="secondary" 
                />
              </Box>
            </Box>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
              <Typography variant="body1">
                {questions[currentQuestionIndex].question}
              </Typography>
            </Paper>
            
            <TextField
              fullWidth
              label="Your Answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer here"
              multiline
              rows={4}
              margin="normal"
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="outlined"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous Question
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                onClick={handleEvaluateAnswer}
                disabled={isEvaluating || !answer.trim()}
              >
                {isEvaluating ? <CircularProgress size={24} /> : 'Evaluate Answer'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next Question
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {evaluation && (
        <Card elevation={3} sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Evaluation Results
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="body1" sx={{ mr: 2 }}>
                Score:
              </Typography>
              <Rating value={evaluation.score / 2} readOnly precision={0.5} max={5} />
              <Typography variant="body1" sx={{ ml: 1 }}>
                {evaluation.score}/10
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="body1" fontWeight="bold" gutterBottom>
              Overall Feedback:
            </Typography>
            <Typography variant="body1" paragraph>
              {evaluation.overallFeedback}
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="success.main" gutterBottom>
                  Strengths:
                </Typography>
                <ul>
                  {evaluation.strengths.map((strength, index) => (
                    <li key={index}>
                      <Typography variant="body2">{strength}</Typography>
                    </li>
                  ))}
                </ul>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="error" gutterBottom>
                  Areas for Improvement:
                </Typography>
                <ul>
                  {evaluation.weaknesses.map((weakness, index) => (
                    <li key={index}>
                      <Typography variant="body2">{weakness}</Typography>
                    </li>
                  ))}
                </ul>
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Suggestions:
              </Typography>
              <ul>
                {evaluation.suggestions.map((suggestion, index) => (
                  <li key={index}>
                    <Typography variant="body2">{suggestion}</Typography>
                  </li>
                ))}
              </ul>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};