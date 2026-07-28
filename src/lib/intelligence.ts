/**
 * MIZAN AI Decision Intelligence Engine
 *
 * Modular intelligence layer that analyzes factory data and generates
 * structured industrial recommendations. Designed for future LLM/AI API
 * integration — the rule-based engine can be swapped with an AI provider
 * by implementing the same interfaces.
 */

import type {
  AIRecommendation,
  FiveWhyAnalysis,
  FishboneAnalysis,
  FinancialImpactItem,
  BeforeAfterComparison,
  ExecutiveInsight,
  AnalysisMethodology,
  ConfidenceLevel,
  RecommendationPriority,
  RecommendationCategory,
  Recommendation,
  DMAICStageData,
  ProjectStatus,
} from '@/types';
import { computeKpis, computeFactoryScore, type OperationalData } from './analysis';
import { shiftData, machines, downtimeEvents, defectRecords, rawMaterials, products } from '@/data/factoryData';

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

type IntelligenceData = OperationalData & { products: typeof products };

function resolveIntelligenceData(override?: Partial<IntelligenceData>): IntelligenceData {
  return {
    shiftData: override?.shiftData ?? shiftData,
    machines: override?.machines ?? machines,
    downtimeEvents: override?.downtimeEvents ?? downtimeEvents,
    defectRecords: override?.defectRecords ?? defectRecords,
    rawMaterials: override?.rawMaterials ?? rawMaterials,
    products: override?.products ?? products,
  };
}

/** Weighted defect cost using each defect record's real product unit cost. */
function weightedDefectCost(records: typeof defectRecords, productList: typeof products): number {
  return records.reduce((acc, r) => {
    const product = productList.find((p) => p.size === r.productSize);
    return acc + r.count * (product ? product.unitCost : 25000);
  }, 0);
}

// =====================================================
// Confidence Score Engine
// =====================================================

interface ConfidenceFactors {
  dataPoints: number;
  dataConsistency: number;
  trendStrength: number;
  crossValidation: number;
}

function computeConfidence(factors: ConfidenceFactors): { score: number; level: ConfidenceLevel } {
  const weighted =
    factors.dataPoints * 0.25 +
    factors.dataConsistency * 0.25 +
    factors.trendStrength * 0.3 +
    factors.crossValidation * 0.2;
  const score = Math.round(Math.min(100, weighted));
  const level: ConfidenceLevel = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low';
  return { score, level };
}

// =====================================================
// Structured AI Recommendations (10-field format)
// =====================================================

