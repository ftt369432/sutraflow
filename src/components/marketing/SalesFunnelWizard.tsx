import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Question {
  id: string;
  text: string;
  icon: React.ReactNode;
  options: {
    label: string;
    value: string;
    agentId: string;
    description: string;
  }[];
}

const discoveryQuestions: Question[] = [
  {
    id: 'industry',
    text: 'What is your primary domain of operation?',
    icon: <Sparkles className="h-6 w-6 text-blue-500" />,
    options: [
      { 
        label: 'Legal & Litigation', 
        value: 'legal', 
        agentId: 'legal',
        description: 'Elite workers\' comp and litigation orchestration.'
      },
      { 
        label: 'Finance & Trading', 
        value: 'finance', 
        agentId: 'trading',
        description: 'Wolf of Wall Street quantitative intelligence.'
      },
      { 
        label: 'Medical & Healthcare', 
        value: 'medical', 
        agentId: 'medical',
        description: 'Autonomous record parsing and Dx summarization.'
      },
      { 
        label: 'Deep Research', 
        value: 'research', 
        agentId: 'research',
        description: 'Sovereign knowledge acquisition and synthesis.'
      },
      { 
        label: 'Extraction & Processing', 
        value: 'docufy', 
        agentId: 'docufy',
        description: 'Autonomous document extraction for massive data dumps.'
      }
    ]
  }
];

export function SalesFunnelWizard() {
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const handleSelect = (questionId: string, value: string, agentId: string) => {
    const nextStep = step + 1;
    if (nextStep < discoveryQuestions.length) {
      setStep(nextStep);
    } else {
      // Completed - Direct to specialized landing page
      navigate(`/agents/${agentId}`);
    }
  };

  const currentQuestion = discoveryQuestions[step];

  return (
    <div className="w-full max-w-4xl mx-auto p-8 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-2xl shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-500 opacity-60" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 rounded-2xl bg-blue-500/10">
              {currentQuestion.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-1">Step {step + 1} of {discoveryQuestions.length}</p>
              <h3 className="text-2xl md:text-3xl font-bold">{currentQuestion.text}</h3>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSelect(currentQuestion.id, option.value, option.agentId)}
                className="p-6 text-left rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-5 w-5 text-blue-500" />
                </div>
                <h4 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors">{option.label}</h4>
                <p className="text-sm text-gray-400 leading-relaxed">{option.description}</p>
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
        <div className="flex gap-2">
          {discoveryQuestions.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-white/10'}`} 
            />
          ))}
        </div>
        <p className="text-sm text-gray-500 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Finding your optimal AI deployment...
        </p>
      </div>
    </div>
  );
}
