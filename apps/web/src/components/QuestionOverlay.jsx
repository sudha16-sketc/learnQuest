import React, { useState, useEffect, useRef } from 'react';
import {
  IconCheckCircle,
  IconXCircle,
  IconLightbulb,
  IconArrowRight,
  IconRotateCcw,
  IconCoins
} from './Icons';

export function QuestionOverlay({
  question,
  checkpointNumber,
  onSubmitAnswer,
  onRequestHint,
  onRetryWithRemedial,
  onContinue
}) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintVisible, setHintVisible] = useState(false);
  const [hintText, setHintText] = useState(question.hint || '');
  const [hintsUsedCount, setHintsUsedCount] = useState(0);
  const [result, setResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Reset state on question change
  useEffect(() => {
    setSelectedOption(null);
    setIsSubmitting(false);
    setHintVisible(false);
    setHintText(question.hint || '');
    setHintsUsedCount(0);
    setResult(null);
    setSubmitError(null);
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
    } catch (err) {
      setSubmitError(err.message || 'Could not submit your answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d1410]/90 pointer-events-auto select-none">
      <div className="w-full max-w-xl bg-[#0d1410] border-2 border-[#17985d] p-6 sm:p-8 overflow-hidden relative">
        {/* Header: Concept & Beacon Number */}
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-[#17985d]/30 font-mono">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#17985d] text-[#ffffff] text-xs font-bold uppercase tracking-wider">
              Checkpoint {checkpointNumber}
            </span>
            <span className="px-2 py-1 border border-[#6d6499] text-[#6d6499] text-xs font-medium">
              #{question.concept}
            </span>
          </div>

          {/* Hint Trigger */}
          {!result && (
            <button
              onClick={handleUseHint}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-wider border ${
                hintVisible
                  ? 'bg-[#0d1410] border-[#6d6499] text-[#6d6499]'
                  : 'bg-[#0d1410] hover:bg-[#17985d]/10 text-[#d2fcf8] border-[#17985d]'
              }`}
            >
              <IconLightbulb className="w-3.5 h-3.5 text-[#17985d]" />
              <span>{hintVisible ? 'Hint Active' : 'Request Hint'}</span>
            </button>
          )}
        </div>

        {/* Question Text */}
        <h2 className="text-base sm:text-lg font-bold text-[#ffffff] mb-5 leading-snug">
          {question.question}
        </h2>

        {/* Revealed Hint Box */}
        {hintVisible && (
          <div className="mb-5 p-3.5 bg-[#0d1410] border border-[#6d6499] text-[#d2fcf8] text-xs font-mono flex items-start gap-2.5">
            <IconLightbulb className="w-4 h-4 text-[#6d6499] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#6d6499] uppercase mb-0.5">AI Hint Guidance:</p>
              <p>{hintText || question.hint}</p>
            </div>
          </div>
        )}

        {/* Four Multiple-Choice Options */}
        <div className="space-y-2.5 mb-6 font-mono">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            let optionStyles = 'bg-[#0d1410] border-[#17985d]/50 text-[#d2fcf8] hover:border-[#17985d]';

            if (result) {
              if (idx === result.correctOptionIndex) {
                optionStyles = 'bg-[#17985d]/20 border-[#17985d] text-[#ffffff]';
              } else if (isSelected) {
                optionStyles = 'bg-[#6d6499]/20 border-[#6d6499] text-[#ffffff]';
              } else {
                optionStyles = 'bg-[#0d1410] border-[#17985d]/20 text-[#d2fcf8]/40';
              }
            } else if (isSelected) {
              optionStyles = 'bg-[#17985d] border-[#17985d] text-[#ffffff]';
            }

            return (
              <button
                key={idx}
                disabled={!!result || isSubmitting}
                onClick={() => setSelectedOption(idx)}
                className={`w-full p-3 border text-left text-xs sm:text-sm font-medium flex items-start gap-3 cursor-pointer disabled:cursor-default ${optionStyles}`}
              >
                <div
                  className={`w-5 h-5 flex items-center justify-center shrink-0 text-xs font-bold border ${
                    isSelected
                      ? 'bg-[#ffffff] text-[#0d1410] border-[#ffffff]'
                      : 'bg-[#0d1410] text-[#17985d] border-[#17985d]'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="flex-1 leading-relaxed">{option}</span>
              </button>
            );
          })}
        </div>

        {/* FEEDBACK & LEARNING FAILURE LOOP */}
        {result && (
          <div className="mb-6 p-4 bg-[#0d1410] border-2 border-[#17985d] font-mono">
            {result.isCorrect ? (
              <div>
                <div className="flex items-center gap-2 text-[#17985d] font-bold text-sm mb-1 uppercase">
                  <IconCheckCircle className="w-5 h-5 text-[#17985d]" />
                  <span>Correct Answer Verified</span>
                </div>
                <p className="text-xs text-[#d2fcf8]/90 leading-relaxed">
                  {result.explanation || question.explanation}
                </p>
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#17985d]/30 text-xs font-bold">
                  <div className="text-[#ffffff]">
                    +{result.xpAwarded} XP Recorded
                  </div>
                  <div className="flex items-center gap-1 text-[#17985d]">
                    <IconCoins className="w-3.5 h-3.5" />
                    <span>+{result.tokensEntitled} LQST Voucher</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 text-[#6d6499] font-bold text-sm mb-1.5 uppercase">
                  <IconXCircle className="w-5 h-5 text-[#6d6499]" />
                  <span>Incorrect. Concept Analysis:</span>
                </div>
                <p className="text-xs text-[#d2fcf8]/90 leading-relaxed mb-2">
                  {result.explanation || question.explanation}
                </p>
                {result.keyTakeaway && (
                  <div className="p-2.5 bg-[#0d1410] border border-[#6d6499] text-[#6d6499] text-[11px] font-medium">
                    <strong>Key Concept:</strong> {result.keyTakeaway}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {submitError && (
          <div className="mb-4 p-3 bg-[#0d1410] border border-[#6d6499] text-[#6d6499] text-xs font-mono">
            {submitError}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2 font-mono">
          {!result ? (
            <button
              onClick={handleSubmit}
              disabled={selectedOption === null || isSubmitting}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#17985d] text-[#ffffff] font-bold text-xs uppercase tracking-wider hover:bg-[#17985d]/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Evaluating...' : 'Submit Choice'}</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : result.isCorrect ? (
            <button
              onClick={onContinue}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#17985d] text-[#ffffff] font-bold text-xs uppercase tracking-wider hover:bg-[#17985d]/90 flex items-center justify-center gap-2"
            >
              <span>Resume Flight</span>
              <IconArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={onRetryWithRemedial}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#6d6499] text-[#ffffff] font-bold text-xs uppercase tracking-wider hover:bg-[#6d6499]/90 flex items-center justify-center gap-2"
              >
                <IconRotateCcw className="w-3.5 h-3.5" />
                <span>Retry Question</span>
              </button>
              <button
                onClick={onContinue}
                className="px-4 py-2.5 bg-[#0d1410] border border-[#17985d] text-[#d2fcf8] font-bold text-xs uppercase tracking-wider hover:bg-[#17985d]/10"
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
