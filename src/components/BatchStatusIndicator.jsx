import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

const NM = "'Neue Montreal', 'Inter', sans-serif";

const BatchStatusIndicator = ({ 
  progress, 
  completedPairs, 
  totalPairs, 
  isProcessing 
}) => {
  const { t } = useLanguage();
  const remaining = totalPairs - completedPairs;
  
  if (totalPairs === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto mt-8 p-6 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden"
    >
      <div className="flex flex-col space-y-6">
        {/* Header Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {isProcessing && (
                <div className="absolute inset-0 rounded-full border-2 border-white/30 animate-spin border-t-transparent"></div>
              )}
            </div>
            <div>
              <h3 className="text-white text-lg font-black tracking-tighter uppercase" style={{ fontFamily: NM }}>
                {t('app.batchStatus')}
              </h3>
              <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest" style={{ fontFamily: NM }}>
                {t('app.processingPairs').replace('{count}', totalPairs)} {totalPairs >= 20 ? t('app.largeBatchMode') : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white font-black text-3xl tracking-tighter" style={{ fontFamily: NM }}>
              {progress}%
            </div>
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest" style={{ fontFamily: NM }}>
              {completedPairs}/{totalPairs} {t('app.complete')}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-xl font-black text-white" style={{ fontFamily: NM }}>{remaining}</div>
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('app.remaining')}</div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-xl font-black text-white" style={{ fontFamily: NM }}>
              {totalPairs >= 50 ? 5 : totalPairs >= 20 ? 3 : 2}
            </div>
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('app.concurrent')}</div>
          </div>
          <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
            <div className="text-sm font-black text-white uppercase tracking-tight" style={{ fontFamily: NM }}>
              {totalPairs >= 100 ? t('app.batchSize.max') : totalPairs >= 50 ? t('app.batchSize.high') : totalPairs >= 20 ? t('app.batchSize.medium') : t('app.batchSize.standard')}
            </div>
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{t('app.batchSize')}</div>
          </div>
        </div>

        {/* Large batch optimization notice */}
        {totalPairs >= 20 && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-white/40 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm">
                <div className="text-white font-black text-[10px] uppercase tracking-widest mb-1" style={{ fontFamily: NM }}>
                  {t('app.largeBatchOptimized')}
                </div>
                <div className="text-gray-500 text-xs leading-relaxed">
                  {t('app.largeBatchOptimizedDesc').replace('{count}', totalPairs)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ETA for very large batches */}
        {totalPairs >= 50 && isProcessing && completedPairs > 0 && (
          <div className="text-center pt-2">
            <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">
              {t('app.eta')}
            </div>
            <div className="text-xl font-black text-white tracking-tighter" style={{ fontFamily: NM }}>
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