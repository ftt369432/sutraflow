import React, { useState } from 'react';
import { Play, Pause, CheckCircle2, Clock, Download, Sparkles, Award } from 'lucide-react';
import { AcademyLesson } from '../../services/academyService';

interface AcademyVideoPlayerProps {
  lesson: AcademyLesson;
  onLaunchPractice?: (lesson: AcademyLesson) => void;
  onCompleteLesson?: (lessonId: string) => void;
  isCompleted?: boolean;
}

export const AcademyVideoPlayer: React.FC<AcademyVideoPlayerProps> = ({
  lesson,
  onLaunchPractice,
  onCompleteLesson,
  isCompleted = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
      {/* Video Viewport */}
      <div className="relative aspect-video bg-black flex items-center justify-center group">
        <video
          key={lesson.id}
          className="w-full h-full object-cover"
          poster={lesson.thumbnailUrl}
          controls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={lesson.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {!isPlaying && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/50 mb-3 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 fill-current translate-x-0.5" />
            </div>
            <span className="text-white font-semibold text-lg">{lesson.title}</span>
            <span className="text-slate-300 text-sm mt-1">{lesson.durationMinutes} Minutes • {lesson.difficulty}</span>
          </div>
        )}
      </div>

      {/* Lesson Meta Bar */}
      <div className="p-6 bg-slate-900/90 border-t border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {lesson.difficulty}
              </span>
              {lesson.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full text-xs bg-slate-800 text-slate-400 border border-slate-700">
                  {tag}
                </span>
              ))}
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{lesson.title}</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">{lesson.description}</p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {lesson.practicePacket && onLaunchPractice && (
              <button
                onClick={() => onLaunchPractice(lesson)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>Launch Practice Sandbox</span>
              </button>
            )}

            {onCompleteLesson && (
              <button
                onClick={() => onCompleteLesson(lesson.id)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 border transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'Completed' : 'Mark Complete'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Chapters Outline */}
        {lesson.chapters.length > 0 && (
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Chapter Breakdown</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {lesson.chapters.map((ch, idx) => (
                <button
                  key={ch.title}
                  onClick={() => setActiveChapterIndex(idx)}
                  className={`flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-colors ${
                    activeChapterIndex === idx
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 font-medium'
                      : 'bg-slate-800/50 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="truncate pr-2">{ch.title}</span>
                  <span className="text-slate-500 font-mono text-[11px] shrink-0">{ch.time}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
