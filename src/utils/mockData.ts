import { formatInTimeZone } from 'date-fns-tz';

export type Timezone = 'UTC' | 'Asia/Shanghai';
export type Currency = 'USD' | 'CNY';

export interface GlobalRechargeData {
  period: string;
  totalRecharge: number;
  totalRevenue: number;
  selfSpend: number;
  selfRecharge: number;
  selfNetRevenue: number;
  selfNetRoi: number;
  selfRechargeRoi: number;
  distRecharge: number;
  distNetRevenue: number;
}

export interface DramaData {
  id: string;
  name: string;
  chineseName: string;
  language: string;
  revenue: number;
  viewingUsers: number;
  intentionCount: number;
  payingUsers: number;
  trend: number;
  cover: string;
  selfSpend: number;
  selfSpendTrend: number;
  selfRecharge: number;
  selfRechargeTrend: number;
  selfRoi: number;
  distRecharge: number;
  distRechargeTrend: number;
  netRevenue: number;
  arpu: number;
}

export interface ChannelData {
  id: string; // Channel ID
  name: string; // Optimizer (优化师)
  leadName: string; // Optimizer Lead (优化师组长)
  platform: 'fb' | 'tk' | 'ios' | 'android';
  type: 'self' | 'dist' | 'organic';
  recharge: number;
  d0Recharge: number;
  rechargeUsers: number;
  newRecharge: number;
  newRechargeUsers: number;
  spend?: number;
  netRevenue: number;
  expectedRevenue?: number;
  roi?: number;
  activeUsers?: number;
  users?: number;
  promoLinkCount: number;
  optimizerCount: number;
  optimizerName?: string;
  dramaName: string;
  dramaId: string;
  language: string;
  department: string;
}

export interface DistributorData {
  name: string;
  recharge: number;
  netRevenue: number;
  newPromoLinks: number;
}

export interface LtvData {
  day: string;
  amount: number;
}

export interface HourlyData {
  hour: string;
  today: number;
  yesterday: number;
}

export interface HourlyActiveUserData {
  hour: string;
  activeUsers: number;
  previousActiveUsers: number;
}

const generateRandomGlobalData = (multiplier: number, currencyRate: number): Omit<GlobalRechargeData, 'period'> => {
  const selfSpend = Math.round((Math.random() * 5000 + 1000) * multiplier * currencyRate);
  const selfRechargeRoi = +(Math.random() * 0.5 + 1.1).toFixed(2); // 1.1 to 1.6
  const selfRecharge = Math.round(selfSpend * selfRechargeRoi);
  
  const taxRate = 0.15; // 15% platform fee/tax
  const selfNetRevenue = Math.round(selfRecharge * (1 - taxRate));
  const selfNetRoi = +(selfNetRevenue / selfSpend).toFixed(2);

  const distRecharge = Math.round((Math.random() * 3000 + 500) * multiplier * currencyRate);
  const distNetRevenue = Math.round(distRecharge * (1 - taxRate) * 0.7); // Assuming 70% share to us

  const totalRecharge = selfRecharge + distRecharge;
  const totalRevenue = selfNetRevenue + distNetRevenue;

  return {
    totalRecharge,
    totalRevenue,
    selfSpend,
    selfRecharge,
    selfNetRevenue,
    selfNetRoi,
    selfRechargeRoi,
    distRecharge,
    distNetRevenue,
  };
};

export const getGlobalRechargeData = (timezone: Timezone, currency: Currency): GlobalRechargeData[] => {
  const tzMultiplier = timezone === 'Asia/Shanghai' ? 1.2 : timezone === 'UTC' ? 1.0 : 0.8;
  const currencyRate = currency === 'CNY' ? 7.2 : 1;

  return [
    { period: '今日 (Today)', ...generateRandomGlobalData(1 * tzMultiplier, currencyRate) },
    { period: '昨日 (Yesterday)', ...generateRandomGlobalData(1.2 * tzMultiplier, currencyRate) },
    { period: '当月 (This Month)', ...generateRandomGlobalData(15 * tzMultiplier, currencyRate) },
    { period: '上月 (Last Month)', ...generateRandomGlobalData(30 * tzMultiplier, currencyRate) },
    { period: '年度 (Yearly)', ...generateRandomGlobalData(150 * tzMultiplier, currencyRate) },
  ];
};

