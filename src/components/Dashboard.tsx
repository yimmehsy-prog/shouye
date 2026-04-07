import React, { useState, useEffect, useMemo } from 'react';
import { Reorder, useDragControls, motion } from 'motion/react';
import { 
  getDramaRankings, 
  getDistributorData, getHourlyRechargeData, getHourlyActiveUserData, getChannelData, getRealtimeMetrics,
  getRegionData, getAppData,
  Timezone, Currency, RealtimeMetrics, HourlyActiveUserData 
} from '../utils/mockData';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Cell, AreaChart, Area, PieChart, Pie
} from 'recharts';
import { 
  Globe, Activity, DollarSign, Users, Smartphone, Film, TrendingUp, TrendingDown, Award, Clock, Filter, Info, CreditCard, Map, HelpCircle, X, BookOpen, Link, GripVertical, ListOrdered, LayoutGrid
} from 'lucide-react';

const formatCurrency = (value: number, currency: Currency) => {
  return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'zh-CN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6', '#84cc16', '#eab308', '#6366f1', '#d946ef'];

type Role = 'admin' | 'team_leader' | 'media_buyer';

interface CurrentUser {
  role: Role;
  name: string;
  actualName?: string;
  department?: string;
  level2?: string;
  level3?: string;
}

const USERS: CurrentUser[] = [
  { role: 'admin', name: '超级管理员 (Admin)', actualName: 'Admin' },
  { role: 'team_leader', name: '张强 (组长)', actualName: '张强', level2: '深圳', level3: '市场部', department: '深圳--市场部' },
  { role: 'media_buyer', name: '陈伟 (投手)', actualName: '陈伟', level2: '深圳', level3: '市场部', department: '深圳--市场部' },
  { role: 'media_buyer', name: '分销商 Alpha', actualName: '分销商Alpha', level2: '分销', level3: '分销公司1', department: '分销--分销公司1' },
  { role: 'media_buyer', name: '分销投手', actualName: '分销投手', level2: '分销', level3: '分销公司1', department: '分销--分销公司1' },
];

const DEPARTMENTS_HIERARCHY: Record<string, Record<string, Record<string, string[]>>> = {
  '总公司': {
    '广州': {
      '市场部': ['王明', '刘芳', '金大卫']
    },
    '深圳': {
      '市场部': ['陈伟', '李娜']
    },
    '分销': {
      '分销公司1': ['分销商Alpha', '分销投手', '短剧推广公司', '欧洲流媒体'],
      '分销公司2': ['全球媒体网络', '亚洲触达']
    },
    '自然流量': {
      '自然流量': ['自然流量-App Store', '自然流量-Google Play']
    }
  }
};

const DashboardSection: React.FC<{ id: string, children: React.ReactNode, className?: string }> = ({ id, children, className }) => {
  return (
    <motion.div layout className={className}>
      {children}
    </motion.div>
  );
};