export function generateAIRecommendations(data?: Partial<IntelligenceData>): AIRecommendation[] {
  const d = resolveIntelligenceData(data);
  const kpis = computeKpis(d);
  const score = computeFactoryScore(d);

  // Identify the worst-performing machine dynamically instead of hardcoding 'm-mold-2'.
  // Falls back to the first machine when no downtime events exist.
  const downtimeByMachine = d.downtimeEvents.reduce((acc, e) => {
    acc[e.machineId] = (acc[e.machineId] ?? 0) + e.durationMin;
    return acc;
  }, {} as Record<string, number>);
  const worstMachineId =
    Object.entries(downtimeByMachine).sort((a, b) => b[1] - a[1])[0]?.[0]
    ?? d.machines[0]?.id
    ?? 'm-mold-2';
  const worstMachine = d.machines.find((m) => m.id === worstMachineId) ?? d.machines[0];
  const worstDowntimes = d.downtimeEvents.filter((e) => e.machineId === worstMachineId);
  const worstDowntimeTotal = sum(worstDowntimes.map((e) => e.durationMin));

  const last14 = d.shiftData.slice(-14);
  const prev14 = d.shiftData.slice(-28, -14);
  const actualLast = sum(last14.map((s) => s.actualUnits));
  const actualPrev = sum(prev14.map((s) => s.actualUnits));
  const productionDrop = ((actualPrev - actualLast) / actualPrev) * 100;

  const defectTotal = sum(last14.map((s) => s.defectUnits));
  const scrapTotal = sum(last14.map((s) => s.scrapKg));
  const scrapCost = scrapTotal * 1850;
  const defectCost = weightedDefectCost(d.defectRecords, d.products) || defectTotal * 25000;
  const wasteCost = scrapCost + defectCost;

  const energyCostTotal = sum(last14.map((s) => s.energyCost));
  const energyKwhTotal = sum(last14.map((s) => s.energyKwh));
  const dieselCost = energyCostTotal * 0.62;
  const solarKwh = energyKwhTotal * 0.38;

  return [
    {
      id: 'ai-rec-1',
      problem: `انخفاض الإنتاج بنسبة 12% خلال آخر أسبوعين بسبب ارتفاع توقفات ${worstMachine?.nameAr ?? 'المعدة الأكثر توقفاً'}`,
      evidence: [
        `ارتفعت توقفات ${worstMachine?.nameAr ?? 'المعدة'} خلال آخر 14 يوم (${worstDowntimes.length} أحداث توقف)`,
        `إجمالي وقت التوقف: ${worstDowntimeTotal} دقيقة (${(worstDowntimeTotal / 60).toFixed(1)} ساعة)`,
        `الإتاحة الحالية: ${worstMachine?.availability ?? 0}% — أقل من المستهدف (90%)`,
        `OEE الحالي: ${worstMachine?.oee ?? 0}% — أقل من الحد الأدنى المقبول (75%)`,
        `المتوسط الزمني بين الأعطال (MTBF): ${worstMachine?.mtbfHours ?? 0} ساعة (المعيار: ≥ 300 ساعة)`,
        `إنتاج آخر 14 يوم: ${actualLast} وحدة مقابل ${actualPrev} وحدة في الفترة السابقة`,
      ],
      engineeringAnalysis:
        'تحليل OEE يكشف أن الانخفاض الرئيسي في الإتاحة (Availability) وليس في الأداء أو الجودة. الأعطال تتركز في نظام التسخين (185 دقيقة) والنظام الهيدروليكي (140 دقيقة) ونظام التبريد (110 دقيقة). نمط الأعطال متزايد يشير إلى تدهور تدريجي في حالة المعدة، وهو نمط كلاسيكي لغياب الصيانة الوقائية الفعالة. تحليل Pareto يظهر أن 3 أنواع أعطال تمثل 78% من إجمالي وقت التوقف.',
      rootCause:
        'عدم كفاءة خطة الصيانة الوقائية وغياب الفحص الدوري لنظام التسخين والنظام الهيدروليكي. آخر صيانة وقائية تمت في 15 مايو — قبل أكثر من شهرين — بينما المعدة تعمل في ظروف تشغيل مكثفة. السبب الجذري الأعمق هو غياب نظام إدارة الصيانة المبنية على الموثوقية (RCM).',
      methodologies: ['DMAIC', 'Pareto Analysis', 'OEE Analysis', '5 Why'],
      recommendation:
        'تنفيذ خطة صيانة وقائية عاجلة تشمل: (1) فحص كامل وصيانة نظام التسخين واستبدال العناصر التالفة، (2) فحص النظام الهيدروليكي وإصلاح التسريبات، (3) إعادة جدولة الصيانة الدورية لتكون كل 3 أسابيع بدلاً من 6 أسابيع، (4) تركيب نظام مراقبة الحالة (Condition Monitoring) للإنذار المبكر.',
      expectedImpact: 'زيادة الإنتاجية 10% وتقليل التوقفات بنسبة 40% ورفع OEE من 53% إلى 72%',
      expectedImpactValue: 10,
      priority: 'critical',
      confidenceScore: 92,
      confidenceLevel: 'high',
      financialImpact: {
        currentCostMonthly: 2500000,
        expectedSavingMonthly: 1000000,
        expectedSavingAnnual: 12000000,
        currency: 'ر.ي',
        description: 'تكلفة التوقفات الحالية 2.5 مليون ر.ي/شهر. تقليل التوقفات 40% يوفر 1 مليون ر.ي/شهر.',
      },
      category: 'maintenance',
      affectedArea: worstMachine?.lineId ? `الخط المرتبط بـ ${worstMachine.nameAr}` : 'خط الإنتاج',
      effort: 'medium',
    },
    {
      id: 'ai-rec-2',
      problem: 'ارتفاع نسبة المنتجات المعيبة إلى 5.8% (المستهدف ≤ 2%) مع تكرار عيب التشوه في الشكل',
      evidence: [
        `إجمالي المنتجات المعيبة في آخر 14 يوم: ${defectTotal} وحدة`,
        `عيب "التشوه في الشكل" يمثل 35% من إجمالي العيوب (${d.defectRecords.filter(d=>d.defectType==='تشوه في الشكل').reduce((a,d)=>a+d.count,0)} وحدة)`,
        `عيب "السماكة غير المتساوية" يمثل 28% من العيوب (${d.defectRecords.filter(d=>d.defectType==='سماكة غير متساوية').reduce((a,d)=>a+d.count,0)} وحدة)`,
        `تكلفة العيوب: ${defectCost.toLocaleString('en-US')} ر.ي في آخر أسبوعين`,
        `معدل الجودة انخفض من ${kpis[2].previous}% إلى ${kpis[2].value}%`,
      ],
      engineeringAnalysis:
        'تحليل Pareto للعيوب يظهر أن عيبين (التشوه والسماكة) يمثلان 63% من إجمالي العيوب. كلا العيبين مرتبط بمرحلة التشكيل. تحليل ارتباط البيانات يكشف أن العيوب ترتفع في الوردية الثانية بنسبة 18%، مما يشير إلى عدم استقرار إعدادات الماكينة بين الورديات. تحليل SPC لدرجة الحرارة يظهر تذبذباً يتجاوز حدود التحكم العلوية والسفلى.',
      rootCause:
        'عدم تجانس حرارة التشكيل بسبب: (1) عدم معايرة نظام التسخين بانتظام، (2) تآكل في قوالب التشكيل يسبب سماكة غير متساوية، (3) غياب إجراءات تشغيل موحدة (SOP) بين الورديات مما يؤدي لاختلاف الإعدادات. السبب الجذري الأعمق هو غياب نظام التحكم الإحصائي في العمليات (SPC).',
      methodologies: ['DMAIC', 'Pareto Analysis', 'SPC', 'Fishbone Analysis'],
      recommendation:
        'تنفيذ: (1) معايرة نظام التسخين وضبط درجات الحرارة لكل منتج مع توثيق الإعدادات، (2) فحص واستبدال القوالب المتآكلة، (3) إنشاء إجراءات تشغيل موحدة (SOP) موثقة لكل وردية، (4) تطبيق بطاقات تحكم SPC لدرجة الحرارة والسماكة، (5) تدريب المشغلين على الإجراءات الموحدة.',
      expectedImpact: 'تقليل العيوب بنسبة 25% ورفع معدل الجودة من 94.2% إلى 96.5%',
      expectedImpactValue: 25,
      priority: 'high',
      confidenceScore: 88,
      confidenceLevel: 'high',
      financialImpact: {
        currentCostMonthly: 1800000,
        expectedSavingMonthly: 450000,
        expectedSavingAnnual: 5400000,
        currency: 'ر.ي',
        description: 'تكلفة العيوب الشهرية 1.8 مليون ر.ي. تقليل العيوب 25% يوفر 450,000 ر.ي/شهر.',
      },
      category: 'quality',
      affectedArea: 'خط 1 وخط 2',
      effort: 'low',
    },
    {
      id: 'ai-rec-3',
      problem: 'تكلفة الطاقة للوحدة 950 ر.ي (المستهدف ≤ 800 ر.ي) بسبب الاعتماد العالي على مولد الديزل',
      evidence: [
        `إجمالي استهلاك الطاقة في آخر 14 يوم: ${energyKwhTotal.toLocaleString('en-US')} kWh`,
        `نظام الطاقة الشمسية يوفر 38% فقط من الاستهلاك (${Math.round(solarKwh).toLocaleString('en-US')} kWh)`,
        `مولد الديزل يوفر 62% من الاستهلاك بتكلفة ${Math.round(dieselCost).toLocaleString('en-US')} ر.ي`,
        `تكلفة الطاقة للوحدة: ${kpis[5].value} ر.ي (المستهدف: ${kpis[5].target} ر.ي)`,
        `الفرصة: زيادة الاعتماد الشمسي من 38% إلى 52% خلال ساعات النهار`,
      ],
      engineeringAnalysis:
        'تحليل استهلاك الطاقة يظهر أن ذروة الإنتاج تتزامن مع ساعات منخفضة الإنتاجية الشمسية. إعادة جدولة الإنتاج الثقيل (الخط 3 - الخزانات الكبيرة) إلى ساعات الذروة الشمسية (10ص-3م) يمكن أن ترفع الاعتماد الشمسي إلى 52%. نظام الطاقة الشمسية الحالي يعمل بكفاءة 95% لكنه غير مستغل بالكامل.',
      rootCause:
        'عدم مواءمة جدولة الإنتاج مع ساعات توفر الطاقة الشمسية. السبب الجذري هو غياب نظام إدارة الطاقة الذكي (Energy Management System) الذي يربط جدولة الإنتاج بتوفر الطاقة المتجددة.',
      methodologies: ['DMAIC', 'OEE Analysis'],
      recommendation:
        'تنفيذ: (1) إعادة جدولة الخط 3 (الخزانات الكبيرة) إلى وردية النهار (8ص-4م)، (2) تركيب نظام إدارة طاقة ذكي يراقب الاستهلاك، (3) زيادة سعة النظام الشمسي بـ 20% لاستيعاب التوسع، (4) تطبيق نظام مراقبة استهلاك الديزل في الوقت الحقيقي.',
      expectedImpact: 'تقليل تكلفة الطاقة 18% وتوفير 340,000 ر.ي شهرياً',
      expectedImpactValue: 18,
      priority: 'medium',
      confidenceScore: 85,
      confidenceLevel: 'high',
      financialImpact: {
        currentCostMonthly: 1900000,
        expectedSavingMonthly: 340000,
        expectedSavingAnnual: 4080000,
        currency: 'ر.ي',
        description: 'تكلفة الطاقة الشهرية 1.9 مليون ر.ي. تقليل الاعتماد على الديزل يوفر 340,000 ر.ي/شهر.',
      },
      category: 'energy',
      affectedArea: 'نظام الطاقة - جميع الخطوط',
      effort: 'low',
    },
    {
      id: 'ai-rec-4',
      problem: 'متوسط وقت تغيير القوالب 45 دقيقة (المعيار العالمي ≤ 10 دقائق) يسبب فقدان وقت تشغيل',
      evidence: [
        `أحداث تغيير القوالب في آخر 14 يوم: ${d.downtimeEvents.filter(e=>e.category==='changeover').length} أحداث`,
        `إجمالي وقت التغيير: ${sum(d.downtimeEvents.filter(e=>e.category==='changeover').map(e=>e.durationMin))} دقيقة`,
        `متوسط وقت التغيير: 45 دقيقة لكل حدث`,
        `الوقت المفقود يعادل إنتاج ~25 وحدة إضافية`,
      ],
      engineeringAnalysis:
        'تحليل SMED يكشف أن 70% من وقت التغيير هو عمليات داخلية (Internal Setup) تتطلب إيقاف الماكينة، بينما 30% فقط عمليات خارجية يمكن تنفيذها أثناء التشغيل. تحليل الفيديو (إن وجد) سيظهر أن البحث عن الأدوات والقوالب يستهلك 15 دقيقة من وقت التغيير. تطبيق SMED يمكن تحويل 60% من العمليات الداخلية إلى خارجية.',
      rootCause:
        'عدم تطبيق منهجية SMED. السبب الجذري: (1) عدم وجود أدوات معدة مسبقاً، (2) غياب إجراءات موثقة لتغيير القالب، (3) عدم استخدام تقنيات التثبيت السريع (Quick Clamps).',
      methodologies: ['SMED', 'DMAIC'],
      recommendation:
        'تنفيذ: (1) توثيق وتقييس إجراءات تغيير القالب، (2) إعداد عربات أدوات متنقلة بكل الأدوات اللازمة، (3) تحويل العمليات الداخلية إلى خارجية (تسخين القالب مسبقاً)، (4) تركيب نظام تثبيت سريع (Quick Clamps)، (5) تدريب الفريق على SMED.',
      expectedImpact: 'تقليل وقت التغيير من 45 إلى 15 دقيقة وزيادة وقت التشغيل 4%',
      expectedImpactValue: 4,
      priority: 'medium',
      confidenceScore: 82,
      confidenceLevel: 'high',
      financialImpact: {
        currentCostMonthly: 675000,
        expectedSavingMonthly: 450000,
        expectedSavingAnnual: 5400000,
        currency: 'ر.ي',
        description: 'وقت التغيير المفقد يكلف 675,000 ر.ي/شهر. تقليله 67% يوفر 450,000 ر.ي/شهر.',
      },
      category: 'production',
      affectedArea: 'جميع خطوط الإنتاج',
      effort: 'medium',
    },
    {
      id: 'ai-rec-5',
      problem: 'مخزون إضافات UV يكفي لـ 9 أيام فقط مع فترة توريد 30 يوم — مخاطرة عالية لتوقف الإنتاج',
      evidence: [
        `مخزون إضافات UV: ${d.rawMaterials.find(r=>r.id==='rm-3')?.stockKg} كجم`,
        `الاستهلاك اليومي: ${d.rawMaterials.find(r=>r.id==='rm-3')?.consumptionPerDayKg} كجم/يوم`,
        `فترة التوريد: ${d.rawMaterials.find(r=>r.id==='rm-3')?.leadTimeDays} يوم`,
        `أيام المخزون المتاحة: 9.4 يوم — أقل من فترة التوريد بـ 21 يوم`,
        `مخزون HDPE: ${d.rawMaterials.find(r=>r.id==='rm-1')?.stockKg} كجم (يكفي 7.7 يوم)`,
      ],
      engineeringAnalysis:
        'تحليل مخاطر سلسلة التوريد يظهر أن نقص إضافات UV سيؤدي لتوقف كامل الإنتاج خلال 9 أيام إذا لم يصل التوريد في الوقت. احتمالية التوقف = 65% بناءً على تحليل فترات التوريد السابقة. تكلفة التوقف المتوقع = 500,000 ر.ي/يوم. مخزون HDPE أيضاً أقل من الموصى به (المعيار: ≥ 14 يوم).',
      rootCause:
        'عدم تطبيق نظام إعادة الطلب التلقائي (Reorder Point). السبب الجذري: غياب سياسة المخزون الاحتياطي (Safety Stock) المبنية على تحليل فترة التوريد ومستوى الخدمة المطلوب.',
      methodologies: ['DMAIC', 'FMEA'],
      recommendation:
        'تنفيذ: (1) طلب عاجل لإضافات UV بكمية تكفي 45 يوم، (2) تطبيق نظام نقطة إعادة الطلب (Reorder Point = فترة التوريد × الاستهلاك اليومي + مخزون أمان 50%)، (3) زيادة مخزون HDPE إلى 35,000 كجم، (4) البحث عن موردين بديلين لتقليل فترة التوريد.',
      expectedImpact: 'تجنب توقف الإنتاج وتوفير 500,000 ر.ي من خسائر التوقف المحتملة',
      expectedImpactValue: 5,
      priority: 'high',
      confidenceScore: 90,
      confidenceLevel: 'high',
      financialImpact: {
        currentCostMonthly: 500000,
        expectedSavingMonthly: 500000,
        expectedSavingAnnual: 6000000,
        currency: 'ر.ي',
        description: 'خسائر التوقف المتوقعة 500,000 ر.ي/يوم. تجنب توقف يوم واحد يوفر 500,000 ر.ي.',
      },
      category: 'cost',
      affectedArea: 'المخزون والتوريد',
      effort: 'low',
    },
    {
      id: 'ai-rec-6',
      problem: '8% من العيوب سببها فقاعات هوائية ناتجة عن رطوبة في حبيبات البلاستيك HDPE',
      evidence: [
        `عيوب "فقاعات هوائية": ${d.defectRecords.filter(dd=>dd.defectType==='فقاعات هوائية').reduce((a,dd)=>a+dd.count,0)} وحدة`,
        `تمثل 15% من إجمالي العيوب`,
        `تتركز في منتجات 2000L و 5000L (الخزانات الكبيرة)`,
        `السبب المرتبط: رطوبة في حبيبات HDPE أثناء التشكيل`,
      ],
      engineeringAnalysis:
        'تحليل 5-Why يكشف أن الفقاعات تتكون عند تبخر الرطوبة المحتبسة في حبيبات HDPE أثناء عملية التسخين. الخزانات الكبيرة أكثر تأثراً لأنها تتطلب وقت تشكيل أطول (72 دقيقة لـ 5000L)، مما يزيد من تعرض المادة لدرجات الحرارة العالية. محتوى الرطوبة في HDPE يتجاوز 0.05% (الحد المقبول ≤ 0.02%).',
      rootCause:
        'تخزين حبيبات HDPE في بيئة غير جافة + غياب مرحلة التجفيف المسبق. السبب الجذري: عدم وجود نظام تجفيف (Hopper Dryer) قبل عملية التشكيل.',
      methodologies: ['5 Why', 'DMAIC'],
      recommendation:
        'تنفيذ: (1) تركيب نظام تجفيف مسبق (Hopper Dryer) لخط 2 وخط 3، (2) تخزين حبيبات HDPE في صوامع محكمة الإغلاق مع مجففات، (3) فحص محتوى الرطوبة قبل التشكيل (الحد المقبول ≤ 0.02%)، (4) تطبيق نظام First-In First-Out (FIFO) للمخزون.',
      expectedImpact: 'تقليل عيوب الفقاعات بنسبة 80% وتوفير 144,000 ر.ي شهرياً',
      expectedImpactValue: 8,
      priority: 'high',
      confidenceScore: 87,
      confidenceLevel: 'high',
      financialImpact: {
        currentCostMonthly: 180000,
        expectedSavingMonthly: 144000,
        expectedSavingAnnual: 1728000,
        currency: 'ر.ي',
        description: 'تكلفة عيوب الفقاعات 180,000 ر.ي/شهر. تقليلها 80% يوفر 144,000 ر.ي/شهر.',
      },
      category: 'quality',
      affectedArea: 'خط 2 وخط 3',
      effort: 'medium',
    },
  ];
}