export interface RealtimeMetrics {
  totalRecharge: number;
  totalRechargeTrend: number;
  netRevenue: number;
  netRevenueTrend: number;
  selfRecharge: number;
  selfRechargeTrend: number;
  selfD0Recharge: number;
  selfD0RechargeTrend: number;
  selfD0NetRevenue: number;
  selfD0NetRevenueTrend: number;
  selfSpend: number;
  selfSpendTrend: number;
  selfRoi: number;
  selfRoiTrend: number;
  selfD0Roi: number;
  selfD0RoiTrend: number;
  selfNetRevenue: number;
  selfNetRevenueTrend: number;
  distRecharge: number;
  distRechargeTrend: number;
  distD0Recharge: number;
  distD0RechargeTrend: number;
  distD0NetRevenue: number;
  distD0NetRevenueTrend: number;
  distSpend: number;
  distD0Roi: number;
  distD0RoiTrend: number;
  distRoi: number;
  distRoiTrend: number;
  distNetRevenue: number;
  distNetRevenueTrend: number;
  activeUsers: number;
  activeUsersTrend: number;
  viewingUsers: number;
  viewingUsersTrend: number;
  intentUsers: number;
  intentUsersTrend: number;
  rechargeUsers: number;
  rechargeUsersTrend: number;
  arpu: number;
  arpuTrend: number;
  newPayingUsers: number;
  newPayingUsersTrend: number;
  newPayingAmount: number;
  newPayingAmountTrend: number;
  conversionRate: number;
  conversionRateTrend: number;
}

