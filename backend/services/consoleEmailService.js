const consoleEmailService = {
  async sendOrderConfirmation(user, order) {
    // Development environment only
    if (process.env.NODE_ENV === 'development') {
      console.log(`Order confirmation email sent to ${user.email}`);
      console.log(`Order ID: ${order.id}, Status: ${order.status}`);
    }
  },

  async sendPasswordReset(email) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Password reset email sent to ${email}`);
    }
  },

  async sendVerificationEmail(email) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`Verification email sent to ${email}`);
    }
  }
};

module.exports = consoleEmailService;