// =====================================================
// 5-Why Analysis Generator
// =====================================================

export function generateFiveWhyAnalysis(problemId: string): FiveWhyAnalysis {
  const analyses: Record<string, FiveWhyAnalysis> = {
    'quality-defects': {
      id: '5why-1',
      problem: 'ارتفاع نسبة المنتجات المعيبة في خزانات 1000 لتر',
      steps: [
        { why: 'لماذا ترتفع نسبة المنتجات المعيبة؟', answer: 'لأن سماكة الخزان غير مستقرة وتتفاوت بين الأجزاء' },
        { why: 'لماذا سماكة الخزان غير مستقرة؟', answer: 'لأن إعدادات الماكينة تتغير بين الورديات' },
        { why: 'لماذا تتغير إعدادات الماكينة بين الورديات؟', answer: 'لعدم وجود إجراء تشغيل موحد (SOP) موثق' },
        { why: 'لماذا لا يوجد إجراء تشغيل موحد؟', answer: 'لأنه لم يتم توثيق إعدادات التشكيل لكل منتج على حدة' },
        { why: 'لماذا لم يتم توثيق الإعدادات؟', answer: 'لعدم وجود نظام إدارة جودة موثق ومسؤول جودة مختص' },
      ],
      rootCause: 'غياب نظام إدارة الجودة الموثق وإجراءات التشغيل الموحدة (SOP) لكل منتج',
      recommendation: 'إنشاء وتوثيق إجراءات تشغيل موحدة (SOP) لكل منتج وتدريب جميع المشغلين عليها',
      methodology: '5 Why',
    },
    'mold2-downtime': {
      id: '5why-2',
      problem: 'ارتفاع توقفات ماكينة التشكيل رقم 2',
      steps: [
        { why: 'لماذا ترتفع توقفات ماكينة التشكيل رقم 2؟', answer: 'بسبب أعطال متكررة في نظام التسخين والنظام الهيدروليكي' },
        { why: 'لماذا تحدث أعطال متكررة في نظام التسخين؟', answer: 'لأن العناصر التالفة لا يتم استبدالها إلا بعد العطل' },
        { why: 'لماذا لا يتم استبدال العناصر قبل العطل؟', answer: 'لأنه لا يوجد فحص دوري لنظام التسخين' },
        { why: 'لماذا لا يوجد فحص دوري؟', answer: 'لأن خطة الصيانة الوقائية لا تشمل نظام التسخين' },
        { why: 'لماذا لا تشمل خطة الصيانة نظام التسخين؟', answer: 'لأن خطة الصيانة تعتمد على الصيانة التصحيحية فقط دون الوقائية' },
      ],
      rootCause: 'اعتماد سياسة الصيانة التصحيحية فقط (Breakdown Maintenance) بدلاً من الصيانة الوقائية',
      recommendation: 'التحول إلى نظام الصيانة الوقائية (PM) وإدراج نظام التسخين والنظام الهيدروليكي في خطة الصيانة الدورية',
      methodology: '5 Why',
    },
    'energy-cost': {
      id: '5why-3',
      problem: 'ارتفاع تكلفة الطاقة للوحدة المنتجة',
      steps: [
        { why: 'لماذا ترتفع تكلفة الطاقة للوحدة؟', answer: 'لأن الاعتماد على مولد الديزل مرتفع (62%)' },
        { why: 'لماذا يكون الاعتماد على الديزل مرتفعاً؟', answer: 'لأن النظام الشمسي لا يغطي سوى 38% من الاستهلاك' },
        { why: 'لماذا يغطي النظام الشمسي 38% فقط؟', answer: 'لأن الإنتاج الثقيل يجري في ساعات منخفضة الإنتاجية الشمسية' },
        { why: 'لماذا يجري الإنتاج الثقيل في ساعات منخفضة؟', answer: 'لعدم مواءمة جدولة الإنتاج مع توفر الطاقة الشمسية' },
        { why: 'لماذا لا تتم مواءمة الجدولة؟', answer: 'لعدم وجود نظام إدارة طاقة ذكي يربط الإنتاج بالطاقة' },
      ],
      rootCause: 'غياب نظام إدارة الطاقة الذكي (EMS) الذي يربط جدولة الإنتاج بتوفر الطاقة المتجددة',
      recommendation: 'تركيب نظام إدارة طاقة ذكي وإعادة جدولة الإنتاج الثقيل إلى ساعات الذروة الشمسية',
      methodology: '5 Why',
    },
    'uv-stockout': {
      id: '5why-4',
      problem: 'مخزون إضافات UV منخفض ويهدد بتوقف الإنتاج',
      steps: [
        { why: 'لماذا المخزون منخفض؟', answer: 'لأنه لم يتم طلب كمية جديدة منذ 20 يوم' },
        { why: 'لماذا لم يتم طلب كمية جديدة؟', answer: 'لأنه لا يوجد نظام تنبيه عند انخفاض المخزون' },
        { why: 'لماذا لا يوجد نظام تنبيه؟', answer: 'لأن المخزون يُتابع يدوياً دون نظام آلي' },
        { why: 'لماذا يُتابع يدوياً؟', answer: 'لعدم وجود نظام إدارة مخزون رقمي' },
        { why: 'لماذا لا يوجد نظام رقمي؟', answer: 'لأن إدارة المخزون لا تعتبر أولوية استثمارية' },
      ],
      rootCause: 'غياب نظام إدارة مخزون رقمي بنقطة إعادة طلب آلية',
      recommendation: 'تطبيق نظام إدارة مخزون رقمي مع نقطة إعادة طلب تلقائية (Reorder Point)',
      methodology: '5 Why',
    },
  };

  return analyses[problemId] || analyses['quality-defects'];
}

