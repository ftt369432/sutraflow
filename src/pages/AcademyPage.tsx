import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Video,
  Play,
  CheckCircle2,
  Calendar,
  Sparkles,
  BookOpen,
  Award,
  Users,
  Search,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { academyService, AcademyModule, AcademyLesson, LiveMasterclass } from '../services/academyService';
import { AcademyVideoPlayer } from '../components/academy/AcademyVideoPlayer';
import { AcademyLiveSessionCard } from '../components/academy/AcademyLiveSessionCard';

export const AcademyPage: React.FC = () => {
  const navigate = useNavigate();
  const curriculum = academyService.getCurriculum();
  const liveSessions = academyService.getLiveSessions();
  const pastRecordings = academyService.getPastRecordings();

  const [activeTab, setActiveTab] = useState<'courses' | 'live' | 'recordings'>('courses');
  const [selectedLesson, setSelectedLesson] = useState<AcademyLesson>(curriculum[0].lessons[0]);
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(['les-101']);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleLessonCompletion = (lessonId: string) => {
    setCompletedLessonIds((prev) =>
      prev.includes(lessonId) ? prev.filter((id) => id !== lessonId) : [...prev, lessonId]
    );
  };

  const handleLaunchPractice = (lesson: AcademyLesson) => {
    // Navigate to the Sovereign Workspace to execute the workflow
    navigate('/sovereign', {
      state: {
        autoTriggerCommand: lesson.practicePacket?.workflowCommand,
        practiceCaseName: lesson.practicePacket?.caseName,
      },
    });
  };

  const handleJoinLiveHuddle = (session: LiveMasterclass) => {
    navigate(`/huddle/${session.roomName}`);
  };

  const filteredModules = curriculum.filter(
    (mod) =>
      mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mod.lessons.some((l) => l.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Hero Header */}
      <div className="relative border-b border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/60 to-slate-950 pt-10 pb-8 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-inner">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  GenieFlow Sovereign Academy
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> California WCAB Grounded
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                Learn, Master & Scale Legal AI Automation
              </h1>
              <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
                Step-by-step video masterclasses, downloadable practice case files, and live weekend coaching sessions taught by veteran California Workers' Comp hearing reps and AI engineers.
              </p>
            </div>

            {/* GPU & Certification Quick Stat */}
            <div className="flex sm:flex-row md:flex-col gap-3 shrink-0">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                <Cpu className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-white">RTX 4090 Zero-PHI Mode</div>
                  <div className="text-slate-400">100% Local GPU Processing</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center gap-3">
                <Award className="w-5 h-5 text-amber-400 shrink-0" />
                <div className="text-xs">
                  <div className="font-semibold text-white">GenieFlow Certified Operator</div>
                  <div className="text-slate-400">{completedLessonIds.length} of 5 Lessons Completed</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-8 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'courses'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Video Curriculum ({curriculum.reduce((acc, m) => acc + m.lessons.length, 0)} Lessons)</span>
            </button>

            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'live'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-4 h-4 text-rose-400" />
              <span>Live Weekend Masterclasses</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-500/20 text-rose-300 font-bold">
                {liveSessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recordings')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
                activeTab === 'recordings'
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Replay Vault ({pastRecordings.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full p-6 sm:p-10">
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Video Player & Practice Area */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <AcademyVideoPlayer
                lesson={selectedLesson}
                onLaunchPractice={handleLaunchPractice}
                onCompleteLesson={toggleLessonCompletion}
                isCompleted={completedLessonIds.includes(selectedLesson.id)}
              />
            </div>

            {/* Right: Modules & Lessons Playlist */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search lessons & topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="flex flex-col gap-4 overflow-y-auto max-h-[750px] pr-1">
                {filteredModules.map((module) => (
                  <div key={module.id} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-3.5 bg-slate-900 border-b border-slate-800/80">
                      <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                        Module {module.number}
                      </div>
                      <h3 className="text-sm font-bold text-white mt-0.5">{module.title}</h3>
                    </div>

                    <div className="divide-y divide-slate-800/50">
                      {module.lessons.map((lesson) => {
                        const isSelected = selectedLesson.id === lesson.id;
                        const isDone = completedLessonIds.includes(lesson.id);

                        return (
                          <button
                            key={lesson.id}
                            onClick={() => setSelectedLesson(lesson)}
                            className={`w-full p-3.5 text-left flex items-start justify-between gap-3 transition-colors ${
                              isSelected
                                ? 'bg-indigo-600/20 border-l-4 border-indigo-500'
                                : 'hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="mt-0.5 shrink-0">
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                ) : (
                                  <Play className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                  {lesson.title}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {lesson.durationMinutes} mins • {lesson.difficulty}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-r from-blue-950/60 to-slate-900/60 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Live Weekend Masterclasses & Coaching</h2>
                  <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                    Every Saturday and Sunday, join our lead legal engineers live in WebRTC video huddles. Bring your toughest claims, audit QME reports live, and build custom automated workflows.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-blue-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span>Free for All Registered Users</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveSessions.map((session) => (
                <AcademyLiveSessionCard
                  key={session.id}
                  session={session}
                  onJoinSession={handleJoinLiveHuddle}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'recordings' && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pastRecordings.map((session) => (
                <AcademyLiveSessionCard
                  key={session.id}
                  session={session}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Regulatory Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500 bg-slate-950">
        [Notice: Preliminary research and calculation draft generated by California Workers' Comp MCP Engine. For legal/claims practitioner review only. Must be independently verified before formal citation, negotiation, or WCAB filing.]
      </footer>
    </div>
  );
};
