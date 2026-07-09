import { useState } from 'react';
import { paymentService } from '../services/paymentService';

export const usePayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentResult, setPaymentResult] = useState(null);

  const processPayment = async (paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.processPayment(paymentData);
      setPaymentResult(result);
      return result;
    } catch (err) {
      setError(err.message || 'Payment failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (transactionId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.verifyPayment(transactionId);
      return result;
    } catch (err) {
      setError(err.message || 'Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getSubscription = async (subscriptionId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.getSubscription(subscriptionId);
      return result;
    } catch (err) {
      setError(err.message || 'Failed to get subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const requestRefund = async (transactionId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await paymentService.requestRefund(transactionId);
      return result;
    } catch (err) {
      setError(err.message || 'Refund request failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    paymentResult,
    processPayment,
    verifyPayment,
    getSubscription,
    requestRefund
  };
};

export default usePayment;