export function getAllFiveWhyProblems(): { id: string; problem: string }[] {
  return [
    { id: 'quality-defects', problem: 'ارتفاع نسبة المنتجات المعيبة' },
    { id: 'mold2-downtime', problem: 'ارتفاع توقفات ماكينة التشكيل رقم 2' },
    { id: 'energy-cost', problem: 'ارتفاع تكلفة الطاقة للوحدة' },
    { id: 'uv-stockout', problem: 'مخزون إضافات UV منخفض' },
  ];
}

// =====================================================
// Fishbone (Ishikawa) Analysis Generator
// =====================================================

export function generateFishboneAnalysis(problemId: string): FishboneAnalysis {
  const analyses: Record<string, FishboneAnalysis> = {
    'quality-defects': {
      id: 'fish-1',
      problem: 'ارتفاع نسبة المنتجات المعيبة (تشوه + سماكة غير متساوية)',
      categories: [
        {
          category: 'machine',
          labelAr: 'الآلة',
          causes: [
            'تآكل في قوالب التشكيل',
            'عدم معايرة نظام التسخين',
            'تذبذب ضغط القالب',
            'نظام تبريد غير متساوٍ',
          ],
        },
        {
          category: 'material',
          labelAr: 'المواد',
          causes: [
            'رطوبة في حبيبات HDPE',
            'اختلاف دفعات المادة الخام',
            'عدم تجانس الماستر باتش',
          ],
        },
        {
          category: 'method',
          labelAr: 'الطريقة',
          causes: [
            'غياب إجراءات تشغيل موحدة (SOP)',
            'اختلاف إعدادات الماكينة بين الورديات',
            'عدم تطبيق SPC',
          ],
        },
        {
          category: 'man',
          labelAr: 'العامل',
          causes: [
            'نقص تدريب المشغلين',
            'اختلاف خبرة المشغلين بين الورديات',
            'غياب التحقق من الإعدادات',
          ],
        },
        {
          category: 'measurement',
          labelAr: 'القياس',
          causes: [
            'عدم قياس درجة الحرارة بشكل مستمر',
            'غياب قياس السماكة أثناء الإنتاج',
            'الفحص النهائي فقط دون الفحص أثناء العملية',
          ],
        },
        {
          category: 'environment',
          labelAr: 'البيئة',
          causes: [
            'تذبذب درجة حرارة المصنع',
            'رطوبة الجو العالية',
            'اختلاف الظروف بين الليل والنهار',
          ],
        },
      ],
      primaryRootCause: 'عدم تجانس حرارة التشكيل بسبب تآكل القوالب وغياب إجراءات التشغيل الموحدة',
      methodology: 'Fishbone Analysis',
    },
    'mold2-downtime': {
      id: 'fish-2',
      problem: 'ارتفاع توقفات ماكينة التشكيل رقم 2',
      categories: [
        {
          category: 'machine',
          labelAr: 'الآلة',
          causes: [
            'تآكل في نظام التسخين',
            'تسريب في النظام الهيدروليكي',
            'مشاكل في نظام التبريد',
            'عمر افتراضي للقطع متجاوز',
          ],
        },
        {
          category: 'material',
          labelAr: 'المواد',
          causes: [
            'استخدام قطع غيار غير أصلية',
            'عدم توفر قطع الغيار في المخزون',
          ],
        },
        {
          category: 'method',
          labelAr: 'الطريقة',
          causes: [
            'غياب الصيانة الوقائية',
            'صيانة تصحيحية فقط',
            'عدم وجود سجل صيانة موثق',
          ],
        },
        {
          category: 'man',
          labelAr: 'العامل',
          causes: [
            'نقص فنيي الصيانة',
            'عدم تدريب الفنيين على المعدة',
            'غياب فحص ما قبل التشغيل',
          ],
        },
        {
          category: 'measurement',
          labelAr: 'القياس',
          causes: [
            'عدم مراقبة الحالة (Condition Monitoring)',
            'غياب مؤشرات MTBF و MTTR',
            'عدم تتبع اتجاهات الأعطال',
          ],
        },
        {
          category: 'environment',
          labelAr: 'البيئة',
          causes: [
            'درجات حرارة مرتفعة في منطقة الماكينة',
            'غبار وزيوت في البيئة المحيطة',
          ],
        },
      ],
      primaryRootCause: 'غياب نظام الصيانة الوقائية الفعال والاعتماد على الصيانة التصحيحية',
      methodology: 'Fishbone Analysis',
    },
  };

  return analyses[problemId] || analyses['quality-defects'];
}

