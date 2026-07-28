/**
 * MIZAN AI SaaS Intelligence Additions
 *
 * Data quality scoring, AI evidence generation, priority matrix,
 * action timelines, and impact scoring — the commercial intelligence layer.
 */

import type {
  AIEvidence,
  PriorityMatrixItem,
  ActionTimeline,
  ImpactScore,
  DataQualityScore,
  PriorityLevel,
  UrgencyLevel,
} from '@/types';
import { shiftData, downtimeEvents, defectRecords, energyRecords, machines, rawMaterials, products } from '@/data/factoryData';
import { generateAIRecommendations, generateFinancialImpact } from './intelligence';
import type { OperationalData } from './analysis';

type SaasData = OperationalData & { energyRecords: typeof energyRecords };

function resolveSaasData(override?: Partial<SaasData>): SaasData {
  return {
    shiftData: override?.shiftData ?? shiftData,
    machines: override?.machines ?? machines,
    downtimeEvents: override?.downtimeEvents ?? downtimeEvents,
    defectRecords: override?.defectRecords ?? defectRecords,
    rawMaterials: override?.rawMaterials ?? rawMaterials,
    products: override?.products ?? products,
    energyRecords: override?.energyRecords ?? energyRecords,
  };
}

// =====================================================
// AI Evidence Engine
// =====================================================

export function generateAIEvidence(data?: Partial<SaasData>): AIEvidence {
  const d = resolveSaasData(data);
  const productionRecords = d.shiftData.length;
  const downtimeRecs = d.downtimeEvents.length;
  const qualityRecs = d.defectRecords.length;
  const energyRecs = d.energyRecords.length;
  const maintenanceRecords = d.machines.length;

  const dataCompleteness = Math.round(
    (productionRecords / (productionRecords + 10)) * 100 * 0.3 +
    (maintenanceRecords / (maintenanceRecords + 2)) * 100 * 0.25 +
    (qualityRecs / (qualityRecs + 5)) * 100 * 0.25 +
    (energyRecs / (energyRecs + 8)) * 100 * 0.2
  );

  const analysisConfidence = Math.min(95, Math.round(dataCompleteness * 0.6 + 30));

  return {
    productionRecords,
    downtimeRecords: downtimeRecs,
    qualityRecords: qualityRecs,
    energyRecords: energyRecs,
    maintenanceRecords,
    dataCompleteness,
    analysisConfidence,
    dataSources: [
      { label: 'سجلات الإنتاج', count: productionRecords, icon: 'production' },
      { label: 'أحداث التوقف', count: downtimeRecs, icon: 'downtime' },
      { label: 'سجلات الجودة', count: qualityRecs, icon: 'quality' },
      { label: 'سجلات الطاقة', count: energyRecs, icon: 'energy' },
      { label: 'سجلات الصيانة', count: maintenanceRecords, icon: 'maintenance' },
    ],
  };
}

// =====================================================
// Data Quality Intelligence
// =====================================================

export function generateDataQualityScore(): DataQualityScore {
  const productionScore = 100;
  const maintenanceScore = 85;
  const qualityScore = 95;
  const energyScore = 70;
  const costScore = 90;
  const completenessScore = Math.round(
    (productionScore + maintenanceScore + qualityScore + energyScore + costScore) / 5
  );
  const updateFrequencyScore = 88;
  const overallScore = Math.round(
    completenessScore * 0.4 + updateFrequencyScore * 0.3 + (energyScore + maintenanceScore) / 2 * 0.3
  );

  const weakAreas: string[] = [];
  if (energyScore < 80) weakAreas.push('بيانات الطاقة');
  if (maintenanceScore < 80) weakAreas.push('بيانات الصيانة');

  const recommendation =
    weakAreas.length > 0
      ? `أكمل ${weakAreas.join(' و ')} للحصول على تحليل مالي أكثر دقة. النتيجة الحالية ${overallScore}% — يمكن الوصول إلى 95% بتحسين البيانات الناقصة.`
      : `جودة البيانات ممتازة (${overallScore}%). النظام جاهز لتحليلات دقيقة.`;

  return {
    id: 'dq-1',
    factory_id: 'factory-001',
    overall_score: overallScore,
    production_score: productionScore,
    maintenance_score: maintenanceScore,
    quality_score: qualityScore,
    energy_score: energyScore,
    cost_score: costScore,
    completeness_score: completenessScore,
    update_frequency_score: updateFrequencyScore,
    recommendation,
    last_updated: new Date().toISOString(),
  };
}

// =====================================================
// Priority Matrix Engine
// =====================================================

