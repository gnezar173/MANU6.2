import type {
  KpiValue,
  FactoryScore,
  Recommendation,
  AnalysisFinding,
  ShiftData,
  Machine,
  DowntimeEvent,
  DefectRecord,
  Product,
  ProductSize,
} from '@/types';
import { shiftData, machines, downtimeEvents, defectRecords, rawMaterials, products } from '@/data/factoryData';

export interface OperationalData {
  shiftData: ShiftData[];
  machines: Machine[];
  downtimeEvents: DowntimeEvent[];
  defectRecords: DefectRecord[];
  rawMaterials: typeof rawMaterials;
  products: Product[];
}

function resolveData(override?: Partial<OperationalData>): OperationalData {
  return {
    shiftData: override?.shiftData ?? shiftData,
    machines: override?.machines ?? machines,
    downtimeEvents: override?.downtimeEvents ?? downtimeEvents,
    defectRecords: override?.defectRecords ?? defectRecords,
    rawMaterials: override?.rawMaterials ?? rawMaterials,
    products: override?.products ?? products,
  };
}

// Production equipment that directly shapes product output. Support assets
// (forklift, generator, solar) are excluded from plant OEE so the metric
// reflects production-line effectiveness, not facility uptime.
const PRODUCTION_MACHINE_TYPES = new Set(['molding', 'mixer', 'grinder', 'compressor']);

/** Production cost of a defect for a given product size, in currency units. */
function defectUnitCost(size: ProductSize, productList: Product[]): number {
  const product = productList.find((p) => p.size === size);
  return product ? product.unitCost : 25000;
}

/**
 * Weighted defect cost: sums each defect record's count multiplied by the
 * real unit cost of the affected product size. Falls back to a flat cost
 * only when no matching product exists, which keeps demo mode correct even
 * if product data is incomplete.
 */