export const getRealtimeMetrics = (timezone: Timezone, currency: Currency, period: string, channelData: ChannelData[]): RealtimeMetrics => {
  const tzMultiplier = timezone === 'Asia/Shanghai' ? 1.2 : timezone === 'UTC' ? 1.0 : 0.8;
  const currencyRate = currency === 'CNY' ? 7.2 : 1;
  let multiplier = 1;
  switch (period) {
    case 'today': multiplier = 1; break;
    case 'yesterday': multiplier = 1.2; break;
    case '7days': multiplier = 7.5; break;
    case 'month': multiplier = 15; break;
    case 'lastMonth': multiplier = 30; break;
    case 'cumulative': multiplier = 100; break;
  }

  const base = multiplier * tzMultiplier;
  
  let selfSpend = 0;
  let selfRecharge = 0;
  let selfD0Recharge = 0;
  let selfNetRevenue = 0;
  let distRecharge = 0;
  let distD0Recharge = 0;
  let distSpend = 0;
  let distNetRevenue = 0;
  let activeUsers = 0;
  let newPayingAmount = 0;
  let rechargeUsers = 0;
  let users = 0;
  let viewingUsers = 0;
  let intentUsers = 0;
  let newPayingUsers = 0;

  channelData.forEach(ch => {
    if (ch.type === 'self') {
      selfSpend += (ch.spend || 0);
      selfRecharge += ch.recharge;
      selfD0Recharge += ch.d0Recharge || 0;
      selfNetRevenue += ch.netRevenue;
    } else if (ch.type === 'dist') {
      distRecharge += ch.recharge;
      distD0Recharge += ch.d0Recharge || 0;
      distSpend += (ch.spend || 0);
      distNetRevenue += ch.netRevenue;
    }
    activeUsers += (ch.activeUsers || 0);
    newPayingAmount += ch.newRecharge;
    rechargeUsers += ch.rechargeUsers;
    users += (ch.users || 0);
    newPayingUsers += ch.newRechargeUsers;
  });

  const totalRecharge = selfRecharge + distRecharge;
  const netRevenue = selfNetRevenue + distNetRevenue;

  if (activeUsers === 0) activeUsers = Math.round(rechargeUsers * 15);
  viewingUsers = Math.round(activeUsers * 0.6);
  intentUsers = Math.round(viewingUsers * 0.3);

  const selfRoi = selfSpend > 0 ? +(selfRecharge / selfSpend).toFixed(2) : 0;
  const selfD0Roi = selfSpend > 0 ? +(selfD0Recharge / selfSpend).toFixed(2) : 0;
  const selfD0NetRevenue = Math.round(selfD0Recharge * 0.85); // 85% after platform fees
  const distD0Roi = distSpend > 0 ? +(distD0Recharge / distSpend).toFixed(2) : +(Math.random() * 0.5 + 0.5).toFixed(2);
  const distD0NetRevenue = Math.round(distD0Recharge * 0.85 * 0.7); // 85% after platform fees, 70% share
  const distRoi = distSpend > 0 ? +(distRecharge / distSpend).toFixed(2) : +(Math.random() * 0.5 + 0.5).toFixed(2);
  const conversionRate = intentUsers > 0 ? +(rechargeUsers / intentUsers * 100).toFixed(2) : 0;

  const getTrend = () => +(Math.random() * 40 - 20).toFixed(1);

  return {
    totalRecharge: Math.round(totalRecharge * base),
    totalRechargeTrend: getTrend(),
    netRevenue: Math.round(netRevenue * base),
    netRevenueTrend: getTrend(),
    selfRecharge: Math.round(selfRecharge * base),
    selfRechargeTrend: getTrend(),
    selfD0Recharge: Math.round(selfD0Recharge * base),
    selfD0RechargeTrend: getTrend(),
    selfD0NetRevenue: Math.round(selfD0NetRevenue * base),
    selfD0NetRevenueTrend: getTrend(),
    selfSpend: Math.round(selfSpend * base),
    selfSpendTrend: getTrend(),
    selfRoi: selfRoi,
    selfRoiTrend: getTrend(),
    selfD0Roi: selfD0Roi,
    selfD0RoiTrend: getTrend(),
    selfNetRevenue: Math.round(selfNetRevenue * base),
    selfNetRevenueTrend: getTrend(),
    distRecharge: Math.round(distRecharge * base),
    distRechargeTrend: getTrend(),
    distD0Recharge: Math.round(distD0Recharge * base),
    distD0RechargeTrend: getTrend(),
    distD0NetRevenue: Math.round(distD0NetRevenue * base),
    distD0NetRevenueTrend: getTrend(),
    distSpend: Math.round(distSpend * base),
    distD0Roi: distD0Roi,
    distD0RoiTrend: getTrend(),
    distRoi: distRoi,
    distRoiTrend: getTrend(),
    distNetRevenue: Math.round(distNetRevenue * base),
    distNetRevenueTrend: getTrend(),
    activeUsers: Math.round(activeUsers * base),
    activeUsersTrend: getTrend(),
    viewingUsers: Math.round(viewingUsers * base),
    viewingUsersTrend: getTrend(),
    intentUsers: Math.round(intentUsers * base),
    intentUsersTrend: getTrend(),
    rechargeUsers: Math.round(rechargeUsers * base),
    rechargeUsersTrend: getTrend(),
    arpu: rechargeUsers > 0 ? Math.round(totalRecharge / rechargeUsers * base) : 0,
    arpuTrend: getTrend(),
    newPayingUsers: Math.round(newPayingUsers * base),
    newPayingUsersTrend: getTrend(),
    newPayingAmount: Math.round(newPayingAmount * base),
    newPayingAmountTrend: getTrend(),
    conversionRate: conversionRate,
    conversionRateTrend: getTrend()
  };
};