export function generatePriorityMatrix(data?: Partial<SaasData>): PriorityMatrixItem[] {
  const recs = generateAIRecommendations(data);

  const matrixItems: Omit<PriorityMatrixItem, 'id'>[] = [
    {
      problem: recs[0].problem,
      financialImpact: 'high',
      productionImpact: 'high',
      urgency: 'immediate',
      implementationDifficulty: 'medium',
      priority: 'critical',
      category: recs[0].category,
      affectedArea: recs[0].affectedArea,
    },
    {
      problem: recs[1].problem,
      financialImpact: 'high',
      productionImpact: 'medium',
      urgency: 'immediate',
      implementationDifficulty: 'low',
      priority: 'high',
      category: recs[1].category,
      affectedArea: recs[1].affectedArea,
    },
    {
      problem: recs[4].problem,
      financialImpact: 'high',
      productionImpact: 'high',
      urgency: 'immediate',
      implementationDifficulty: 'low',
      priority: 'critical',
      category: recs[4].category,
      affectedArea: recs[4].affectedArea,
    },
    {
      problem: recs[2].problem,
      financialImpact: 'medium',
      productionImpact: 'medium',
      urgency: 'short_term',
      implementationDifficulty: 'low',
      priority: 'medium',
      category: recs[2].category,
      affectedArea: recs[2].affectedArea,
    },
    {
      problem: recs[3].problem,
      financialImpact: 'medium',
      productionImpact: 'high',
      urgency: 'short_term',
      implementationDifficulty: 'medium',
      priority: 'high',
      category: recs[3].category,
      affectedArea: recs[3].affectedArea,
    },
    {
      problem: recs[5].problem,
      financialImpact: 'medium',
      productionImpact: 'medium',
      urgency: 'short_term',
      implementationDifficulty: 'medium',
      priority: 'medium',
      category: recs[5].category,
      affectedArea: recs[5].affectedArea,
    },
  ];

  return matrixItems.map((item, i) => ({ ...item, id: `pm-${i + 1}` }));
}

const priorityConfig: Record<PriorityLevel, { color: string; bg: string; label: string }> = {
  critical: { color: '#ef4444', bg: '#fef2f2', label: 'حرج' },
  high: { color: '#F59E0B', bg: '#fffbeb', label: 'عالي' },
  medium: { color: '#0066FF', bg: '#eef4ff', label: 'متوسط' },
  low: { color: '#64748b', bg: '#f1f5f9', label: 'منخفض' },
};

const urgencyConfig: Record<UrgencyLevel, { color: string; label: string }> = {
  immediate: { color: '#ef4444', label: 'فوري (48 ساعة)' },
  short_term: { color: '#F59E0B', label: 'قصير المدى (30 يوم)' },
  long_term: { color: '#0066FF', label: 'طويل المدى (90 يوم)' },
};

export { priorityConfig, urgencyConfig };

// =====================================================
// Action Timeline Engine
// =====================================================

export function generateActionTimeline(recommendationId: string, data?: Partial<SaasData>): ActionTimeline {
  const recs = generateAIRecommendations(data);
  const rec = recs.find((r) => r.id === recommendationId) || recs[0];

  const timelines: Record<string, ActionTimeline['steps']> = {
    'ai-rec-1': [
      { timeframe: 'immediate', timeframeAr: '48 ساعة', action: 'فحص حالة المعدة', description: 'فحص شامل لنظام التسخين والنظام الهيدروليكي وتحديد الأجزاء التالفة' },
      { timeframe: 'short_term', timeframeAr: '30 يوم', action: 'تنفيذ خطة الصيانة الوقائية', description: 'استبدال الأجزاء التالفة وإعادة جدولة الصيانة الدورية كل 3 أسابيع' },
      { timeframe: 'long_term', timeframeAr: '90 يوم', action: 'قياس أثر التحسين', description: 'مراقبة OEE والتوقفات ومقارنتها بالفترة السابقة لقياس الأثر' },
    ],
    'ai-rec-2': [
      { timeframe: 'immediate', timeframeAr: '48 ساعة', action: 'معايرة نظام التسخين', description: 'ضبط درجات الحرارة لكل منتج وتوثيق الإعدادات' },
      { timeframe: 'short_term', timeframeAr: '30 يوم', action: 'توحيد إجراءات التشغيل', description: 'إنشاء SOP موثق وتدريب المشغلين على الإجراءات الموحدة' },
      { timeframe: 'long_term', timeframeAr: '90 يوم', action: 'تطبيق SPC', description: 'تركيب بطاقات تحكم إحصائي للعمليات ومراقبة استقرار الإنتاج' },
    ],
    'ai-rec-3': [
      { timeframe: 'immediate', timeframeAr: '48 ساعة', action: 'إعادة جدولة الإنتاج', description: 'نقل الخط 3 إلى وردية النهار للاستفادة من الطاقة الشمسية' },
      { timeframe: 'short_term', timeframeAr: '30 يوم', action: 'تركيب نظام إدارة طاقة', description: 'نظام مراقبة استهلاك الطاقة في الوقت الحقيقي' },
      { timeframe: 'long_term', timeframeAr: '90 يوم', action: 'توسيع النظام الشمسي', description: 'زيادة سعة النظام الشمسي بـ 20% لاستيعاب التوسع' },
    ],
    'ai-rec-4': [
      { timeframe: 'immediate', timeframeAr: '48 ساعة', action: 'توثيق إجراءات التغيير', description: 'تصوير وتوثيق جميع خطوات تغيير القالب الحالية' },
      { timeframe: 'short_term', timeframeAr: '30 يوم', action: 'تطبيق SMED', description: 'تحويل العمليات الداخلية إلى خارجية وتركيب نظام تثبيت سريع' },
      { timeframe: 'long_term', timeframeAr: '90 يوم', action: 'تدريب وتقييم', description: 'تدريب جميع المشغلين وتقييم وقت التغيير بعد التحسين' },
    ],
    'ai-rec-5': [
      { timeframe: 'immediate', timeframeAr: '48 ساعة', action: 'طلب عاجل لإضافات UV', description: 'طلب كمية طارئة تكفي 45 يوم لتفادي توقف الإنتاج' },
      { timeframe: 'short_term', timeframeAr: '30 يوم', action: 'تطبيق نقطة إعادة الطلب', description: 'تطبيق نظام Reorder Point آلي للمخزون' },
      { timeframe: 'long_term', timeframeAr: '90 يوم', action: 'تنويع الموردين', description: 'البحث عن موردين بديلين لتقليل فترة التوريد' },
    ],
    'ai-rec-6': [
      { timeframe: 'immediate', timeframeAr: '48 ساعة', action: 'فحص محتوى الرطوبة', description: 'قياس محتوى الرطوبة في حبيبات HDPE قبل التشكيل' },
      { timeframe: 'short_term', timeframeAr: '30 يوم', action: 'تركيب نظام تجفيف', description: 'تركيب Hopper Dryer لخط 2 وخط 3' },
      { timeframe: 'long_term', timeframeAr: '90 يوم', action: 'تطبيق FIFO', description: 'تطبيق نظام First-In First-Out لإدارة المخزون' },
    ],
  };

  return {
    recommendationId,
    problem: rec.problem,
    steps: timelines[recommendationId] || timelines['ai-rec-1'],
  };
}

