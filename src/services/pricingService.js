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

      // ============================================================
      // Features are stored on pricing_plans.features (JSON array),
      // not in a separate pricing_features table.
      // ============================================================
      return plans.map(plan => {
        // Normalize features — could be an array, JSON string, or null
        let features = [];
        if (Array.isArray(plan.features)) {
          features = plan.features;
        } else if (typeof plan.features === 'string') {
          try {
            const parsed = JSON.parse(plan.features);
            if (Array.isArray(parsed)) features = parsed;
          } catch (e) {
            console.warn('Could not parse features for plan', plan.tier, e.message);
          }
        }

        // ✅ FIXED: read `price` first (matches admin CRUD), fall back to legacy column
        const monthlyPrice = Number(
          plan.price ?? plan.price_monthly ?? 0
        );
        // ✅ FIXED: read `annual_price` first, fall back to legacy column
        const annualPrice = Number(
          plan.annual_price ?? plan.price_annual ?? 0
        );

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
          // ✅ FIXED: pass the DB audience through so Pricing.js can split
          // school vs tertiary. Plans with no audience default to 'school'.
          audience: plan.audience || 'school'
        };
      });
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