export const getActiveUserAppDistribution = (date: 'today' | 'yesterday' = 'today') => {
  const m = date === 'today' ? 1 : 0.85;
  return [
    { name: 'yoo', activeUsers: Math.round(12500 * m), viewingUsers: Math.round(8500 * m), intentUsers: Math.round(4200 * m), rechargeUsers: Math.round(1250 * m), color: '#4f46e5' },
    { name: 'manseen', activeUsers: Math.round(8200 * m), viewingUsers: Math.round(5600 * m), intentUsers: Math.round(2800 * m), rechargeUsers: Math.round(980 * m), color: '#0ea5e9' },
    { name: '马甲包A', activeUsers: Math.round(6400 * m), viewingUsers: Math.round(4300 * m), intentUsers: Math.round(2100 * m), rechargeUsers: Math.round(810 * m), color: '#10b981' },
    { name: '马甲包B', activeUsers: Math.round(5100 * m), viewingUsers: Math.round(3500 * m), intentUsers: Math.round(1750 * m), rechargeUsers: Math.round(650 * m), color: '#f59e0b' },
    { name: '马甲包C', activeUsers: Math.round(4200 * m), viewingUsers: Math.round(2800 * m), intentUsers: Math.round(1400 * m), rechargeUsers: Math.round(520 * m), color: '#8b5cf6' },
    { name: '马甲包D', activeUsers: Math.round(3600 * m), viewingUsers: Math.round(2400 * m), intentUsers: Math.round(1200 * m), rechargeUsers: Math.round(450 * m), color: '#ec4899' },
    { name: '马甲包E', activeUsers: Math.round(2800 * m), viewingUsers: Math.round(1900 * m), intentUsers: Math.round(950 * m), rechargeUsers: Math.round(340 * m), color: '#f43f5e' },
    { name: '马甲包F', activeUsers: Math.round(2100 * m), viewingUsers: Math.round(1400 * m), intentUsers: Math.round(700 * m), rechargeUsers: Math.round(260 * m), color: '#14b8a6' },
    { name: '马甲包G', activeUsers: Math.round(1500 * m), viewingUsers: Math.round(1000 * m), intentUsers: Math.round(500 * m), rechargeUsers: Math.round(180 * m), color: '#84cc16' },
    { name: '其他', activeUsers: Math.round(1200 * m), viewingUsers: Math.round(800 * m), intentUsers: Math.round(400 * m), rechargeUsers: Math.round(140 * m), color: '#eab308' },
  ];
};

export const getAppData = (date: string = 'today') => {
  let m = 1;
  switch (date) {
    case 'today': m = 1; break;
    case 'yesterday': m = 0.85; break;
    case '7days': m = 6.5; break;
    case 'month': m = 25; break;
    case 'lastMonth': m = 28; break;
    default: m = 1;
  }
  return {
    clients: [
      { name: 'iOS', value: 45 },
      { name: 'Android', value: 35 },
      { name: 'H5', value: 15 },
      { name: '小程序', value: 5 },
    ],
    packages: [
      { name: 'yoo', value: 50 },
      { name: 'manseen', value: 30 },
      { name: '马甲包A', value: 12 },
      { name: '马甲包B', value: 8 },
    ],
    payments: [
      { name: '200金币', value: Math.round(40 * m) },
      { name: '周会员', value: Math.round(30 * m) },
      { name: '月会员（续订）', value: Math.round(20 * m) },
      { name: '年会员', value: Math.round(10 * m) },
    ]
  };
};

export const getRegionData = (currency: Currency, date: string = 'today') => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  let m = 1;
  switch (date) {
    case 'today': m = 1; break;
    case 'yesterday': m = 0.92; break;
    case '7days': m = 7.2; break;
    case 'month': m = 28; break;
    case 'lastMonth': m = 31; break;
    default: m = 1;
  }
  return [
    { name: 'US', label: '美国', value: 4500 * rate * m },
    { name: 'UK', label: '英国', value: 2100 * rate * m },
    { name: 'AU', label: '澳大利亚', value: 1800 * rate * m },
    { name: 'CA', label: '加拿大', value: 1500 * rate * m },
    { name: 'SG', label: '新加坡', value: 900 * rate * m },
    { name: 'MY', label: '马来西亚', value: 600 * rate * m },
    { name: 'ID', label: '印尼', value: 450 * rate * m },
    { name: 'TH', label: '泰国', value: 300 * rate * m },
  ];
};

