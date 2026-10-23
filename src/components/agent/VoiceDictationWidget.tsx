import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2, Play, CheckCircle2 } from 'lucide-react';

interface VoiceDictationWidgetProps {
  onTranscribe?: (text: string) => void;
  onExecuteIntent?: (intentText: string) => void;
}

export const VoiceDictationWidget: React.FC<VoiceDictationWidgetProps> = ({
  onTranscribe,
  onExecuteIntent,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Hold Spacebar or Click to Dictate');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check browser support for SpeechRecognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (onTranscribe) {
          onTranscribe(currentTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Voice dictation error:', event.error);
        setIsListening(false);
        setStatusMessage(`Error: ${event.error}`);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscribe]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setStatusMessage('Voice Recognition API not supported in this browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatusMessage('Dictation paused');
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      setStatusMessage('Listening... Speak your command');
    }
  };

  const handleExecute = () => {
    if (!transcript.trim()) return;
    setIsProcessing(true);
    setStatusMessage('Routing intent to GenieFlow background engine...');
    
    setTimeout(() => {
      if (onExecuteIntent) {
        onExecuteIntent(transcript);
      }
      setIsProcessing(false);
      setStatusMessage('Intent dispatched to MCP server');
    }, 800);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg backdrop-blur-md">
      <button
        onClick={toggleListening}
        className={`relative p-3 rounded-full transition-all duration-300 ${
          isListening
            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/50 scale-105 animate-pulse'
            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
        }`}
        title={isListening ? 'Click to Stop Dictation' : 'Click to Push-to-Talk'}
      >
        {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center min-w-[200px]">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Voice-In, Visual-Out
          </span>
          <span className="text-[10px] text-slate-500">{statusMessage}</span>
        </div>
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="e.g., Prep Martinez deposition and draft 28-line penalty petition..."
          className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
        />
      </div>

      {transcript && (
        <button
          onClick={handleExecute}
          disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow transition-all disabled:opacity-50"
        >
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Execute Intent
        </button>
      )}
    </div>
  );
};
