import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Activity, ShieldCheck, Wrench, Zap, Trash2, TrendingUp } from 'lucide-react';
import { generateIntelligentAdvisorResponse } from '@/lib/intelligence';
import { useFactoryData } from '@/lib/useFactoryData';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const suggestedQuestions = [
  { text: 'لماذا انخفض الإنتاج هذا الأسبوع؟', icon: <TrendingUp size={16} /> },
  { text: 'ما هو مؤشر صحة المصنع؟', icon: <Activity size={16} /> },
  { text: 'ما هي أكثر العيوب تكراراً؟', icon: <ShieldCheck size={16} /> },
  { text: 'حلل التوقفات والصيانة', icon: <Wrench size={16} /> },
  { text: 'ما هو الأثر المالي للهدر؟', icon: <Zap size={16} /> },
  { text: 'ما هي قرارات الأسبوع؟', icon: <Sparkles size={16} /> },
];

export default function Advisor() {
  const { bundle } = useFactoryData();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: 'مرحباً بك في مساعد MIZAN AI. أنا مستشارك الصناعي الذكي - مهندس صناعي وخبير تحسين مستمر.\n\nيمكنني تحليل بيانات مصنعك والإجابة على أسئلتك بتحليل منظم يشمل: المشكلة، الأدلة، التحليل الهندسي، السبب الجذري، التوصية، والأثر المالي المتوقع.\n\nكيف يمكنني مساعدتك اليوم؟',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateIntelligentAdvisorResponse(text, bundle ?? undefined);
      const aiMsg: Message = { id: `a-${Date.now()}`, role: 'ai', text: response };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="animate-fade-in h-[calc(100vh-7rem)] flex flex-col">
      {/* Header */}
      <div className="card p-4 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aiblue-600 to-navy-800 flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">مساعد MIZAN AI</h2>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
              <p className="text-xs text-slate-400">المستشار الصناعي الذكي - متصل</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                msg.role === 'ai'
                  ? 'bg-gradient-to-br from-aiblue-600 to-navy-800 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}
            >
              {msg.role === 'ai' ? <Sparkles size={18} /> : <User size={18} />}
            </div>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'ai'
                  ? 'bg-white border border-slate-200 text-slate-700'
                  : 'bg-navy-900 text-white'
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-line">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aiblue-600 to-navy-800 flex items-center justify-center shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-aiblue-400 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-aiblue-400 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
              <span className="w-2 h-2 rounded-full bg-aiblue-400 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          {suggestedQuestions.map((q) => (
            <button
              key={q.text}
              onClick={() => sendMessage(q.text)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:border-aiblue-300 hover:text-aiblue-600 transition-all"
            >
              {q.icon}
              {q.text}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="shrink-0">
        <div className="card p-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="اكتب سؤالك هنا..."
            className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-slate-400"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-aiblue-600 text-white flex items-center justify-center hover:bg-aiblue-700 transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