export const getDramaRankings = (currency: Currency, languageFilter: string = 'ALL') => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  
  const generateDramaMetrics = (revenue: number) => {
    const selfRecharge = Math.round(revenue * (Math.random() * 0.4 + 0.4)); // 40% to 80% self
    const distRecharge = revenue - selfRecharge;
    
    const selfRoi = +(Math.random() * 0.6 + 0.9).toFixed(2); // 0.9 to 1.5
    const selfSpend = Math.round(selfRecharge / selfRoi);
    
    const selfSpendTrend = Math.round(Math.random() * 40 - 15); // -15% to +25%
    const selfRechargeTrend = Math.round(Math.random() * 40 - 10); // -10% to +30%
    const distRechargeTrend = Math.round(Math.random() * 50 - 10); // -10% to +40%
    
    const netRevenue = Math.round(revenue * 0.85); // 85% after platform fees
    
    // Generate user counts: viewing > intention > paying
    const payingUsers = Math.round((revenue / rate) / (Math.random() * 20 + 10)) || 1; 
    const intentionCount = Math.round(payingUsers * (Math.random() * 3 + 1.5));
    const viewingUsers = Math.round(intentionCount * (Math.random() * 5 + 3));
    
    const arpu = payingUsers > 0 ? revenue / payingUsers : 0;

    return { 
      selfSpend, selfSpendTrend, selfRecharge, selfRechargeTrend, selfRoi,
      distRecharge, distRechargeTrend,
      netRevenue, viewingUsers, intentionCount, payingUsers, arpu
    };
  };

  const allDramas = {
    trending: [
      { 
        id: '1001', 
        name: 'Billionaire\'s Secret Wife', 
        chineseName: '亿万富翁的秘密妻子',
        language: 'EN', 
        revenue: 125000 * rate, 
        trend: 15,
        cover: 'https://picsum.photos/seed/drama1/120/160',
        ...generateDramaMetrics(125000 * rate)
      },
      { 
        id: '1002', 
        name: 'Alpha\'s Rejected Mate', 
        chineseName: '阿尔法的被拒伴侣',
        language: 'EN', 
        revenue: 98000 * rate, 
        trend: 22,
        cover: 'https://picsum.photos/seed/drama2/120/160',
        ...generateDramaMetrics(98000 * rate)
      },
      { 
        id: '1003', 
        name: 'El Amor del CEO', 
        chineseName: 'CEO之爱',
        language: 'ES', 
        revenue: 85000 * rate, 
        trend: 8,
        cover: 'https://picsum.photos/seed/drama3/120/160',
        ...generateDramaMetrics(85000 * rate)
      },
      { 
        id: '1004', 
        name: 'Vampire King', 
        chineseName: '吸血鬼之王',
        language: 'EN', 
        revenue: 76000 * rate, 
        trend: -5,
        cover: 'https://picsum.photos/seed/drama4/120/160',
        ...generateDramaMetrics(76000 * rate)
      },
      { 
        id: '1005', 
        name: 'Cinta Sang Miliarder', 
        chineseName: '亿万富翁之恋',
        language: 'ID', 
        revenue: 65000 * rate, 
        trend: 12,
        cover: 'https://picsum.photos/seed/drama5/120/160',
        ...generateDramaMetrics(65000 * rate)
      },
      { 
        id: '1009', 
        name: 'La Venganza', 
        chineseName: '复仇',
        language: 'ES', 
        revenue: 54000 * rate, 
        trend: 18,
        cover: 'https://picsum.photos/seed/drama6/120/160',
        ...generateDramaMetrics(54000 * rate)
      },
      { 
        id: '1010', 
        name: 'Forbidden Love', 
        chineseName: '禁忌之恋',
        language: 'EN', 
        revenue: 48000 * rate, 
        trend: 5,
        cover: 'https://picsum.photos/seed/drama11/120/160',
        ...generateDramaMetrics(48000 * rate)
      },
      { 
        id: '1011', 
        name: 'The CEO\'s Contract', 
        chineseName: 'CEO的契约',
        language: 'ES', 
        revenue: 42000 * rate, 
        trend: 10,
        cover: 'https://picsum.photos/seed/drama12/120/160',
        ...generateDramaMetrics(42000 * rate)
      },
      { 
        id: '1012', 
        name: 'Wolf\'s Destiny', 
        chineseName: '狼之宿命',
        language: 'EN', 
        revenue: 38000 * rate, 
        trend: -2,
        cover: 'https://picsum.photos/seed/drama13/120/160',
        ...generateDramaMetrics(38000 * rate)
      },
      { 
        id: '1013', 
        name: 'Ratu Drama', 
        chineseName: '剧集女王',
        language: 'ID', 
        revenue: 35000 * rate, 
        trend: 15,
        cover: 'https://picsum.photos/seed/drama14/120/160',
        ...generateDramaMetrics(35000 * rate)
      },
    ],
    new: [
      { 
        id: '2001', 
        name: 'Rebirth of the Heiress', 
        chineseName: '继承人的重生',
        language: 'EN', 
        revenue: 45000 * rate, 
        trend: 150,
        cover: 'https://picsum.photos/seed/drama7/120/160',
        ...generateDramaMetrics(45000 * rate)
      },
      { 
        id: '2002', 
        name: 'Mi Dulce Venganza', 
        chineseName: '我的甜蜜复仇',
        language: 'ES', 
        revenue: 38000 * rate, 
        trend: 120,
        cover: 'https://picsum.photos/seed/drama8/120/160',
        ...generateDramaMetrics(38000 * rate)
      },
      { 
        id: '2003', 
        name: 'Dragon\'s Bride', 
        chineseName: '龙的新娘',
        language: 'EN', 
        revenue: 32000 * rate, 
        trend: 85,
        cover: 'https://picsum.photos/seed/drama9/120/160',
        ...generateDramaMetrics(32000 * rate)
      },
      { 
        id: '2004', 
        name: 'Istri yang Terbuang', 
        chineseName: '被抛弃的妻子',
        language: 'ID', 
        revenue: 28000 * rate, 
        trend: 210,
        cover: 'https://picsum.photos/seed/drama10/120/160',
        ...generateDramaMetrics(28000 * rate)
      },
      { 
        id: '2005', 
        name: 'The Lost Heir', 
        chineseName: '失落的继承人',
        language: 'EN', 
        revenue: 25000 * rate, 
        trend: 300,
        cover: 'https://picsum.photos/seed/drama15/120/160',
        ...generateDramaMetrics(25000 * rate)
      },
      { 
        id: '2006', 
        name: 'Amor Prohibido', 
        chineseName: '禁忌之爱',
        language: 'ES', 
        revenue: 22000 * rate, 
        trend: 180,
        cover: 'https://picsum.photos/seed/drama16/120/160',
        ...generateDramaMetrics(22000 * rate)
      },
      { 
        id: '2007', 
        name: 'Phoenix Rising', 
        chineseName: '凤凰涅槃',
        language: 'EN', 
        revenue: 19000 * rate, 
        trend: 250,
        cover: 'https://picsum.photos/seed/drama17/120/160',
        ...generateDramaMetrics(19000 * rate)
      },
      { 
        id: '2008', 
        name: 'Cinta Pertama', 
        chineseName: '初恋',
        language: 'ID', 
        revenue: 16000 * rate, 
        trend: 140,
        cover: 'https://picsum.photos/seed/drama18/120/160',
        ...generateDramaMetrics(16000 * rate)
      },
      { 
        id: '2009', 
        name: 'Secret Garden', 
        chineseName: '秘密花园',
        language: 'EN', 
        revenue: 14000 * rate, 
        trend: 110,
        cover: 'https://picsum.photos/seed/drama19/120/160',
        ...generateDramaMetrics(14000 * rate)
      },
      { 
        id: '2010', 
        name: 'El Destino', 
        chineseName: '命运',
        language: 'ES', 
        revenue: 12000 * rate, 
        trend: 95,
        cover: 'https://picsum.photos/seed/drama20/120/160',
        ...generateDramaMetrics(12000 * rate)
      },
    ]
  };

  if (languageFilter === 'ALL') return allDramas;

  return {
    trending: allDramas.trending.filter(d => d.language === languageFilter),
    new: allDramas.new.filter(d => d.language === languageFilter),
  };
};

