import { useState } from 'react';
import { Search, GitBranch, Fish, ArrowLeft, ArrowRight, Sparkles, Target } from 'lucide-react';
import {
  generateFiveWhyAnalysis,
  generateFishboneAnalysis,
  getAllFiveWhyProblems,
} from '@/lib/intelligence';

export default function RootCauseAnalysis() {
  const problems = getAllFiveWhyProblems();
  const [selectedProblem, setSelectedProblem] = useState(problems[0].id);
  const [view, setView] = useState<'5why' | 'fishbone'>('5why');

  const fiveWhy = generateFiveWhyAnalysis(selectedProblem);
  const fishbone = generateFishboneAnalysis(selectedProblem);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card p-6 bg-gradient-to-l from-navy-900 to-navy-800 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
            <Search size={28} />
          </div>
          <div>
            <h2 className="text-xl font-extrabold">تحليل السبب الجذري</h2>
            <p className="text-sm text-white/60 mt-0.5">Root Cause Analysis - تحليل هندسي منهجي للمشاكل الصناعية</p>
          </div>
        </div>
      </div>

      {/* Problem selector + view toggle */}
      <div className="card p-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-semibold text-slate-600">المشكلة:</label>
          <select
            value={selectedProblem}
            onChange={(e) => setSelectedProblem(e.target.value)}
            className="input-field max-w-xs"
          >
            {problems.map((p) => (
              <option key={p.id} value={p.id}>{p.problem}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 mr-auto">
          <button
            onClick={() => setView('5why')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === '5why' ? 'bg-aiblue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <GitBranch size={18} />
            5 Why
          </button>
          <button
            onClick={() => setView('fishbone')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              view === 'fishbone' ? 'bg-aiblue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Fish size={18} />
            Fishbone
          </button>
        </div>
      </div>

      {/* 5-Why Analysis */}
      {view === '5why' && (
        <div className="card p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-aiblue-50 flex items-center justify-center text-aiblue-600">
              <GitBranch size={20} />
            </div>
            <div>
              <h3 className="section-title">تحليل 5 Why</h3>
              <p className="text-xs text-slate-400">الوصول للسبب الجذري بالسؤال المتتالي</p>
            </div>
          </div>

          <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-xs font-bold text-red-600 mb-1">المشكلة</p>
            <p className="text-sm font-semibold text-slate-800">{fiveWhy.problem}</p>
          </div>

          <div className="space-y-3">
            {fiveWhy.steps.map((step, i) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-aiblue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  {i < fiveWhy.steps.length - 1 && <div className="w-0.5 flex-1 bg-aiblue-200 my-1" />}
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-sm font-bold text-aiblue-700 mb-1">{step.why}</p>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm text-slate-700">{step.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-xl bg-navy-900 text-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-aiblue-300" />
              <p className="text-xs font-bold text-aiblue-300 uppercase tracking-wide">السبب الجذري</p>
            </div>
            <p className="text-sm font-semibold leading-relaxed mb-3">{fiveWhy.rootCause}</p>
            <div className="rounded-lg bg-white/10 p-3">
              <p className="text-xs text-white/50 mb-1">التوصية</p>
              <p className="text-sm">{fiveWhy.recommendation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fishbone Analysis */}
      {view === 'fishbone' && (
        <div className="card p-6 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
              <Fish size={20} />
            </div>
            <div>
              <h3 className="section-title">تحليل Fishbone (Ishikawa)</h3>
              <p className="text-xs text-slate-400">تحليل الأسباب حسب فئات 6M</p>
            </div>
          </div>

          <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-6">
            <p className="text-xs font-bold text-red-600 mb-1">المشكلة</p>
            <p className="text-sm font-semibold text-slate-800">{fishbone.problem}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fishbone.categories.map((cat) => {
              const colors: Record<string, string> = {
                machine: '#0066FF',
                material: '#00B86B',
                method: '#F59E0B',
                man: '#8b5cf6',
                measurement: '#06b6d4',
                environment: '#ec4899',
              };
              const color = colors[cat.category];
              return (
                <div key={cat.category} className="rounded-xl border-2 p-4" style={{ borderColor: `${color}30` }}>
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-white text-sm font-bold mb-3"
                    style={{ backgroundColor: color }}
                  >
                    {cat.labelAr}
                  </div>
                  <div className="space-y-2">
                    {cat.causes.map((cause, j) => (
                      <div key={j} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                        {cause}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-xl bg-navy-900 text-white p-5">
            <div className="flex items-center gap-2 mb-2">
              <Target size={18} className="text-aiblue-300" />
              <p className="text-xs font-bold text-aiblue-300 uppercase tracking-wide">السبب الجذري الرئيسي</p>
            </div>
            <p className="text-sm font-semibold leading-relaxed">{fishbone.primaryRootCause}</p>
          </div>
        </div>
      )}
    </div>
  );
}
