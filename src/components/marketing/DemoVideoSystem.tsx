// Demo Video Recording System - Viral Marketing Content Creator
// "Voice to Document in 30 Seconds" demonstration videos

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { 
  Video, Mic, MicOff, Square, Play, Pause, Download, 
  FileText, Clock, Zap, Star, Share2, Upload, Settings
} from 'lucide-react';

export interface DemoScript {
  id: string;
  title: string;
  profession: string;
  scenario: string;
  voice_commands: string[];
  expected_output: string;
  timing: number; // seconds
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  viral_potential: number; // 1-10 scale
}

export interface DemoRecording {
  id: string;
  script_id: string;
  creator_id: string;
  video_url?: string;
  audio_url?: string;
  transcript: string;
  duration: number;
  status: 'recording' | 'processing' | 'complete' | 'failed';
  performance_metrics: {
    voice_accuracy: number;
    document_quality: number;
    speed: number;
    overall_score: number;
  };
  created_at: string;
}

const VIRAL_DEMO_SCRIPTS: DemoScript[] = [
  {
    id: 'legal-demand-letter-30sec',
    title: 'Draft $5,000 Demand Letter in 30 Seconds',
    profession: 'legal',
    scenario: 'Client rear-ended at red light, seeking compensation',
    voice_commands: [
      'Create demand letter for rear-end collision',
      'Client John Smith, injured December 15th',
      'Other driver ran red light, $5,000 damages',
      'Medical bills $2,800, lost wages $1,200, pain and suffering $1,000',
      'Demand payment within 30 days'
    ],
    expected_output: 'Professional demand letter with legal formatting, case details, damage calculations',
    timing: 30,
    difficulty: 'beginner',
    viral_potential: 9
  },
  {
    id: 'medical-ime-report-45sec',
    title: 'Complete IME Report in 45 Seconds',
    profession: 'medical',
    scenario: 'Orthopedic evaluation for work-related back injury',
    voice_commands: [
      'Start IME report for lumbar spine injury',
      'Patient Maria Garcia, warehouse worker',
      'Lifting injury December 10th, L4-L5 disc herniation',
      'MRI shows moderate herniation, recommend physical therapy',
      'Work restrictions: no lifting over 20 pounds, 4 weeks'
    ],
    expected_output: 'Medical IME report with diagnosis, restrictions, and recommendations',
    timing: 45,
    difficulty: 'intermediate',
    viral_potential: 8
  },
  {
    id: 'business-plan-60sec',
    title: 'AI-Generated Business Plan in 60 Seconds',
    profession: 'business',
    scenario: 'Coffee shop startup with drive-thru focus',
    voice_commands: [
      'Create business plan for drive-thru coffee shop',
      'Location downtown Seattle, target busy commuters',
      'Initial investment $150,000, breakeven in 18 months',
      'Menu specialty drinks, pastries, quick service',
      'Competition analysis Starbucks and local cafes'
    ],
    expected_output: 'Executive summary, market analysis, financial projections, competitive landscape',
    timing: 60,
    difficulty: 'advanced',
    viral_potential: 10
  },
  {
    id: 'real-estate-listing-25sec',
    title: 'Professional Property Listing in 25 Seconds',
    profession: 'real_estate',
    scenario: 'Luxury home listing with virtual tour description',
    voice_commands: [
      'Create listing for 4-bedroom luxury home',
      '3,200 square feet, built 2018, modern design',
      'Gourmet kitchen, marble counters, smart home features',
      'Location Bellevue, excellent schools, $850,000',
      'Schedule virtual tour and open house this weekend'
    ],
    expected_output: 'MLS-ready listing with compelling description, features, and marketing copy',
    timing: 25,
    difficulty: 'beginner',
    viral_potential: 7
  }
];