export default function Dashboard() {
  const sectionNames: Record<string, string> = {
    'realtime-metrics': '实时大盘数据',
    'ad-metrics': '投放指标',
    'charts-row': '充值趋势与分布',
    'drama-rankings': '短剧排行 (起量/新剧)'
  };

  const [timezone, setTimezone] = useState<Timezone>('UTC');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');
  
  const [currentUser, setCurrentUser] = useState<CurrentUser>(USERS[0]);
  const [filterLevel1, setFilterLevel1] = useState<string>('all');
  const [filterLevel2, setFilterLevel2] = useState<string>('all');
  const [filterLevel3, setFilterLevel3] = useState<string>('all');
  const [filterLevel4, setFilterLevel4] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const handleDepartmentChange = (val: string) => {
    setDepartmentFilter(val);
    if (val === 'all') {
      setFilterLevel1('all');
      setFilterLevel2('all');
      setFilterLevel3('all');
      setFilterLevel4('all');
    } else {
      const parts = val.split(':');
      setFilterLevel1(parts[1] || 'all');
      setFilterLevel2(parts[2] || 'all');
      setFilterLevel3(parts[3] || 'all');
      setFilterLevel4(parts[4] || 'all');
    }
  };

  const departmentOptions = React.useMemo(() => {
    const options = [{ label: '全部', value: 'all' }];
    Object.entries(DEPARTMENTS_HIERARCHY).forEach(([l1, l2Obj]) => {
      options.push({ label: l1, value: `l1:${l1}` });
      Object.entries(l2Obj).forEach(([l2, l3Obj]) => {
        options.push({ label: `\u00A0\u00A0${l2}`, value: `l2:${l1}:${l2}` });
        Object.entries(l3Obj).forEach(([l3, l4Arr]) => {
          options.push({ label: `\u00A0\u00A0\u00A0\u00A0${l3}`, value: `l3:${l1}:${l2}:${l3}` });
          l4Arr.forEach(l4 => {
            options.push({ label: `\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0${l4}`, value: `l4:${l1}:${l2}:${l3}:${l4}` });
          });
        });
      });
    });

    if (currentUser.role === 'admin') {
      return options;
    } else if (currentUser.role === 'team_leader') {
      const prefix = `l3:总公司:${currentUser.level2}:${currentUser.level3}`;
      const l4Prefix = `l4:总公司:${currentUser.level2}:${currentUser.level3}`;
      return options.filter(opt => opt.value === 'all' || opt.value === prefix || opt.value.startsWith(l4Prefix));
    } else {
      const myValue = `l4:总公司:${currentUser.level2}:${currentUser.level3}:${currentUser.actualName}`;
      return options.filter(opt => opt.value === 'all' || opt.value === myValue);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser.role === 'admin') {
      setFilterLevel1('all');
      setFilterLevel2('all');
      setFilterLevel3('all');
      setFilterLevel4('all');
      setDepartmentFilter('all');
    } else if (currentUser.role === 'team_leader') {
      setFilterLevel1('总公司');
      setFilterLevel2(currentUser.level2 || 'all');
      setFilterLevel3(currentUser.level3 || 'all');
      setFilterLevel4('all');
      setDepartmentFilter(`l3:总公司:${currentUser.level2}:${currentUser.level3}`);
    } else if (currentUser.role === 'media_buyer') {
      setFilterLevel1('总公司');
      setFilterLevel2(currentUser.level2 || 'all');
      setFilterLevel3(currentUser.level3 || 'all');
      setFilterLevel4(currentUser.actualName || 'all');
      setDepartmentFilter(`l4:总公司:${currentUser.level2}:${currentUser.level3}:${currentUser.actualName}`);
    }
  }, [currentUser]);

  const [realtimePeriod, setRealtimePeriod] = useState<string>('today');
  const [adPeriod, setAdPeriod] = useState<string>('today');
  const [dramaTab, setDramaTab] = useState<'trending' | 'new'>('trending');
  const [dramaLanguage, setDramaLanguage] = useState<string>('ALL');
  const [channelDate, setChannelDate] = useState<'today' | 'yesterday'>('today');
  const [distributionDate, setDistributionDate] = useState<'today' | 'yesterday'>('today');
  const [rechargeChartType, setRechargeChartType] = useState<'cumulative' | 'hourly'>('cumulative');
  const [isPrdOpen, setIsPrdOpen] = useState(false);
  const [isVisibilityMenuOpen, setIsVisibilityMenuOpen] = useState(false);

  // Section order state for drag and drop
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => {
    const defaultOrder = Object.keys(sectionNames);
    const saved = localStorage.getItem('dashboard_section_order_v10');
    if (!saved) return defaultOrder;
    try {
      const parsed = JSON.parse(saved) as string[];
      // Filter out IDs that are no longer in sectionNames
      const filtered = parsed.filter(id => sectionNames[id]);
      // Add any missing valid IDs (new sections)
      const missing = defaultOrder.filter(id => !filtered.includes(id));
      return [...filtered, ...missing];
    } catch (e) {
      return defaultOrder;
    }
  });

  const [hiddenSections, setHiddenSections] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard_hidden_sections_v10');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved) as string[];
      // Filter out IDs that are no longer in sectionNames
      return parsed.filter(id => sectionNames[id]);
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('dashboard_section_order_v10', JSON.stringify(sectionOrder));
  }, [sectionOrder]);

  useEffect(() => {
    localStorage.setItem('dashboard_hidden_sections_v10', JSON.stringify(hiddenSections));
  }, [hiddenSections]);

  const toggleSectionVisibility = (sectionId: string) => {
    if (hiddenSections.includes(sectionId)) {
      // Show section: remove from hidden, add to order
      setHiddenSections(prev => prev.filter(id => id !== sectionId));
      setSectionOrder(prev => {
        if (!prev.includes(sectionId)) {
          // Find original index based on default order to insert it in a reasonable place
          const defaultOrder = Object.keys(sectionNames);
          const newOrder = [...prev];
          const defaultIndex = defaultOrder.indexOf(sectionId);
          
          // Simple insertion: just push to end for now, or you could try to insert at original index
          // For simplicity and reliability, appending to the end is safest
          newOrder.push(sectionId);
          
          // Sort based on default order to maintain logical flow
          return newOrder.sort((a, b) => defaultOrder.indexOf(a) - defaultOrder.indexOf(b));
        }
        return prev;
      });
    } else {
      // Hide section: add to hidden, remove from order
      setHiddenSections(prev => [...prev, sectionId]);
      setSectionOrder(prev => prev.filter(id => id !== sectionId));
    }
  };

  const dramaData = React.useMemo(() => getDramaRankings(currency, dramaLanguage), [currency, dramaLanguage]);
  const rawChannelData = React.useMemo(() => getChannelData(currency, channelDate), [currency, channelDate]);
  
  const channelData = React.useMemo(() => {
    let filtered = rawChannelData;
    
    if (filterLevel2 !== 'all') {
      filtered = filtered.filter(item => item.department.startsWith(filterLevel2));
    }
    if (filterLevel3 !== 'all') {
      filtered = filtered.filter(item => item.department.includes(filterLevel3));
    }
    if (filterLevel4 !== 'all') {
      filtered = filtered.filter(item => item.name === filterLevel4);
    }
    
    if (currentUser.role !== 'admin') {
      if (currentUser.level2 === '分销') {
        filtered = filtered.filter(item => item.type === 'dist');
      } else {
        filtered = filtered.filter(item => item.type !== 'dist');
      }
    }
    
    return filtered;
  }, [rawChannelData, filterLevel2, filterLevel3, filterLevel4, currentUser.role]);

  const hourlyData = React.useMemo(() => getHourlyRechargeData(currency), [currency]);
  const regionData = React.useMemo(() => getRegionData(currency, distributionDate), [currency, distributionDate]);
  const appData = React.useMemo(() => getAppData(distributionDate), [distributionDate]);
  const hourlyActiveUserData = React.useMemo(() => getHourlyActiveUserData(), []);

  const scaleFactor = React.useMemo(() => {
    if (filterLevel1 === 'all' && filterLevel2 === 'all' && filterLevel3 === 'all' && filterLevel4 === 'all') return 1;
    const totalRechargeRaw = rawChannelData.reduce((sum, item) => sum + item.recharge, 0) || 1;
    const totalRechargeFiltered = channelData.reduce((sum, item) => sum + item.recharge, 0);
    return totalRechargeFiltered / totalRechargeRaw;
  }, [rawChannelData, channelData, filterLevel1, filterLevel2, filterLevel3, filterLevel4]);

  const scaledHourlyData = useMemo(() => hourlyData.map(d => ({...d, today: d.today * scaleFactor, yesterday: d.yesterday * scaleFactor})), [hourlyData, scaleFactor]);
  const scaledRegionData = useMemo(() => regionData.map(d => ({...d, value: d.value * scaleFactor})), [regionData, scaleFactor]);
  const scaledAppData = useMemo(() => ({
    ...appData,
    payments: appData.payments.map(d => ({...d, value: d.value * scaleFactor}))
  }), [appData, scaleFactor]);
  
  const scaledDramaData = useMemo(() => {
    const scaleDramas = (dramas: any[]) => dramas.map(d => ({
      ...d,
      revenue: d.revenue * scaleFactor,
      viewingUsers: Math.round(d.viewingUsers * scaleFactor),
      intentionCount: Math.round(d.intentionCount * scaleFactor),
      payingUsers: Math.round(d.payingUsers * scaleFactor),
      selfSpend: d.selfSpend * scaleFactor,
      selfRecharge: d.selfRecharge * scaleFactor,
      distRecharge: d.distRecharge * scaleFactor,
      netRevenue: d.netRevenue * scaleFactor,
    }));
    return {
      trending: scaleDramas(dramaData.trending),
      new: scaleDramas(dramaData.new)
    };
  }, [dramaData, scaleFactor]);

  const totalDistributionAmount = useMemo(() => scaledRegionData.reduce((sum, item) => sum + item.value, 0), [scaledRegionData]);

  const getComparisonLabel = (period: string) => {
    switch (period) {
      case 'today':
      case 'yesterday':
        return '较前一日';
      case '7days':
        return '较前7日';
      case 'month':
        return '较上月';
      case 'lastMonth':
        return null;
      default:
        return '较前一日';
    }
  };

  const getPeriodPrefix = (period: string) => {
    switch (period) {
      case 'today': return '当日';
      case 'yesterday': return '昨日';
      case '7days': return '7日';
      case 'month': return '本月';
      case 'lastMonth': return '上月';
      default: return '当日';
    }
  };

  const renderTrend = (trend: number, period: string) => {
    const label = getComparisonLabel(period);
    if (!label) return null;
    const isPositive = trend >= 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50';
    
    return (
      <div className="flex flex-col">
        <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center w-fit ${colorClass}`}>
          <Icon className="w-3 h-3 mr-0.5" />
          {Math.abs(trend)}%
        </div>
        <div className="text-[10px] text-slate-400 mt-0.5 whitespace-nowrap transform scale-90 origin-left">
          {label}
        </div>
      </div>
    );
  };

  const cumulativeHourlyData = React.useMemo(() => {
    let todaySum = 0;
    let yesterdaySum = 0;
    return scaledHourlyData.map(d => {
      todaySum += d.today;
      yesterdaySum += d.yesterday;
      return {
        ...d,
        today: todaySum,
        yesterday: yesterdaySum
      };
    });
  }, [scaledHourlyData]);

  const realtimeData = React.useMemo(() => {
    return getRealtimeMetrics(timezone, currency, realtimePeriod, channelData);
  }, [timezone, currency, clientFilter, packageFilter, realtimePeriod, channelData]);

  const adData = React.useMemo(() => {
    return getRealtimeMetrics(timezone, currency, adPeriod, channelData);
  }, [timezone, currency, adPeriod, channelData]);

  const realtimeDataScaled = React.useMemo(() => {
    if (!realtimeData) return null;
    if (scaleFactor === 1) return realtimeData;
    
    if (scaleFactor === 0) {
      const zeroed = { ...realtimeData };
      for (const key in zeroed) {
        if (typeof zeroed[key as keyof RealtimeMetrics] === 'number') {
          (zeroed as any)[key] = 0;
        }
      }
      return zeroed;
    }

    const scaled = { ...realtimeData };
    for (const key in scaled) {
      if (typeof scaled[key as keyof RealtimeMetrics] === 'number') {
        if (key.includes('Trend') || key === 'selfRoi' || key === 'conversionRate' || key === 'arpu') {
          continue;
        }
        (scaled as any)[key] = Math.round((scaled as any)[key] * scaleFactor);
      }
    }
    return scaled;
  }, [realtimeData, scaleFactor]);

  const adDataScaled = React.useMemo(() => {
    if (!adData) return null;
    if (scaleFactor === 1) return adData;
    const scaled = { ...adData };
    for (const key in scaled) {
      if (typeof scaled[key as keyof RealtimeMetrics] === 'number') {
        if (key.includes('Trend') || key === 'selfRoi' || key === 'distRoi' || key === 'selfD0Roi' || key === 'distD0Roi' || key === 'conversionRate' || key === 'arpu') {
          continue;
        }
        (scaled as any)[key] = Math.round((scaled as any)[key] * scaleFactor);
      }
    }
    return scaled;
  }, [adData, scaleFactor]);

  const getScaledDeptMetrics = (period: string) => {
    const metrics: Record<string, {
      department: string;
      type: 'self' | 'dist';
      recharge: number;
      d0Recharge: number;
      d0NetRevenue: number;
      spend: number;
      netRevenue: number;
      roi: number;
      d0Roi: number;
    }> = {};

    const multiplier = period === 'today' ? 1 : period === 'yesterday' ? 1.2 : period === '7days' ? 7.5 : period === 'month' ? 15 : 30;

    channelData.forEach(ch => {
      if (ch.type === 'self' || ch.type === 'dist') {
        const key = `${ch.department}-${ch.type}`;
        if (!metrics[key]) {
          metrics[key] = {
            department: ch.department,
            type: ch.type,
            recharge: 0,
            d0Recharge: 0,
            d0NetRevenue: 0,
            spend: 0,
            netRevenue: 0,
            roi: 0,
            d0Roi: 0
          };
        }
        metrics[key].recharge += ch.recharge * multiplier;
        metrics[key].d0Recharge += (ch.d0Recharge || 0) * multiplier;
        metrics[key].d0NetRevenue += (ch.d0Recharge || 0) * multiplier * 0.85 * (ch.type === 'dist' ? 0.7 : 1);
        metrics[key].spend += (ch.spend || 0) * multiplier;
        metrics[key].netRevenue += ch.netRevenue * multiplier;
      }
    });

    return Object.values(metrics).map(m => {
      const scaledRecharge = Math.round(m.recharge * scaleFactor);
      const scaledD0Recharge = Math.round(m.d0Recharge * scaleFactor);
      const scaledD0NetRevenue = Math.round(m.d0NetRevenue * scaleFactor);
      const scaledSpend = Math.round(m.spend * scaleFactor);
      const scaledNetRevenue = Math.round(m.netRevenue * scaleFactor);
      return {
        ...m,
        recharge: scaledRecharge,
        d0Recharge: scaledD0Recharge,
        d0NetRevenue: scaledD0NetRevenue,
        spend: scaledSpend,
        netRevenue: scaledNetRevenue,
        roi: scaledSpend > 0 ? +(scaledRecharge / scaledSpend).toFixed(2) : 0,
        d0Roi: scaledSpend > 0 ? +(scaledD0Recharge / scaledSpend).toFixed(2) : (m.type === 'dist' ? +(Math.random() * 0.5 + 0.5).toFixed(2) : 0)
      };
    }).sort((a, b) => b.recharge - a.recharge);
  };

  const adDepartmentMetrics = React.useMemo(() => getScaledDeptMetrics(adPeriod), [channelData, scaleFactor, adPeriod]);

  const adMetricsByType = React.useMemo(() => {
    const types: Record<string, any> = {
      'self': { type: '自投', spend: 0, d0Recharge: 0, d0NetRevenue: 0, recharge: 0, netRevenue: 0 },
      'dist': { type: '分销', spend: 0, d0Recharge: 0, d0NetRevenue: 0, recharge: 0, netRevenue: 0 }
    };

    adDepartmentMetrics.forEach(m => {
      if (types[m.type]) {
        types[m.type].spend += m.spend;
        types[m.type].d0Recharge += m.d0Recharge;
        types[m.type].d0NetRevenue += m.d0NetRevenue;
        types[m.type].recharge += m.recharge;
        types[m.type].netRevenue += m.netRevenue;
      }
    });

    return Object.values(types).map(t => ({
      ...t,
      d0Roi: t.spend > 0 ? +(t.d0Recharge / t.spend).toFixed(2) : 0,
      roi: t.spend > 0 ? +(t.recharge / t.spend).toFixed(2) : 0
    }));
  }, [adDepartmentMetrics]);



  const renderDramaRankings = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-slate-800">短剧排行</h3>
        </div>
        <div className="flex bg-slate-200/70 p-1 rounded-lg">
          <button 
            onClick={() => setDramaTab('trending')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${dramaTab === 'trending' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            起量剧
          </button>
          <button 
            onClick={() => setDramaTab('new')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${dramaTab === 'new' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            新上架
          </button>
        </div>
      </div>
      {/* Language Filter */}
      <div className="px-5 py-2 border-b border-slate-100 bg-white flex items-center gap-2">
        <span className="text-xs text-slate-500">对应语言:</span>
        <div className="flex gap-1">
          {[
            { code: 'ALL', label: '全部' },
            { code: 'EN', label: '英语' },
            { code: 'ES', label: '西班牙语' },
            { code: 'ID', label: '印尼语' }
          ].map(lang => (
            <button 
              key={lang.code}
              onClick={() => setDramaLanguage(lang.code)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded border ${dramaLanguage === lang.code ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-0 flex-1 overflow-auto max-h-[770px] lg:max-h-none">
        <ul className="divide-y divide-slate-100">
          {scaledDramaData[dramaTab].length > 0 ? scaledDramaData[dramaTab].slice(0, 5).map((drama, idx) => (
            <li 
              key={drama.id} 
              className="p-4 hover:bg-slate-50 transition-colors flex items-start gap-3 cursor-pointer group"
              onClick={() => console.log(`Entering drama list for: ${drama.name}`)}
            >
              <div className="relative shrink-0">
                <img 
                  src={drama.cover} 
                  alt={drama.name} 
                  className="w-16 h-20 object-cover rounded shadow-sm border border-slate-100"
                  referrerPolicy="no-referrer"
                />
                <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${idx < 3 ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white'}`}>
                  {idx + 1}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="truncate">
                    <div className="font-bold text-slate-900 truncate text-sm group-hover:text-indigo-600 transition-colors">{drama.name}</div>
                    <div className="text-xs text-slate-500 truncate mt-0.5">{drama.chineseName}</div>
                  </div>
                </div>
                
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>ID: <span className="text-slate-600 font-mono">{drama.id}</span></span>
                    <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-500 font-medium">
                      {drama.language === 'EN' ? '英语' : drama.language === 'ES' ? '西班牙语' : drama.language === 'ID' ? '印尼语' : drama.language}
                    </span>
                  </div>
                  {currentUser.role === 'admin' && (
                    <div className="flex flex-col gap-0.5 items-start shrink-0">
                      <span className="text-slate-600 font-medium">观看: {drama.viewingUsers.toLocaleString()}人</span>
                      <span className="text-slate-600 font-medium">意向: {drama.intentionCount.toLocaleString()}人</span>
                      <span className="text-slate-600 font-medium">支付: {drama.payingUsers.toLocaleString()}人</span>
                    </div>
                  )}
                </div>

                {/* Recovery Metrics */}
                {currentUser.role === 'admin' && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[10px]">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">自投(消耗/ROI):</span>
                      <span className="font-mono font-bold text-amber-600">{formatCurrency(drama.selfSpend, currency)}</span>
                      <span className="text-slate-300">/</span>
                      <span className={`font-mono font-bold ${drama.selfRoi >= 1.2 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {drama.selfRoi.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500 font-medium">充值(自投/分销):</span>
                      <span className="font-mono font-bold text-indigo-600">{formatCurrency(drama.selfRecharge, currency)}</span>
                      <span className="text-slate-300">/</span>
                      <span className="font-mono font-bold text-emerald-600">{formatCurrency(drama.distRecharge, currency)}</span>
                    </div>
                  </div>
                )}
              </div>
            </li>
          )) : (
            <li className="p-8 text-center text-sm text-slate-500">暂无该语言数据</li>
          )}
        </ul>
      </div>
    </div>
  );

  const renderHourlyTrend = () => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-500" />
          <h3 className="font-semibold text-slate-800">充值分布图</h3>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
          <button 
            onClick={() => setRechargeChartType('cumulative')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rechargeChartType === 'cumulative' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            累计趋势
          </button>
          <button 
            onClick={() => setRechargeChartType('hourly')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rechargeChartType === 'hourly' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
          >
            时段趋势
          </button>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rechargeChartType === 'cumulative' ? cumulativeHourlyData : scaledHourlyData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="colorToday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorYesterday" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} interval={2} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => currency === 'USD' ? `${val/1000}k` : `¥${val/1000}k`}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              formatter={(value: number, name: string) => [
                formatCurrency(value, currency), 
                name === 'today' ? '今日' : '昨日'
              ]}
            />
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="plainline"
              formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value === 'today' ? '今日' : '昨日'}</span>}
            />
            <Area type="monotone" dataKey="yesterday" name="yesterday" stroke="#eab308" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorYesterday)" />
            <Area type="monotone" dataKey="today" name="today" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorToday)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const renderDistributionAnalysis = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-slate-800">分布分析</h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setDistributionDate('today')}
            className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${distributionDate === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            今日
          </button>
          <button
            onClick={() => setDistributionDate('yesterday')}
            className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${distributionDate === 'yesterday' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            昨日
          </button>
        </div>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Registration Country Distribution */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Map className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-700">注册国家充值分布</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={scaledRegionData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  width={80}
                  tickFormatter={(value) => {
                    const item = scaledRegionData.find(d => d.name === value);
                    return item ? `${item.name} ${item.label}` : value;
                  }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelFormatter={(value) => {
                    const item = scaledRegionData.find(d => d.name === value);
                    return item ? `${item.name} - ${item.label}` : value;
                  }}
                  formatter={(value: number) => [formatCurrency(value, currency), '充值金额']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {scaledRegionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recharge Details */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-4 h-4 text-slate-500" />
            <h4 className="text-sm font-semibold text-slate-700">充值明细</h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scaledAppData.payments}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {scaledAppData.payments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const percent = data.value;
                      const amount = (percent / 100) * totalDistributionAmount;
                      return (
                        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
                          <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></span>
                            {data.name}
                          </p>
                          <div className="flex justify-between gap-4 text-xs text-slate-500 mb-1">
                            <span>占比:</span>
                            <span className="font-medium text-slate-700">{percent}%</span>
                          </div>
                          <div className="flex justify-between gap-4 text-xs text-slate-500">
                            <span>金额:</span>
                            <span className="font-medium text-slate-700">{formatCurrency(amount, currency)}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  formatter={(value) => <span className="text-[10px] text-slate-600 font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  
  const renderSection = (id: string) => {
    const isSelfAdMode = filterLevel2 === '广州' || filterLevel2 === '深圳';
    const isDistAdMode = filterLevel2 === '分销';

    switch (id) {
      case 'realtime-metrics':
        if (isSelfAdMode || isDistAdMode) return null;
        return (
          <>
            {/* Section 1: Realtime Data (实时数据) */}
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-slate-800">实时大盘数据</h2>
              </div>
            </div>
            <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
              {[
                { value: 'today', label: '实时' },
                { value: 'yesterday', label: '昨日' },
                { value: '7days', label: '7日' },
                { value: 'month', label: '本月' },
                { value: 'lastMonth', label: '上月' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRealtimePeriod(option.value)}
                  className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                    realtimePeriod === option.value
                      ? 'bg-white shadow-sm text-indigo-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-6 space-y-6">
            {/* 一级指标 (Primary Metrics) */}
            {currentUser.role === 'admin' && (
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <div className="w-1 h-3 bg-indigo-600 rounded-full"></div>
                  核心指标
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                  {/* 1. 总充值 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">总充值</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{formatCurrency(realtimeDataScaled.totalRecharge, currency)}</div>
                    {renderTrend(realtimeDataScaled.totalRechargeTrend, realtimePeriod)}
                  </div>
                  {/* 2. 预计实收 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">预计实收</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{formatCurrency(realtimeDataScaled.netRevenue, currency)}</div>
                    {renderTrend(realtimeDataScaled.netRevenueTrend, realtimePeriod)}
                  </div>
                  {/* 3. 活跃人数 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">活跃人数</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{realtimeDataScaled.activeUsers.toLocaleString()}</div>
                    {renderTrend(realtimeDataScaled.activeUsersTrend, realtimePeriod)}
                  </div>
                  {/* 4. 观看人数 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">观看人数</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{realtimeDataScaled.viewingUsers.toLocaleString()}</div>
                  </div>
                  {/* 5. 意向人数 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">意向人数</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{realtimeDataScaled.intentUsers.toLocaleString()}</div>
                  </div>
                  {/* 6. 充值人数 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">充值人数</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{realtimeDataScaled.rechargeUsers.toLocaleString()}</div>
                    {renderTrend(realtimeDataScaled.rechargeUsersTrend, realtimePeriod)}
                  </div>
                  {/* 7. 客单价 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">客单价</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{formatCurrency(realtimeDataScaled.arpu, currency)}</div>
                  </div>
                  {/* 8. 首充人数 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">{getPeriodPrefix(realtimePeriod)}首充人数</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{realtimeDataScaled.newPayingUsers.toLocaleString()}</div>
                  </div>
                  {/* 9. 首充金额 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">{getPeriodPrefix(realtimePeriod)}首充金额</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{formatCurrency(realtimeDataScaled.newPayingAmount, currency)}</div>
                    {renderTrend(realtimeDataScaled.newPayingAmountTrend, realtimePeriod)}
                  </div>
                  {/* 10. 支付成功率 */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex flex-col justify-start min-h-[100px]">
                    <div className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">支付成功率</div>
                    <div className="text-lg font-bold font-mono text-slate-800 mb-1 tabular-nums">{realtimeDataScaled.conversionRate.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            )}


          </div>
        </section>
          </>
        );
      case 'ad-metrics':
        if (!adDataScaled) return null;
        
        if (currentUser.role !== 'admin' && !isDistAdMode && !isSelfAdMode) return null;

        const totalSpend = adDataScaled.selfSpend; // Distribution spend is unavailable
        const totalD0Recharge = adDataScaled.selfD0Recharge + adDataScaled.distD0Recharge;
        const totalD0NetRevenue = adDataScaled.selfD0NetRevenue + adDataScaled.distD0NetRevenue;
        const totalRecharge = adDataScaled.distRecharge + adDataScaled.selfRecharge;
        const totalNetRevenue = adDataScaled.distNetRevenue + adDataScaled.selfNetRevenue;
        const totalD0Roi = totalSpend > 0 ? +(adDataScaled.selfD0Recharge / totalSpend).toFixed(2) : 0;
        const totalRoi = totalSpend > 0 ? +(adDataScaled.selfRecharge / totalSpend).toFixed(2) : 0;
        const isMediaBuyer = currentUser.role === 'media_buyer';
        const gridColsClass = isMediaBuyer 
          ? 'xl:grid-cols-4' 
          : (currentUser.role === 'admin' || isSelfAdMode ? 'xl:grid-cols-7' : 'xl:grid-cols-5');

        return (
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-bold text-slate-800">投放指标</h2>
                </div>
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200">
                {[
                  { value: 'today', label: '实时' },
                  { value: 'yesterday', label: '昨日' },
                  { value: '7days', label: '7日' },
                  { value: 'month', label: '本月' },
                  { value: 'lastMonth', label: '上月' }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setAdPeriod(option.value)}
                    className={`px-4 py-1.5 text-sm font-medium rounded transition-colors ${
                      adPeriod === option.value
                        ? 'bg-white shadow-sm text-indigo-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div className={`grid grid-cols-2 md:grid-cols-3 ${gridColsClass} gap-4`}>
                  {/* 1. 消耗 */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-start min-h-[80px]">
                    <div className="text-sm text-slate-500 mb-1 font-medium whitespace-nowrap">消耗</div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 mb-1 tabular-nums tracking-tight">{formatCurrency(totalSpend, currency)}</div>
                  </div>
                  {/* 2. D0充值 */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-start min-h-[80px]">
                    <div className="text-sm text-slate-500 mb-1 font-medium whitespace-nowrap">D0充值</div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 mb-1 tabular-nums tracking-tight">{formatCurrency(totalD0Recharge, currency)}</div>
                  </div>
                  {/* NEW: D0 ROI */}
                  {(isMediaBuyer || currentUser.role === 'admin' || isSelfAdMode) && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-start min-h-[80px]">
                      <div className="text-sm text-slate-500 mb-1 font-medium whitespace-nowrap">D0 ROI</div>
                      <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 mb-1 tabular-nums tracking-tight">
                        {(!isSelfAdMode && currentUser.level2 === '分销') ? '-' : totalD0Roi.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {/* 3. D0预计实收 */}
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-start min-h-[80px]">
                    <div className="text-sm text-slate-500 mb-1 font-medium whitespace-nowrap">D0预计实收</div>
                    <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 mb-1 tabular-nums tracking-tight">{formatCurrency(totalD0NetRevenue, currency)}</div>
                  </div>
                  {/* 4. 充值金额 */}
                  {!isMediaBuyer && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-start min-h-[80px]">
                      <div className="text-sm text-slate-500 mb-1 font-medium whitespace-nowrap">充值金额</div>
                      <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 mb-1 tabular-nums tracking-tight">{formatCurrency(totalRecharge, currency)}</div>
                    </div>
                  )}
                  {/* NEW: ROI */}
                  {!isMediaBuyer && (currentUser.role === 'admin' || isSelfAdMode) && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-start min-h-[80px]">
                      <div className="text-sm text-slate-500 mb-1 font-medium whitespace-nowrap">ROI</div>
                      <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 mb-1 tabular-nums tracking-tight">{totalRoi.toFixed(2)}</div>
                    </div>
                  )}
                  {/* 5. 预计实收 */}
                  {!isMediaBuyer && (
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 flex flex-col justify-start min-h-[80px]">
                      <div className="text-sm text-slate-500 mb-1 font-medium whitespace-nowrap">预计实收</div>
                      <div className="text-lg sm:text-xl font-bold font-mono text-slate-800 mb-1 tabular-nums tracking-tight">{formatCurrency(totalNetRevenue, currency)}</div>
                    </div>
                  )}
                </div>
                
                {/* Type breakdown - Only visible to Admin */}
                {currentUser.role === 'admin' && (
                  <div className="overflow-x-auto border border-slate-100 rounded-lg mt-6">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">类型</th>
                          <th className="px-4 py-3 text-right">消耗</th>
                          <th className="px-4 py-3 text-right">D0充值</th>
                          <th className="px-4 py-3 text-right">D0 ROI</th>
                          <th className="px-4 py-3 text-right">D0预计实收</th>
                          <th className="px-4 py-3 text-right">充值金额</th>
                          <th className="px-4 py-3 text-right">ROI</th>
                          <th className="px-4 py-3 text-right">预计实收</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {adMetricsByType.map(item => (
                          <tr key={item.type} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-700">{item.type}</td>
                            <td className="px-4 py-3 text-right font-mono text-amber-600 tabular-nums">
                              {item.type === '分销' ? <span className="text-slate-400">-</span> : formatCurrency(item.spend, currency)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-indigo-600 tabular-nums">{formatCurrency(item.d0Recharge, currency)}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              {item.type === '分销' ? (
                                <span className="text-slate-400">-</span>
                              ) : (
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.d0Roi >= 1.0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {item.d0Roi.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-teal-600 tabular-nums">{formatCurrency(item.d0NetRevenue, currency)}</td>
                            <td className="px-4 py-3 text-right font-mono text-blue-600 tabular-nums">{formatCurrency(item.recharge, currency)}</td>
                            <td className="px-4 py-3 text-right font-mono tabular-nums">
                              {item.type === '分销' ? (
                                <span className="text-slate-400">-</span>
                              ) : (
                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.roi >= 1.2 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                                  {item.roi.toFixed(2)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-teal-600 tabular-nums">{formatCurrency(item.netRevenue, currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      case 'charts-row':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hourly Recharge Trend (充值分布图) */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h3 className="font-semibold text-slate-800">充值分布图</h3>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-md border border-slate-200">
                  <button 
                    onClick={() => setRechargeChartType('cumulative')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rechargeChartType === 'cumulative' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    累计趋势
                  </button>
                  <button 
                    onClick={() => setRechargeChartType('hourly')}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${rechargeChartType === 'hourly' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    时段趋势
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={rechargeChartType === 'cumulative' ? cumulativeHourlyData : scaledHourlyData} margin={{ top: 10, right: 20, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="colorToday" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorYesterday" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#eab308" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} interval={2} />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(val) => currency === 'USD' ? `$${val/1000}k` : `¥${val/1000}k`}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value, currency), 
                        name === 'today' ? '今日' : '昨日'
                      ]}
                    />
                    <Legend 
                      verticalAlign="top" 
                      height={36} 
                      iconType="plainline"
                      formatter={(value) => <span className="text-xs text-slate-600 font-medium">{value === 'today' ? '今日' : '昨日'}</span>}
                    />
                    <Area type="monotone" dataKey="yesterday" name="yesterday" stroke="#eab308" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorYesterday)" />
                    <Area type="monotone" dataKey="today" name="today" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorToday)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            {/* Distribution Analysis (分布分析) */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-bold text-slate-800">分布分析</h3>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setDistributionDate('today')}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${distributionDate === 'today' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    今日
                  </button>
                  <button
                    onClick={() => setDistributionDate('yesterday')}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${distributionDate === 'yesterday' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    昨日
                  </button>
                </div>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Registration Country Distribution */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Map className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-700">注册国家充值分布</h4>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={scaledRegionData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                        <XAxis type="number" hide />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fill: '#64748b' }}
                          width={80}
                          tickFormatter={(value) => {
                            const item = scaledRegionData.find(d => d.name === value);
                            return item ? `${item.name} ${item.label}` : value;
                          }}
                        />
                        <Tooltip 
                          cursor={{ fill: '#f8fafc' }}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelFormatter={(value) => {
                            const item = scaledRegionData.find(d => d.name === value);
                            return item ? `${item.name} - ${item.label}` : value;
                          }}
                          formatter={(value: number) => [formatCurrency(value, currency), '充值金额']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                          {scaledRegionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Recharge Details */}
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-semibold text-slate-700">充值明细</h4>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={scaledAppData.payments}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          nameKey="name"
                        >
                          {scaledAppData.payments.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const data = payload[0].payload;
                              const percent = data.value;
                              const amount = (percent / 100) * totalDistributionAmount;
                              return (
                                <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100">
                                  <p className="text-sm font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].payload.fill }}></span>
                                    {data.name}
                                  </p>
                                  <div className="flex justify-between gap-4 text-xs text-slate-500 mb-1">
                                    <span>占比:</span>
                                    <span className="font-medium text-slate-700">{percent}%</span>
                                  </div>
                                  <div className="flex justify-between gap-4 text-xs text-slate-500">
                                    <span>金额:</span>
                                    <span className="font-medium text-slate-700">{formatCurrency(amount, currency)}</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          verticalAlign="bottom" 
                          height={36}
                          iconType="circle"
                          formatter={(value) => <span className="text-[10px] text-slate-600 font-medium">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'drama-rankings':
        return (
          <div className="flex flex-col h-full">
            {/* Short Drama Rankings */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
              <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Film className="w-5 h-5 text-rose-500" />
                  <h3 className="font-bold text-slate-800">短剧排行</h3>
                </div>
                {/* Language Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">对应语言:</span>
                  <div className="flex gap-1">
                    {[
                      { code: 'ALL', label: '全部' },
                      { code: 'EN', label: '英语' },
                      { code: 'ES', label: '西班牙语' },
                      { code: 'ID', label: '印尼语' }
                    ].map(lang => (
                      <button 
                        key={lang.code}
                        onClick={() => setDramaLanguage(lang.code)}
                        className={`px-2 py-0.5 text-[10px] font-medium rounded border ${dramaLanguage === lang.code ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {(['trending', 'new'] as const).map((tab) => (
                  <div key={tab} className="flex flex-col">
                    <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-200 font-bold text-sm text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-1 h-4 rounded-full ${tab === 'trending' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                        <span>{tab === 'trending' ? '起量剧' : '新上架'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-normal">TOP 10</span>
                    </div>
                    <div className="p-0 overflow-auto">
                      <ul className="grid grid-cols-1 xl:grid-cols-2 gap-px bg-slate-200">
                        {scaledDramaData[tab].length > 0 ? scaledDramaData[tab].slice(0, 10).map((drama, idx) => (
                          <li 
                            key={drama.id} 
                            className="p-4 bg-white hover:bg-slate-50 transition-all flex items-start gap-3 cursor-pointer group relative"
                            onClick={() => console.log(`Entering drama list for: ${drama.name}`)}
                          >
                            <div className="relative shrink-0">
                              <img 
                                src={drama.cover} 
                                alt={drama.name} 
                                className="w-14 h-18 xl:w-16 xl:h-20 object-cover rounded shadow-sm border border-slate-100 group-hover:shadow-md transition-shadow"
                                referrerPolicy="no-referrer"
                              />
                              <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm z-10 ${idx < 3 ? 'bg-rose-500 text-white' : 'bg-slate-400 text-white'}`}>
                                {idx + 1}
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 truncate text-sm group-hover:text-indigo-600 transition-colors leading-tight">{drama.name}</div>
                                <div className="text-[11px] text-slate-400 truncate mt-0.5">{drama.chineseName}</div>
                                
                                <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                                  <span className="text-slate-400">ID: <span className="text-slate-600 font-mono">{drama.id}</span></span>
                                  <span className="bg-slate-100 px-1 py-0.5 rounded text-slate-500 font-medium scale-90 origin-left">
                                    {drama.language === 'EN' ? '英语' : drama.language === 'ES' ? '西班牙语' : drama.language === 'ID' ? '印尼语' : drama.language}
                                  </span>
                                </div>
                              </div>
                              
                              {currentUser.role === 'admin' && (
                                <div className="mt-2 pt-2 border-t border-slate-50 grid grid-cols-3 gap-x-2 gap-y-1 text-[10px]">
                                  <div className="flex flex-col">
                                    <span className="text-slate-400">观看</span>
                                    <span className="text-slate-700 font-bold tabular-nums">{drama.viewingUsers.toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-slate-400">意向</span>
                                    <span className="text-slate-700 font-bold tabular-nums">{drama.intentionCount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-slate-400">支付</span>
                                    <span className="text-slate-700 font-bold tabular-nums">{drama.payingUsers.toLocaleString()}</span>
                                  </div>
                                  <div className="col-span-3 mt-2">
                                    <div className="flex items-center justify-between bg-slate-50/80 border border-slate-100 rounded-md px-2 py-1.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-500 font-medium">总充值</span>
                                        <span className="text-indigo-600 font-bold tabular-nums">{formatCurrency(drama.revenue, currency)}</span>
                                      </div>
                                      <div className="w-px h-3 bg-slate-200"></div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-slate-500 font-medium">人均</span>
                                        <span className="text-emerald-600 font-bold tabular-nums">{formatCurrency(drama.arpu, currency)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </li>
                        )) : (
                          <li className="p-8 text-center text-sm text-slate-500 bg-white col-span-full">暂无该语言数据</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (!realtimeData) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-12">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-inner">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">出海短剧运营大盘</h1>
          </div>
          <div className="flex items-center gap-4">
            {/* Current User Role Display (Demo) */}
            <div className="flex items-center gap-2 shrink-0 mr-2">
              <span className="text-xs text-slate-500">当前用户(演示):</span>
              <select
                value={currentUser.name}
                onChange={(e) => {
                  const user = USERS.find(u => u.name === e.target.value);
                  if (user) setCurrentUser(user);
                }}
                className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded px-2 py-1 focus:outline-none cursor-pointer hover:border-indigo-300 transition-colors"
              >
                {USERS.map(user => (
                  <option key={user.name} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>

            {/* Section Visibility & Sort Dropdown (Demo) */}
            <div className="relative shrink-0">
              <button 
                onClick={() => setIsVisibilityMenuOpen(!isVisibilityMenuOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border transition-colors ${isVisibilityMenuOpen ? 'bg-slate-50 border-slate-300 text-indigo-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-xs font-bold">模块显示与排序</span>
              </button>
              
              {isVisibilityMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsVisibilityMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                    <div className="px-4 py-2 text-xs text-slate-500 border-b border-slate-100 mb-2">
                      拖动调整顺序，勾选控制显示
                    </div>
                    <Reorder.Group 
                      axis="y" 
                      values={sectionOrder} 
                      onReorder={setSectionOrder}
                      className="flex flex-col"
                    >
                      {sectionOrder.map((id) => (
                        <Reorder.Item 
                          key={id} 
                          value={id}
                          className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 cursor-grab active:cursor-grabbing"
                        >
                          <GripVertical className="w-4 h-4 text-slate-400" />
                          <input 
                            type="checkbox" 
                            checked={!hiddenSections.includes(id)}
                            onChange={() => toggleSectionVisibility(id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-sm text-slate-700 select-none">{sectionNames[id]}</span>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                </>
              )}
            </div>

            {/* PRD Button (Demo) */}
            <button 
              onClick={() => setIsPrdOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-colors shrink-0"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="text-xs font-bold">数据说明 (PRD)</span>
            </button>

            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm border border-indigo-200 ml-2">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Global Filter Bar */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-20 shadow-sm flex flex-col">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between w-full">
          <div className="flex items-center gap-6 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 shrink-0">
              <Filter className="w-4 h-4" />
              <span>全局筛选:</span>
            </div>

            {/* Timezone Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500">时区:</span>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 transition-colors hover:bg-slate-200">
                <Globe className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value as Timezone)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-slate-700"
                >
                  <option value="UTC">UTC (UTC+0)</option>
                  <option value="Asia/Shanghai">Beijing (UTC+8)</option>
                </select>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 shrink-0"></div>

            {/* Client Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500">客户端:</span>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 transition-colors hover:bg-slate-200">
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-slate-700"
                >
                  <option value="all">全部</option>
                  <option value="ios">iOS端</option>
                  <option value="android">安卓端</option>
                  <option value="h5">H5</option>
                  <option value="miniapp">小程序</option>
                </select>
              </div>
            </div>

            {/* Package Filter */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500">应用:</span>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 transition-colors hover:bg-slate-200">
                <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={packageFilter}
                  onChange={(e) => setPackageFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-slate-700"
                >
                  <option value="all">全部</option>
                  <option value="yoo">yoo</option>
                  <option value="manseen">manseen</option>
                  <option value="majiaA">马甲包A</option>
                  <option value="majiaB">马甲包B</option>
                </select>
              </div>
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 shrink-0"></div>

            {/* Department Filter (Consolidated) */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-500">部门:</span>
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200 transition-colors hover:bg-slate-200">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <select
                  value={departmentFilter}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={currentUser.role === 'media_buyer'}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer text-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed max-w-[180px] truncate"
                >
                  {departmentOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {sectionOrder.map((sectionId) => {
            const content = renderSection(sectionId);
            if (!content) return null;
            return (
              <DashboardSection key={sectionId} id={sectionId}>
                {content}
              </DashboardSection>
            );
          })}
        </div>
      </main>

      {/* PRD Documentation Modal */}
      {isPrdOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">数据字段说明文档 (PRD)</h3>
                  <p className="text-xs text-slate-500">详细说明每一个数据的内容和获取公式</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPrdOpen(false)} 
                className="p-2 hover:bg-slate-200 rounded-full transition-colors group"
              >
                <X className="w-6 h-6 text-slate-400 group-hover:text-slate-600" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-12">
              {/* Section: Global Description */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-slate-800 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">全局说明 (Global Description)</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">时区筛选</div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      支持 <span className="text-indigo-600 font-semibold">UTC+0 (默认)</span> 和 <span className="text-indigo-600 font-semibold">UTC+8 (北京时间)</span> 切换。所有时间维度（如小时充值、当日新增）均会随之重算。
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Real-time Dashboard */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">实时大盘数据 (Real-time Dashboard)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">核心指标</div>
                    <div className="text-xs text-slate-500 leading-relaxed">包含总充值、预计实收、活跃人数、观看人数、意向人数、充值人数、客单价、首充人数等核心运营指标。</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">多维筛选</div>
                    <div className="text-xs text-slate-500 leading-relaxed">支持按客户端（iOS/Android/Web）、应用包名、时区（UTC/UTC+8）以及时间维度（实时/昨日/7日/本月/上月）进行全局筛选。</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">数据公式</div>
                    <div className="text-xs text-slate-500 leading-relaxed">
                      <p>• 预计实收 = 总充值 - 渠道佣金 - 税费</p>
                      <p>• 支付成功率 = 充值人数 / 意向人数</p>
                      <p>• 环比 = (本期数值 - 上期数值) / 上期数值 * 100%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Ad Metrics */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">投放指标 (Ad Metrics)</h4>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-3">
                      <Activity className="w-4 h-4 text-indigo-600" />
                      <span className="font-bold text-slate-700 text-sm">投放指标</span>
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed space-y-2">
                      <p>整合自投和分销渠道的投放表现，包含消耗、D0充值、D0 ROI、总充值、总ROI等。</p>
                      <div className="bg-white p-3 rounded border border-slate-200 mt-2">
                        <span className="font-bold text-slate-700 block mb-1">核心公式：</span>
                        <p>• D0 ROI = D0充值 / 消耗</p>
                        <p>• ROI = 充值金额 / 消耗</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Marketing Analysis */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">趋势与分布 (Analysis)</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">充值分布图</div>
                    <div className="text-xs text-slate-500 mb-2">展示24小时充值趋势，支持累计趋势与时段趋势切换，对比今日与昨日数据。</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="font-bold text-slate-700 text-sm mb-1">分布分析</div>
                    <div className="text-xs text-slate-500 mb-2">包含注册国家充值分布（Top 8）及充值档位明细占比分析。</div>
                  </div>
                </div>
              </div>

              {/* Section: Drama Rankings */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1.5 h-6 bg-rose-500 rounded-full"></div>
                  <h4 className="text-base font-bold text-slate-800 uppercase tracking-wide">短剧排行 (Drama Rankings)</h4>
                </div>
                <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-xs text-slate-500 leading-relaxed space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="font-bold text-slate-700 mb-1">起量剧 (Trending)</p>
                        <p>按当日充值金额排序的头部剧集，反映当前市场热度。</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-700 mb-1">新上架 (New Releases)</p>
                        <p>按上架时间排序的最新剧集，用于追踪新品表现。</p>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border border-slate-200">
                      <span className="font-bold text-slate-700 block mb-1">展示字段说明：</span>
                      观看人数、意向人数、支付人数、总充值、人均充值 (ARPU)。支持按语言（英语/西语/印尼语）过滤。
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 text-center">
              <p className="text-[10px] text-slate-400 italic">最后更新时间: 2026-03-24 | 版本: v1.2.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