// =====================================================
// Financial Impact Engine
// =====================================================

export function generateFinancialImpact(data?: Partial<IntelligenceData>): FinancialImpactItem[] {
  const d = resolveIntelligenceData(data);
  const last14 = d.shiftData.slice(-14);
  const downtimeTotal = sum(last14.map((s) => s.downtimeHours));
  const defectTotal = sum(last14.map((s) => s.defectUnits));
  const scrapTotal = sum(last14.map((s) => s.scrapKg));
  const energyCostTotal = sum(last14.map((s) => s.energyCost));
  const actualTotal = sum(last14.map((s) => s.actualUnits));
  const plannedTotal = sum(last14.map((s) => s.plannedUnits));
  const productionLoss = plannedTotal - actualTotal;

  const avgProductPrice = d.products.length > 0 ? d.products.reduce((a, p) => a + p.unitPrice, 0) / d.products.length : 0;
  const downtimeCostMonthly = Math.round((downtimeTotal / 14) * 30 * 85000);
  const defectCostMonthly = Math.round((weightedDefectCost(d.defectRecords, d.products) / 14) * 30) || Math.round((defectTotal / 14) * 30 * 25000);
  const wasteCostMonthly = Math.round((scrapTotal / 14) * 30 * 1850);
  const energyLossMonthly = Math.round((energyCostTotal / 14) * 30 * 0.15);
  const productionLossMonthly = Math.round((productionLoss / 14) * 30 * avgProductPrice * 0.3);

  return [
    {
      id: 'fin-1',
      category: 'Downtime Cost',
      categoryAr: 'تكلفة التوقفات',
      currentCost: downtimeCostMonthly,
      expectedImprovement: 40,
      expectedSaving: Math.round(downtimeCostMonthly * 0.4),
      annualSaving: Math.round(downtimeCostMonthly * 0.4 * 12),
      unit: 'ر.ي',
      description: `التوقفات الحالية ${downtimeTotal} ساعة/أسبوعين. تقليل 40% يوفر ${Math.round(downtimeCostMonthly * 0.4).toLocaleString('en-US')} ر.ي/شهر`,
    },
    {
      id: 'fin-2',
      category: 'Defect Cost',
      categoryAr: 'تكلفة العيوب',
      currentCost: defectCostMonthly,
      expectedImprovement: 25,
      expectedSaving: Math.round(defectCostMonthly * 0.25),
      annualSaving: Math.round(defectCostMonthly * 0.25 * 12),
      unit: 'ر.ي',
      description: `${defectTotal} وحدة معيبة/أسبوعين. تقليل 25% يوفر ${Math.round(defectCostMonthly * 0.25).toLocaleString('en-US')} ر.ي/شهر`,
    },
    {
      id: 'fin-3',
      category: 'Waste Cost',
      categoryAr: 'تكلفة المخلفات',
      currentCost: wasteCostMonthly,
      expectedImprovement: 30,
      expectedSaving: Math.round(wasteCostMonthly * 0.3),
      annualSaving: Math.round(wasteCostMonthly * 0.3 * 12),
      unit: 'ر.ي',
      description: `${scrapTotal} كجم مخلفات/أسبوعين. تقليل 30% يوفر ${Math.round(wasteCostMonthly * 0.3).toLocaleString('en-US')} ر.ي/شهر`,
    },
    {
      id: 'fin-4',
      category: 'Energy Loss',
      categoryAr: 'خسائر الطاقة',
      currentCost: Math.round(energyCostTotal / 14 * 30),
      expectedImprovement: 18,
      expectedSaving: Math.round(energyCostTotal / 14 * 30 * 0.18),
      annualSaving: Math.round(energyCostTotal / 14 * 30 * 0.18 * 12),
      unit: 'ر.ي',
      description: `تكلفة الطاقة ${Math.round(energyCostTotal / 14 * 30).toLocaleString('en-US')} ر.ي/شهر. تقليل 18% يوفر ${Math.round(energyCostTotal / 14 * 30 * 0.18).toLocaleString('en-US')} ر.ي/شهر`,
    },
    {
      id: 'fin-5',
      category: 'Production Loss',
      categoryAr: 'خسائر الإنتاج',
      currentCost: productionLossMonthly,
      expectedImprovement: 12,
      expectedSaving: Math.round(productionLossMonthly * 0.12),
      annualSaving: Math.round(productionLossMonthly * 0.12 * 12),
      unit: 'ر.ي',
      description: `فقدان إنتاج ${productionLoss} وحدة/أسبوعين. استعادة 12% يوفر ${Math.round(productionLossMonthly * 0.12).toLocaleString('en-US')} ر.ي/شهر`,
    },
  ];
}

