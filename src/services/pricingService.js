// src/services/pricingService.js
import { supabase } from './supabaseClient';

export const pricingService = {
  getPricingPlans: async function() {
    try {
      if (!supabase) return [];

      const { data: plans, error: plansError } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (plansError) throw plansError;
      if (!plans || plans.length === 0) return [];

      return plans.map(plan => {
        let features = [];
        if (Array.isArray(plan.features)) {
          features = plan.features;
        } else if (typeof plan.features === 'string') {
          try {
            const parsed = JSON.parse(plan.features);
            if (Array.isArray(parsed)) features = parsed;
          } catch (e) {}
        }

        const monthlyPrice = Number(plan.price ?? plan.price_monthly ?? 0);
        const annualPrice = Number(plan.annual_price ?? plan.price_annual ?? 0);

        return {
          id: plan.id,
          name: plan.name || plan.tier,
          tier: plan.tier,
          description: plan.description,
          price: monthlyPrice,
          annualPrice: annualPrice || null,
          currency: plan.currency || 'ZAR',
          period: plan.period || '/month',
          popular: plan.popular || false,
          note: plan.note,
          badge: plan.badge || null,
          features,
          audience: plan.audience || 'school',
          paystack_plan_code: plan.paystack_plan_code
        };
      });
    } catch (error) {
      console.error('❌ Error in getPricingPlans:', error);
      return [];
    }
  },

  getUserSubscription: async function(userId) {
    try {
      if (!supabase) return null;

      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        return null;
      }

      if (!subData) return null;

      if (subData.plan_id) {
        const { data: planData, error: planError } = await supabase
          .from('pricing_plans')
          .select('*')
          .eq('id', subData.plan_id)
          .maybeSingle();

        if (planData && !planError) {
          subData.plan = planData;
        }
      }

      return subData;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }
};

export default pricingService;