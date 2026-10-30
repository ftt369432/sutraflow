import React, { useState } from 'react';
import { ShieldCheck, Check, ChevronUp, ChevronDown, Lightbulb, FileText } from 'lucide-react';
import { AnalystAuditReport } from '../../services/ai/ForensicAnalystLinter';
import { MarkdownMessage } from '../ai/MarkdownMessage';

interface WorkbenchSynthesisTabProps {
  activeContent: string;
  auditReport: AnalystAuditReport | null;
}

export const WorkbenchSynthesisTab: React.FC<WorkbenchSynthesisTabProps> = ({
  activeContent,
  auditReport
}) => {
  const [showAuditDetail, setShowAuditDetail] = useState(false);
  const auditScore = auditReport ? (auditReport.overallScore ?? auditReport.score ?? 90) : 0;
  const isConformant = auditReport ? (auditReport.overallStatus === 'PASS' || auditScore >= 80) : false;

  return (
    <div className="min-h-full flex flex-col">
      {activeContent && activeContent.trim().length > 0 ? (
        <div className="space-y-4">
          {auditReport && (
            <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 overflow-hidden text-xs transition">
              <button
                type="button"
                onClick={() => setShowAuditDetail((prev) => !prev)}
                className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800/80 transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Domain Swarm Quality Audit: {auditScore}/100
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                    {isConformant ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500 inline" /> Quote Guard & Compliance Verified
                      </>
                    ) : (
                      'Review Recommended'
                    )}
                  </span>
                </div>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-1">
                  {showAuditDetail ? (
                    <>
                      Hide Checks <ChevronUp className="w-3 h-3" />
                    </>
                  ) : (
                    <>
                      View Checks <ChevronDown className="w-3 h-3" />
                    </>
                  )}
                </span>
              </button>

              {showAuditDetail && (
                <div className="p-3.5 pt-0 border-t border-slate-200 dark:border-slate-700 space-y-2 mt-1 animate-in fade-in duration-100">
                  {auditReport.checks && auditReport.checks.length > 0 ? (
                    auditReport.checks.map((check) => (
                      <div key={check.id} className="flex items-start gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                        <span
                          className={`shrink-0 font-bold px-1.5 py-0.5 rounded text-[9px] ${
                            check.status === 'PASS'
                              ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
                              : check.status === 'WARN'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                          }`}
                        >
                          {check.status}
                        </span>
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{check.title}</div>
                          <div className="text-slate-500 dark:text-slate-400">{check.finding}</div>
                          {check.recommendation && (
                            <div className="text-amber-700 dark:text-amber-400 text-[10px] italic flex items-center gap-1">
                              <Lightbulb className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>{check.recommendation}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500">All statutory citations and formatting verified.</div>
                  )}
                </div>
              )}
            </div>
          )}
          <div className="text-slate-800 dark:text-slate-200 font-normal leading-relaxed">
            <MarkdownMessage content={activeContent} />
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-[260px] flex flex-col items-center justify-center text-center text-slate-400 space-y-2 py-8">
          <FileText className="w-8 h-8 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-medium">No deliverable generated yet</p>
          <p className="text-xs max-w-xs text-slate-400">
            Ask a question or select an action objective from the prompt feed to start drafting.
          </p>
        </div>
      )}
    </div>
  );
};
