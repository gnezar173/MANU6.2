import type {
  FactoryProfile,
  ProductionLine,
  Product,
  Machine,
  ProcessStage,
  RawMaterial,
  ShiftData,
  DefectRecord,
  DowntimeEvent,
  EnergyRecord,
} from '@/types';

export const factoryProfile: FactoryProfile = {
  id: 'factory-001',
  nameAr: 'مصنع الميزان لخزانات المياه البلاستيكية',
  nameEn: 'Mizan Plastic Water Tanks Factory',
  industry: 'Plastic Water Tank Manufacturing',
  country: 'Yemen',
  employees: 95,
  shifts: 2,
  powerSources: ['ديزل', 'طاقة شمسية'],
  establishedYear: 2015,
};

export const productionLines: ProductionLine[] = [
  {
    id: 'line-1',
    name: 'Line 1 — Small Tanks',
    nameAr: 'خط 1 - الخزانات الصغيرة',
    products: ['500L', '1000L'],
    shiftCapacity: 120,
  },
  {
    id: 'line-2',
    name: 'Line 2 — Medium Tanks',
    nameAr: 'خط 2 - الخزانات المتوسطة',
    products: ['2000L', '3000L'],
    shiftCapacity: 70,
  },
  {
    id: 'line-3',
    name: 'Line 3 — Large Tanks',
    nameAr: 'خط 3 - الخزانات الكبيرة',
    products: ['5000L'],
    shiftCapacity: 35,
  },
];

export const products: Product[] = [
  {
    id: 'p-500',
    name: 'خزان 500 لتر',
    size: '500L',
    capacityLiters: 500,
    cycleTimeMin: 18,
    materialKg: 8.5,
    unitCost: 14500,
    unitPrice: 22000,
    lineId: 'line-1',
  },
  {
    id: 'p-1000',
    name: 'خزان 1000 لتر',
    size: '1000L',
    capacityLiters: 1000,
    cycleTimeMin: 25,
    materialKg: 16,
    unitCost: 28000,
    unitPrice: 42000,
    lineId: 'line-1',
  },
  {
    id: 'p-2000',
    name: 'خزان 2000 لتر',
    size: '2000L',
    capacityLiters: 2000,
    cycleTimeMin: 38,
    materialKg: 32,
    unitCost: 55000,
    unitPrice: 82000,
    lineId: 'line-2',
  },
  {
    id: 'p-3000',
    name: 'خزان 3000 لتر',
    size: '3000L',
    capacityLiters: 3000,
    cycleTimeMin: 48,
    materialKg: 48,
    unitCost: 78000,
    unitPrice: 115000,
    lineId: 'line-2',
  },
  {
    id: 'p-5000',
    name: 'خزان 5000 لتر',
    size: '5000L',
    capacityLiters: 5000,
    cycleTimeMin: 72,
    materialKg: 82,
    unitCost: 132000,
    unitPrice: 195000,
    lineId: 'line-3',
  },
];

