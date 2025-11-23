import { useState, useEffect } from 'react';
import { Leaf, AlertCircle, ArrowRight, Sprout, Trash2, Filter, ArrowUpDown, Flower2 } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';

// --- Type definitions & mock data ---
interface Service {
  id: string;
  name: string;
  status: 'healthy' | 'warning';
  version: string;
  pods: number;
  lastDeploy: number | null; // Timestamp in milliseconds, null if never deployed
  position: { x: number; y: number }; // Position on garden (percentage)
  githubRepo?: string;
  githubOwner?: string;
}




interface ServiceCardProps {
  service: Service;
  onManage: (serviceInfo: { serviceName: string; githubRepo?: string; strategy?: string }) => void;
  onDelete: (id: string) => void;
  copy: {
    version: string;
    lastWatered: string;
    manage: string;
    deleteTitle: string;
    healthy: string;
    warning: string;
  };
  formatTime: (timestamp: number | null) => string;
}

const ServiceCard = ({ service, onManage, onDelete, copy, formatTime }: ServiceCardProps) => {
  const isHealthy = service.status === 'healthy';
  // ServiceCard UI
  return (
    <div className={`
      relative overflow-hidden rounded-2xl border-2 p-6 transition-all hover:shadow-lg
      ${isHealthy ? 'border-green-100 bg-white' : 'border-amber-100 bg-amber-50'}
    `}>
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full opacity-20 
        ${isHealthy ? 'bg-green-200' : 'bg-amber-200'}`}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-3 ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
              {isHealthy ? <Leaf size={24} /> : <AlertCircle size={24} />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">{service.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full 
                ${isHealthy ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {isHealthy ? copy.healthy : copy.warning}
              </span>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(service.id);
            }}
            className="rounded-lg p-2 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
            title={copy.deleteTitle}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-slate-600">
        <div>
          <p className="text-xs text-slate-400">{copy.version}</p>
          <p className="font-mono font-semibold">{service.version}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">{copy.lastWatered}</p>
          <p className="font-medium">{formatTime(service.lastDeploy)}</p>
        </div>
      </div>
      <button
        onClick={() => onManage({
          serviceName: service.name,
          githubRepo: service.githubRepo,
          strategy: 'canary', // Default strategy, can be enhanced later
        })}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-bold text-white transition-all hover:bg-green-600 hover:shadow-lg hover:shadow-green-200"
      >
        {copy.manage} <ArrowRight size={16} />
      </button>
    </div>
  );
};

interface DashboardPageProps {
  onManage: (serviceInfo: { serviceName: string; githubRepo?: string; strategy?: string }) => void;
  onStartDeploy: () => void;
}

export default function DashboardPage({ onManage, onStartDeploy }: DashboardPageProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [filterStatus, setFilterStatus] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastDeploy'>('lastDeploy');
  const { language } = useLanguage();
  const copy = {
    en: {
      title: 'My Garden 🌿',
      subtitle: 'Manage your Kubernetes deployments with peace of mind.',
      mock: '⚠️ Running in MOCK mode',
      startButton: '+ New Deployment  🌱',
      gardenAlt: 'Digital Garden',
      confirmDelete: 'Are you sure you want to delete this service?',
      deleteErrorPrefix: 'Error deleting service:',
      healthCheck: 'Garden Health Check',
      healthLabels: {
        healthy: 'Healthy',
        warning: 'Warning',
        critical: 'Critical',
      },
      noServices: 'No services found with this status.',
      filter: {
        all: 'All',
        healthy: 'Healthy',
        warning: 'Warning',
        critical: 'Critical',
        sortBy: 'Sort by',
        name: 'Name',
        lastDeploy: 'Last Deploy',
      },
      serviceCard: {
        version: 'Version',
        lastWatered: 'Last Watered',
        manage: 'Manage Deployment',
        deleteTitle: 'Delete service',
        healthy: 'HEALTHY',
        warning: 'WARNING',
      },
    },
    ja: {
      title: '私のデジタルガーデン 🌿',
      subtitle: 'Kubernetes デプロイを安心して管理しましょう。',
      mock: '⚠️ モックモードで動作中',
      startButton: '+ 新規デプロイ 🌱',
      gardenAlt: 'デジタルガーデン',
      confirmDelete: 'このサービスを削除しますか？',
      deleteErrorPrefix: 'サービス削除エラー:',
      healthCheck: '🥕 ガーデンヘルスチェック',
      healthLabels: {
        healthy: '正常',
        warning: '注意',
        critical: '重大',
      },
      noServices: 'このステータスのサービスが見つかりません。',
      filter: {
        all: 'すべて',
        healthy: '正常',
        warning: '注意',
        critical: '重大',
        sortBy: '並び替え',
        name: '名前',
        lastDeploy: '最終デプロイ',
      },
      serviceCard: {
        version: 'Version',
        lastWatered: 'Last Watered',
        manage: 'デプロイ管理',
        deleteTitle: 'サービスを削除',
        healthy: '正常',
        warning: '注意',
      },
    },
    ko: {
      title: '내 디지털 가든 🌿',
      subtitle: 'Kubernetes 배포를 안심하고 관리하세요.',
      mock: '⚠️ MOCK 모드로 실행 중',
      startButton: '🌱 배포 시작',
      gardenAlt: '디지털 가든',
      confirmDelete: '이 서비스를 삭제하시겠습니까?',
      deleteErrorPrefix: '서비스 삭제 오류:',
      healthCheck: '가든 상태 확인',
      healthLabels: {
        healthy: '정상',
        warning: '경고',
        critical: '심각',
      },
      noServices: '이 상태의 서비스를 찾을 수 없습니다.',
      filter: {
        all: '전체',
        healthy: '정상',
        warning: '경고',
        critical: '심각',
        sortBy: '정렬',
        name: '이름',
        lastDeploy: '마지막 배포',
      },
      serviceCard: {
        version: '버전',
        lastWatered: '마지막 배포',
        manage: '가든 관리',
        deleteTitle: '서비스 삭제',
        healthy: '정상',
        warning: '경고',
      },
    },
  } as const;
  const t = copy[language];

  const API_URL = import.meta.env.VITE_API_URL;
  const USE_MOCK = !API_URL || API_URL === 'mock';

  // Format time similar to HistoryPage
  const formatTime = (timestamp: number | null) => {
    if (timestamp === null) {
      return language === 'ja' ? '未配信' : 'N/A';
    }
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return language === 'ja' ? 'たった今' : 'Just now';
    if (minutes < 60) return language === 'ja' ? `${minutes}分前` : `${minutes}m ago`;
    if (hours < 24) return language === 'ja' ? `${hours}時間前` : `${hours}h ago`;
    return language === 'ja' ? `${days}日前` : `${days}d ago`;
  };

  // Helper function to generate consistent random position based on service ID
  // Same ID will always get the same position
  const getPositionFromId = (id: string): { x: number; y: number } => {
    // Simple hash function to convert string ID to number
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    // Use hash to generate consistent pseudo-random values
    const seed1 = Math.abs(hash);
    const seed2 = Math.abs(hash * 31); // Different seed for y
    return {
      x: (seed1 % 8000) / 100 + 10, // 10-90%
      y: (seed2 % 8000) / 100 + 10, // 10-90%
    };
  };

  // Calculate distance between two positions
  const getDistance = (pos1: { x: number; y: number }, pos2: { x: number; y: number }): number => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Check if a position collides with existing positions
  const hasCollision = (pos: { x: number; y: number }, existingPositions: { x: number; y: number }[], minDistance: number = 8): boolean => {
    return existingPositions.some(existing => getDistance(pos, existing) < minDistance);
  };

  // Find a non-colliding position
  const findNonCollidingPosition = (
    initialPos: { x: number; y: number },
    existingPositions: { x: number; y: number }[],
    minDistance: number = 8,
    maxAttempts: number = 50
  ): { x: number; y: number } => {
    if (!hasCollision(initialPos, existingPositions, minDistance)) {
      return initialPos;
    }

    // Try to find a nearby position that doesn't collide
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const angle = (attempt * 137.508) % 360; // Golden angle for even distribution
      const radius = minDistance + (attempt % 3) * 2; // Gradually increase radius
      const rad = (angle * Math.PI) / 180;
      
      const newX = Math.max(10, Math.min(90, initialPos.x + Math.cos(rad) * radius));
      const newY = Math.max(10, Math.min(90, initialPos.y + Math.sin(rad) * radius));
      const newPos = { x: newX, y: newY };

      if (!hasCollision(newPos, existingPositions, minDistance)) {
        return newPos;
      }
    }

    // If all attempts fail, return a random position
    return {
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
    };
  };

  // Adjust positions to avoid collisions
  const adjustPositions = (services: Array<{ id: string; position: { x: number; y: number } }>): Array<{ x: number; y: number }> => {
    const adjustedPositions: { x: number; y: number }[] = [];
    
    for (const service of services) {
      const adjustedPos = findNonCollidingPosition(
        service.position,
        adjustedPositions,
        8 // Minimum distance of 8%
      );
      adjustedPositions.push(adjustedPos);
    }
    
    return adjustedPositions;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (USE_MOCK) {
      // Mock data fallback
      const mockServices = [
        { id: '1', name: 'demo-api', status: 'healthy' as const, version: 'v1.0.2', pods: 3, lastDeploy: Date.now() - 2 * 3600000, position: getPositionFromId('1') },
        { id: '2', name: 'demo-frontend', status: 'warning' as const, version: 'v2.1.0', pods: 2, lastDeploy: Date.now() - 86400000, position: getPositionFromId('2') },
      ];
      // Adjust positions to avoid collisions
      const adjustedPositions = adjustPositions(mockServices);
      const adjustedServices = mockServices.map((svc, idx) => ({
        ...svc,
        position: adjustedPositions[idx],
      }));
      setServices(adjustedServices);
      return;
    }

    try {
      // Fetch services
      const servicesRes = await fetch(`${API_URL}/services`);
      let servicesList: any[] = [];
      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        servicesList = Array.isArray(servicesData) ? servicesData : (servicesData.services || []);
      }

      // Fetch deployments to get last deployment time for each service
      let deploymentsMap: Map<string, number> = new Map();
      try {
        const deploymentsRes = await fetch(`${API_URL}/deployments`);
        if (deploymentsRes.ok) {
          const deploymentsData = await deploymentsRes.json();
          const deployments = Array.isArray(deploymentsData) ? deploymentsData : (deploymentsData.deployments || []);
          
          // Create a map of service name to latest deployment timestamp
          deployments.forEach((deployment: any) => {
            const serviceName = deployment.serviceName || deployment.serviceId;
            const createdAt = deployment.createdAt;
            if (serviceName && createdAt) {
              const existingTime = deploymentsMap.get(serviceName);
              if (!existingTime || createdAt > existingTime) {
                deploymentsMap.set(serviceName, createdAt);
              }
            }
          });
        }
      } catch (err) {
        console.error('Failed to fetch deployments:', err);
      }

      const mappedServices = servicesList.map((svc: any, idx: number) => {
        const serviceId = svc.id || String(idx);
        const serviceName = svc.name || svc.serviceName || 'unknown';
        const lastDeployTimestamp = deploymentsMap.get(serviceName) || null;
        
        return {
          id: serviceId,
          name: serviceName,
          status: 'healthy' as const,
          version: 'latest',
          pods: 3,
          lastDeploy: lastDeployTimestamp,
          position: getPositionFromId(serviceId),
          githubRepo: svc.githubRepo,
          githubOwner: svc.githubOwner,
        };
      });
      // Adjust positions to avoid collisions
      const adjustedPositions = adjustPositions(mappedServices);
      const adjustedServices = mappedServices.map((svc: Service, idx: number) => ({
        ...svc,
        position: adjustedPositions[idx],
      }));
      setServices(adjustedServices);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm(t.confirmDelete)) return;

    if (USE_MOCK) {
      setServices(services.filter(s => s.id !== serviceId));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/services/${serviceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete service');

      // Remove from local state
      setServices(services.filter(s => s.id !== serviceId));
    } catch (err: any) {
      alert(`${t.deleteErrorPrefix} ${err.message}`);
    }
  };

  // Calculate health check counts
  const healthyCount = services.filter(s => s.status === 'healthy').length;
  const warningCount = services.filter(s => s.status === 'warning').length;
  
  // Calculate Garden Level (game-like UI)
  const totalServices = services.length;
  const gardenLevel = Math.max(1, Math.floor(totalServices / 2) + 1); // Level increases with services
  const servicesInCurrentLevel = totalServices % 2; // 0 or 1
  const deploymentsNeededForNextLevel = servicesInCurrentLevel === 0 ? 2 : 1;
  const xpPercentage = (servicesInCurrentLevel / 2) * 100; // Progress percentage
  
  // Filter services for Health Check panel
  const panelServices = selectedStatus === 'healthy' 
    ? services.filter(s => s.status === 'healthy')
    : selectedStatus === 'warning'
    ? services.filter(s => s.status === 'warning')
    : []; // critical services (empty for now)
  
  // Filter and sort services for Service Cards
  const filteredAndSortedServices = [...services]
    .filter(s => {
      if (filterStatus === 'all') return true;
      if (filterStatus === 'critical') return false; // No critical services yet
      return s.status === filterStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        // Sort by lastDeploy timestamp (most recent first)
        // null values go to the end
        if (a.lastDeploy === null && b.lastDeploy === null) return 0;
        if (a.lastDeploy === null) return 1;
        if (b.lastDeploy === null) return -1;
        return b.lastDeploy - a.lastDeploy; // Descending order (newest first)
      }
    });

  return (
    // Fill available height so the parent container keeps layout tight
    <div className="min-h-full bg-stone-50 p-8">
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-logo">{t.title}</h1>
          <p className="text-slate-500">{t.subtitle}</p>
          {USE_MOCK && <p className="text-xs text-amber-600 mt-2">{t.mock}</p>}
        </div>
        <button
          onClick={onStartDeploy}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-slate-300 transition-all hover:bg-green-600 hover:shadow-green-200"
        >
          {t.startButton}
        </button>
      </header>

      {/* Garden Visualization with Health Check */}
      <div className="mb-10 flex flex-col lg:flex-row gap-6">
        {/* Garden Visualization */}
        <div className="flex-1 relative rounded-3xl shadow-xl overflow-visible" style={{ aspectRatio: '16/8' }}>
          <div className="absolute inset-0 rounded-3xl overflow-hidden">
            <img
              src="/garden.png"
              alt={t.gardenAlt}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Sprouts positioned on the garden */}
          {services.map((service) => {
            const isHealthy = service.status === 'healthy';
            const showTooltipBelow = service.position.y < 30; // Show tooltip below if service is in top 30%
            return (
              <div
                key={service.id}
                className="absolute group cursor-pointer transition-all hover:scale-125 z-10"
                style={{
                  left: `${service.position.x}%`,
                  top: `${service.position.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                onClick={() => onManage({
                  serviceName: service.name,
                  githubRepo: service.githubRepo,
                  strategy: 'canary', // Default strategy, can be enhanced later
                })}
              >
                <div className="relative">
                  <div className={`rounded-full p-3 shadow-lg transition-all ${isHealthy
                    ? 'bg-green-100 text-green-600 border-2 border-green-300'
                    : 'bg-amber-100 text-amber-600 border-2 border-amber-300'
                    }`}>
                    <Sprout size={32} strokeWidth={2} />
                  </div>
                  {/* Tooltip on hover */}
                  <div className={`absolute left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 ${
                    showTooltipBelow ? 'top-full mt-2' : 'bottom-full mb-2'
                  }`}>
                    <div className="bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
                      {service.name}
                      <div className={`text-[10px] mt-1 ${isHealthy ? 'text-green-300' : 'text-amber-300'
                        }`}>
                        {isHealthy ? t.serviceCard.healthy : t.serviceCard.warning}
                      </div>
                      <div className={`absolute left-1/2 transform -translate-x-1/2 w-0 h-0 ${
                        showTooltipBelow 
                          ? 'top-0 -translate-y-full border-l-4 border-r-4 border-b-4 border-transparent border-b-slate-900'
                          : 'bottom-0 translate-y-full border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Garden Health Check Panel */}
        <div className="lg:w-80 flex-shrink-0 rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-lg flex flex-col" style={{ aspectRatio: '16/8', maxHeight: '100%' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 font-logo">{t.healthCheck}</h2>
            <div className="text-green-500">
              <Flower2 size={24} className="animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 mb-6 flex-shrink-0">
            {/* Healthy */}
            <button
              onClick={() => setSelectedStatus('healthy')}
              className="flex flex-col items-center cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <div className={`w-16 h-16 rounded-full bg-green-100 flex items-center justify-center shadow-md transition-all ${
                selectedStatus === 'healthy' ? 'ring-4 ring-green-300 ring-offset-2' : ''
              }`}>
                <span className="text-2xl font-bold text-green-700">{healthyCount}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">{t.healthLabels.healthy}</p>
            </button>
            {/* Warning */}
            <button
              onClick={() => setSelectedStatus('warning')}
              className="flex flex-col items-center cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <div className={`w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center shadow-md transition-all ${
                selectedStatus === 'warning' ? 'ring-4 ring-amber-300 ring-offset-2' : ''
              }`}>
                <span className="text-2xl font-bold text-amber-700">{warningCount}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">{t.healthLabels.warning}</p>
            </button>
            {/* Critical - placeholder for future use */}
            <button
              onClick={() => setSelectedStatus('critical')}
              className="flex flex-col items-center cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <div className={`w-16 h-16 rounded-full bg-red-100 flex items-center justify-center shadow-md transition-all ${
                selectedStatus === 'critical' ? 'ring-4 ring-red-300 ring-offset-2' : ''
              }`}>
                <span className="text-2xl font-bold text-red-700">0</span>
              </div>
              <p className="text-xs text-slate-500 mt-2 font-medium">{t.healthLabels.critical}</p>
            </button>
          </div>
          
          {/* Garden Level Progress Bar */}
          <div className="mb-4 p-3 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-xl border border-sky-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sprout size={16} className="text-sky-600" />
                <span className="text-xs font-bold text-sky-700">Garden Level</span>
              </div>
              <span className="text-lg font-bold text-sky-700">Lv.{gardenLevel}</span>
            </div>
            <div className="relative w-full h-3 bg-sky-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 via-sky-500 to-cyan-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${xpPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </div>
            </div>
            <div className="flex items-center justify-center mt-1.5">
              <span className="text-[10px] text-sky-600 font-medium">
                {deploymentsNeededForNextLevel} more deployment{deploymentsNeededForNextLevel > 1 ? 's' : ''} to next level
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
              <Leaf size={12} className="text-sky-500" />
              <span className="font-medium">{totalServices} Services Growing</span>
            </div>
          </div>
          
          {/* Service List in Panel */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {panelServices.length > 0 ? (
              <div className="space-y-2">
                {panelServices.map((service) => {
                  const isHealthy = service.status === 'healthy';
                  return (
                    <div
                      key={service.id}
                      className={`p-3 rounded-lg border transition-all hover:shadow-md cursor-pointer ${
                        isHealthy ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
                      }`}
                      onClick={() => onManage({
                        serviceName: service.name,
                        githubRepo: service.githubRepo,
                        strategy: 'canary', // Default strategy, can be enhanced later
                      })}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full p-1.5 ${isHealthy ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                          {isHealthy ? <Leaf size={14} /> : <AlertCircle size={14} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{service.name}</p>
                          <p className="text-xs text-slate-500">{service.version}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p className="text-sm">{t.noServices}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Sort Bar */}
      <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">{t.filter.all}:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.filter.all}
            </button>
            <button
              onClick={() => setFilterStatus('healthy')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'healthy'
                  ? 'bg-green-600 text-white'
                  : 'bg-green-50 text-green-700 hover:bg-green-100'
              }`}
            >
              {t.filter.healthy}
            </button>
            <button
              onClick={() => setFilterStatus('warning')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'warning'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              {t.filter.warning}
            </button>
            <button
              onClick={() => setFilterStatus('critical')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filterStatus === 'critical'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              {t.filter.critical}
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpDown size={18} className="text-slate-500" />
          <span className="text-sm font-medium text-slate-700">{t.filter.sortBy}:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'lastDeploy')}
            className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            <option value="name">{t.filter.name}</option>
            <option value="lastDeploy">{t.filter.lastDeploy}</option>
          </select>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedServices.length > 0 ? (
          filteredAndSortedServices.map((svc) => (
            <ServiceCard
              key={svc.id}
              service={svc}
              onManage={onManage}
              onDelete={handleDeleteService}
              copy={t.serviceCard}
              formatTime={formatTime}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-400">
            <p className="text-lg">{t.noServices}</p>
          </div>
        )}
      </div>
    </div>
  );
}