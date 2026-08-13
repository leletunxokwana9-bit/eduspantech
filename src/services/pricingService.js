// src/services/pricingService.js
import { supabase } from './supabaseClient';

const pricingService = {
  getPricingPlans: async function() {
    try {
      // Check if supabase is available
      if (!supabase) {
        console.error('❌ Supabase client not available');
        return [];
      }

      console.log('📊 Fetching pricing plans from Supabase...');
      
      const { data: plans, error: plansError } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (plansError) {
        console.error('❌ Error fetching plans:', plansError);
        throw plansError;
      }

      console.log('✅ Plans fetched:', plans);

      if (!plans || plans.length === 0) {
        console.warn('⚠️ No plans found in database');
        return [];
      }

      const planIds = plans.map(plan => plan.id);
      const { data: features, error: featuresError } = await supabase
        .from('pricing_features')
        .select('*')
        .in('plan_id', planIds)
        .eq('is_included', true)
        .order('display_order', { ascending: true });

      if (featuresError) {
        console.error('❌ Error fetching features:', featuresError);
      }

      const featuresByPlan = {};
      if (features) {
        features.forEach(feature => {
          if (!featuresByPlan[feature.plan_id]) {
            featuresByPlan[feature.plan_id] = [];
          }
          featuresByPlan[feature.plan_id].push(feature.feature);
        });
      }

      return plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        description: plan.description,
        price: plan.price_monthly,
        annualPrice: plan.price_annual,
        currency: plan.currency || 'ZAR',
        period: plan.period || '/month',
        popular: plan.popular || false,
        note: plan.note,
        features: featuresByPlan[plan.id] || []
      }));
    } catch (error) {
      console.error('❌ Error in getPricingPlans:', error);
      return [];
    }
  },

  getUserSubscription: async function(userId) {
    try {
      if (!supabase) {
        console.error('❌ Supabase client not available');
        return null;
      }

      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, plan:pricing_plans(*)')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }
};

export default pricingService;
export { pricingService };