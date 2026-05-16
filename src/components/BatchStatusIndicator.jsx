import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const BatchStatusIndicator = ({ totalPairs, completedPairs, isProcessing = false }) => {
  const { t } = useLanguage();
  const progress = totalPairs > 0 ? Math.floor((completedPairs / totalPairs) * 100) : 0;
  const remaining = totalPairs - completedPairs;

  // Don't show for small batches
  if (totalPairs < 5) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mb-6"
    >
      <div className="p-6" style={{
        background: 'rgba(10, 10, 10, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                <svg className="w-5 h-5 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {isProcessing && (
                <div className="absolute inset-0 rounded-full border-2 border-neon-cyan/50 animate-spin border-t-transparent"></div>
              )}
            </div>
            <div>
              <h3 className="text-white text-lg font-semibold">
                {t('app.batchStatus')}
              </h3>
              <p className="text-gray-400 text-sm">
                {t('app.processingPairs').replace('{count}', totalPairs)} {totalPairs >= 20 ? t('app.largeBatchMode') : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {progress}%
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {completedPairs}/{totalPairs} {t('app.complete')}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-white/5 rounded-full h-3 overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-white/40 rounded-full relative"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              {/* Animated shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[pulse_2s_infinite]"></div>
            </motion.div>
          </div>

          {/* Progress markers for large batches */}
          {totalPairs >= 20 && (
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          )}
        </div>

        {/* Status Details */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">{completedPairs}</div>
            <div className="text-xs text-gray-400">{t('app.completed')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white/60">{remaining}</div>
            <div className="text-xs text-gray-400">{t('app.remaining')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">
              {totalPairs <= 5 ? '4' : totalPairs <= 20 ? '6' : totalPairs <= 50 ? '8' : totalPairs <= 75 ? '10' : '12'}
            </div>
            <div className="text-xs text-gray-400">{t('app.concurrent')}</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 text-center">
            <div className="text-lg font-semibold text-white">
              {totalPairs >= 100 ? t('app.batchSize.max') : totalPairs >= 50 ? t('app.batchSize.high') : totalPairs >= 20 ? t('app.batchSize.medium') : t('app.batchSize.standard')}
            </div>
            <div className="text-xs text-gray-400">{t('app.batchSize')}</div>
          </div>
        </div>

        {/* Large batch optimization notice */}
        {totalPairs >= 20 && (
          <div className="mt-4 bg-white/5 border border-white/10 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <svg className="w-5 h-5 text-white/60 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <div className="text-white font-medium">
                  {t('app.largeBatchOptimized')}
                </div>
                <div className="text-gray-400">
                  {t('app.largeBatchOptimizedDesc').replace('{count}', totalPairs)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ETA for very large batches */}
        {totalPairs >= 50 && isProcessing && completedPairs > 0 && (
          <div className="mt-4 text-center">
            <div className="text-sm text-gray-400">
              {t('app.eta')}
            </div>
            <div className="text-lg font-semibold text-white">
              {(() => {
                const avgTimePerVideo = 90; // seconds (estimated)
                const remainingTime = remaining * avgTimePerVideo;
                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                return `~${minutes}m ${seconds}s`;
              })()}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default BatchStatusIndicator;