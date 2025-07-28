'use client';

import { ReactNode, useState } from 'react';
import { Crown, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSubscription } from '@/hooks/useSubscription';
import UpgradeModal from '@/components/subscription/UpgradeModal';
import { Permission } from '@/lib/permissions';

interface ProFeatureGateProps {
  children: ReactNode;
  feature: Permission;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  upgradePromptTitle?: string;
  upgradePromptDescription?: string;
}

export default function ProFeatureGate({
  children,
  feature,
  fallback,
  showUpgradePrompt = true,
  upgradePromptTitle,
  upgradePromptDescription
}: ProFeatureGateProps) {
  const { data: session } = useSession();
  const { isPro, loading } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Check if user has the required permission
  const hasRequiredPermission = session?.user?.permissions?.includes(feature) || false;

  // Show loading state
  if (loading) {
    return (
      <div className="animate-pulse bg-[var(--bg-tertiary)] rounded-lg p-4">
        <div className="h-4 bg-[var(--border-color)] rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-[var(--border-color)] rounded w-1/2"></div>
      </div>
    );
  }

  // Check if user has permission for this feature
  const hasAccess = hasRequiredPermission || isPro;

  // If user has access, render the feature
  if (hasAccess) {
    return <>{children}</>;
  }

  // If fallback is provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  if (showUpgradePrompt) {
    const defaultTitle = upgradePromptTitle || getDefaultTitle(feature);
    const defaultDescription = upgradePromptDescription || getDefaultDescription(feature);

    return (
      <>
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-[var(--border-color)] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-color)]">{defaultTitle}</h3>
              <p className="text-sm text-[var(--text-muted)]">{defaultDescription}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade to Pro
            </button>
            <div className="text-xs text-[var(--text-muted)]">
              Starting at ₹1/month • Cancel anytime
            </div>
          </div>
        </div>

        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </>
    );
  }

  // If no upgrade prompt, show locked state
  return (
    <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-lg p-6 text-center">
      <Lock className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
      <p className="text-[var(--text-muted)]">This feature requires a Pro subscription</p>
    </div>
  );
}

// Helper functions to get default titles and descriptions based on feature
function getDefaultTitle(feature: string): string {
  const titles: Record<string, string> = {
    'github:import': 'GitHub Repository Import',
    'chat:unlimited': 'Unlimited Chat History',
    'models:premium': 'Premium AI Models',
    'export:conversations': 'Export Conversations',
    'support:priority': 'Priority Support',
    default: 'Pro Feature'
  };
  
  return titles[feature] || titles.default;
}

function getDefaultDescription(feature: string): string {
  const descriptions: Record<string, string> = {
    'github:import': 'Import entire GitHub repositories for AI analysis and assistance.',
    'chat:unlimited': 'Keep unlimited chat history and never lose your conversations.',
    'models:premium': 'Access to the latest and most powerful AI models.',
    'export:conversations': 'Export your conversations in various formats.',
    'support:priority': 'Get priority customer support and faster response times.',
    default: 'Unlock this premium feature with a Pro subscription.'
  };
  
  return descriptions[feature] || descriptions.default;
}

// Lightweight version for simple feature checks
export function ProBadge({ className }: { className?: string }) {
  const { isPro } = useSubscription();
  
  if (!isPro) return null;
  
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 text-xs font-medium rounded-full ${className}`}>
      <Crown className="w-3 h-3" />
      Pro
    </span>
  );
}

// Hook for checking permissions in components
export function useProFeature(feature: Permission) {
  const { data: session } = useSession();
  const { isPro, loading } = useSubscription();
  
  const hasRequiredPermission = session?.user?.permissions?.includes(feature) || false;
  
  return {
    hasAccess: hasRequiredPermission || isPro,
    isPro,
    loading,
    requiresUpgrade: !hasRequiredPermission && !isPro
  };
} 