function weightedDefectCost(records: DefectRecord[], productList: Product[]): number {
  return records.reduce((acc, r) => acc + r.count * defectUnitCost(r.productSize, productList), 0);
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

function statusFromValue(value: number, target: number, warnThreshold = 0.9): 'good' | 'warning' | 'critical' {
  const ratio = value / target;
  if (ratio >= warnThreshold) return 'good';
  if (ratio >= warnThreshold - 0.1) return 'warning';
  return 'critical';
}

export function computeKpis(data?: Partial<OperationalData>): KpiValue[] {
  const d = resolveData(data);
  const last7 = d.shiftData.slice(-14);
  const prev7 = d.shiftData.slice(-28, -14);

  const plannedTotal = sum(last7.map((s) => s.plannedUnits));
  const actualTotal = sum(last7.map((s) => s.actualUnits));
  const goodTotal = sum(last7.map((s) => s.goodUnits));
  const defectTotal = sum(last7.map((s) => s.defectUnits));
  const scrapTotal = sum(last7.map((s) => s.scrapKg));
  const runtimeTotal = sum(last7.map((s) => s.runtimeHours));
  const downtimeTotal = sum(last7.map((s) => s.downtimeHours));
  const energyCostTotal = sum(last7.map((s) => s.energyCost));
  const energyKwhTotal = sum(last7.map((s) => s.energyKwh));

  const prevPlanned = sum(prev7.map((s) => s.plannedUnits));
  const prevActual = sum(prev7.map((s) => s.actualUnits));
  const prevGood = sum(prev7.map((s) => s.goodUnits));
  const prevDefect = sum(prev7.map((s) => s.defectUnits));
  const prevDowntime = sum(prev7.map((s) => s.downtimeHours));
  const prevEnergyCost = sum(prev7.map((s) => s.energyCost));

  const productionEfficiency = (actualTotal / plannedTotal) * 100;
  const prevProductionEfficiency = (prevActual / prevPlanned) * 100;
  const qualityRate = (goodTotal / actualTotal) * 100;
  const prevQualityRate = (prevGood / prevActual) * 100;
  const productionMachines = d.machines.filter((m) => PRODUCTION_MACHINE_TYPES.has(m.type));
  const oee = productionMachines.length > 0 ? avg(productionMachines.map((m) => m.oee)) : 0;
  const downtimePct = (downtimeTotal / (runtimeTotal + downtimeTotal)) * 100;
  const prevDowntimePct = (prevDowntime / (prevDowntime + sum(prev7.map((s) => s.runtimeHours)))) * 100;

  const avgDefectUnitCost = d.products.length > 0 ? d.products.reduce((a, p) => a + p.unitCost, 0) / d.products.length : 25000;
  const scrapCost = scrapTotal * 1850;
  const defectCost = weightedDefectCost(d.defectRecords, d.products) || defectTotal * avgDefectUnitCost;
  const wasteCost = scrapCost + defectCost;
  const prevWasteCost = sum(prev7.map((s) => s.scrapKg)) * 1850 + prevDefect * avgDefectUnitCost;

  const energyCostPerUnit = energyCostTotal / actualTotal;
  const prevEnergyCostPerUnit = prevEnergyCost / prevActual;

  const maintenanceStatus = avg(d.machines.map((m) => m.availability));

  return [
    {
      key: 'production',
      label: 'كفاءة الإنتاج',
      value: Number(productionEfficiency.toFixed(1)),
      unit: '%',
      target: 95,
      previous: Number(prevProductionEfficiency.toFixed(1)),
      trend: Number((productionEfficiency - prevProductionEfficiency).toFixed(1)),
      status: statusFromValue(productionEfficiency, 95),
      description: 'نسبة الإنتاج الفعلي من الإنتاج المخطط',
    },
    {
      key: 'oee',
      label: 'كفاءة المعدات الكلية',
      value: Number(oee.toFixed(1)),
      unit: '%',
      target: 85,
      previous: 68.5,
      trend: Number((oee - 68.5).toFixed(1)),
      status: statusFromValue(oee, 85),
      description: 'الإتاحة × الأداء × الجودة لمعدات الإنتاج',
    },
    {
      key: 'quality',
      label: 'معدل الجودة',
      value: Number(qualityRate.toFixed(1)),
      unit: '%',
      target: 98,
      previous: Number(prevQualityRate.toFixed(1)),
      trend: Number((qualityRate - prevQualityRate).toFixed(1)),
      status: statusFromValue(qualityRate, 98),
      description: 'نسبة المنتجات المطابقة من إجمالي الإنتاج',
    },
    {
      key: 'downtime',
      label: 'نسبة التوقفات',
      value: Number(downtimePct.toFixed(1)),
      unit: '%',
      target: 5,
      previous: Number(prevDowntimePct.toFixed(1)),
      trend: Number((downtimePct - prevDowntimePct).toFixed(1)),
      status: downtimePct <= 5 ? 'good' : downtimePct <= 10 ? 'warning' : 'critical',
      description: 'نسبة وقت التوقف من إجمالي وقت التشغيل',
    },
    {
      key: 'waste',
      label: 'تكلفة الهدر',
      value: Math.round(wasteCost),
      unit: 'ر.ي',
      target: 500000,
      previous: Math.round(prevWasteCost),
      trend: Math.round(wasteCost - prevWasteCost),
      status: wasteCost <= 500000 ? 'good' : wasteCost <= 1000000 ? 'warning' : 'critical',
      description: 'تكلفة المخلفات والمنتجات المعيبة',
    },
    {
      key: 'energy',
      label: 'تكلفة الطاقة للوحدة',
      value: Math.round(energyCostPerUnit),
      unit: 'ر.ي',
      target: 800,
      previous: Math.round(prevEnergyCostPerUnit),
      trend: Math.round(energyCostPerUnit - prevEnergyCostPerUnit),
      status: energyCostPerUnit <= 800 ? 'good' : energyCostPerUnit <= 1000 ? 'warning' : 'critical',
      description: 'متوسط تكلفة الطاقة لكل وحدة منتجة',
    },
    {
      key: 'maintenance',
      label: 'حالة الصيانة',
      value: Number(maintenanceStatus.toFixed(1)),
      unit: '%',
      target: 95,
      previous: 88.2,
      trend: Number((maintenanceStatus - 88.2).toFixed(1)),
      status: statusFromValue(maintenanceStatus, 95),
      description: 'متوسط إتاحة المعدات',
    },
  ];
}

export function computeFactoryScore(data?: Partial<OperationalData>): FactoryScore {
  const kpis = computeKpis(data);

  const productionScore = Math.min(100, (kpis[0].value / kpis[0].target) * 100);
  const qualityScore = Math.min(100, (kpis[2].value / kpis[2].target) * 100);
  const oeeScore = Math.min(100, (kpis[1].value / kpis[1].target) * 100);
  const maintenanceScore = Math.min(100, (kpis[6].value / kpis[6].target) * 100);
  const downtimeScore = Math.max(0, 100 - kpis[3].value * 5);
  const energyScore = Math.max(0, 100 - ((kpis[5].value - kpis[5].target) / kpis[5].target) * 100);
  const costScore = Math.max(0, 100 - ((kpis[4].value - kpis[4].target) / kpis[4].target) * 50);

  const current = Math.round(
    productionScore * 0.2 +
    qualityScore * 0.2 +
    oeeScore * 0.15 +
    maintenanceScore * 0.15 +
    downtimeScore * 0.1 +
    energyScore * 0.1 +
    costScore * 0.1
  );

  return {
    current,
    previous: 64,
    trend: current - 64,
    components: {
      productionEfficiency: Math.round(productionScore),
      quality: Math.round(qualityScore),
      oee: Math.round(oeeScore),
      maintenance: Math.round(maintenanceScore),
      energy: Math.round(energyScore),
      cost: Math.round(costScore),
      delivery: 78,
    },
  };
}

export function generateRecommendations(): Recommendation[] {
  return [
    {
      id: 'rec-1',
      title: 'تنفيذ خطة صيانة وقائية عاجلة لماكينة التشكيل رقم 2',
      description:
        'اكتشف MIZAN AI أن ماكينة التشكيل رقم 2 تعاني من ارتفاع التوقفات بنسبة 28% خلال الأسبوع الماضي، مع انخفاض الإتاحة إلى 71% والمتوسط الزمني بين الأعطال إلى 140 ساعة فقط. الأعطال الرئيسية في نظام التسخين والنظام الهيدروليكي.',
      category: 'maintenance',
      priority: 'critical',
      impact: 'زيادة الإنتاجية 10% وتقليل التوقفات بنسبة 40%',
      impactValue: 10,
      effort: 'medium',
      methodology: 'TPM - الصيانة الإنتاجية الشاملة',
      affectedArea: 'خط 2 - الخزانات المتوسطة',
    },
    {
      id: 'rec-2',
      title: 'ضبط معايير حرارة التشكيل لتقليل عيوب التشوه',
      description:
        'تحليل عيوب الجودة يظهر أن "التشوه في الشكل" هو العيب الأكثر تكراراً، ويمثل 35% من إجمالي العيوب. السبب الجذري هو عدم تجانس حرارة التشكيل. يوصى بمعايرة نظام التسخين وضبط درجات الحرارة لكل منتج.',
      category: 'quality',
      priority: 'high',
      impact: 'تقليل العيوب بنسبة 25% وتوفير 180,000 ر.ي شهرياً',
      impactValue: 25,
      effort: 'low',
      methodology: 'DMAIC - مرحلة التحسين',
      affectedArea: 'خط 1 وخط 2',
    },
    {
      id: 'rec-3',
      title: 'تقليل وقت تغيير القوالب باستخدام تقنية SMED',
      description:
        'متوسط وقت تغيير القالب الحالي 45 دقيقة. تطبيق منهجية SMED يمكن أن يقلل الوقت إلى 15 دقيقة، مما يوفر 30 دقيقة لكل تغيير ويزيد من وقت التشغيل الفعلي.',
      category: 'production',
      priority: 'medium',
      impact: 'زيادة وقت التشغيل 4% وزيادة الإنتاج 15 وحدة شهرياً',
      impactValue: 4,
      effort: 'medium',
      methodology: 'SMED - تبديل سريع للقوالب',
      affectedArea: 'جميع خطوط الإنتاج',
    },
    {
      id: 'rec-4',
      title: 'زيادة الاعتماد على الطاقة الشمسية خلال ساعات الذروة',
      description:
        'تكلفة الطاقة الحالية 950 ر.ي لكل وحدة. تحليل استهلاك الطاقة يظهر إمكانية زيادة الاعتماد على النظام الشمسي من 38% إلى 52% خلال ساعات النهار، مما يقلل استهلاك الديزل.',
      category: 'energy',
      priority: 'medium',
      impact: 'تقليل تكلفة الطاقة 18% وتوفير 340,000 ر.ي شهرياً',
      impactValue: 18,
      effort: 'low',
      methodology: 'تحسين استهلاك الطاقة',
      affectedArea: 'نظام الطاقة',
    },
    {
      id: 'rec-5',
      title: 'معالجة رطوبة حبيبات البلاستيك قبل التشكيل',
      description:
        '8% من العيوب سببها فقاعات هوائية ناتجة عن رطوبة في حبيبات HDPE. تركيب نظام تجفيف مسبق أو تخزين المواد في بيئة جافة سيقلل هذا النوع من العيوب بشكل كبير.',
      category: 'quality',
      priority: 'high',
      impact: 'تقليل عيوب الفقاعات بنسبة 80%',
      impactValue: 8,
      effort: 'medium',
      methodology: '5 Why - تحليل السبب الجذري',
      affectedArea: 'خط 2 وخط 3',
    },
    {
      id: 'rec-6',
      title: 'تحسين إدارة مخزون المواد الخام',
      description:
        'مخزون إضافات UV يكفي لـ 9 أيام فقط مع فترة توريد 30 يوم. يجب زيادة المخزون الاحتياطي لتجنب توقف الإنتاج. مخزون HDPE يكفي لـ 7.7 يوم وهو أقل من الموصى به.',
      category: 'cost',
      priority: 'high',
      impact: 'تجنب توقف الإنتاج وتوفير 500,000 ر.ي من خسائر التوقف',
      impactValue: 5,
      effort: 'low',
      methodology: 'تحسين سلسلة التوريد',
      affectedArea: 'المخزون والتوريد',
    },
  ];
}

export function generateFindings(): AnalysisFinding[] {
  return [
    {
      id: 'f-1',
      area: 'الصيانة',
      finding: 'ماكينة التشكيل رقم 2 تعاني من انخفاض حاد في الإتاحة (71%) مع ارتفاع الأعطال في نظام التسخين والنظام الهيدروليكي',
      severity: 'critical',
      metric: 'إتاحة المعدة',
      currentValue: '71%',
      benchmark: '≥ 90%',
      recommendation: 'تنفيذ صيانة وقائية فورية وإعادة جدولة الصيانة الدورية',
    },
    {
      id: 'f-2',
      area: 'الجودة',
      finding: 'نسبة العيوب 5.8% مع تكرار عيب "التشوه في الشكل" و"السماكة غير المتساوية" بشكل رئيسي',
      severity: 'warning',
      metric: 'معدل العيوب',
      currentValue: '5.8%',
      benchmark: '≤ 2%',
      recommendation: 'معايرة نظام التسخين وفحص تآكل القوالب',
    },
    {
      id: 'f-3',
      area: 'الطاقة',
      finding: 'تكلفة الطاقة للوحدة 950 ر.ي أعلى من المستهدف بسبب الاعتماد العالي على مولد الديزل',
      severity: 'warning',
      metric: 'تكلفة الطاقة/وحدة',
      currentValue: '950 ر.ي',
      benchmark: '≤ 800 ر.ي',
      recommendation: 'زيادة الاعتماد على الطاقة الشمسية وتحسين جدولة الإنتاج',
    },
    {
      id: 'f-4',
     area: 'الإنتاج',
      finding: 'كفاءة الإنتاج 87% مع فجوة 8% عن المستهدف بسبب التوقفات المتكررة',
      severity: 'warning',
      metric: 'كفاءة الإنتاج',
      currentValue: '87%',
      benchmark: '≥ 95%',
      recommendation: 'تقليل التوقفات وتطبيق SMED لتقليل وقت التغيير',
    },
    {
      id: 'f-5',
     area: 'المخزون',
      finding: 'مخزون إضافات UV يكفي لـ 9 أيام فقط مع فترة توريد 30 يوم - مخاطرة عالية لتوقف الإنتاج',
      severity: 'critical',
      metric: 'أيام المخزون',
      currentValue: '9 أيام',
      benchmark: '≥ 30 يوم',
      recommendation: 'طلب عاجل وتعديل سياسة المخزون الاحتياطي',
    },
    {
      id: 'f-6',
     area: 'الهدر',
      finding: 'تكلفة الهدر الشهري تتجاوز 1.2 مليون ر.ي من المخلفات والمنتجات المعيبة',
      severity: 'warning',
      metric: 'تكلفة الهدر',
      currentValue: '1.2M ر.ي',
      benchmark: '≤ 500K ر.ي',
      recommendation: 'تطبيق منهجية Lean لتقليل الهدر السبعة',
    },
  ];
}

// AI Advisor response generator
export function generateAdvisorResponse(question: string): string {
  const q = question.toLowerCase();
  const score = computeFactoryScore();
  const kpis = computeKpis();
  const recs = generateRecommendations();

  if (q.includes('صحة') || q.includes('مؤشر') || q.includes('النتيجة') || q.includes('score')) {
    return `مؤشر صحة المصنع الحالي هو ${score.current} من 100، بتحسن ${score.trend > 0 ? '+' : ''}${score.trend} نقطة عن الفترة السابقة.\n\nأقوى المجالات:\n• الإتاحة: ${score.components.maintenance}%\n• الجودة: ${score.components.quality}%\n\nأضعف المجالات:\n• كفاءة المعدات (OEE): ${score.components.oee}%\n• الطاقة: ${score.components.energy}%\n\nالسبب الرئيسي لانخفاض المؤشر هو ماكينة التشكيل رقم 2. إصلاحها سيرفع المؤشر بـ 8-10 نقاط.`;
  }

  if (q.includes('انتاج') || q.includes('إنتاج') || q.includes('production')) {
    const eff = kpis[0];
    return `كفاءة الإنتاج الحالية ${eff.value}% (المستهدف ${eff.target}%).\n\nالتحليل:\n• الإنتاج الفعلي أقل من المخطط بنسبة ${(100 - eff.value).toFixed(1)}%\n• السبب الرئيسي: توقفات ماكينة التشكيل رقم 2 (${downtimeEvents.filter(e => e.machineId === 'm-mold-2').length} أحداث توقف هذا الأسبوع)\n• التوقفات تستهلك ${kpis[3].value}% من وقت التشغيل\n\nالتوصية: تنفيذ خطة صيانة وقائية لماكينة التشكيل رقم 2 وتطبيق SMED لتقليل وقت تغيير القوالب. الأثر المتوقع: زيادة الإنتاجية 10%.`;
  }

  if (q.includes('جود') || q.includes('quality') || q.includes('عيوب') || q.includes('defect')) {
    const quality = kpis[2];
    const topDefects = defectRecords.slice(0, 4);
    return `معدل الجودة الحالي ${quality.value}% (المستهدف ${quality.target}%).\n\nأكثر العيوب تكراراً:\n${topDefects.map(d => `• ${d.defectType} (${d.productSize}): ${d.count} وحدة`).join('\n')}\n\nالسبب الجذري الرئيسي: عدم تجانس حرارة التشكيل وتآكل القوالب.\n\nالتوصية: معايرة نظام التسخين وفحص القوالب. الأثر المتوقع: تقليل العيوب 25% وتوفير 180,000 ر.ي شهرياً.`;
  }

  if (q.includes('صيان') || q.includes('maintenance') || q.includes('عطل') || q.includes('توقف')) {
    const mold2 = machines.find(m => m.id === 'm-mold-2')!;
    return `حالة الصيانة تتطلب انتباه عاجل.\n\nالمعدات الحرجة:\n• ${mold2.nameAr}: إتاحة ${mold2.availability}%، OEE ${mold2.oee}%، ${mold2.downtimeHours} ساعة توقف\n• ضاغط الهواء: إتاحة 88%\n• مولد الديزل: إتاحة 91%\n\nأحداث التوقف هذا الأسبوع: ${downtimeEvents.length} حدث بإجمالي ${sum(downtimeEvents.map(e => e.durationMin))} دقيقة.\n\nالتوصية: صيانة وقائية فورية لماكينة التشكيل رقم 2 - عطل في نظام التسخين والنظام الهيدروليكي. إعادة جدولة الصيانة الدورية لمنع الأعطال المستقبلية.`;
  }

  if (q.includes('طاق') || q.includes('energy') || q.includes('ديزل') || q.includes('شمس')) {
    const energy = kpis[5];
    return `تكلفة الطاقة للوحدة ${energy.value} ر.ي (المستهدف ${energy.target} ر.ي).\n\nمصادر الطاقة:\n• الطاقة الشمسية: 38% من الاستهلاك (تكلفة 0)\n• مولد الديزل: 62% من الاستهلاك (تكلفة عالية)\n\nالتوصية: زيادة الاعتماد على الطاقة الشمسية من 38% إلى 52% خلال ساعات النهار، وإعادة جدولة الإنتاج الثقيل خلال ساعات الذروة الشمسية. الأثر المتوقع: تقليل تكلفة الطاقة 18% وتوفير 340,000 ر.ي شهرياً.`;
  }

  if (q.includes('هدر') || q.includes('waste') || q.includes('تكلفة') || q.includes('cost')) {
    const waste = kpis[4];
    return `تكلفة الهدر الحالية ${waste.value.toLocaleString('en-US')} ر.ي.\n\nمصادر الهدر:\n• مخلفات الإنتاج (Scrap): ${(sum(shiftData.slice(-14).map(s => s.scrapKg))).toLocaleString('en-US')} كجم\n• منتجات معيبة: ${sum(shiftData.slice(-14).map(s => s.defectUnits))} وحدة\n\nأنواع الهدر السبعة (Lean):\n• هدر الإنتاج الزائد\n• هدر الانتظار (التوقفات)\n• هدر النقل\n• هدر المعالجة الزائدة\n• هدر المخزون\n• هدر الحركة\n• هدر العيوب\n\nالتوصية: التركيز على تقليل عيوب الجودة وتوقفات المعدات أولاً - تمثل 80% من تكلفة الهدر.`;
  }

  if (q.includes('توصي') || q.includes('تحسين') || q.includes('recommend') || q.includes('ماذا') || q.includes('ما هي')) {
    return `لدي ${recs.length} توصيات مرتبة حسب الأولوية:\n\n${recs.slice(0, 4).map((r, i) => `${i + 1}. ${r.title}\n   الأولوية: ${r.priority === 'critical' ? 'عاجلة' : r.priority === 'high' ? 'عالية' : r.priority === 'medium' ? 'متوسطة' : 'منخفضة'}\n   الأثر: ${r.impact}`).join('\n\n')}\n\nأبدأ بالتوصية الأولى - لها أعلى أثر وأقل جهد نسبياً.`;
  }

  return `مرحباً بك في مساعد MIZAN AI. يمكنني مساعدتك في:\n\n• تحليل مؤشر صحة المصنع\n• تحليل الإنتاج والكفاءة\n• تحليل الجودة والعيوب\n• تحليل الصيانة والتوقفات\n• تحليل الطاقة والتكاليف\n• تحليل الهدر والخسائر\n• التوصيات والتحسينات\n\nاسألني عن أي من هذه المجالات وسأعطيك تحليلاً مفصلاً مع توصيات عملية.`;
}

export { avg, sum };