export const getChannelData = (currency: Currency, date: string, month?: string): ChannelData[] => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  let m = 1;
  switch (date) {
    case 'today': m = 1; break;
    case 'yesterday': m = 1.15; break;
    case '7days': m = 7.5; break;
    case 'month': m = 25; break;
    case 'lastMonth': m = 30; break;
    default: m = 1;
  }
  
  // Adjust multiplier slightly based on month string to simulate data changes
  if (month) {
    const monthNum = parseInt(month.split('-')[1]);
    m = m * (1 + (monthNum % 5) * 0.05);
  }

  const departments = ['广州--市场部', '深圳--市场部', '分销--分销公司1', '分销--分销公司2'];
  const leads = {
    '广州--市场部': '李华',
    '深圳--市场部': '张强',
    '分销--分销公司1': '赵敏',
    '分销--分销公司2': '孙悦'
  };
  const optimizers = {
    '李华': ['王明', '刘芳', '金大卫', '李四'],
    '张强': ['陈伟', '李娜', '王五'],
    '赵敏': ['分销商Alpha', '分销投手', '短剧推广公司', '欧洲流媒体'],
    '孙悦': ['全球媒体网络', '亚洲触达']
  };

  const data: ChannelData[] = [];
  let idCounter = 1;

  departments.forEach(dept => {
    const lead = leads[dept as keyof typeof leads];
    const opts = optimizers[lead as keyof typeof optimizers];
    const isSelf = dept.includes('市场部');

    opts.forEach(opt => {
      // Generate 2-4 campaigns per optimizer
      const numCampaigns = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numCampaigns; i++) {
        const recharge = Math.round((Math.random() * 80000 + 20000) * rate * m);
        const d0Recharge = Math.round(recharge * (0.4 + Math.random() * 0.3));
        const roi = +(Math.random() * 0.8 + 1.1).toFixed(2);
        const spend = Math.round(recharge / roi);
        const expectedRevenue = isSelf ? Math.round(recharge * 0.85) : Math.round(recharge * 0.85 * 0.7);
        const rechargeUsers = Math.round(recharge / (50 * rate));
        const newRechargeUsers = Math.round(rechargeUsers * 0.3);
        const newRecharge = Math.round(recharge * 0.3);

        data.push({
          id: `CH${String(idCounter++).padStart(3, '0')}`,
          name: opt,
          type: isSelf ? 'self' : 'dist',
          platform: isSelf ? (Math.random() > 0.5 ? 'fb' : 'tk') : 'fb',
          recharge,
          d0Recharge,
          rechargeUsers,
          newRecharge,
          newRechargeUsers,
          spend,
          expectedRevenue,
          roi,
          dramaName: `Drama ${idCounter}`,
          dramaId: `ID: 100${idCounter}`,
          language: '英语',
          users: rechargeUsers * 10,
          department: dept,
          leadName: lead,
          optimizerName: opt,
          promoLinkCount: Math.floor(Math.random() * 20) + 5,
          optimizerCount: 1,
          netRevenue: expectedRevenue
        });
      }
    });
  });

  // Add organic traffic
  data.push({
    id: `CH${String(idCounter++).padStart(3, '0')}`,
    name: '自然流量',
    type: 'organic',
    platform: 'ios',
    recharge: 15000 * rate * m,
    d0Recharge: 15000 * rate * m * 0.5,
    rechargeUsers: 150,
    newRecharge: 3000 * rate * m,
    newRechargeUsers: 30,
    spend: undefined,
    expectedRevenue: 12750 * rate * m,
    roi: 0,
    dramaName: `Organic Drama 1`,
    dramaId: `ID: 9001`,
    language: '英语',
    users: 1500,
    department: '自然流量',
    leadName: '系统',
    optimizerName: '自然流量',
    promoLinkCount: 0,
    optimizerCount: 0,
    netRevenue: 12750 * rate * m
  });

  return data.sort((a, b) => b.recharge - a.recharge);
};

