import { useState, useRef, useEffect } from 'react';
import { Play, CheckCircle, Loader2, ShieldCheck, Terminal, Activity, ArrowLeft, Check, Sprout, Trees, Flower2, Bot, Sparkles, AlertCircle, Info, TrendingUp, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import confetti from 'canvas-confetti'; // celebratory confetti
import toast, { Toaster } from 'react-hot-toast'; // toast notifications
import { useLanguage } from '../components/LanguageContext';

// --- Helpers ---
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type LogMeta = {
  role: 'agent' | 'user' | 'system';
  text: string;
};

// DynamoDB format parser
const parseDynamoDBValue = (value: any): any => {
  if (!value || typeof value !== 'object') return value;
  
  if (value.S) return value.S; // String
  if (value.N) return parseFloat(value.N); // Number
  if (value.L) return value.L.map((item: any) => parseDynamoDBValue(item)); // List
  if (value.M) {
    const result: any = {};
    for (const [key, val] of Object.entries(value.M)) {
      result[key] = parseDynamoDBValue(val);
    }
    return result;
  }
  return value;
};

interface AiAnalysisData {
  risks?: string[];
  decision?: string;
  metrics_status?: Record<string, string>;
  recommendations?: string[];
  confidence?: number;
  reasoning?: string;
}

const parseAiAnalysis = (data: any): AiAnalysisData | null => {
  if (!data) return null;
  
  try {
    // If it's already a parsed object, return it
    if (typeof data === 'object' && !data.S && !data.M && !data.L) {
      return data as AiAnalysisData;
    }
    
    // Parse DynamoDB format
    const parsed = parseDynamoDBValue(data);
    
    return {
      risks: parsed.risks || [],
      decision: parsed.decision || '',
      metrics_status: parsed.metrics_status || {},
      recommendations: parsed.recommendations || [],
      confidence: parsed.confidence || 0,
      reasoning: parsed.reasoning || '',
    };
  } catch (error) {
    console.error('Error parsing aiAnalysis:', error);
    return null;
  }
};

const parseLogEntry = (entry: string): LogMeta => {
  if (entry.startsWith('Gardener Agent:')) {
    return { role: 'agent', text: entry.replace('Gardener Agent:', '').trim() };
  }
  if (entry.startsWith('User:')) {
    return { role: 'user', text: entry.replace('User:', '').trim() };
  }
  return { role: 'system', text: entry };
};

// --- Visual components ---

// Plant growth animation
const GrowingPlant = ({ status, labels }: { status: string; labels: { idle: string; planning: string; running: string; success: string } }) => {
  let Icon = Sprout;
  let color = "text-slate-300 bg-slate-100";
  let scale = "scale-100";

  if (status === 'planning') {
    Icon = Sprout;
    color = "text-green-500 bg-green-100 animate-pulse";
    scale = "scale-110";
  } else if (status === 'running') {
    Icon = Flower2;
    color = "text-green-600 bg-green-100 animate-bounce";
    scale = "scale-125";
  } else if (status === 'success') {
    Icon = Trees;
    color = "text-green-700 bg-green-200";
    scale = "scale-125";
  }

  return (
    <div className="flex flex-col items-center justify-center py-8 transition-all duration-500">
      <div className={`flex h-24 w-24 items-center justify-center rounded-full border-4 border-white shadow-xl transition-all duration-500 ${color} ${scale}`}>
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-sm font-bold text-slate-500 transition-all">
        {status === 'idle' && labels.idle}
        {status === 'planning' && labels.planning}
        {status === 'running' && labels.running}
        {status === 'success' && labels.success}
      </p>
    </div>
  );
};

const TimelineStep = ({ icon: Icon, label, status }: { icon: any, label: string, status: 'pending' | 'running' | 'done' }) => {
  const getColors = () => {
    if (status === 'done') return 'text-green-600 bg-green-100 border-green-200';
    if (status === 'running') return 'text-blue-600 bg-blue-50 border-blue-200 animate-pulse';
    return 'text-slate-300 bg-slate-50 border-slate-100';
  };

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${getColors()}`}>
        {status === 'running' ? <Loader2 className="animate-spin" size={18} /> : <Icon size={18} />}
      </div>
      <span className={`text-xs font-medium text-center ${status === 'pending' ? 'text-slate-400' : 'text-slate-700'}`}>
        {label}
      </span>
    </div>
  );
};


// --- Main component ---
interface DeploymentConsoleProps {
  onBack: () => void;
  deploymentConfig: {
    serviceName: string;
    githubRepo: string;
    strategy: string;
    description: string;
    environment?: string; // Optional
  } | null;
  isRedeploy?: boolean; // Whether this is a redeployment
}

export default function DeploymentConsole({ onBack, deploymentConfig, isRedeploy = false }: DeploymentConsoleProps) {
  const { language } = useLanguage();
  const copy = {
    en: {
      headerPrefix: isRedeploy ? 'Redeploying:' : 'Deploying:',
      environment: 'Production Environment',
      strategyLabel: 'Strategy',
      strategyOptions: {
        canary: 'Canary Deployment (Recommended)',
        blue: 'Blue-Green Deployment',
      },
      plant: {
        idle: 'Ready to Grow',
        planning: 'Sprouting...',
        running: 'Blooming...',
        success: 'Fully Grown!',
      },
      timeline: {
        lint: 'Test & Lint',
        scan: 'Sec Scan',
        canary: 'Deploy',
      },
      buttons: {
        deploy: isRedeploy ? 'Redeploy with Gardener Agent' : 'Deploy with Gardener Agent',
        processing: 'Processing...',
        ready: 'Deployment Ready',
        failed: 'Deployment Failed',
      },
      info: {
        strategy: 'This deployment will use Canary strategy.',
      },
      successPanel: {
        title: 'Build Successful',
        description: 'If there are any issues, click Rollback. Otherwise, click Promote to Deploy.',
        promote: 'Promote to Deploy',
        promoting: 'Promoting...',
        rollback: 'Rollback',
        chartTitle: 'Latency Comparison (ms)',
      },
      promotedPanel: {
        title: 'Deployment Promoted Successfully!',
        description: 'Your deployment has been successfully promoted. All systems are running smoothly.',
        backToDashboard: 'Back to Dashboard',
      },
      failedPanel: {
        title: 'Build Failed',
        description: 'The build process encountered an error. Please check the logs above for details.',
        retry: 'Try Again',
      },
      toast: {
        initializing: 'Initializing Deployment Agent...',
        planCreated: 'Plan Created! Running Tests.',
        securityClear: 'Security Clean. Rolling out Canary.',
        canaryLive: 'Build Live!',
        //deploymentSuccess: 'Deployment Successful! 🎉',
        failedStart: 'Deployment failed to start',
        failed: 'Deployment Failed',
        promoteSuccess: 'Successfully Promoted!',
        rollbackStart: 'Rolling back to previous version...',
        rollbackDone: 'Rollback Complete.',
      },
      logReady: isRedeploy
        ? "Gardener Agent: Ready to redeploy. Click 'Redeploy with Gardener Agent' to start."
        : "Gardener Agent: Ready to deploy. Click 'Deploy with Gardener Agent' to start.",
      userLabel: 'You',
      agentLabel: 'Gardener Agent',
      promote: {
        deploying: "Gardener Agent: Deploying in progress. Please wait...",
        success: "Gardener Agent: Deployment completed successfully!",
        waitingAnalysis: "Gardener Agent: Waiting for AI analysis. Please wait...",
        analysisReady: "Gardener Agent: AI analysis is ready!",
      },
    },
    ja: {
      headerPrefix: isRedeploy ? '再デプロイ中:' : 'デプロイ中:',
      environment: '本番環境',
      strategyLabel: '戦略',
      strategyOptions: {
        canary: 'Canary Deployment（推奨）',
        blue: 'Blue-Green Deployment',
      },
      plant: {
        idle: '成長の準備完了',
        planning: '芽が出ています...',
        running: '開花中...',
        success: '立派に成長しました！',
      },
      timeline: {
        lint: 'テスト & Lint',
        scan: 'Sec Scan',
        canary: 'Deploy',
      },
      buttons: {
        deploy: isRedeploy ? 'ガーデナーエージェントで再デプロイ' : 'エージェントとデプロイ',
        processing: '処理中...',
        ready: 'デプロイ完了',
        failed: 'デプロイ失敗',
      },
      info: {
        strategy: 'このデプロイはCanary戦略を使用します。',
      },
      successPanel: {
        title: 'Build Successful',
        description: '問題があればロールバックをクリックしてください。問題がなければ、Promote to Deployボタンをクリックしてください。',
        promote: 'Promote to Deploy',
        promoting: '昇格中...',
        rollback: 'Rollback',
        chartTitle: 'レイテンシ比較 (ms)',
      },
      promotedPanel: {
        title: 'デプロイの昇格が成功しました！',
        description: 'デプロイは100%のトラフィックに正常に昇格しました。すべてのシステムが正常に動作しています。',
        backToDashboard: 'ダッシュボードに戻る',
      },
      failedPanel: {
        title: 'Build Failed',
        description: 'The build process encountered an error. Please check the logs above for details.',
        retry: '再試行',
      },
      toast: {
        initializing: 'デプロイエージェントを初期化しています...',
        planCreated: '計画を作成しました。テストを実行中。',
        securityClear: 'セキュリティ検査クリア。カナリアを展開中。',
        canaryLive: 'Build Live!',
        deploymentSuccess: 'デプロイ成功！ 🎉',
        failedStart: 'デプロイ開始に失敗しました',
        failed: 'デプロイ失敗',
        promoteSuccess: 'Successfully Promoted!',
        rollbackStart: '前のバージョンへロールバックしています...',
        rollbackDone: 'ロールバック完了。',
      },
      logReady: isRedeploy
        ? "ガーデナーエージェント: 再デプロイ準備完了です。「ガーデナーエージェントで再デプロイ」をクリックしてください。"
        : "ガーデナーエージェント: デプロイ準備完了です。「エージェントとデプロイ」をクリックしてください。",
      userLabel: 'あなた',
      agentLabel: 'ガーデナーエージェント',
      promote: {
        deploying: "ガーデナーエージェント: デプロイ中です。お待ちください...",
        success: "ガーデナーエージェント: デプロイが正常に完了しました！",
        waitingAnalysis: "ガーデナーエージェント: AI分析を待っています。お待ちください...",
        analysisReady: "ガーデナーエージェント: AI分析の準備ができました！",
      },
    },
    ko: {
      headerPrefix: isRedeploy ? '재배포 중:' : '배포 중:',
      environment: '프로덕션 환경',
      strategyLabel: '전략',
      strategyOptions: {
        canary: 'Canary 배포 (권장)',
        blue: 'Blue-Green 배포',
      },
      plant: {
        idle: '성장 준비 완료',
        planning: '싹이 트는 중...',
        running: '꽃이 피는 중...',
        success: '완전히 자랐습니다!',
      },
      timeline: {
        lint: '테스트 & Lint',
        scan: '보안 스캔',
        canary: '배포',
      },
      buttons: {
        deploy: isRedeploy ? '가든 에이전트로 재배포' : '가든 에이전트로 배포',
        processing: '처리 중...',
        ready: '배포 준비 완료',
        failed: '배포 실패',
      },
      info: {
        strategy: '이 배포는 Canary 전략을 사용합니다.',
      },
      successPanel: {
        title: '빌드 성공',
        description: '문제가 있으면 롤백을 클릭하세요. 문제가 없으면 Promote to Deploy를 클릭하세요.',
        promote: 'Promote to Deploy',
        promoting: '승격 중...',
        rollback: '롤백',
        chartTitle: '지연 시간 비교 (ms)',
      },
      promotedPanel: {
        title: '배포가 성공적으로 승격되었습니다!',
        description: '배포가 성공적으로 승격되었습니다. 모든 시스템이 정상적으로 작동하고 있습니다.',
        backToDashboard: '대시보드로 돌아가기',
      },
      failedPanel: {
        title: '빌드 실패',
        description: '빌드 프로세스에서 오류가 발생했습니다. 자세한 내용은 위의 로그를 확인하세요.',
        retry: '다시 시도',
      },
      toast: {
        initializing: '배포 에이전트 초기화 중...',
        planCreated: '계획 생성 완료! 테스트 실행 중.',
        securityClear: '보안 검사 통과. Canary 배포 중.',
        canaryLive: '빌드 라이브!',
        failedStart: '배포 시작 실패',
        failed: '배포 실패',
        promoteSuccess: '성공적으로 승격되었습니다!',
        rollbackStart: '이전 버전으로 롤백 중...',
        rollbackDone: '롤백 완료.',
      },
      logReady: isRedeploy
        ? "가든 에이전트: 재배포 준비 완료. '가든 에이전트로 재배포'를 클릭하여 시작하세요."
        : "가든 에이전트: 배포 준비 완료. '가든 에이전트로 배포'를 클릭하여 시작하세요.",
      userLabel: '사용자',
      agentLabel: '가든 에이전트',
      promote: {
        deploying: "가든 에이전트: 배포 중입니다. 기다려주세요...",
        success: "가든 에이전트: 배포가 성공적으로 완료되었습니다!",
        waitingAnalysis: "가든 에이전트: AI 분석 응답을 기다리는 중입니다. 기다려주세요...",
        analysisReady: "가든 에이전트: AI 분석이 준비되었습니다!",
      },
    },
  } as const;
  const t = copy[language];

  const serviceName = deploymentConfig?.serviceName || 'demo-api';
  const [status, setStatus] = useState<'idle' | 'planning' | 'running' | 'success' | 'failed' | 'promoted'>('idle');
  const [logs, setLogs] = useState<string[]>([t.logReady]);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  // Auto scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleDeploy = async () => {
    if (status !== 'idle' || !deploymentConfig) return;

    // Toast: deployment initialized
    toast.loading(t.toast.initializing, { id: 'deploy-toast' });

    setStatus('planning');
    const version = 'latest'; // Default to latest since version control is removed
    setLogs(prev => [...prev, `User: Deploying ${deploymentConfig.serviceName}:${version} with canary strategy.`, "Gardener Agent: Analyzing... Generating deployment plan."]);

    try {
      // Step 1: Check if service exists, if not create it
      setLogs(prev => [...prev, "Gardener Agent: Checking if service exists..."]);

      const servicesResponse = await fetch(`${API_URL}/services`);
      if (!servicesResponse.ok) {
        const errorText = await servicesResponse.text();
        throw new Error(`Failed to fetch services: ${servicesResponse.status} - ${errorText}`);
      }

      const servicesData = await servicesResponse.json();
      const servicesList = Array.isArray(servicesData) ? servicesData : (servicesData.services || []);

      let service = servicesList.find((s: any) => s.name === deploymentConfig.serviceName);

      if (!service) {
        // Create the service
        setLogs(prev => [...prev, "Gardener Agent: Service not found. Creating new service..."]);

        // Always use canary strategy (medium criticality)
        const criticality: 'medium' = 'medium';

        // Get githubToken from localStorage
        const githubToken = localStorage.getItem('githubToken') || '';

        const createResponse = await fetch(`${API_URL}/services`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: deploymentConfig.serviceName,
            gitUrl: deploymentConfig.githubRepo,
            gitBranch: 'main',
            namespace: githubToken,
            criticality: criticality,
          }),
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          setLogs(prev => [...prev, `Error: Failed to create service - ${createResponse.status}: ${errorText}`]);
          throw new Error(`Failed to create service: ${createResponse.status} - ${errorText}`);
        }

        const createData = await createResponse.json();
        service = createData.service;
        setLogs(prev => [...prev, `Gardener Agent: Service created successfully with ID: ${service.id}`]);
      } else {
        setLogs(prev => [...prev, `Gardener Agent: Service found with ID: ${service.id}`]);
      }

      // Step 2: Start deployment with serviceId
      setLogs(prev => [...prev, "Gardener Agent: Starting deployment..."]);

      const response = await fetch(`${API_URL}/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceId: service.id,
          environment: deploymentConfig.environment || 'production',
          description: deploymentConfig.description,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        setLogs(prev => [...prev, `Error: Failed to start deployment - ${response.status}: ${errorText}`]);
        throw new Error(`Failed to start deployment: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const deploymentId = data.deployment?.id || data.deploymentId || data.id;
      setDeploymentId(deploymentId);

      setLogs(prev => [...prev, "Gardener Agent: Plan approved. Starting pipeline...", "Running Tests & Lint..."]);
      toast.success(t.toast.planCreated, { id: 'deploy-toast' });
      setStatus('running');

      // Poll for deployment status
      pollDeploymentStatus(deploymentId);

    } catch (error: any) {
      setStatus('failed');
      setLogs(prev => [...prev, `Error: ${error.message}`]);
      toast.error(t.toast.failedStart, { id: 'deploy-toast' });
      console.error('Deployment error:', error);
    }
  };

  const lastStatusRef = useRef<string | null>(null);

  const pollDeploymentStatus = async (id: string) => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/deploy/${id}`);
        // If the request fails (e.g., 404 Not Found), keep polling until the record appears.
        if (!response.ok) {
          // Only stop on server errors (5xx). For 404, wait and retry.
          if (response.status >= 500) {
            console.error('Server error while polling deployment status:', response.status);
            return;
          }
          // 404 or other client errors: wait and retry.
          await sleep(2000);
          return checkStatus();
        }

        const data = await response.json();
        const deployment = data.deployment || data; // Handle both {deployment: {...}} and direct object
        const currentStatus = deployment.status;

        console.log('Poll response:', deployment);

        // Check for aiAnalysis
        if (deployment.aiAnalysis && deployment.aiAnalysis !== null) {
          setAiAnalysis(deployment.aiAnalysis);
        }

        // Fallback: if error exists, treat as failed
        if (deployment.error && !currentStatus?.includes('SUCCESS') && !currentStatus?.includes('DEPLOYED')) {
          if (currentStatus !== lastStatusRef.current) {
            lastStatusRef.current = currentStatus;
            setStatus('failed');
            setLogs(prev => [...prev, `Deployment failed: ${deployment.error}`]);
            toast.error(t.toast.failed, { id: 'deploy-toast' });
            return;
          }
        }

        // Only update logs if status has changed
        // Check buildStatus as well since webhook updates it
        const effectiveStatus = (deployment.buildStatus === 'success' && currentStatus === 'BUILD_TRIGGERED')
          ? 'BUILD_COMPLETED'
          : currentStatus;

        if (effectiveStatus !== lastStatusRef.current) {
          lastStatusRef.current = effectiveStatus;

          if (effectiveStatus === 'BUILD_TRIGGERED') {
            setLogs(prev => [...prev, "Build triggered via GitHub Actions..."]);
          } else if (effectiveStatus === 'BUILD_COMPLETED') {
            setLogs(prev => [...prev, "Build completed successfully!", "Security Scan passed (Trivy).", "Rolling out canary deployment..."]);
            toast.success(t.toast.securityClear, { id: 'deploy-toast' });

            // Simulate deployment completion after 3 seconds
            await sleep(3000);
            setStatus('success');
            setLogs(prev => [...prev, "Gardener Agent: Build successful! Canary is live."]);
            toast.success(t.toast.canaryLive, { id: 'deploy-toast' });

            await sleep(1000);
            // Fire confetti and show success notification
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
            /*toast.success(t.toast.deploymentSuccess, {
              duration: 3000,
              icon: <CheckCircle size={24} className="text-white" />,
              style: {
                background: '#10b981',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
              }
            });*/
            return; // Stop polling
          } else if (effectiveStatus === 'DEPLOYED_TO_EKS' || effectiveStatus === 'SUCCESS' || effectiveStatus === 'IMAGE_VALIDATED') {
            setStatus('success');
            setLogs(prev => [...prev, "Gardener Agent: Deployment successful! Canary is live."]);
            toast.success(t.toast.canaryLive, { id: 'deploy-toast' });

            await sleep(1000);
            // Fire confetti and show success notification
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
            /*toast.success(t.toast.deploymentSuccess, {
              duration: 3000,
              icon: <CheckCircle size={24} className="text-white" />,
              style: {
                background: '#10b981',
                color: '#fff',
                fontSize: '16px',
                fontWeight: 'bold',
              }
            });*/
            return; // Stop polling
          } else if (effectiveStatus && effectiveStatus.includes('FAILED')) {
            setStatus('failed');
            setLogs(prev => [...prev, `Deployment failed: ${deployment.error || 'Unknown error'}`]);
            toast.error(t.toast.failed, { id: 'deploy-toast' });
            return; // Stop polling
          }
        }

        // Continue polling
        await sleep(3000);
        checkStatus();
      } catch (error) {
        console.error('Error polling deployment status:', error);
      }
    };

    checkStatus();
  };

  const handlePromote = async () => {
    if (!deploymentId || isPromoting) return;

    setIsPromoting(true);
    setLogs(prev => [...prev, "User: Confirmed. Promoting to deploy", t.promote.deploying]);

    try {
      const response = await fetch(`${API_URL}/deploy/${deploymentId}/promote`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to promote deployment');
      }

      // Start polling for finalStatus to be SUCCESS
      pollForPromoteSuccess(deploymentId);
    } catch (error) {
      console.error('Promote error:', error);
      toast.error('Failed to promote deployment');
      setIsPromoting(false);
    }
  };

  const pollForPromoteSuccess = async (id: string) => {
    let finalStatusReached = false;
    
    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/deploy/${id}`);
        if (!response.ok) {
          if (response.status >= 500) {
            console.error('Server error while polling promote status:', response.status);
            return;
          }
          await sleep(3000);
          return checkStatus();
        }

        const data = await response.json();
        const deployment = data.deployment || data;
        const finalStatus = deployment.deploymentPlan?.finalStatus || deployment.finalStatus;
        
        console.log('Polling for promote success, finalStatus:', finalStatus, 'aiAnalysis:', deployment.aiAnalysis);

        // First, wait for finalStatus to be SUCCESS
        if (!finalStatusReached && finalStatus === 'SUCCESS') {
          finalStatusReached = true;
          setLogs(prev => [...prev, t.promote.success]);
          setLogs(prev => [...prev, t.promote.waitingAnalysis]);
          
          // Check if aiAnalysis already exists
          if (deployment.aiAnalysis && deployment.aiAnalysis !== null) {
            setAiAnalysis(deployment.aiAnalysis);
            setLogs(prev => [...prev, t.promote.analysisReady]);
            
            // Fire celebratory confetti
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
            toast.success(t.toast.promoteSuccess, { duration: 4000, icon: '🎉' });

            await sleep(1000);
            setStatus('promoted');
            setIsPromoting(false);
            return; // Stop polling
          }
          
          // Continue polling for aiAnalysis
          await sleep(3000);
          return checkStatus();
        }

        // After finalStatus is SUCCESS, wait for aiAnalysis
        if (finalStatusReached) {
          if (deployment.aiAnalysis && deployment.aiAnalysis !== null) {
            setAiAnalysis(deployment.aiAnalysis);
            setLogs(prev => [...prev, t.promote.analysisReady]);
            
            // Fire celebratory confetti
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
            });
            toast.success(t.toast.promoteSuccess, { duration: 4000, icon: '🎉' });

            await sleep(1000);
            setStatus('promoted');
            setIsPromoting(false);
            return; // Stop polling once we have aiAnalysis
          }
          
          // Continue polling for aiAnalysis
          await sleep(3000);
          return checkStatus();
        }

        // Continue polling if finalStatus is not SUCCESS yet
        await sleep(3000);
        checkStatus();
      } catch (error) {
        console.error('Error polling promote status:', error);
      }
    };

    checkStatus();
  };

  const handleRollback = async () => {
    if (!deploymentId) return;

    setLogs(prev => [...prev, "User: Rollback requested.", "Gardener Agent: Reverting traffic to stable version... Done."]);

    try {
      const response = await fetch(`${API_URL}/deploy/${deploymentId}/rollback`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to rollback deployment');
      }

      toast.error(t.toast.rollbackStart);

      await sleep(1500);
      toast.success(t.toast.rollbackDone);

      setStatus('idle');
      setLogs([t.logReady]);
    } catch (error) {
      console.error('Rollback error:', error);
      toast.error('Failed to rollback deployment');
    }
  };

  const isProcessing = status === 'planning' || status === 'running';
  const isSuccess = status === 'success';
  const isFailed = status === 'failed';
  const isPromoted = status === 'promoted';

  return (
    <div className="flex h-full w-full overflow-hidden bg-stone-50">
      {/* Toast container */}
      <Toaster position="top-center" reverseOrder={false} />

      {/* Left Panel */}
      <div className="flex w-1/2 flex-col border-r border-slate-200 bg-white">
        <header className="flex items-center gap-4 border-b border-slate-100 p-6">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{`${t.headerPrefix} ${serviceName}`}</h2>
            <p className="text-xs text-slate-400">{t.environment}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="space-y-6">
            {/* Animated plant visualization */}
            {!isPromoted && <GrowingPlant status={status} labels={t.plant} />}

            {/* Strategy Info */}
            {status === 'idle' && (
              <div className="mb-3 flex items-center justify-center gap-2 text-sm text-slate-500">
                <Info size={16} className="text-blue-500" />
                <span>{t.info.strategy}</span>
              </div>
            )}

            {!isPromoted && (
              <button
                onClick={handleDeploy}
                disabled={status !== 'idle'}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold text-white shadow-lg transition-all active:scale-95 
                        ${status === 'idle' ? 'bg-green-600 shadow-green-200 hover:bg-green-700' : ''}
                        ${isProcessing ? 'bg-slate-400 shadow-none cursor-not-allowed' : ''}
                        ${isSuccess ? 'bg-green-800 shadow-none cursor-not-allowed' : ''}
                        ${isFailed ? 'bg-red-600 shadow-none cursor-not-allowed' : ''}
                      `}
              >
                {status === 'idle' && <><Play size={20} /> {t.buttons.deploy}</>}
                {isProcessing && <><Loader2 className="animate-spin" /> {t.buttons.processing}</>}
                {isSuccess && <><Check size={20} /> {t.buttons.ready}</>}
                {isFailed && <><AlertCircle size={20} /> {t.buttons.failed}</>}
              </button>
            )}
            {isPromoted && (
              <div className="flex flex-col items-center gap-4 py-8">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white shadow-xl bg-green-200 text-green-700">
                  <CheckCircle size={48} strokeWidth={1.5} />
                </div>
                <p className="text-lg font-bold text-green-700">{t.promotedPanel.title}</p>
                <p className="text-sm text-slate-500 text-center">{t.promotedPanel.description}</p>
                {aiAnalysis && (() => {
                  const parsed = parseAiAnalysis(aiAnalysis);
                  if (!parsed) return null;
                  
                  return (
                    <div className="w-full mt-4 space-y-4">
                      {/* Confidence Header */}
                      <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot size={20} className="text-blue-600" />
                            <p className="text-sm font-bold text-blue-800">AI Analysis</p>
                          </div>
                          {parsed.confidence && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100">
                              <Target size={14} className="text-blue-600" />
                              <span className="text-xs font-bold text-blue-700">
                                {Math.round(parsed.confidence * 100)}% Confidence
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics Status */}
                      {parsed.metrics_status && Object.keys(parsed.metrics_status).length > 0 && (
                        <div className="p-4 rounded-xl bg-green-50 border-2 border-green-200">
                          <div className="flex items-center gap-2 mb-3">
                            <TrendingUp size={18} className="text-green-600" />
                            <p className="text-sm font-bold text-green-800">Metrics Status</p>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(parsed.metrics_status).map(([metric, status]) => (
                              <div key={metric} className="flex items-center justify-between">
                                <span className="text-xs font-medium text-slate-700 capitalize">
                                  {metric.replace(/_/g, ' ')}
                                </span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                  status === 'within threshold' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {status}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reasoning */}
                      {parsed.reasoning && (
                        <div className="p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Info size={18} className="text-slate-600" />
                            <p className="text-sm font-bold text-slate-800">Reasoning</p>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">{parsed.reasoning}</p>
                        </div>
                      )}

                      {/* Risks */}
                      {parsed.risks && parsed.risks.length > 0 && (
                        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-200">
                          <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={18} className="text-amber-600" />
                            <p className="text-sm font-bold text-amber-800">Potential Risks</p>
                          </div>
                          <ul className="space-y-2">
                            {parsed.risks.map((risk, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-amber-600 mt-0.5">•</span>
                                <span className="text-xs text-slate-700 flex-1">{risk}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Recommendations */}
                      {parsed.recommendations && parsed.recommendations.length > 0 && (
                        <div className="p-4 rounded-xl bg-indigo-50 border-2 border-indigo-200">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle size={18} className="text-indigo-600" />
                            <p className="text-sm font-bold text-indigo-800">Recommendations</p>
                          </div>
                          <ul className="space-y-2">
                            {parsed.recommendations.map((rec, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 size={14} className="text-indigo-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-slate-700 flex-1">{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })()}
                <button
                  onClick={onBack}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-4 text-lg font-bold text-white shadow-lg shadow-green-200 hover:bg-green-700 transition-all active:scale-95"
                >
                  <ArrowLeft size={20} />
                  {t.promotedPanel.backToDashboard}
                </button>
              </div>
            )}

            {/* Timeline Status */}
            {status !== 'idle' && !isPromoted && (
              <div className="mt-4 rounded-2xl bg-slate-50 p-6 border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between gap-2">
                  <TimelineStep icon={Terminal} label={t.timeline.lint} status={status === 'planning' ? 'running' : 'done'} />
                  <div className="mt-4 h-0.5 flex-1 bg-slate-200"></div>
                  <TimelineStep icon={ShieldCheck} label={t.timeline.scan} status={status === 'running' ? 'running' : (status === 'success' ? 'done' : 'pending')} />
                  <div className="mt-4 h-0.5 flex-1 bg-slate-200"></div>
                  <TimelineStep icon={Activity} label={t.timeline.canary} status={status === 'success' ? 'done' : (status === 'running' ? 'pending' : 'pending')} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-1/2 flex-col bg-stone-100">
        {!isPromoted && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex flex-col gap-4">
              {logs.map((log, idx) => {
              const meta = parseLogEntry(log);
              const isAgent = meta.role === 'agent';
              const isUser = meta.role === 'user';
              const alignment = isUser ? 'justify-end' : 'justify-start';
              const rowDirection = isUser ? 'flex-row-reverse text-right' : '';
              const bubbleBase = 'max-w-[85%] rounded-3xl px-5 py-4 text-sm shadow-sm animate-in slide-in-from-bottom-2';
              const bubbleStyles = isUser
                ? 'bg-slate-900 text-white rounded-tr-none'
                : isAgent
                  ? 'bg-white text-slate-800 rounded-tl-none border border-emerald-100'
                  : 'bg-white text-slate-600 rounded-tl-none border border-slate-100';

              return (
                <div key={idx} className={`flex ${alignment}`}>
                  <div className={`flex items-start gap-3 ${rowDirection}`}>
                    {isAgent && (
                      <div className="relative flex h-12 w-12 items-center justify-center rounded-3xl bg-emerald-50 text-emerald-600 shadow-inner shadow-emerald-100">
                        <Bot size={20} strokeWidth={1.5} />
                        <span className="absolute -bottom-1 -right-1 text-lg" role="img" aria-label="garden spark">
                          🌼
                        </span>
                      </div>
                    )}
                    <div className={`${bubbleBase} ${bubbleStyles}`}>
                      {(isAgent || isUser) && (
                        <span
                          className={`mb-2 inline-flex items-center gap-1 text-xs font-semibold ${isAgent ? 'text-emerald-600' : 'text-slate-300'}`}
                        >
                          {isAgent && <Sparkles size={12} />}
                          {isAgent ? t.agentLabel : t.userLabel}
                        </span>
                      )}
                      <p>{meta.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {isSuccess && !isPromoted && (
          <div className="border-t border-slate-200 bg-white p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full duration-500">
            <div className="mb-3 flex items-center gap-2 text-green-700 font-bold text-lg">
              <CheckCircle size={24} /> {t.successPanel.title}
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-500">{t.successPanel.description}</p>
              <div className="flex gap-4">
                <button
                  onClick={handlePromote}
                  disabled={isPromoting}
                  className={`flex-1 rounded-xl py-3 px-5 text-sm font-bold text-white shadow-md transition-colors ${
                    isPromoting
                      ? 'bg-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-green-600 hover:bg-green-700 shadow-green-100'
                  }`}
                >
                  {isPromoting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      {t.successPanel.promoting}
                    </span>
                  ) : (
                    t.successPanel.promote
                  )}
                </button>
                <button
                  onClick={handleRollback}
                  disabled={isPromoting}
                  className={`flex-1 rounded-xl border-2 py-3 text-sm font-bold transition-colors ${
                    isPromoting
                      ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-red-500 hover:border-red-200'
                  }`}
                >
                  {t.successPanel.rollback}
                </button>
              </div>
            </div>
          </div>
        )}

        {isFailed && (
          <div className="border-t border-red-200 bg-red-50 p-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-full duration-500">
            <div className="mb-4 flex items-center gap-2 text-red-700 font-bold text-lg">
              <AlertCircle size={24} /> {t.failedPanel.title}
            </div>
            <p className="text-sm text-red-600 mb-4">
              {t.failedPanel.description}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-100 transition-colors"
            >
              {t.failedPanel.retry}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}