export const machines: Machine[] = [
  {
    id: 'm-mold-1',
    name: 'Molding Machine 1',
    nameAr: 'ماكينة التشكيل رقم 1',
    type: 'molding',
    lineId: 'line-1',
    status: 'running',
    availability: 92,
    performance: 88,
    quality: 96,
    oee: 77.8,
    downtimeHours: 6.2,
    mtbfHours: 320,
    mttrHours: 3.5,
    lastMaintenance: '2026-06-28',
    nextMaintenance: '2026-07-28',
  },
  {
    id: 'm-mold-2',
    name: 'Molding Machine 2',
    nameAr: 'ماكينة التشكيل رقم 2',
    type: 'molding',
    lineId: 'line-2',
    status: 'down',
    availability: 71,
    performance: 82,
    quality: 91,
    oee: 53.1,
    downtimeHours: 22.8,
    mtbfHours: 140,
    mttrHours: 8.2,
    lastMaintenance: '2026-05-15',
    nextMaintenance: '2026-07-15',
  },
  {
    id: 'm-mold-3',
    name: 'Molding Machine 3',
    nameAr: 'ماكينة التشكيل رقم 3',
    type: 'molding',
    lineId: 'line-3',
    status: 'running',
    availability: 89,
    performance: 85,
    quality: 94,
    oee: 71.2,
    downtimeHours: 8.4,
    mtbfHours: 280,
    mttrHours: 4.1,
    lastMaintenance: '2026-06-20',
    nextMaintenance: '2026-08-05',
  },
  {
    id: 'm-mixer-1',
    name: 'Material Mixer',
    nameAr: 'ماكينة الخلط',
    type: 'mixer',
    status: 'running',
    availability: 95,
    performance: 90,
    quality: 98,
    oee: 83.8,
    downtimeHours: 3.2,
    mtbfHours: 450,
    mttrHours: 2.0,
    lastMaintenance: '2026-07-01',
    nextMaintenance: '2026-08-01',
  },
  {
    id: 'm-grinder-1',
    name: 'Grinding Machine',
    nameAr: 'ماكينة الطحن',
    type: 'grinder',
    status: 'idle',
    availability: 97,
    performance: 92,
    quality: 95,
    oee: 84.9,
    downtimeHours: 1.8,
    mtbfHours: 520,
    mttrHours: 1.5,
    lastMaintenance: '2026-06-15',
    nextMaintenance: '2026-09-15',
  },
  {
    id: 'm-comp-1',
    name: 'Air Compressor',
    nameAr: 'ضاغط الهواء',
    type: 'compressor',
    status: 'running',
    availability: 88,
    performance: 86,
    quality: 100,
    oee: 75.7,
    downtimeHours: 7.5,
    mtbfHours: 210,
    mttrHours: 3.8,
    lastMaintenance: '2026-05-30',
    nextMaintenance: '2026-07-30',
  },
  {
    id: 'm-forklift-1',
    name: 'Forklift',
    nameAr: 'الرافعة الشوكية',
    type: 'forklift',
    status: 'idle',
    availability: 93,
    performance: 78,
    quality: 100,
    oee: 72.5,
    downtimeHours: 4.6,
    mtbfHours: 360,
    mttrHours: 5.0,
    lastMaintenance: '2026-06-10',
    nextMaintenance: '2026-08-10',
  },
  {
    id: 'm-gen-1',
    name: 'Diesel Generator',
    nameAr: 'مولد الديزل',
    type: 'generator',
    status: 'running',
    availability: 91,
    performance: 84,
    quality: 100,
    oee: 76.4,
    downtimeHours: 9.2,
    mtbfHours: 260,
    mttrHours: 6.5,
    lastMaintenance: '2026-06-05',
    nextMaintenance: '2026-07-25',
  },
  {
    id: 'm-solar-1',
    name: 'Solar Energy System',
    nameAr: 'نظام الطاقة الشمسية',
    type: 'solar',
    status: 'running',
    availability: 98,
    performance: 95,
    quality: 100,
    oee: 93.1,
    downtimeHours: 1.2,
    mtbfHours: 800,
    mttrHours: 1.0,
    lastMaintenance: '2026-04-20',
    nextMaintenance: '2026-10-20',
  },
];

export const processStages: ProcessStage[] = [
  { id: 'ps-1', step: 'receiving', nameAr: 'استلام المواد الخام', nameEn: 'Raw Material Receiving', order: 1, cycleTimeMin: 15, yieldRate: 100 },
  { id: 'ps-2', step: 'inspection', nameAr: 'فحص المواد', nameEn: 'Material Inspection', order: 2, cycleTimeMin: 20, yieldRate: 99 },
  { id: 'ps-3', step: 'mixing', nameAr: 'خلط المواد', nameEn: 'Material Mixing', order: 3, cycleTimeMin: 12, yieldRate: 99 },
  { id: 'ps-4', step: 'heating', nameAr: 'عملية التسخين', nameEn: 'Heating Process', order: 4, cycleTimeMin: 25, yieldRate: 98 },
  { id: 'ps-5', step: 'molding', nameAr: 'عملية التشكيل', nameEn: 'Molding Process', order: 5, cycleTimeMin: 35, yieldRate: 94 },
  { id: 'ps-6', step: 'cooling', nameAr: 'التبريد', nameEn: 'Cooling', order: 6, cycleTimeMin: 18, yieldRate: 97 },
  { id: 'ps-7', step: 'trimming', nameAr: 'التشذيب', nameEn: 'Trimming', order: 7, cycleTimeMin: 8, yieldRate: 96 },
  { id: 'ps-8', step: 'quality', nameAr: 'فحص الجودة', nameEn: 'Quality Inspection', order: 8, cycleTimeMin: 10, yieldRate: 95 },
  { id: 'ps-9', step: 'storage', nameAr: 'التخزين', nameEn: 'Final Storage', order: 9, cycleTimeMin: 12, yieldRate: 100 },
  { id: 'ps-10', step: 'shipping', nameAr: 'الشحن', nameEn: 'Shipping', order: 10, cycleTimeMin: 15, yieldRate: 100 },
];

