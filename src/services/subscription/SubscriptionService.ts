import { PremiumTier } from '../neural/NeuralPersonalAssistant';
import { getAIServiceRouter, PaidFeature, checkFeatureAccess } from '../AIServiceRouter';
import { toast } from 'react-hot-toast';

/**
 * 💳 Subscription Service
 * 
 * Centralized enforcement of Tier-based feature gating.
 * Ensures PAID features are locked for FREE users.
 */
export class SubscriptionService {
    private static instance: SubscriptionService;
    private currentTier: PremiumTier = PremiumTier.FREE;

    private constructor() {
        // Load initial tier from localStorage for immediate gating
        const savedTier = localStorage.getItem('genieflow_user_tier') as PremiumTier;
        if (savedTier && Object.values(PremiumTier).includes(savedTier)) {
            this.currentTier = savedTier;
            console.log(`[SubscriptionService] Initialized with PERSISTED tier: ${this.currentTier}`);
        } else {
            console.log(`[SubscriptionService] Initialized with DEFAULT tier: ${this.currentTier}`);
        }
    }

    public static getInstance(): SubscriptionService {
        if (!SubscriptionService.instance) {
            SubscriptionService.instance = new SubscriptionService();
        }
        return SubscriptionService.instance;
    }

    public setTier(tier: PremiumTier) {
        if (this.currentTier !== tier) {
            console.log(`[SubscriptionService] Switching tier from ${this.currentTier} to ${tier}`);
            this.currentTier = tier;
            localStorage.setItem('genieflow_user_tier', tier);
            
            // Re-sync AIServiceRouter to ensure AI routing follows the new tier
            // We use the singleton factory method to avoid re-initializing if possible
            try {
                const router = getAIServiceRouter(tier);
                router.getUsageStats().tier = tier; // Manual sync if needed
            } catch (error) {
                console.error('[SubscriptionService] Failed to sync AIServiceRouter tier:', error);
            }
        }
    }

    /**
     * Check if a feature is accessible. If not allowed, shows a toast.
     */
    public checkAccess(feature: PaidFeature, silent: boolean = false): boolean {
        const access = checkFeatureAccess(feature, this.currentTier);
        
        if (!access.allowed && !silent) {
            toast.error(access.message, {
                duration: 5000,
                position: 'top-center',
                style: {
                    background: '#1a1a2e',
                    color: '#fff',
                    border: '1px solid #f97316'
                }
            });
        }
        
        return access.allowed;
    }

    /**
     * Get current tier for UI logic
     */
    public getTier(): PremiumTier {
        return this.currentTier;
    }

    /**
     * Special check for Genie Drive document count
     */
    public canAddDocument(currentCount: number): boolean {
        if (this.currentTier !== PremiumTier.FREE) return true;
        
        const limit = 3; 
        if (currentCount >= limit) {
            toast.error(`Free Tier Limit: You've reached the ${limit} document limit for Genie Drive. Please upgrade to Pro Creator for unlimited storage.`);
            return false;
        }
        return true;
    }
}

export const subscriptionService = SubscriptionService.getInstance();
