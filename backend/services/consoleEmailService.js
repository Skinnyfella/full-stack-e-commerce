class ConsoleEmailService {
  async sendEmail(to, subject, body) {
    console.log('\n========== EMAIL SENT ==========');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('Body:');
    console.log(body);
    console.log('================================\n');
    
    return { success: true, messageId: `MOCK-EMAIL-${Date.now()}` };
  }
  
  async sendOrderConfirmation(user, order) {
    return this.sendEmail(
      user.email,
      `Order Confirmation #${order.id}`,
      `Thank you for your order, ${user.name}!\n\nOrder details: ${JSON.stringify(order, null, 2)}`
    );
  }

  async sendPasswordReset(user, resetToken) {
    return this.sendEmail(
      user.email,
      'Password Reset Request',
      `You requested a password reset. Use the following token: ${resetToken}\n\nIf you did not request this, please ignore this email.`
    );
  }

  async sendWelcome(user) {
    return this.sendEmail(
      user.email,
      'Welcome to Our E-commerce Store!',
      `Hello ${user.first_name},\n\nThank you for registering with our store. We're excited to have you as a customer!`
    );
  }
}

module.exports = new ConsoleEmailService(); 