export const rawMaterials: RawMaterial[] = [
  {
    id: 'rm-1',
    nameAr: 'حبيبات البلاستيك HDPE',
    nameEn: 'HDPE Plastic Resin',
    unit: 'كجم',
    stockKg: 18500,
    consumptionPerDayKg: 2400,
    unitCost: 1850,
    supplier: 'مؤسسة المواد الصناعية',
    leadTimeDays: 14,
  },
  {
    id: 'rm-2',
    nameAr: 'ماستر باتش للألوان',
    nameEn: 'Color Masterbatch',
    unit: 'كجم',
    stockKg: 1200,
    consumptionPerDayKg: 120,
    unitCost: 6500,
    supplier: 'شركة الألوان المتقدمة',
    leadTimeDays: 21,
  },
  {
    id: 'rm-3',
    nameAr: 'إضافات الحماية من الأشعة فوق البنفسجية',
    nameEn: 'UV Additives',
    unit: 'كجم',
    stockKg: 340,
    consumptionPerDayKg: 36,
    unitCost: 12000,
    supplier: 'مجموعة الإضافات الصناعية',
    leadTimeDays: 30,
  },
];

// Generate 14 days of shift data
function generateShiftData(): ShiftData[] {
  const data: ShiftData[] = [];
  const today = new Date('2026-07-24');
  const lines = [
    { lineId: 'line-1', planned: 120, base: 108 },
    { lineId: 'line-2', planned: 70, base: 62 },
    { lineId: 'line-3', planned: 35, base: 30 },
  ];

  for (let d = 13; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];

    lines.forEach((line, idx) => {
      for (let shift = 1; shift <= 2; shift++) {
        const variance = (Math.sin(d * 0.7 + idx) + Math.cos(d * 0.4)) * 0.08;
        const actual = Math.round(line.base * (1 + variance) * (shift === 2 ? 0.92 : 1));
        const defectRate = 0.04 + Math.max(0, Math.sin(d * 0.5)) * 0.03;
        const defectUnits = Math.round(actual * defectRate);
        const goodUnits = actual - defectUnits;
        const scrapKg = Math.round(defectUnits * 20 * (1 + idx * 0.3));
        const runtime = 7.5 - Math.max(0, Math.sin(d * 0.6 + idx)) * 0.8;
        const downtime = 8 - runtime;
        const energyKwh = Math.round(actual * (1.8 + idx * 0.5));
        const energyCost = Math.round(energyKwh * 85);

        data.push({
          id: `shift-${dateStr}-${line.lineId}-${shift}`,
          shiftName: `وردية ${shift}`,
          date: dateStr,
          lineId: line.lineId,
          plannedUnits: line.planned,
          actualUnits: actual,
          goodUnits,
          defectUnits,
          scrapKg,
          runtimeHours: Number(runtime.toFixed(1)),
          downtimeHours: Number(downtime.toFixed(1)),
          energyKwh,
          energyCost,
        });
      }
    });
  }
  return data;
}

export const shiftData: ShiftData[] = generateShiftData();