// =====================================================
// AI Recommendation → Recommendation mapper
// =====================================================

const effortByEffort: Record<string, Recommendation['effort']> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

/** Maps the structured 10-field AIRecommendation to the flat Recommendation shape used by Dashboard/Analysis/Report. */
export function mapAIRecommendations(recs: AIRecommendation[]): Recommendation[] {
  return recs.map((r) => ({
    id: r.id,
    title: r.recommendation.split('،')[0]?.trim() ?? r.recommendation.slice(0, 60),
    description: r.problem,
    category: r.category,
    priority: r.priority,
    impact: r.expectedImpact,
    impactValue: r.expectedImpactValue,
    effort: effortByEffort[r.effort] ?? 'medium',
    methodology: r.methodologies.join(' + '),
    affectedArea: r.affectedArea,
  }));
}

export function generateBeforeAfterComparison(data?: Partial<IntelligenceData>): BeforeAfterComparison[] {
  const kpis = computeKpis(data);
  const score = computeFactoryScore(data);

  const oee = kpis.find((k) => k.key === 'oee')?.value ?? 62;
  const prodEff = kpis.find((k) => k.key === 'production')?.value ?? 79;
  const quality = kpis.find((k) => k.key === 'quality')?.value ?? 91;
  const downtime = kpis.find((k) => k.key === 'downtime')?.value ?? 14;
  const energyCost = kpis.find((k) => k.key === 'energy')?.value ?? 950;
  const wasteCost = kpis.find((k) => k.key === 'waste')?.value ?? 1200000;

  const defectRate = 100 - quality;

  // Projected "after" values based on expected improvements from AI recommendations
  return [
    { metric: 'OEE', metricAr: 'كفاءة المعدات الكلية (تقديري)', before: oee, after: Math.min(100, oee + 13), unit: '%', improvement: 13 },
    { metric: 'Production Efficiency', metricAr: 'كفاءة الإنتاج (تقديري)', before: prodEff, after: Math.min(100, prodEff + 13), unit: '%', improvement: 13 },
    { metric: 'Quality Rate', metricAr: 'معدل الجودة (تقديري)', before: quality, after: Math.min(100, quality + 6), unit: '%', improvement: 6 },
    { metric: 'Downtime', metricAr: 'نسبة التوقفات (تقديري)', before: downtime, after: Math.max(0, downtime - 8), unit: '%', improvement: -8 },
    { metric: 'Defect Rate', metricAr: 'معدل العيوب (تقديري)', before: defectRate, after: Math.max(0, defectRate - 3.7), unit: '%', improvement: -3.7 },
    { metric: 'Energy Cost/Unit', metricAr: 'تكلفة الطاقة/وحدة (تقديري)', before: energyCost, after: Math.max(0, energyCost - 170), unit: 'ر.ي', improvement: -170 },
    { metric: 'Waste Cost', metricAr: 'تكلفة الهدر (تقديري)', before: wasteCost, after: Math.max(0, wasteCost * 0.6), unit: 'ر.ي', improvement: -(wasteCost * 0.4) },
    { metric: 'Factory Score', metricAr: 'مؤشر صحة المصنع (تقديري)', before: score.current, after: Math.min(100, score.current + 22), unit: '/100', improvement: 22 },
  ];
}

// =====================================================
// Executive Insight Engine
// =====================================================

export function generateExecutiveInsight(data?: Partial<IntelligenceData>): ExecutiveInsight {
  const score = computeFactoryScore(data);
  const recs = generateAIRecommendations(data);
  const financial = generateFinancialImpact(data);

  const totalSavings = sum(financial.map((f) => f.expectedSaving));
  const monthlyLoss = sum(financial.map((f) => f.currentCost));

  return {
    factoryHealthScore: score.current,
    healthTrend: score.trend,
    topProblems: [
      { title: 'توقفات ماكينة التشكيل رقم 2', severity: 'critical', impact: 'انخفاض الإنتاج 12%' },
      { title: 'ارتفاع العيوب (تشوه + سماكة)', severity: 'high', impact: 'تكلفة 1.8M ر.ي/شهر' },
      { title: 'مخزون UV منخفض', severity: 'high', impact: 'مخاطرة توقف الإنتاج' },
      { title: 'تكلفة طاقة مرتفعة', severity: 'medium', impact: 'زيادة 18% فوق المستهدف' },
    ],
    topOpportunities: [
      { title: 'صيانة وقائية لماكينة التشكيل 2', saving: 1000000, effort: 'medium' },
      { title: 'معايرة نظام التسخين', saving: 450000, effort: 'low' },
      { title: 'زيادة الاعتماد على الطاقة الشمسية', saving: 340000, effort: 'low' },
      { title: 'تطبيق SMED لتغيير القوالب', saving: 450000, effort: 'medium' },
    ],
    totalExpectedSavings: totalSavings,
    weeklyDecisions: [
      {
        title: 'إعادة جدولة صيانة ماكينة التشكيل رقم 2',
        expectedResult: 'زيادة الإنتاج 8% وتقليل التوقفات 40%',
        priority: 'critical',
      },
      {
        title: 'طلب عاجل لإضافات UV',
        expectedResult: 'تجنب توقف الإنتاج خلال 9 أيام',
        priority: 'high',
      },
      {
        title: 'معايرة نظام التسخين لخط 1 وخط 2',
        expectedResult: 'تقليل العيوب 25%',
        priority: 'high',
      },
    ],
    financialSummary: {
      monthlyLoss,
      potentialSaving: totalSavings,
      roi: Math.round((totalSavings / (monthlyLoss * 0.3)) * 100),
    },
  };
}

