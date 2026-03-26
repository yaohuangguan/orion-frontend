import React from 'react';
import { R2UsageStats } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTranslation } from '../../i18n/LanguageContext';

interface R2UsageDashboardProps {
  usage: R2UsageStats;
}

const COLORS = {
  RESOURCES: '#3b82f6', // Blue-500
  BACKUPS: '#f59e0b', // Amber-500
  OTHERS: '#64748b' // Slate-500
};

export const R2UsageDashboard: React.FC<R2UsageDashboardProps> = ({ usage }) => {
  const { t } = useTranslation();

  const chartData = [
    {
      name: t.system.r2.resources,
      value: usage.resources.size,
      formatted: usage.resources.sizeFormatted,
      color: COLORS.RESOURCES
    },
    {
      name: t.system.r2.backups,
      value: usage.backups.size,
      formatted: usage.backups.sizeFormatted,
      color: COLORS.BACKUPS
    },
    {
      name: t.system.r2.others,
      value: usage.others.size,
      formatted: usage.others.sizeFormatted,
      color: COLORS.OTHERS
    }
  ].filter((d) => d.value > 0);

  // Constants for Cloudflare R2 Pricing
  const FREE_TIER_LIMIT_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
  const COST_PER_GB_OVERAGE = 0.015; // $0.015 per GB

  // Calculations
  const totalBytes = usage.total.size;
  const usedPercentage = Math.min(100, (totalBytes / FREE_TIER_LIMIT_BYTES) * 100);
  const isOverLimit = totalBytes > FREE_TIER_LIMIT_BYTES;

  const overageGB = isOverLimit ? (totalBytes - FREE_TIER_LIMIT_BYTES) / (1024 * 1024 * 1024) : 0;
  const estimatedCost = overageGB * COST_PER_GB_OVERAGE;

  // Progress Bar Color
  let progressColor = 'bg-emerald-500';
  if (usedPercentage > 80) progressColor = 'bg-amber-500';
  if (usedPercentage >= 100) progressColor = 'bg-rose-500';

  const StatCard = ({ title, count, size, color, icon }: any) => (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm ${color}`}
        >
          <i className={`fas ${icon}`}></i>
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</span>
      </div>
      <div>
        <div className="text-xl font-bold text-slate-800 dark:text-white">{size}</div>
        <div className="text-xs text-slate-500 font-mono">
          {count} {t.system.cloudinary.objects}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 mb-8 animate-fade-in">
      {/* Tier & Cost Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
          <div className="flex-1 w-full">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-1">
              <i className="fas fa-cloud text-orange-500"></i> {t.system.r2.plan}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {t.system.r2.planDesc}
            </p>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                <span className="text-slate-600 dark:text-slate-300">
                  {t.system.r2.storageUsage}
                </span>
                <span className={`${isOverLimit ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {usage.total.sizeFormatted} / 10 GB
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${progressColor}`}
                  style={{ width: `${usedPercentage}%` }}
                ></div>
              </div>
              <div className="text-[10px] text-slate-400 text-right">
                {usedPercentage.toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 min-w-[200px] border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest mb-1">
              {t.system.r2.estCost}
            </span>
            <div className="text-3xl font-display font-bold text-slate-900 dark:text-white">
              ${estimatedCost.toFixed(4)}
            </div>
            {isOverLimit ? (
              <span className="text-[10px] text-rose-500 font-bold mt-1">
                {t.system.r2.overage}
              </span>
            ) : (
              <span className="text-[10px] text-emerald-500 font-bold mt-1">
                {t.system.r2.freeTier}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Summary Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <StatCard
            title={t.system.r2.resources}
            count={usage.resources.count}
            size={usage.resources.sizeFormatted}
            color="bg-blue-500 shadow-blue-500/20"
            icon="fa-layer-group"
          />
          <StatCard
            title={t.system.r2.backups}
            count={usage.backups.count}
            size={usage.backups.sizeFormatted}
            color="bg-amber-500 shadow-amber-500/20"
            icon="fa-archive"
          />
          <StatCard
            title={t.system.r2.others}
            count={usage.others.count}
            size={usage.others.sizeFormatted}
            color="bg-slate-500 shadow-slate-500/20"
            icon="fa-file"
          />
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl p-4 shadow-lg flex flex-col justify-between border border-slate-700">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {t.system.r2.totalObjects}
            </div>
            <div className="text-3xl font-bold">{usage.total.count}</div>
            <div className="text-[10px] text-slate-400">{t.system.r2.allBuckets}</div>
          </div>
        </div>

        {/* Right: Visualization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            {t.system.r2.distribution}
          </h4>
          <div className="flex-1 min-h-[150px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [props.payload.formatted, name]}
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Center Icon */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
              <i className="fas fa-chart-pie text-slate-300 dark:text-slate-600 text-2xl"></i>
            </div>
          </div>

          {/* Legend Bars */}
          <div className="mt-2 space-y-2">
            {chartData.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  ></span>
                  <span>{item.name}</span>
                </div>
                <span>{item.formatted}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
