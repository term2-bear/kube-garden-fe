import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, GitCommit, Loader2, Trash2 } from 'lucide-react';
import { useLanguage } from '../components/LanguageContext';

interface DeploymentRecord {
  id: string;
  serviceId: string;
  imageTag: string;
  status: string;
  strategy: string;
  environment: string;
  createdAt: number;
  description?: string;
  error?: string;
}

export default function HistoryPage() {
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useLanguage();

  const copy = {
    en: {
      title: 'Deployment Log 📜',
      subtitle: 'Track all gardening activities and growth records.',
      mock: '⚠️ Running in MOCK mode (Set VITE_API_URL to enable real backend)',
      confirmDelete: 'Are you sure you want to delete this deployment?',
      deleteErrorPrefix: 'Error deleting deployment:',
      errorLabel: 'Error:',
      empty: 'No deployments yet. Start your first deployment! 🌱',
      table: {
        status: 'Status',
        service: 'Service / Version',
        summary: 'Information',
        time: 'Time',
        actions: 'Actions',
        deleteTitle: 'Delete deployment',
      },
      statuses: {
        success: 'Success',
        failed: 'Failed',
        progress: 'In Progress',
      },
      loadingAlt: 'Loading...',
    },
    ja: {
      title: 'デプロイ日誌 📜',
      subtitle: 'ガーデニングの活動と成長記録を追跡します。',
      mock: '⚠️ モックモードで動作中（本番利用には VITE_API_URL を設定）',
      confirmDelete: 'このデプロイ履歴を削除しますか？',
      deleteErrorPrefix: 'デプロイ削除エラー:',
      errorLabel: 'エラー:',
      empty: 'まだデプロイ記録がありません。まずは 1 件デプロイしてみましょう！🌱',
      table: {
        status: 'ステータス',
        service: 'サービス / バージョン',
        summary: 'サマリー',
        time: '時間',
        actions: '操作',
        deleteTitle: 'デプロイを削除',
      },
      statuses: {
        success: '成功',
        failed: '失敗',
        progress: '進行中',
      },
      loadingAlt: '読み込み中...',
    },
  } as const;
  const t = copy[language];

  const API_URL = import.meta.env.VITE_API_URL;
  const USE_MOCK = !API_URL || API_URL === 'mock';

  useEffect(() => {
    fetchDeployments();
  }, []);

  const fetchDeployments = async () => {
    if (USE_MOCK) {
      // Mock data fallback
      const mockData = [
        { id: '103', serviceId: 'demo-api', imageTag: 'v1.1.0', status: 'SUCCESS', strategy: 'canary', environment: 'production', createdAt: Date.now() - 1000 * 60, description: 'Performance improved by 15%' },
        { id: '102', serviceId: 'demo-frontend', imageTag: 'v2.1.0', status: 'SUCCESS', strategy: 'blue-green', environment: 'production', createdAt: Date.now() - 86400000, description: 'UI update' },
        { id: '101', serviceId: 'demo-api', imageTag: 'v1.0.9', status: 'BUILD_FAILED', strategy: 'canary', environment: 'production', createdAt: Date.now() - 259200000, description: 'Failed due to unit test error', error: 'Build error' },
      ];
      setDeployments(mockData);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/deployments`);
      if (!response.ok) throw new Error('Failed to fetch deployments');
      const data = await response.json();
      setDeployments(data.deployments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deploymentId: string) => {
    if (!confirm(t.confirmDelete)) return;

    if (USE_MOCK) {
      setDeployments(deployments.filter(d => d.id !== deploymentId));
      return;
    }

    try {
      const response = await fetch(`${API_URL}/deploy/${deploymentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete deployment');

      // Remove from local state
      setDeployments(deployments.filter(d => d.id !== deploymentId));
    } catch (err: any) {
      alert(`${t.deleteErrorPrefix} ${err.message}`);
    }
  };

  const getStatusDisplay = (record: DeploymentRecord) => {
    const isFailed = record.status.includes('FAILED') || record.error;
    const isSuccess = record.status === 'SUCCESS' || record.status === 'DEPLOYED' || record.status === 'IMAGE_VALIDATED' || record.status === 'PROMOTED';
    const isInProgress = record.status.includes('PROGRESS') || record.status.includes('TRIGGERED') || record.status.includes('IN_PROGRESS');

    if (isSuccess) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-700"><CheckCircle size={12} /> {t.statuses.success}</span>;
    } else if (isFailed) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700"><XCircle size={12} /> {t.statuses.failed}</span>;
    } else if (isInProgress) {
      return <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700"><Loader2 size={12} className="animate-spin" /> {t.statuses.progress}</span>;
    }
    return <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">{record.status}</span>;
  };

  // [추가됨] 객체 형태의 데이터를 안전하게 문자열로 변환하여 렌더링하는 함수
  const safeRender = (content: any) => {
    if (!content) return null;
    if (typeof content === 'string') return content;

    // 객체인 경우 (Error, Cause 등의 키가 있거나 일반 객체인 경우)
    if (typeof content === 'object') {
      // 에러 로그에 나온 포맷 대응
      if (content.Error) return content.Error;
      if (content.message) return content.message;
      // 그 외의 경우 JSON 문자열로 변환하여 출력
      return JSON.stringify(content);
    }
    return String(content);
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return language === 'ja' ? 'たった今' : 'Just now';
    if (minutes < 60) return language === 'ja' ? `${minutes}分前` : `${minutes}m ago`;
    if (hours < 24) return language === 'ja' ? `${hours}時間前` : `${hours}h ago`;
    return language === 'ja' ? `${days}日前` : `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-stone-50">
        <Loader2 className="animate-spin text-green-600" size={48} aria-label={t.loadingAlt} />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-stone-50 p-8">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 font-logo">{t.title}</h2>
        <p className="text-slate-500">{t.subtitle}</p>
        {USE_MOCK && <p className="text-xs text-amber-600 mt-2">{t.mock}</p>}
      </header>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          {t.errorLabel} {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-6 py-4 font-bold">{t.table.status}</th>
              <th className="px-6 py-4 font-bold">{t.table.service}</th>
              <th className="px-6 py-4 font-bold">{t.table.summary}</th>
              <th className="px-6 py-4 font-bold">{t.table.time}</th>
              <th className="px-6 py-4 font-bold">{t.table.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deployments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  {t.empty}
                </td>
              </tr>
            ) : (
              deployments.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    {getStatusDisplay(record)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{record.serviceId}</div>
                    <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
                      <GitCommit size={12} /> {record.imageTag}
                    </div>
                  </td>

                  {/* [수정됨] safeRender 적용하여 객체 오류 방지 */}
                  <td className="px-6 py-4 text-slate-600 max-w-xs truncate">
                    {safeRender(record.description) || safeRender(record.error) || '-'}
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-400">
                    {formatTime(record.createdAt)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleDelete(record.id)}
                      className="rounded-lg p-2 text-red-500 hover:bg-red-50 transition-colors"
                      title={t.table.deleteTitle}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}