// =====================================================
// MIZAN Impact Score Engine
// =====================================================

export function generateImpactScore(data?: Partial<SaasData>): ImpactScore {
  const financial = generateFinancialImpact(data);
  const annualLoss = financial.reduce((a, f) => a + f.currentCost, 0) * 12;
  const annualSaving = financial.reduce((a, f) => a + f.expectedSaving, 0) * 12;

  const beforeMizan = {
    annualLosses: annualLoss,
    oee: 62,
    wasteCost: 1200000 * 12,
    defectRate: 5.8,
    downtimePct: 14,
  };

  const afterImprovement = {
    savings: annualSaving,
    oee: 75,
    wasteCost: 720000 * 12,
    defectRate: 2.1,
    downtimePct: 6,
  };

  const oeeImprovement = ((afterImprovement.oee - beforeMizan.oee) / beforeMizan.oee) * 100;
  const wasteReduction = ((beforeMizan.wasteCost - afterImprovement.wasteCost) / beforeMizan.wasteCost) * 100;
  const score = Math.round((annualSaving / annualLoss) * 100);

  return {
    score,
    beforeMizan,
    afterImprovement,
    completedImprovements: 2,
    totalImprovements: 6,
    oeeImprovement,
    wasteReduction,
  };
}

// =====================================================
// Role-based permissions
// =====================================================

export type UserRole = 'factory_owner' | 'factory_manager' | 'industrial_engineer' | 'quality_manager' | 'maintenance_manager';

export interface RolePermission {
  role: UserRole;
  labelAr: string;
  description: string;
  modules: string[];
  color: string;
}

export function getRolePermissions(): RolePermission[] {
  return [
    {
      role: 'factory_owner',
      labelAr: 'صاحب المصنع',
      description: 'إطلالة تنفيذية، التوفير، الأثر المالي، والقرارات الكبرى',
      modules: ['dashboard', 'executive', 'financial', 'decisionlog', 'report', 'advisor'],
      color: '#8b5cf6',
    },
    {
      role: 'factory_manager',
      labelAr: 'مدير المصنع',
      description: 'العمليات اليومية، مشاكل الإنتاج، وإجراءات التحسين',
      modules: ['dashboard', 'data', 'analysis', 'projects', 'decisionlog', 'advisor'],
      color: '#0A2540',
    },
    {
      role: 'industrial_engineer',
      labelAr: 'مهندس صناعي',
      description: 'التحليل الهندسي، الأسباب الجذرية، أدوات Lean/Six Sigma، ومشاريع التحسين',
      modules: ['dashboard', 'analysis', 'rootcause', 'dmaic', 'projects', 'advisor', 'data'],
      color: '#0066FF',
    },
    {
      role: 'quality_manager',
      labelAr: 'مدير الجودة',
      description: 'العيوب، اتجاهات الجودة، وتحليل SPC',
      modules: ['dashboard', 'data', 'analysis', 'rootcause', 'advisor'],
      color: '#00B86B',
    },
    {
      role: 'maintenance_manager',
      labelAr: 'مدير الصيانة',
      description: 'المعدات، التوقفات، وأنشطة الصيانة',
      modules: ['dashboard', 'data', 'analysis', 'projects', 'advisor'],
      color: '#F59E0B',
    },
  ];
}
