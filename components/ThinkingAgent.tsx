import React, { useState, useRef, useEffect } from 'react';
import { askThinkingAgent } from '../services/geminiService';

export const ThinkingAgent: React.FC = () => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  useEffect(() => {
    if (answer && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [answer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setAnswer('');
    setThinkingSteps(['Deconstructing query intent...', 'Retrieving contextual knowledge...', 'Formulating logical pathways...']);
    
    // Simulate complex thought progression for UX
    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      if (stepCount === 1) setThinkingSteps(prev => [...prev, 'Evaluating edge cases and counter-arguments...']);
      if (stepCount === 2) setThinkingSteps(prev => [...prev, 'Synthesizing final architecture...']);
      if (stepCount === 3) setThinkingSteps(prev => [...prev, 'Drafting comprehensive response...']);
    }, 3500);

    try {
      const result = await askThinkingAgent(query);
      clearInterval(interval);
      setThinkingSteps([]); // Clear thinking steps on success to show result cleanly, or keep them if desired
      setAnswer(result);
    } catch (err) {
      clearInterval(interval);
      setAnswer("I encountered a network error while attempting to process this deep thought. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-24 pt-32 min-h-screen">
      <div className="text-center mb-16 animate-slide-up">
        <div className="inline-flex items-center justify-center p-3 bg-primary-50 dark:bg-primary-900/20 rounded-2xl mb-6 ring-1 ring-primary-500/20">
          <i className="fas fa-brain text-primary-600 dark:text-primary-400 text-2xl"></i>
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-6">
          Gemini 3.0 Thinking Lab
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Experience the reasoning capabilities of the latest <strong>Gemini 3 Pro</strong> model. 
          This agent utilizes a 32k thinking budget to solve complex architectural and logical problems.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-primary-900/5 dark:shadow-none border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300">
        {/* Input Section */}
        <div className="p-2 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900">
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question that requires deep reasoning (e.g., 'Design a scalable event-driven architecture for a fintech app')..."
              className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 pr-16 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-800 dark:text-slate-200 text-lg min-h-[160px] resize-none placeholder:text-slate-400 transition-all shadow-inner"
              style={{ overflow: 'hidden' }}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 pointer-events-none">
                gemini-3-pro-preview
              </span>
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="w-12 h-12 flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary-600/30"
              >
                {isLoading ? (
                  <i className="fas fa-circle-notch fa-spin"></i>
                ) : (
                  <i className="fas fa-arrow-up"></i>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Thinking State */}
        {isLoading && (
          <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-start gap-5">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm relative z-10">
                  <i className="fas fa-microchip text-primary-500 animate-pulse"></i>
                </div>
                <div className="absolute inset-0 bg-primary-500/20 blur-lg rounded-full"></div>
              </div>
              
              <div className="space-y-4 w-full pt-2">
                <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Thinking Process</p>
                <div className="space-y-3">
                  {thinkingSteps.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-slate-600 dark:text-slate-300 animate-fade-in font-mono text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-500"></span>
                      {step}
                    </div>
                  ))}
                  <div className="flex items-center gap-3 text-slate-400 animate-pulse font-mono text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    Generating tokens...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Answer Output */}
        {answer && (
          <div ref={answerRef} className="border-t border-slate-100 dark:border-slate-800 p-8 md:p-12 animate-fade-in bg-white dark:bg-slate-900">
            <div className="prose prose-lg prose-slate dark:prose-invert max-w-none">
              <div className="flex gap-6">
                <div className="shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                    <i className="fas fa-robot"></i>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="markdown-body whitespace-pre-wrap leading-relaxed">
                    {answer}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-10 flex gap-4 pl-16 border-t border-slate-100 dark:border-slate-800 pt-6">
              <button 
                onClick={() => navigator.clipboard.writeText(answer)}
                className="text-sm font-medium text-slate-500 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-400 flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <i className="fas fa-copy"></i> Copy
              </button>
              <button 
                onClick={() => setAnswer('')}
                className="text-sm font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <i className="fas fa-trash"></i> Reset
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};