// =====================================================
// Decision Log (seed data)
// =====================================================

export function generateDecisionLogSeed() {
  return [
    {
      id: 'log-1',
      date: '2026-07-24',
      problem: 'ارتفاع توقفات ماكينة التشكيل رقم 2 بنسبة 32%',
      aiRecommendation: 'تنفيذ صيانة وقائية عاجلة وفحص نظام التسخين والنظام الهيدروليكي',
      managementDecision: 'اعتماد خطة الصيانة الوقائية وتخصيص فريق الصيانة',
      implementationStatus: 'in_progress' as const,
      result: 'بانتظار التنفيذ - متوقع انخفاض التوقفات 40%',
      saving: 1000000,
    },
    {
      id: 'log-2',
      date: '2026-07-20',
      problem: 'ارتفاع عيوب التشوه في الشكل بنسبة 35%',
      aiRecommendation: 'معايرة نظام التسخين وضبط درجات الحرارة لكل منتج',
      managementDecision: 'تكليف مهندس الجودة بمعايرة النظام',
      implementationStatus: 'completed' as const,
      result: 'انخفاض عيوب التشوه بنسبة 15% خلال 4 أيام',
      saving: 90000,
    },
    {
      id: 'log-3',
      date: '2026-07-15',
      problem: 'تكلفة الطاقة للوحدة تتجاوز المستهدف بـ 18%',
      aiRecommendation: 'زيادة الاعتماد على الطاقة الشمسية وإعادة جدولة الإنتاج',
      managementDecision: 'تحت الدراسة - تقييم جدوى تركيب وحدات شمسية إضافية',
      implementationStatus: 'pending' as const,
      result: 'بانتظار القرار',
      saving: 340000,
    },
    {
      id: 'log-4',
      date: '2026-07-10',
      problem: 'مخزون HDPE أقل من المستوى الآمن',
      aiRecommendation: 'طلب كمية طارئة وتعديل سياسة المخزون الاحتياطي',
      managementDecision: 'تم الطلب من المورد وتم اعتماد سياسة المخزون الجديدة',
      implementationStatus: 'completed' as const,
      result: 'وصلت الكمية وتم تجنب توقف الإنتاج',
      saving: 500000,
    },
  ];
}

// =====================================================
// DMAIC Stage Templates
// =====================================================

export function generateDMAICStages(problemTitle: string): import('@/types').DMAICStageData[] {
  return [
    {
      stage: 'define',
      labelAr: 'تعريف',
      description: 'تعريف المشكلة ونطاقها وأثرها',
      completed: true,
      details: `المشكلة: ${problemTitle}\nالأثر: انخفاض الإنتاج وزيادة التكاليف\nالنطاق: خط الإنتاج المتأثر`,
    },
    {
      stage: 'measure',
      labelAr: 'قياس',
      description: 'قياس الوضع الحالي وجمع البيانات',
      completed: true,
      details: 'تم قياس: نسبة العيوب، وقت التوقف، OEE، تكلفة الهدر\nالبيانات متوفرة من آخر 14 يوم',
    },
    {
      stage: 'analyze',
      labelAr: 'تحليل',
      description: 'تحليل الأسباب الجذرية باستخدام 5-Why و Fishbone',
      completed: false,
      details: 'تحليل قيد التنفيذ - تم تحديد الأسباب المحتملة\nبانتظار تأكيد السبب الجذري',
    },
    {
      stage: 'improve',
      labelAr: 'تحسين',
      description: 'تنفيذ الحلول والإجراءات التصحيحية',
      completed: false,
      details: 'بانتظار اعتماد الحل\nالحلول المقترحة محددة',
    },
    {
      stage: 'control',
      labelAr: 'متابعة',
      description: 'متابعة النتائج وضمان استدامة التحسين',
      completed: false,
      details: 'بانتظار اكتمال التنفيذ\nسيتم قياس الأثر بعد التنفيذ',
    },
  ];
}

// =====================================================
// AI Advisor Intelligence (upgraded)
// =====================================================

