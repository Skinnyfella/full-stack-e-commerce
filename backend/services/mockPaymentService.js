class MockPaymentService {
  async processPayment(amount, cardDetails) {
    // Mock successful payment flow
    const transactionId = `mock_${Date.now()}`;
    
    return {
      success: true,
      transactionId,
      amount
    };
  }

  async refundPayment(transactionId, amount) {
    return {
      success: true,
      refundId: `refund_${Date.now()}`,
      amount
    };
  }
}

module.exports = new MockPaymentService();