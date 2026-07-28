// MIZAN Manufacturing AI — Core Domain Types

export type ProductSize = '500L' | '1000L' | '2000L' | '3000L' | '5000L';

export interface Product {
  id: string;
  name: string;
  size: ProductSize;
  capacityLiters: number;
  cycleTimeMin: number;
  materialKg: number;
  unitCost: number;
  unitPrice: number;
  lineId: string;
}

export interface ProductionLine {
  id: string;
  name: string;
  nameAr: string;
  products: ProductSize[];
  shiftCapacity: number;
}

export type MachineType =
  | 'molding'
  | 'mixer'
  | 'grinder'
  | 'compressor'
  | 'forklift'
  | 'generator'
  | 'solar';

export interface Machine {
  id: string;
  name: string;
  nameAr: string;
  type: MachineType;
  lineId?: string;
  status: 'running' | 'idle' | 'maintenance' | 'down';
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  downtimeHours: number;
  mtbfHours: number;
  mttrHours: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export type ProcessStep =
  | 'receiving'
  | 'inspection'
  | 'mixing'
  | 'heating'
  | 'molding'
  | 'cooling'
  | 'trimming'
  | 'quality'
  | 'storage'
  | 'shipping';

export interface ProcessStage {
  id: string;
  step: ProcessStep;
  nameAr: string;
  nameEn: string;
  order: number;
  cycleTimeMin: number;
  yieldRate: number;
}

export interface RawMaterial {
  id: string;
  nameAr: string;
  nameEn: string;
  unit: string;
  stockKg: number;
  consumptionPerDayKg: number;
  unitCost: number;
  supplier: string;
  leadTimeDays: number;
}

export interface ShiftData {
  id: string;
  shiftName: string;
  date: string;
  lineId: string;
  plannedUnits: number;
  actualUnits: number;
  goodUnits: number;
  defectUnits: number;
  scrapKg: number;
  runtimeHours: number;
  downtimeHours: number;
  energyKwh: number;
  energyCost: number;
}

export interface DefectRecord {
  id: string;
  date: string;
  productSize: ProductSize;
  defectType: string;
  count: number;
  rootCause?: string;
}

export interface DowntimeEvent {
  id: string;
  date: string;
  machineId: string;
  machineName: string;
  reason: string;
  durationMin: number;
  category: 'planned' | 'breakdown' | 'changeover' | 'material' | 'operator' | 'energy';
}

export interface EnergyRecord {
  date: string;
  source: 'diesel' | 'solar' | 'grid';
  kwh: number;
  cost: number;
}

export interface FactoryProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  industry: string;
  country: string;
  employees: number;
  shifts: number;
  powerSources: string[];
  establishedYear: number;
}

// KPI definitions
export interface KpiValue {
  key: string;
  label: string;
  value: number;
  unit: string;
  target: number;
  previous: number;
  trend: number;
  status: 'good' | 'warning' | 'critical';
  description: string;
}

export interface FactoryScore {
  current: number;
  previous: number;
  trend: number;
  components: {
    productionEfficiency: number;
    quality: number;
    oee: number;
    maintenance: number;
    energy: number;
    cost: number;
    delivery: number;
  };
}

export type RecommendationPriority = 'critical' | 'high' | 'medium' | 'low';
export type RecommendationCategory =
  | 'production'
  | 'quality'
  | 'maintenance'
  | 'energy'
  | 'cost'
  | 'waste'
  | 'delivery';

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: RecommendationCategory;
  priority: RecommendationPriority;
  impact: string;
  impactValue: number;
  effort: 'low' | 'medium' | 'high';
  methodology: string;
  affectedArea: string;
}

export interface AnalysisFinding {
  id: string;
  area: string;
  finding: string;
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  currentValue: string;
  benchmark: string;
  recommendation: string;
}

// =====================================================
// MIZAN AI Decision Intelligence Layer Types
// =====================================================

export type AnalysisMethodology =
  | 'DMAIC'
  | '5 Why'
  | 'Pareto Analysis'
  | 'Fishbone Analysis'
  | 'OEE Analysis'
  | 'TPM'
  | 'SMED'
  | 'SPC'
  | 'FMEA'
  | 'Kaizen'
  | 'Lean Waste Analysis';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

/** Structured AI recommendation following the 10-field MIZAN format */
export interface AIRecommendation {
  id: string;
  // 1. المشكلة
  problem: string;
  // 2. الأدلة
  evidence: string[];
  // 3. التحليل الهندسي
  engineeringAnalysis: string;
  // 4. السبب الجذري
  rootCause: string;
  // 5. منهج التحليل المستخدم
  methodologies: AnalysisMethodology[];
  // 6. التوصية
  recommendation: string;
  // 7. الأثر المتوقع
  expectedImpact: string;
  expectedImpactValue: number;
  // 8. الأولوية
  priority: RecommendationPriority;
  // 9. درجة الثقة
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  // 10. الأثر المالي
  financialImpact: FinancialImpact;
  // Metadata
  category: RecommendationCategory;
  affectedArea: string;
  effort: 'low' | 'medium' | 'high';
}

export interface FinancialImpact {
  currentCostMonthly: number;
  expectedSavingMonthly: number;
  expectedSavingAnnual: number;
  currency: string;
  description: string;
}

// 5-Why Analysis
export interface FiveWhyAnalysis {
  id: string;
  problem: string;
  steps: { why: string; answer: string }[];
  rootCause: string;
  recommendation: string;
  methodology: AnalysisMethodology;
}

// Fishbone Analysis
export interface FishboneCategory {
  category: 'machine' | 'material' | 'method' | 'man' | 'measurement' | 'environment';
  labelAr: string;
  causes: string[];
}