export function generateIntelligentAdvisorResponse(question: string, data?: Partial<IntelligenceData>): string {
  const q = question.toLowerCase();
  const recs = generateAIRecommendations(data);
  const score = computeFactoryScore(data);
  const financial = generateFinancialImpact(data);
  const insight = generateExecutiveInsight(data);

  // Production drop analysis
  if (q.includes('لماذا انخفض') || q.includes('انخفض') || q.includes('لماذا انخفض')) {
    const rec = recs[0];
    return formatStructuredResponse(rec, 'تحليل MIZAN AI - انخفاض الإنتاج');
  }

  if (q.includes('انتاج') || q.includes('إنتاج') || q.includes('production')) {
    const rec = recs[0];
    return formatStructuredResponse(rec, 'تحليل الإنتاج');
  }

  if (q.includes('جود') || q.includes('quality') || q.includes('عيوب') || q.includes('defect')) {
    const rec = recs[1];
    return formatStructuredResponse(rec, 'تحليل الجودة');
  }

  if (q.includes('صيان') || q.includes('maintenance') || q.includes('عطل') || q.includes('توقف')) {
    const rec = recs[0];
    return formatStructuredResponse(rec, 'تحليل الصيانة');
  }

  if (q.includes('طاق') || q.includes('energy') || q.includes('ديزل') || q.includes('شمس')) {
    const rec = recs[2];
    return formatStructuredResponse(rec, 'تحليل الطاقة');
  }

  if (q.includes('هدر') || q.includes('waste') || q.includes('تكلفة') || q.includes('cost') || q.includes('مال') || q.includes('توفير')) {
    const totalSaving = sum(financial.map(f => f.expectedSaving));
    const totalAnnual = sum(financial.map(f => f.annualSaving));
    return `تحليل MIZAN AI - الأثر المالي\n\nالمشكلة:\nتكلفة الفاقد الشهرية ${insight.financialSummary.monthlyLoss.toLocaleString('en-US')} ر.ي\n\nالأدلة:\n${financial.map(f => `• ${f.categoryAr}: ${f.currentCost.toLocaleString('en-US')} ر.ي/شهر`).join('\n')}\n\nالتحليل الهندسي:\nتحليل التكاليف يكشف أن التوقفات والعيوب تمثل 68% من إجمالي الخسائر. تحسين هذين المجالين أولاً يعطي أعلى عائد على الاستثمار.\n\nالسبب الجذري:\nغياب الصيانة الوقائية وعدم توحيد إجراءات التشغيل\n\nالمنهجية:\nDMAIC + Pareto Analysis\n\nالتوصية:\nالتركيز على 3 مجالات: الصيانة الوقائية، تقليل العيوب، تحسين الطاقة\n\nالأثر المتوقع:\nالتوفير الشهري: ${totalSaving.toLocaleString('en-US')} ر.ي\nالتوفير السنوي: ${totalAnnual.toLocaleString('en-US')} ر.ي\n\nدرجة الثقة: 89%`;
  }

  if (q.includes('صحة') || q.includes('مؤشر') || q.includes('النتيجة') || q.includes('score')) {
    return `تحليل MIZAN AI - مؤشر صحة المصنع\n\nالمشكلة:\nمؤشر صحة المصنع ${score.current}/100 (المستهدف ≥ 85)\n\nالأدلة:\n• كفاءة الإنتاج: ${score.components.productionEfficiency}%\n• الجودة: ${score.components.quality}%\n• OEE: ${score.components.oee}%\n• الصيانة: ${score.components.maintenance}%\n• الطاقة: ${score.components.energy}%\n\nالتحليل الهندسي:\nأضعف المجالات هي OEE (${score.components.oee}%) والطاقة (${score.components.energy}%). كلاهما مرتبط بماكينة التشكيل رقم 2.\n\nالسبب الجذري:\nتوقفات ماكينة التشكيل رقم 2 تؤثر على 4 من 7 مؤشرات\n\nالمنهجية:\nOEE Analysis + DMAIC\n\nالتوصية:\nإصلاح ماكينة التشكيل رقم 2 أولاً - سيرفع المؤشر 8-10 نقاط\n\nالأثر المتوقع:\nرفع المؤشر من ${score.current} إلى ${Math.min(100, score.current + 10)}\n\nدرجة الثقة: 92%`;
  }

  if (q.includes('توصي') || q.includes('تحسين') || q.includes('recommend') || q.includes('ماذا') || q.includes('ما هي') || q.includes('ماذا افعل')) {
    return `تحليل MIZAN AI - التوصيات\n\nلدي ${recs.length} توصيات مرتبة حسب الأولوية والأثر المالي:\n\n${recs.slice(0, 4).map((r, i) => `${i + 1}. ${r.problem}\n   الأولوية: ${r.priority === 'critical' ? 'عاجلة' : r.priority === 'high' ? 'عالية' : 'متوسطة'}\n   الأثر المالي: ${r.financialImpact.expectedSavingMonthly.toLocaleString('en-US')} ر.ي/شهر\n   درجة الثقة: ${r.confidenceScore}%`).join('\n\n')}\n\nأبدأ بالتوصية الأولى - لها أعلى أثر مالي (1M ر.ي/شهر) وأعلى درجة ثقة (92%).`;
  }

  if (q.includes('قرار') || q.includes('decision') || q.includes('هذا الاسبوع') || q.includes('هذا الأسبوع')) {
    return `تحليل MIZAN AI - قرارات الأسبوع\n\n${insight.weeklyDecisions.map((d, i) => `القرار ${i + 1}: ${d.title}\nالنتيجة المتوقعة: ${d.expectedResult}\nالأولوية: ${d.priority === 'critical' ? 'عاجلة' : 'عالية'}\n`).join('\n')}\nالتوفير المتوقع من تنفيذ جميع القرارات: ${insight.totalExpectedSavings.toLocaleString('en-US')} ر.ي/شهر`;
  }

  return `مرحباً بك في مساعد MIZAN AI - مستشارك الصناعي الذكي.\n\nيمكنني تحليل:\n\n• مؤشر صحة المصنع والحالة العامة\n• أسباب انخفاض الإنتاج\n• تحليل الجودة والعيوب\n• تحليل الصيانة والتوقفات\n• تحليل الطاقة والتكاليف\n• الأثر المالي والتوفير المتوقع\n• التوصيات وقرارات الأسبوع\n\nاسألني سؤالاً محدداً وسأعطيك تحليلاً منظماً يشمل: المشكلة، الأدلة، التحليل الهندسي، السبب الجذري، التوصية، والأثر المتوقع.`;
}

function formatStructuredResponse(rec: AIRecommendation, title: string): string {
  return `${title}\n\nالمشكلة:\n${rec.problem}\n\nالأدلة:\n${rec.evidence.map(e => `• ${e}`).join('\n')}\n\nالتحليل الهندسي:\n${rec.engineeringAnalysis}\n\nالسبب الجذري:\n${rec.rootCause}\n\nالمنهجية المستخدمة:\n${rec.methodologies.join(' + ')}\n\nالتوصية:\n${rec.recommendation}\n\nالأثر المتوقع:\n${rec.expectedImpact}\n\nالأثر المالي:\nالتكلفة الحالية: ${rec.financialImpact.currentCostMonthly.toLocaleString('en-US')} ${rec.financialImpact.currency}/شهر\nالتوفير المتوقع: ${rec.financialImpact.expectedSavingMonthly.toLocaleString('en-US')} ${rec.financialImpact.currency}/شهر\nالتوفير السنوي: ${rec.financialImpact.expectedSavingAnnual.toLocaleString('en-US')} ${rec.financialImpact.currency}\n\nالأولوية: ${rec.priority === 'critical' ? 'عاجلة' : rec.priority === 'high' ? 'عالية' : 'متوسطة'}\n\nدرجة الثقة: ${rec.confidenceScore}%`;
}

// =====================================================
// DMAIC ↔ Project Status Synchronization
// =====================================================

/**
 * Maps the number of completed DMAIC stages to a project lifecycle status.
 * 0 → detected, 1 → analyzing, 2 → approved, 3 → in_progress, 4 → closed, 5 → measured.
 * The DMAIC stages array is the single source of truth for lifecycle progress.
 */
export function stagesToStatus(stages: DMAICStageData[]): ProjectStatus {
  const completed = stages.filter((s) => s.completed).length;
  const map: ProjectStatus[] = ['detected', 'analyzing', 'approved', 'in_progress', 'closed', 'measured'];
  return map[Math.min(completed, map.length - 1)];
}

/**
 * Derives which DMAIC stages should be marked completed for a given project status,
 * without discarding any per-stage detail text. Used when the operator changes
 * status directly from the Projects screen — the stages array stays the single
 * source of truth because the status is always recomputed from it.
 */
export function statusToStages(stages: DMAICStageData[], status: ProjectStatus): DMAICStageData[] {
  const countByStatus: Record<ProjectStatus, number> = {
    detected: 0,
    analyzing: 1,
    approved: 2,
    in_progress: 3,
    closed: 4,
    measured: 5,
  };
  const target = countByStatus[status];
  return stages.map((s, i) => ({ ...s, completed: i < target }));
}

