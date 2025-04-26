class MockPaymentService {
  async processPayment(amount, cardDetails) {
    console.log(`PAYMENT ATTEMPT: $${amount} with card ending in ${cardDetails.number.slice(-4)}`);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success/failure (90% success rate)
    const isSuccessful = Math.random() < 0.9;
    
    if (isSuccessful) {
      console.log(`PAYMENT SUCCESS: Transaction ID: MOCK-${Date.now()}`);
      return {
        success: true,
        transactionId: `MOCK-${Date.now()}`,
        message: 'Payment processed successfully'
      };
    } else {
      console.log('PAYMENT FAILED: Card declined');
      return {
        success: false,
        error: 'Card declined',
        message: 'Payment processing failed'
      };
    }
  }

  async refundPayment(transactionId, amount) {
    console.log(`REFUND ATTEMPT: $${amount} for transaction ${transactionId}`);
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log(`REFUND SUCCESS for transaction ${transactionId}`);
    return {
      success: true,
      refundId: `REFUND-${Date.now()}`,
      message: 'Refund processed successfully'
    };
  }
}

module.exports = new MockPaymentService(); 