export interface FishboneAnalysis {
  id: string;
  problem: string;
  categories: FishboneCategory[];
  primaryRootCause: string;
  methodology: AnalysisMethodology;
}

// DMAIC Project
export type DMAICStage = 'define' | 'measure' | 'analyze' | 'improve' | 'control';
export type DMAICStageAr = 'تعريف' | 'قياس' | 'تحليل' | 'تحسين' | 'متابعة';

export interface DMAICStageData {
  stage: DMAICStage;
  labelAr: string;
  description: string;
  completed: boolean;
  details: string;
}

// Improvement Project
export type ProjectStatus =
  | 'detected'
  | 'analyzing'
  | 'approved'
  | 'in_progress'
  | 'closed'
  | 'measured';

export interface ImprovementProject {
  id: string;
  title: string;
  problem: string;
  rootCause: string;
  actionPlan: string;
  owner: string;
  dueDate: string;
  expectedSaving: number;
  actualSaving: number;
  status: ProjectStatus;
  category: RecommendationCategory;
  methodology: AnalysisMethodology;
  createdAt: string;
  dmaicStages: DMAICStageData[];
  recommendationId?: string;
}

// Decision Log
export interface DecisionLogEntry {
  id: string;
  date: string;
  problem: string;
  aiRecommendation: string;
  managementDecision: string;
  implementationStatus: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  result: string;
  saving?: number;
}

// Financial Impact Analysis
export interface FinancialImpactItem {
  id: string;
  category: string;
  categoryAr: string;
  currentCost: number;
  expectedImprovement: number;
  expectedSaving: number;
  annualSaving: number;
  unit: string;
  description: string;
}

export interface BeforeAfterComparison {
  metric: string;
  metricAr: string;
  before: number;
  after: number;
  unit: string;
  improvement: number;
}

// Executive Insight
export interface ExecutiveInsight {
  factoryHealthScore: number;
  healthTrend: number;
  topProblems: { title: string; severity: RecommendationPriority; impact: string }[];
  topOpportunities: { title: string; saving: number; effort: 'low' | 'medium' | 'high' }[];
  totalExpectedSavings: number;
  weeklyDecisions: { title: string; expectedResult: string; priority: RecommendationPriority }[];
  financialSummary: {
    monthlyLoss: number;
    potentialSaving: number;
    roi: number;
  };
}

// =====================================================
// SaaS Platform Architecture Types
// =====================================================

export type UserRole =
  | 'factory_owner'
  | 'factory_manager'
  | 'industrial_engineer'
  | 'quality_manager'
  | 'maintenance_manager';

export interface PlatformUser {
  id: string;
  factory_id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_color: string;
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name_ar: string;
  name_en: string;
  industry: string;
  country: string;
  subscription_plan: string;
  created_at: string;
}

export interface FactoryRecord {
  id: string;
  company_id: string;
  name_ar: string;
  name_en: string;
  industry: string;
  country: string;
  employees: number;
  shifts: number;
  power_sources: string[];
  established_year: number;
  is_demo: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  factory_id: string;
  name_ar: string;
  name_en: string;
  type: string;
  created_at: string;
}

export type PlanKey = 'starter' | 'professional' | 'enterprise';

export interface SubscriptionPlan {
  id: string;
  plan_key: PlanKey;
  name_ar: string;
  name_en: string;
  price_monthly: number;
  max_factories: number;
  features: string[];
  is_popular: boolean;
}

// Data Quality
export interface DataQualityScore {
  id: string;
  factory_id: string;
  overall_score: number;
  production_score: number;
  maintenance_score: number;
  quality_score: number;
  energy_score: number;
  cost_score: number;
  completeness_score: number;
  update_frequency_score: number;
  recommendation: string;
  last_updated: string;
}

// AI Evidence
export interface AIEvidence {
  productionRecords: number;
  downtimeRecords: number;
  qualityRecords: number;
  energyRecords: number;
  maintenanceRecords: number;
  dataCompleteness: number;
  analysisConfidence: number;
  dataSources: { label: string; count: number; icon: string }[];
}

// Priority Matrix
export type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';
export type UrgencyLevel = 'immediate' | 'short_term' | 'long_term';

export interface PriorityMatrixItem {
  id: string;
  problem: string;
  financialImpact: PriorityLevel;
  productionImpact: PriorityLevel;
  urgency: UrgencyLevel;
  implementationDifficulty: 'low' | 'medium' | 'high';
  priority: PriorityLevel;
  category: RecommendationCategory;
  affectedArea: string;
}

// Action Timeline
export interface ActionTimelineStep {
  timeframe: 'immediate' | 'short_term' | 'long_term';
  timeframeAr: string;
  action: string;
  description: string;
}

export interface ActionTimeline {
  recommendationId: string;
  problem: string;
  steps: ActionTimelineStep[];
}

// MIZAN Impact Score
export interface ImpactScore {
  score: number;
  beforeMizan: {
    annualLosses: number;
    oee: number;
    wasteCost: number;
    defectRate: number;
    downtimePct: number;
  };
  afterImprovement: {
    savings: number;
    oee: number;
    wasteCost: number;
    defectRate: number;
    downtimePct: number;
  };
  completedImprovements: number;
  totalImprovements: number;
  oeeImprovement: number;
  wasteReduction: number;
}

// Data Import
export type ImportDataType = 'production' | 'quality' | 'maintenance' | 'energy' | 'cost';
export type ImportStep = 'upload' | 'validate' | 'quality' | 'import' | 'analyze';

export interface ImportProgress {
  step: ImportStep;
  label: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  details?: string;
}