export const defectRecords: DefectRecord[] = [
  { id: 'd-1', date: '2026-07-23', productSize: '1000L', defectType: 'تشوه في الشكل', count: 8, rootCause: 'حرارة التشكيل غير متجانسة' },
  { id: 'd-2', date: '2026-07-23', productSize: '2000L', defectType: 'فقاعات هوائية', count: 5, rootCause: 'رطوبة في حبيبات البلاستيك' },
  { id: 'd-3', date: '2026-07-22', productSize: '1000L', defectType: 'سماكة غير متساوية', count: 12, rootCause: 'تآكل في القالب' },
  { id: 'd-4', date: '2026-07-22', productSize: '500L', defectType: 'لون غير مطابق', count: 4, rootCause: 'خلط غير كافٍ للماستر باتش' },
  { id: 'd-5', date: '2026-07-21', productSize: '2000L', defectType: 'تشقق في الحواف', count: 7, rootCause: 'تبريد سريع' },
  { id: 'd-6', date: '2026-07-21', productSize: '3000L', defectType: 'تشوه في الشكل', count: 3, rootCause: 'ضغط منخفض في القالب' },
  { id: 'd-7', date: '2026-07-20', productSize: '1000L', defectType: 'سماكة غير متساوية', count: 9, rootCause: 'تآكل في القالب' },
  { id: 'd-8', date: '2026-07-20', productSize: '5000L', defectType: 'فقاعات هوائية', count: 2, rootCause: 'رطوبة في حبيبات البلاستيك' },
];

export const downtimeEvents: DowntimeEvent[] = [
  { id: 'dt-1', date: '2026-07-23', machineId: 'm-mold-2', machineName: 'ماكينة التشكيل رقم 2', reason: 'عطل في نظام التسخين', durationMin: 185, category: 'breakdown' },
  { id: 'dt-2', date: '2026-07-23', machineId: 'm-comp-1', machineName: 'ضاغط الهواء', reason: 'صيانة دورية', durationMin: 45, category: 'planned' },
  { id: 'dt-3', date: '2026-07-22', machineId: 'm-mold-2', machineName: 'ماكينة التشكيل رقم 2', reason: 'تغيير القالب', durationMin: 55, category: 'changeover' },
  { id: 'dt-4', date: '2026-07-22', machineId: 'm-gen-1', machineName: 'مولد الديزل', reason: 'انقطاع وقود الديزل', durationMin: 90, category: 'material' },
  { id: 'dt-5', date: '2026-07-21', machineId: 'm-mold-2', machineName: 'ماكينة التشكيل رقم 2', reason: 'عطل في النظام الهيدروليكي', durationMin: 140, category: 'breakdown' },
  { id: 'dt-6', date: '2026-07-21', machineId: 'm-mold-1', machineName: 'ماكينة التشكيل رقم 1', reason: 'تغيير القالب', durationMin: 40, category: 'changeover' },
  { id: 'dt-7', date: '2026-07-20', machineId: 'm-mold-2', machineName: 'ماكينة التشكيل رقم 2', reason: 'مشكلة في نظام التبريد', durationMin: 110, category: 'breakdown' },
  { id: 'dt-8', date: '2026-07-20', machineId: 'm-comp-1', machineName: 'ضاغط الهواء', reason: 'ضغط منخفض', durationMin: 35, category: 'breakdown' },
  { id: 'dt-9', date: '2026-07-19', machineId: 'm-mold-2', machineName: 'ماكينة التشكيل رقم 2', reason: 'صيانة طارئة', durationMin: 95, category: 'breakdown' },
  { id: 'dt-10', date: '2026-07-19', machineId: 'm-forklift-1', machineName: 'الرافعة الشوكية', reason: 'بطارية فارغة', durationMin: 60, category: 'energy' },
];

export const energyRecords: EnergyRecord[] = (() => {
  const records: EnergyRecord[] = [];
  const today = new Date('2026-07-24');
  for (let d = 13; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().split('T')[0];
    const solarFactor = 0.35 + Math.max(0, Math.sin(d * 0.3)) * 0.1;
    const totalKwh = 1800 + Math.sin(d * 0.5) * 150;
    const solarKwh = Math.round(totalKwh * solarFactor);
    const dieselKwh = Math.round(totalKwh * (1 - solarFactor));
    records.push({ date: dateStr, source: 'solar', kwh: solarKwh, cost: 0 });
    records.push({ date: dateStr, source: 'diesel', kwh: dieselKwh, cost: Math.round(dieselKwh * 85) });
  }
  return records;
})();