export const getDistributorData = (currency: Currency, month: string = '2024-03'): DistributorData[] => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  // Use month string as a seed for some variance
  const monthSeed = month.split('-').reduce((acc, part) => acc + parseInt(part), 0);
  const m = 0.8 + (monthSeed % 5) * 0.1; // Variance between 0.8 and 1.2
  
  return [
    { name: '分销商Alpha', recharge: 250000 * rate * m, netRevenue: 87500 * rate * m, newPromoLinks: Math.floor(125 * m) },
    { name: '全球媒体网络', recharge: 180000 * rate * m, netRevenue: 63000 * rate * m, newPromoLinks: Math.floor(98 * m) },
    { name: '短剧推广有限公司', recharge: 120000 * rate * m, netRevenue: 42000 * rate * m, newPromoLinks: Math.floor(75 * m) },
    { name: '亚洲触达', recharge: 90000 * rate * m, netRevenue: 31500 * rate * m, newPromoLinks: Math.floor(42 * m) },
    { name: '欧洲流媒体', recharge: 65000 * rate * m, netRevenue: 22750 * rate * m, newPromoLinks: Math.floor(31 * m) },
  ].sort((a, b) => b.recharge - a.recharge);
};

export const getLtvData = (currency: Currency, days: number = 7): LtvData[] => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  const data: LtvData[] = [];
  let currentAmount = 15.5;

  for (let i = 1; i <= days; i++) {
    data.push({ day: `Day ${i}`, amount: +(currentAmount * rate).toFixed(2) });
    
    let increment = 0;
    if (i === 1) increment = 6.8;
    else if (i === 2) increment = 4.5;
    else if (i === 3) increment = 2.7;
    else if (i === 4) increment = 1.7;
    else if (i === 5) increment = 1.3;
    else if (i === 6) increment = 1.3;
    else increment = 1.2 * Math.pow(0.92, i - 7);

    currentAmount += increment;
  }

  return data;
};