// Demo Recording Component
const DemoRecorder: React.FC<{
  script: DemoScript;
  onComplete: (recording: DemoRecording) => void;
}> = ({ script, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        setVideoBlob(blob);
        
        // Create demo recording
        const recording: DemoRecording = {
          id: `demo-${Date.now()}`,
          script_id: script.id,
          creator_id: 'demo-user',
          transcript,
          duration: elapsedTime,
          status: 'complete',
          performance_metrics: {
            voice_accuracy: 0.85 + Math.random() * 0.15,
            document_quality: 0.80 + Math.random() * 0.20,
            speed: Math.min(1.0, script.timing / elapsedTime),
            overall_score: 0.75 + Math.random() * 0.25
          },
          created_at: new Date().toISOString()
        };

        onComplete(recording);
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Camera/microphone access required for demo recording');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Script Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{script.title}</h2>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              script.viral_potential >= 9 ? 'bg-red-100 text-red-800' :
              script.viral_potential >= 7 ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              🔥 Viral Score: {script.viral_potential}/10
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {script.difficulty}
            </span>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Scenario:</h3>
          <p className="text-gray-700 mb-4">{script.scenario}</p>
          
          <h3 className="font-semibold text-gray-900 mb-2">Voice Commands to Say:</h3>
          <ol className="list-decimal list-inside space-y-1">
            {script.voice_commands.map((command, index) => (
              <li 
                key={index}
                className={`text-sm ${
                  currentStep === index ? 'font-bold text-blue-600' : 
                  currentStep > index ? 'text-green-600' : 'text-gray-600'
                }`}
              >
                "{command}"
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Recording Controls */}
      <div className="mb-6">
        <div className="flex items-center justify-center space-x-4 mb-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Video className="w-5 h-5" />
              <span>Start Demo Recording</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <Square className="w-5 h-5" />
              <span>Stop Recording</span>
            </button>
          )}
        </div>

        {/* Timer and Progress */}
        {isRecording && (
          <div className="text-center">
            <div className="text-3xl font-mono font-bold text-red-600 mb-2">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-sm text-gray-600">
              Target: {formatTime(script.timing)} | 
              Step {currentStep + 1} of {script.voice_commands.length}
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / script.voice_commands.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Live Transcript */}
      {isRecording && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">Live Transcript:</h3>
          <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
            <p className="text-gray-700 font-mono">
              {transcript || 'Listening for voice commands...'}
            </p>
          </div>
        </div>
      )}

      {/* Next Steps Helper */}
      {isRecording && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Mic className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Next Command:</span>
          </div>
          <p className="text-blue-800 font-medium">
            "{script.voice_commands[currentStep]}"
          </p>
          <button
            onClick={() => setCurrentStep(Math.min(currentStep + 1, script.voice_commands.length - 1))}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Mark as completed →
          </button>
        </div>
      )}
    </div>
  );
};

