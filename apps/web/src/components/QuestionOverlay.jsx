import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Coins
} from 'lucide-react';

export function QuestionOverlay({
  question,
  checkpointNumber,
  onSubmitAnswer,
  onRequestHint,
  onRetryWithRemedial,
  onContinue
}) {
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState(question.hint || '');
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Reset all per-question state whenever a new question is served.
  useEffect(() => {
    setSelectedOption(null);
    setIsSubmitting(false);
    setHintVisible(false);
    setHintText(question.hint || '');
    setHintsUsedCount(0);
    setResult(null);
    setSubmitError(null);

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { scale: 0.85, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: 'back.out(1.5)' }
      );
    }
  }, [question.id]);

  const handleUseHint = async () => {
    if (hintVisible) return;
    setHintVisible(true);
    setHintsUsedCount(c => c + 1);

    if (onRequestHint && !hintText) {
      try {
        const hintRes = await onRequestHint(question.concept, question.question);
        if (hintRes?.hint) {
          setHintText(hintRes.hint);
        }
      } catch (e) {
        console.warn('Hint request error:', e);
      }
    }
  };

  const handleSubmit = async () => {
    if (selectedOption === null || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await onSubmitAnswer({
        questionId: question.id,
        concept: question.concept,
        chosenOption: selectedOption,
        hintsUsed: hintsUsedCount
      });

      setResult(response);

      // Animate result card
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { scale: 0.98 },
          { scale: 1, duration: 0.25, ease: 'power2.out' }
        );
      }
    } catch (err) {
      setSubmitError(err.message || 'Could not submit your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-auto"
    >
      <div
        ref={cardRef}
        className="w-full max-w-xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/30 overflow-hidden relative"
      >
        {/* Header: Concept & Beacon Number */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              Checkpoint {checkpointNumber}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-mono font-medium">
              #{question.concept}
            </span>
          </div>

          {/* Hint Trigger */}
          {!result && (
            <button
              onClick={handleUseHint}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                hintVisible
                  ? 'bg-amber-950/60 border border-amber-600/60 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              <span>{hintVisible ? 'Hint Active' : 'Need Hint?'}</span>
            </button>
          )}
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-xl font-display font-bold text-white mb-5 leading-snug">
          {question.question}
        </h2>

        {/* Revealed Hint Box */}
        {hintVisible && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 animate-fadeIn">
            <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-0.5">AI Hint:</p>
              <p>{hintText || question.hint}</p>
            </div>
          </div>
        )}

        {/* Four Multiple-Choice Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            let optionStyles = 'bg-slate-900/60 border-slate-700/60 text-slate-200 hover:bg-slate-800/80 hover:border-indigo-500/50';

            if (result) {
              if (idx === result.correctOptionIndex) {
                optionStyles = 'bg-emerald-950/70 border-emerald-500 text-emerald-200';
              } else if (isSelected) {
                optionStyles = 'bg-rose-950/70 border-rose-500 text-rose-200';
              } else {
                optionStyles = 'bg-slate-900/30 border-slate-800 text-slate-500 opacity-60';
              }
            } else if (isSelected) {
              optionStyles = 'bg-indigo-950/80 border-indigo-400 text-white shadow-md shadow-indigo-500/20';
            }

            return (
              <button
                key={idx}
                disabled={!!result || isSubmitting}
                onClick={() => setSelectedOption(idx)}
                className={`w-full p-3.5 sm:p-4 rounded-2xl border text-left text-sm font-medium transition-all flex items-start gap-3 cursor-pointer disabled:cursor-default ${optionStyles}`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 font-mono text-xs font-bold ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="flex-1 mt-0.5 leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        {/* FEEDBACK & LEARNING FAILURE LOOP */}
        {result && (
          <div className="mb-6 p-4 rounded-2xl border animate-fadeIn bg-slate-900/80 border-slate-700">
            {result.isCorrect ? (
              <div>
                <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Brilliant! That's correct.</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.explanation || question.explanation}
                </p>
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center gap-1 font-bold text-amber-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>+{result.xpAwarded} XP Gained</span>
                  </div>
                  <div className="flex items-center gap-1 font-bold text-cyan-400">
                    <Coins className="w-3.5 h-3.5" />
                    <span>+{result.tokensEntitled} LQST Entitled</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-rose-400 font-bold mb-1.5">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span>Not quite! Let's understand why:</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed mb-2">
                  {result.explanation || question.explanation}
                </p>
                {result.keyTakeaway && (
                  <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-300 text-[11px] font-medium">
                    💡 <strong>Key Takeaway:</strong> {result.keyTakeaway}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs">
            {submitError}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null || isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>{isSubmitting ? 'Evaluating...' : 'Confirm Answer'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : result.isCorrect ? (
            <button
              onClick={onContinue}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <span>Continue Adventure</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onRetryWithRemedial}
                className="flex-1 sm:flex-initial px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Challenge</span>
              </button>
              <button
                onClick={onContinue}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition-all"
              >
                Skip For Now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
