import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/Tabs';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Sparkles, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { geminiService } from '../services/gemini/GeminiService';

export const ToolsPage = () => {
  // State for Interview Wizard
  const [interviewQuestion, setInterviewQuestion] = useState('');
  const [interviewResponse, setInterviewResponse] = useState('');
  const [isGeneratingInterview, setIsGeneratingInterview] = useState(false);
  
  // State for Image Generator
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageStatus, setImageStatus] = useState<string | null>(null);

  // Real Gemini generation for assistant improvement suggestions
  const generateInterviewResponse = async () => {
    if (!interviewQuestion.trim()) return;
    
    setIsGeneratingInterview(true);
    
    try {
      if (!geminiService.isConfigured()) {
        setInterviewResponse(
          'Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your environment variables to enable live AI recommendations.'
        );
        return;
      }

      const prompt = `As an expert AI system architect, analyze the following AI assistant specification and provide 3-4 structured, high-impact recommendations to improve its domain accuracy, workflow orchestration, and prompt engineering:\n\n${interviewQuestion.trim()}`;
      const response = await geminiService.generateResponse(prompt, {
        systemPrompt: 'You are a senior AI systems engineer specializing in deterministic legal and workflow agents.'
      });
      setInterviewResponse(response.content);
    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      setInterviewResponse(`Failed to generate suggestions: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingInterview(false);
    }
  };

  // Real image generation or explicit status
  const generateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGeneratingImage(true);
    setImageStatus(null);
    
    try {
      if (!geminiService.isConfigured()) {
        setImageStatus('Gemini API key required for multimodal image synthesis.');
        return;
      }
      
      // Request prompt enhancement & SVG or multimodal visual generation
      const response = await geminiService.generateResponse(
        `Generate a high-quality SVG graphic or diagram for: "${imagePrompt}". Output raw valid SVG markup inside an \`\`\`xml code block.`,
        { systemPrompt: 'You are an SVG illustration and technical graphic design expert.' }
      );
      
      const svgMatch = response.content.match(/<svg[\s\S]*?<\/svg>/i);
      if (svgMatch) {
        const svgBlob = new Blob([svgMatch[0]], { type: 'image/svg+xml' });
        setGeneratedImageUrl(URL.createObjectURL(svgBlob));
        setImageStatus('Generated interactive SVG graphic.');
      } else {
        setImageStatus('Generated text specifications for graphic rendering. Direct pixel synthesis requires Imagen 3 integration.');
      }
    } catch (error: any) {
      console.error('Error generating graphic:', error);
      setImageStatus(`Generation failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="container px-6 py-8 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Productivity & AI Tools</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Powered directly by the GenieFlow AI engine for agent optimization and visual asset generation.
        </p>
      </div>
      
      <Tabs defaultValue="interview" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900">
          <TabsTrigger value="interview" className="font-semibold text-sm">
            <Sparkles className="w-4 h-4 mr-2 text-indigo-500" />
            AI Assistant Optimizer
          </TabsTrigger>
          <TabsTrigger value="image" className="font-semibold text-sm">
            <ImageIcon className="w-4 h-4 mr-2 text-indigo-500" />
            Graphic & Diagram Generator
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="interview" className="space-y-4 pt-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-lg font-bold mb-2 text-slate-900 dark:text-white">Assistant Improvement Wizard</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Describe your AI assistant&apos;s target domain, system prompts, and expected capabilities. The Gemini engine will diagnose gaps and generate architectural recommendations.
            </p>
            
            <div className="space-y-4">
              <Textarea
                className="w-full"
                rows={4}
                placeholder="Describe your AI assistant's purpose, target users, and current capabilities..."
                value={interviewQuestion}
                onChange={(e) => setInterviewQuestion(e.target.value)}
              />
              
              <Button
                onClick={generateInterviewResponse}
                disabled={isGeneratingInterview || !interviewQuestion.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isGeneratingInterview ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Analyzing with Gemini...
                  </>
                ) : (
                  'Analyze & Generate Recommendations'
                )}
              </Button>
              
              {interviewResponse && (
                <div className="mt-6 p-5 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 rounded-xl">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 text-sm mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Gemini Optimization Report:
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {interviewResponse}
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="image" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Diagram & Visual Asset Generator</CardTitle>
              <CardDescription>
                Generate custom SVG diagrams, icons, and interface schematics from plain English descriptions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="prompt">Visual Description</Label>
                <Textarea
                  id="prompt"
                  placeholder="e.g. A flowchart of workers compensation medical-legal dispute resolution process..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                />
              </div>
              
              {imageStatus && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
                  <span>{imageStatus}</span>
                </div>
              )}

              {generatedImageUrl && (
                <div className="mt-4 p-4 flex justify-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                  <img 
                    src={generatedImageUrl} 
                    alt="Generated Graphic" 
                    className="rounded-lg max-h-72 object-contain"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={generateImage}
                disabled={isGeneratingImage || !imagePrompt.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {isGeneratingImage ? 'Synthesizing...' : 'Generate Visual Asset'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ToolsPage;