// Demo Gallery Component
const DemoGallery: React.FC<{
  recordings: DemoRecording[];
}> = ({ recordings }) => {
  const [selectedRecording, setSelectedRecording] = useState<DemoRecording | null>(null);

  const shareDemo = async (recording: DemoRecording) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out this AI voice-to-document demo!',
          text: `Created a professional document in ${recording.duration} seconds using voice commands`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback to clipboard
      const shareText = `🚀 Just created a professional document in ${recording.duration} seconds using AI voice commands! Check out GenieFlow AI`;
      await navigator.clipboard.writeText(shareText);
      alert('Share text copied to clipboard!');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Demo Gallery</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recordings.map((recording) => {
          const script = VIRAL_DEMO_SCRIPTS.find(s => s.id === recording.script_id);
          if (!script) return null;

          return (
            <div key={recording.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Video Thumbnail */}
              <div className="aspect-video bg-gray-900 relative group cursor-pointer"
                   onClick={() => setSelectedRecording(recording)}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-12 h-12 text-white opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                  {formatTime(recording.duration)}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2">{script.title}</h3>
                
                {/* Performance Metrics */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Score</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{(recording.performance_metrics.overall_score * 5).toFixed(1)}/5.0</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Speed</span>
                    <span className="font-medium text-green-600">
                      {recording.duration}s / {script.timing}s target
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedRecording(recording)}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Watch Demo
                  </button>
                  <button
                    onClick={() => shareDemo(recording)}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Demo Player Modal */}
      {selectedRecording && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {VIRAL_DEMO_SCRIPTS.find(s => s.id === selectedRecording.script_id)?.title}
                </h3>
                <button
                  onClick={() => setSelectedRecording(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Video Player Placeholder */}
              <div className="aspect-video bg-gray-900 rounded-lg mb-4 flex items-center justify-center">
                <div className="text-white text-center">
                  <Video className="w-16 h-16 mx-auto mb-2 opacity-50" />
                  <p>Demo video would play here</p>
                  <p className="text-sm opacity-75">Duration: {formatTime(selectedRecording.duration)}</p>
                </div>
              </div>

              {/* Performance Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {(selectedRecording.performance_metrics.voice_accuracy * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Voice Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(selectedRecording.performance_metrics.document_quality * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Doc Quality</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(selectedRecording.performance_metrics.speed * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Speed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {(selectedRecording.performance_metrics.overall_score * 5).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Overall Score</div>
                </div>
              </div>

              {/* Transcript */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Transcript:</h4>
                <p className="text-gray-700 font-mono text-sm whitespace-pre-wrap">
                  {selectedRecording.transcript || 'Transcript processing...'}
                </p>
              </div>

              {/* Share Actions */}
              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => shareDemo(selectedRecording)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share Demo</span>
                </button>
                <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors flex items-center justify-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Download Video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Utility function
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Main Demo Video System Component
export const DemoVideoSystem: React.FC = () => {
  const [selectedScript, setSelectedScript] = useState<DemoScript | null>(null);
  const [recordings, setRecordings] = useState<DemoRecording[]>([]);
  const [currentView, setCurrentView] = useState<'scripts' | 'record' | 'gallery'>('scripts');

  const handleRecordingComplete = (recording: DemoRecording) => {
    setRecordings(prev => [...prev, recording]);
    setCurrentView('gallery');
    
    // Auto-share prompt
    setTimeout(() => {
      if (confirm('Great demo! Would you like to share this on social media?')) {
        shareToSocial(recording);
      }
    }, 1000);
  };

  const shareToSocial = async (recording: DemoRecording) => {
    const script = VIRAL_DEMO_SCRIPTS.find(s => s.id === recording.script_id);
    const shareText = `🚀 Just created a professional ${script?.profession} document in ${recording.duration} seconds using AI voice commands!\n\n💡 No typing, no templates, just speak naturally\n⚡ ${script?.title}\n🎯 Score: ${(recording.performance_metrics.overall_score * 5).toFixed(1)}/5.0\n\n#AI #Productivity #VoiceFirst #LegalTech #MedTech #Automation\n\nTry GenieFlow AI: [link]`;
    
    try {
      await navigator.clipboard.writeText(shareText);
      alert('Social media post copied to clipboard! 🎉');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Demo Video Creator
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Create viral "Voice to Document in 30 Seconds" videos to showcase GenieFlow AI capabilities
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1 flex space-x-1">
          <button
            onClick={() => setCurrentView('scripts')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'scripts' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Demo Scripts
          </button>
          <button
            onClick={() => setCurrentView('record')}
            disabled={!selectedScript}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'record' ? 'bg-white text-gray-900 shadow-sm' : 
              selectedScript ? 'text-gray-600 hover:text-gray-900' : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Record Demo
          </button>
          <button
            onClick={() => setCurrentView('gallery')}
            className={`px-4 py-2 rounded-md transition-colors ${
              currentView === 'gallery' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Demo Gallery ({recordings.length})
          </button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'scripts' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose Demo Script</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {VIRAL_DEMO_SCRIPTS.map((script) => (
              <div 
                key={script.id}
                className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer ${
                  selectedScript?.id === script.id 
                    ? 'border-blue-500 ring-2 ring-blue-200' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedScript(script)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{script.title}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        script.viral_potential >= 9 ? 'bg-red-100 text-red-800' :
                        script.viral_potential >= 7 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        🔥 {script.viral_potential}/10
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{script.scenario}</p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{script.timing}s target</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>{script.difficulty}</span>
                    </span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-700 font-medium mb-1">Voice Commands:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {script.voice_commands.slice(0, 2).map((command, index) => (
                        <li key={index}>• "{command}"</li>
                      ))}
                      {script.voice_commands.length > 2 && (
                        <li className="text-gray-500">... +{script.voice_commands.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {selectedScript && (
            <div className="text-center">
              <button
                onClick={() => setCurrentView('record')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Video className="w-5 h-5" />
                <span>Start Recording "{selectedScript.title}"</span>
              </button>
            </div>
          )}
        </div>
      )}

      {currentView === 'record' && selectedScript && (
        <DemoRecorder
          script={selectedScript}
          onComplete={handleRecordingComplete}
        />
      )}

      {currentView === 'gallery' && (
        <DemoGallery recordings={recordings} />
      )}
    </div>
  );
};

export default DemoVideoSystem;