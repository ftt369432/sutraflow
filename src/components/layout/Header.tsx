import React, { useState, useEffect } from 'react';
import { useUserStore } from '../../stores/userStore';
import {
  Search, Bell, Settings, Menu, ChevronDown, Maximize, Minimize, StickyNote,
  Trash2, Edit2, Mic, Moon, Sun, Laptop, RotateCcw, Lightbulb, Bot, BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { UserMenu } from './UserMenu';
import { useTheme } from '../../contexts/ThemeContext';
import { VoiceControl } from '../../services/VoiceControl';
import { FeedbackManager } from '../../services/evolution/FeedbackManager';
import { useOrchestrationManifest } from '../../hooks/useOrchestrationManifest';
import { useUIStore } from '../../store/uiStore';
import { DemoLaunchButton } from '../demo/DemoLaunchButton';
import { GuidedTourModal } from '../demo/GuidedTourModal';
import { ZoomControls } from './ZoomControls';
import { ThemeSkinSelector } from './ThemeSkinSelector';
import { BRAND_CONFIG } from '../../config/brand';
import { useQuickActions } from '../../hooks/useQuickActions';
import { ActiveContextHUD } from '../common/ActiveContextHUD';

// Type for sticky notes
interface StickyNote {
  id: string;
  content: string;
  timestamp: number; // Unix timestamp
  color: string;
}

interface HeaderProps {
  className?: string;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export function Header({ className, onToggleSidebar, isSidebarCollapsed: _isSidebarCollapsed }: HeaderProps) {
  const { user } = useUserStore();
  const _navigate = useNavigate();
  const { theme, toggleTheme, isDark } = useTheme();
  const { setPaletteOpen } = useQuickActions();
  const setSettingsModalOpen = useUIStore(state => state.setSettingsModalOpen);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showHeaderTour, setShowHeaderTour] = useState<boolean>(() => {
    return localStorage.getItem('genieflow_show_header_tour') === 'true';
  });
  const [showHeaderDemo, setShowHeaderDemo] = useState<boolean>(() => {
    return localStorage.getItem('genieflow_show_header_demo') === 'true';
  });

  useEffect(() => {
    const handleOptionsChange = () => {
      setShowHeaderTour(localStorage.getItem('genieflow_show_header_tour') === 'true');
      setShowHeaderDemo(localStorage.getItem('genieflow_show_header_demo') === 'true');
    };
    const handleOpenTour = () => {
      setIsTourOpen(true);
    };

    window.addEventListener('header-options-changed', handleOptionsChange);
    window.addEventListener('storage', handleOptionsChange);
    window.addEventListener('open-guided-tour', handleOpenTour);

    return () => {
      window.removeEventListener('header-options-changed', handleOptionsChange);
      window.removeEventListener('storage', handleOptionsChange);
      window.removeEventListener('open-guided-tour', handleOpenTour);
    };
  }, []);

  // Voice control state
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceControl] = useState(() => new VoiceControl());

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Search handler
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // TODO: Implement search functionality
  };

  // Enhanced refresh handler - includes email and token refresh
  const handleRefresh = async () => {
    try {
      // Clear search
      setSearchQuery('');

      // Try to refresh email services first
      try {
        // Import email service dynamically to avoid circular dependencies
        const { default: emailService } = await import('../../services/email/emailService');
        await emailService.initialize();
      } catch (emailError) {
        console.warn('⚠️ Email refresh failed:', emailError);
      }

      // Try to refresh Google API tokens
      try {
        const { googleApiClient } = await import('../../services/google/GoogleAPIClient');
        googleApiClient.isSignedIn();
      } catch (tokenError) {
        console.warn('⚠️ Token check failed:', tokenError);
      }

      // Finally refresh the page to ensure all components are updated
      window.location.reload();

    } catch (error) {
      console.error('❌ Refresh failed:', error);
      // Fallback to simple page refresh
      window.location.reload();
    }
  };

  // Voice control handler
  const toggleVoiceControl = async () => {
    if (isVoiceActive) {
      try {
        voiceControl.stopListening();
        setIsVoiceActive(false);
        voiceControl.speak("Voice control deactivated");
      } catch (error) {
        console.error('Error stopping voice control:', error);
      }
    } else {
      try {
        voiceControl.startListening();
        setIsVoiceActive(true);
        voiceControl.speak("Voice control activated. Say 'Hey Genie' to start a command.");
      } catch (error) {
        console.error('Error starting voice control:', error);
        voiceControl.speak("Voice control is not available in this browser");
      }
    }
  };
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [currentNote, setCurrentNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteColor, setNoteColor] = useState('#FFFDD0'); // Default light yellow

  // Feedback State
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackType, setFeedbackType] = useState<'suggestion' | 'blind_spot' | 'feature'>('suggestion');

  // Available note colors
  const noteColors = [
    '#FFFDD0', // Light Yellow
    '#FFCCCC', // Light Red
    '#CCFFCC', // Light Green
    '#CCE0FF', // Light Blue
    '#E6CCFF', // Light Purple
    '#FFE5CC', // Light Orange
  ];

  // Load notes from localStorage on initial render
  useEffect(() => {
    const savedNotes = localStorage.getItem('stickyNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Failed to parse saved notes', e);
      }
    }
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('stickyNotes', JSON.stringify(notes));
  }, [notes]);

  // Function to toggle fullscreen
  const toggleFullscreen = async () => {
    try {
      if (window.electronBridge?.isElectron) {
        const result = await window.electronBridge.system.toggleFullscreen();
        if (result?.success) {
          setIsFullscreen(result.isFullscreen);
        }
        return;
      }

      const doc = document as any;
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      );

      if (!isCurrentlyFullscreen) {
        const element = document.documentElement;
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if ((element as any).mozRequestFullScreen) {
          await (element as any).mozRequestFullScreen();
        } else if ((element as any).msRequestFullscreen) {
          await (element as any).msRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('[Header] Fullscreen toggle failed/blocked:', err);
      // Fallback state toggle
      setIsFullscreen(prev => !prev);
    }
  };

  // Check fullscreen status changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as any;
      setIsFullscreen(!!(
        document.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement
      ));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // Add a note
  const addNote = () => {
    if (currentNote.trim()) {
      if (editingId !== null) {
        // Update existing note
        const updatedNotes = notes.map(note =>
          note.id === editingId ? { ...note, content: currentNote, color: noteColor } : note
        );
        setNotes(updatedNotes);
        setEditingId(null);
      } else {
        // Add new note
        const newNote: StickyNote = {
          id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          content: currentNote,
          timestamp: Date.now(),
          color: noteColor
        };
        setNotes([...notes, newNote]);
      }
      setCurrentNote('');
      setNoteColor('#FFFDD0'); // Reset to default color
    }
  };

  // Edit a note
  const editNote = (note: StickyNote) => {
    setCurrentNote(note.content);
    setEditingId(note.id);
    setNoteColor(note.color);
  };

  // Delete a note
  const deleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const manifest = useOrchestrationManifest();

  const handleFeedbackSubmit = async () => {
    if (!feedbackContent.trim() || !user) return;

    try {
      const context = FeedbackManager.captureContext(manifest);
      await FeedbackManager.submitFeedback({
        user_id: user.id,
        type: feedbackType,
        content: feedbackContent,
        context: context
      });

      console.log('✨ Feedback Submitted successfully');
      setShowFeedback(false);
      setFeedbackContent('');
      // Show a temporary success message or toast if available
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  return (
    <header className={cn(
      "h-16 shrink-0 glassy-header-bar flex items-center pl-4 pr-6 sticky top-0 z-50 w-full",
      className
    )}>
      <div className="flex items-center w-full max-w-full justify-between overflow-hidden">
        <div className="flex items-center">
          {/* Mobile menu button - visible on mobile */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md gleaming-silver-button mr-2 md:mr-4 md:hidden"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          {/* Desktop menu button - hidden on mobile */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md gleaming-silver-button mr-4 hidden md:flex"
              aria-label="Toggle sidebar"
            >
              <Menu size={20} />
            </button>
          )}
          <div 
            onClick={() => setPaletteOpen(true)}
            className="relative flex items-center cursor-pointer group"
          >
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-cyan-400 transition-colors" />
            </div>
            <input
              type="text"
              readOnly
              placeholder={`Search ${BRAND_CONFIG.name}... (Ctrl+K)`}
              onClick={() => setPaletteOpen(true)}
              className="py-1.5 pl-9 pr-8 w-40 sm:w-56 md:w-64 text-xs border border-slate-300 dark:border-slate-700/80 rounded-xl bg-white/70 dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none cursor-pointer hover:border-cyan-500/40 transition-all shadow-sm"
            />
            <div className="absolute right-2.5 flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono text-slate-500 dark:text-slate-400 pointer-events-none">
              <span>⌘K</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-1.5 md:space-x-2 relative" style={{ minWidth: 0 }}>
          {/* Voice Control */}
          <button
            className={cn(
              "hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200",
              isVoiceActive ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40" : ""
            )}
            title={isVoiceActive ? "Stop Voice Control" : "Start Voice Control"}
            onClick={toggleVoiceControl}
          >
            <Mic
              size={18}
              className={isVoiceActive ? 'animate-pulse text-emerald-500' : 'text-slate-600 dark:text-slate-300'}
            />
          </button>

          {/* Refresh */}
          <button
            className="hidden sm:flex p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            onClick={handleRefresh}
            title="Refresh Page & Data"
          >
            <RotateCcw size={18} className="text-slate-600 dark:text-slate-300" />
          </button>

          {/* Theme Toggle */}
          <button
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'system' ? (
              <Laptop size={18} className="text-slate-600 dark:text-slate-300" />
            ) : isDark ? (
              <Sun size={18} className="text-yellow-400" />
            ) : (
              <Moon size={18} className="text-slate-600 dark:text-slate-300" />
            )}
          </button>

          {/* Architect Suggestion / Feedback */}
          <button
            className="hidden md:flex p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            onClick={() => setShowFeedback(!showFeedback)}
            title="Architect Evolution & Feedback"
          >
            <Lightbulb size={18} className={cn("text-slate-600 dark:text-slate-300", showFeedback && "text-yellow-500")} />
          </button>

          {/* Sticky Notes / Notepad */}
          <button
            className={cn(
              "flex p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200",
              showNotes && "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
            )}
            onClick={() => setShowNotes(!showNotes)}
            title="Sticky Notes / Notepad"
          >
            <StickyNote size={18} className={cn("text-slate-600 dark:text-slate-300", showNotes && "text-amber-500")} />
          </button>

          {/* Zoom Controls (Frame Scale & Reset) */}
          <ZoomControls className="hidden sm:flex" />

          {/* Fullscreen Toggle */}
          <button
            className="hidden sm:flex p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize size={18} className="text-slate-600 dark:text-slate-300" /> : <Maximize size={18} className="text-slate-600 dark:text-slate-300" />}
          </button>

          {/* Settings Modal */}
          <button
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
            onClick={() => setSettingsModalOpen(true)}
            title="System Settings"
          >
            <Settings size={18} className="text-slate-600 dark:text-slate-300" />
          </button>

          {/* Guided Tour & Demo Launch */}
          {showHeaderTour && (
            <button
              onClick={() => setIsTourOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all shadow-sm"
              title="Launch Instructional Guided Tour"
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tour</span>
            </button>
          )}
          {showHeaderDemo && (
            <DemoLaunchButton variant="header" />
          )}

          <div className="flex items-center gap-2 ml-1">
            <UserMenu />
          </div>

          <GuidedTourModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
        </div>
      </div>

      {/* Architect Suggestion Panel */}
      {/* Architect Suggestion Panel */}
      {showFeedback && (
        <div className="fixed right-0 top-16 w-80 h-[calc(100vh-64px)] bg-background/98 backdrop-blur-md text-foreground border-l border-border shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-sm">Architect Evolution</h3>
            </div>
            <button
              className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground"
              onClick={() => setShowFeedback(false)}
            >
              <Minimize className="h-4 w-4" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            <div className="p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                As the Architect, your feedback evolves the system. Tell us what the AI is missing or how it should work.
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Feedback Type</label>
              <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
                {(['suggestion', 'blind_spot', 'feature'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFeedbackType(type)}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-md text-[10px] font-bold transition-all duration-200",
                      feedbackType === type
                        ? "bg-background text-primary shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {type.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Your Insight</label>
              <textarea
                className="w-full p-3 bg-background border-2 border-border rounded-xl text-sm min-h-[180px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none shadow-inner"
                placeholder={feedbackType === 'blind_spot' ? "What did the agent fail to do?" : "Describe your structural suggestion..."}
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
              />
            </div>

            <button
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-[0.98] shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
              onClick={handleFeedbackSubmit}
            >
              <span>Submit Evolution Request</span>
              <Bot className="h-4 w-4 group-hover:animate-bounce" />
            </button>
          </div>

          <div className="mt-auto p-4 bg-muted/30 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="h-4 w-4 text-primary opacity-70" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Context Active</span>
            </div>
            <p className="text-[10px] text-muted-foreground/60 italic leading-snug">
              "Submitting will capture current agent thoughts and task hierarchy to help the Architect debug the mismatch."
            </p>
          </div>
        </div>
      )}

      {/* Sticky Notes Panel */}
      {showNotes && (
        <div className="fixed right-0 top-16 w-80 h-[calc(100vh-64px)] bg-white border-l shadow-lg z-50 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-medium">Sticky Notes</h3>
            <button
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100"
              onClick={() => setShowNotes(false)}
            >
              <Minimize className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 border-b">
            <textarea
              className="w-full p-2 border rounded-md text-sm min-h-24"
              placeholder="Type your note here..."
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              style={{ backgroundColor: noteColor }}
            />

            <div className="flex items-center gap-2 my-3">
              <span className="text-xs text-gray-500">Color:</span>
              {noteColors.map(color => (
                <button
                  key={color}
                  className={`w-6 h-6 rounded-full ${noteColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNoteColor(color)}
                  aria-label={`Select ${color} color`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium transition-colors"
                onClick={addNote}
              >
                {editingId !== null ? 'Update Note' : 'Add Note'}
              </button>
              {editingId !== null && (
                <button
                  className="py-2 px-4 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setCurrentNote('');
                    setEditingId(null);
                    setNoteColor('#FFFDD0');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notes.length === 0 ? (
              <div className="text-center text-gray-500 text-sm p-4">
                No notes yet. Add your first note above.
              </div>
            ) : (
              notes.map(note => (
                <div
                  key={note.id}
                  className="p-3 rounded-md shadow-sm relative group border"
                  style={{ backgroundColor: note.color }}
                >
                  <p className="text-sm whitespace-pre-wrap mb-2">{note.content}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDate(note.timestamp)}
                  </div>
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 flex bg-white bg-opacity-70 rounded">
                    <button
                      className="p-1 text-gray-500 hover:text-blue-500"
                      onClick={() => editNote(note)}
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      className="p-1 text-gray-500 hover:text-red-500"
                      onClick={() => deleteNote(note.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}

// Glassmorphism style for header buttons (add to global CSS or Tailwind config):
// .glassy-header-btn {
//   background: rgba(255,255,255,0.25);
//   box-shadow: 0 8px 32px 0 rgba(34,48,74,0.18);
//   border: 1px solid rgba(255,255,255,0.25);
//   backdrop-filter: blur(8px);
// }