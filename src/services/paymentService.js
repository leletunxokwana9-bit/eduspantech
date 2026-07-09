const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

const MOCK_PAYMENT_RESPONSE = {
  success: true,
  transactionId: 'txn_' + Date.now(),
  subscriptionId: 'sub_' + Date.now(),
  plan: {
    id: 2,
    name: 'Gold',
    tier: 'Tier_Gold',
    price: 'R200',
    period: '/month',
    currency: 'ZAR'
  },
  user: {
    id: 'user_' + Date.now(),
    name: 'John Doe',
    email: 'john@example.com',
    cohort: 'HighSchool'
  },
  paymentMethod: 'card',
  status: 'completed',
  timestamp: new Date().toISOString(),
  nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
};

export const paymentService = {
  processPayment: async (paymentData) => {
    if (IS_DEVELOPMENT) {
      console.log('💳 Processing payment (development mode):', paymentData);
      await new Promise(resolve => setTimeout(resolve, 1500));

      return {
        ...MOCK_PAYMENT_RESPONSE,
        user: {
          ...MOCK_PAYMENT_RESPONSE.user,
          name: paymentData.fullName,
          email: paymentData.email
        },
        plan: paymentData.plan,
        paymentMethod: paymentData.paymentMethod
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payment/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) throw new Error('Payment failed');
      return response.json();
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  },

  verifyPayment: async (transactionId) => {
    if (IS_DEVELOPMENT) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { status: 'completed', transactionId };
    }

    const response = await fetch(`${API_BASE_URL}/payment/verify/${transactionId}`);
    if (!response.ok) throw new Error('Verification failed');
    return response.json();
  },

  getSubscription: async (subscriptionId) => {
    if (IS_DEVELOPMENT) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        id: subscriptionId,
        plan: 'Gold',
        tier: 'Tier_Gold',
        status: 'active',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: [
          'Live drop-in evening homework clinics',
          'Real-time interactive whiteboard',
          '24/7 Access to recorded lessons',
          'Homework help from expert tutors',
          'Weekly progress reports'
        ]
      };
    }

    const response = await fetch(`${API_BASE_URL}/subscription/${subscriptionId}`);
    if (!response.ok) throw new Error('Failed to fetch subscription');
    return response.json();
  },

  cancelSubscription: async (subscriptionId) => {
    if (IS_DEVELOPMENT) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true, message: 'Subscription cancelled successfully' };
    }

    const response = await fetch(`${API_BASE_URL}/subscription/${subscriptionId}/cancel`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Cancellation failed');
    return response.json();
  },

  requestRefund: async (transactionId) => {
    if (IS_DEVELOPMENT) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Refund request submitted. Audit in progress.',
        auditRequired: true,
        gracePeriod: '72 hours'
      };
    }

    const response = await fetch(`${API_BASE_URL}/payment/refund/${transactionId}`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Refund request failed');
    return response.json();
  }
};

export default paymentService;