export const getHourlyRechargeData = (currency: Currency): HourlyData[] => {
  const rate = currency === 'CNY' ? 7.2 : 1;
  const data: HourlyData[] = [];
  
  // Simulate a typical 24-hour curve (peak around evening)
  for (let i = 0; i < 24; i++) {
    const hour = `${i.toString().padStart(2, '0')}:00`;
    let base = 1000;
    if (i >= 18 && i <= 22) base = 5000; // Evening peak
    else if (i >= 8 && i <= 17) base = 2500; // Daytime
    else base = 800; // Night
    
    // Today's data (might be incomplete if we simulate current time, but let's show full for comparison)
    // Add some random variance
    const todayVariance = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
    const yesterdayVariance = Math.random() * 0.3 + 0.85; // slightly different curve
    
    // Simulate today being generally 10% higher than yesterday
    const todayBase = base * 1.1;
    
    data.push({
      hour,
      today: Math.round(todayBase * todayVariance * rate),
      yesterday: Math.round(base * yesterdayVariance * rate)
    });
  }
  return data;
};

export const getHourlyActiveUserData = (): HourlyActiveUserData[] => {
  const data: HourlyActiveUserData[] = [];
  
  for (let i = 0; i < 24; i++) {
    const hour = `${i.toString().padStart(2, '0')}:00`;
    let base = 500;
    if (i >= 18 && i <= 22) base = 2500; // Evening peak
    else if (i >= 8 && i <= 17) base = 1200; // Daytime
    else base = 300; // Night
    
    const variance = Math.random() * 0.3 + 0.85;
    const prevVariance = Math.random() * 0.3 + 0.8;
    
    data.push({
      hour,
      activeUsers: Math.round(base * variance),
      previousActiveUsers: Math.round(base * 0.9 * prevVariance)
    });
  }
  return data;
};
