// Email Service for sending password reset emails and other notifications

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string, userName?: string): Promise<EmailResult> {
    const resetUrl = `${this.getBaseUrl()}/auth/reset-password/${resetToken}`;
    
    const html = this.generatePasswordResetEmailHTML(resetUrl, userName);
    const text = this.generatePasswordResetEmailText(resetUrl, userName);

    return await this.sendEmail({
      to: email,
      subject: 'Reset your Technically Fit password',
      html,
      text
    });
  }

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, userName: string, userRole: 'client' | 'trainer'): Promise<EmailResult> {
    const html = this.generateWelcomeEmailHTML(userName, userRole);
    const text = this.generateWelcomeEmailText(userName, userRole);

    return await this.sendEmail({
      to: email,
      subject: 'Welcome to Technically Fit!',
      html,
      text
    });
  }

  /**
   * Send email verification email
   */
  async sendEmailVerificationEmail(email: string, verificationToken: string, userName?: string): Promise<EmailResult> {
    const verificationUrl = `${this.getBaseUrl()}/auth/verify-email/${verificationToken}`;
    
    const html = this.generateEmailVerificationHTML(verificationUrl, userName);
    const text = this.generateEmailVerificationText(verificationUrl, userName);

    return await this.sendEmail({
      to: email,
      subject: 'Verify your Technically Fit email address',
      html,
      text
    });
  }

  /**
   * Core email sending method
   * This is where you would integrate with your email service provider
   */
  private async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      // TODO: Replace with actual email service integration
      // Examples: Resend, SendGrid, AWS SES, Nodemailer, etc.
      
      // For development, log the email instead of sending
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email would be sent:', {
          to: options.to,
          subject: options.subject,
          preview: options.text?.substring(0, 100) + '...'
        });
        
        // Simulate successful send
        return {
          success: true,
          messageId: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
      }

      // Production email sending would go here
      // Example with Resend:
      /*
      const resend = new Resend(process.env.RESEND_API_KEY);
      const result = await resend.emails.send({
        from: 'Technically Fit <noreply@technicallyfit.com>',
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      });
      
      return {
        success: true,
        messageId: result.data?.id
      };
      */

      // For now, return success in all environments
      return {
        success: true,
        messageId: `placeholder-${Date.now()}`
      };

    } catch (error) {
      console.error('Email sending failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown email error'
      };
    }
  }

  /**
   * Generate password reset email HTML
   */
  private generatePasswordResetEmailHTML(resetUrl: string, userName?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { width: 48px; height: 48px; background: #2563eb; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡</div>
      <h1>Reset Your Password</h1>
    </div>
    
    <p>Hi${userName ? ` ${userName}` : ''},</p>
    
    <p>We received a request to reset your password for your Technically Fit account. Click the button below to create a new password:</p>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </p>
    
    <p>This link will expire in 1 hour for security reasons.</p>
    
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
    
    <div class="footer">
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>© ${new Date().getFullYear()} Technically Fit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate password reset email plain text
   */
  private generatePasswordResetEmailText(resetUrl: string, userName?: string): string {
    return `Hi${userName ? ` ${userName}` : ''},

We received a request to reset your password for your Technically Fit account.

To reset your password, click this link:
${resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} Technically Fit. All rights reserved.`;
  }

  /**
   * Generate welcome email HTML
   */
  private generateWelcomeEmailHTML(userName: string, userRole: 'client' | 'trainer'): string {
    const roleSpecificContent = userRole === 'trainer' 
      ? '<p>As a trainer, you can create and sell training programs, connect with clients, and build your fitness business on our platform.</p>'
      : '<p>As a client, you can browse training programs, connect with certified trainers, and track your fitness journey with our comprehensive tools.</p>';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Technically Fit</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { width: 48px; height: 48px; background: #2563eb; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡</div>
      <h1>Welcome to Technically Fit!</h1>
    </div>
    
    <p>Hi ${userName},</p>
    
    <p>Welcome to Technically Fit! We're excited to have you join our community of fitness enthusiasts and professionals.</p>
    
    ${roleSpecificContent}
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="${this.getBaseUrl()}/dashboard" class="button">Get Started</a>
    </p>
    
    <p>If you have any questions, feel free to reach out to our support team.</p>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} Technically Fit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate welcome email plain text
   */
  private generateWelcomeEmailText(userName: string, userRole: 'client' | 'trainer'): string {
    const roleSpecificContent = userRole === 'trainer' 
      ? 'As a trainer, you can create and sell training programs, connect with clients, and build your fitness business on our platform.'
      : 'As a client, you can browse training programs, connect with certified trainers, and track your fitness journey with our comprehensive tools.';

    return `Hi ${userName},

Welcome to Technically Fit! We're excited to have you join our community of fitness enthusiasts and professionals.

${roleSpecificContent}

Get started: ${this.getBaseUrl()}/dashboard

If you have any questions, feel free to reach out to our support team.

© ${new Date().getFullYear()} Technically Fit. All rights reserved.`;
  }

  /**
   * Generate email verification HTML
   */
  private generateEmailVerificationHTML(verificationUrl: string, userName?: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { width: 48px; height: 48px; background: #2563eb; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡</div>
      <h1>Verify Your Email</h1>
    </div>
    
    <p>Hi${userName ? ` ${userName}` : ''},</p>
    
    <p>Please verify your email address to complete your Technically Fit account setup.</p>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="${verificationUrl}" class="button">Verify Email</a>
    </p>
    
    <p>This verification link will expire in 24 hours.</p>
    
    <div class="footer">
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>© ${new Date().getFullYear()} Technically Fit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
  }

  /**
   * Generate email verification plain text
   */
  private generateEmailVerificationText(verificationUrl: string, userName?: string): string {
    return `Hi${userName ? ` ${userName}` : ''},

Please verify your email address to complete your Technically Fit account setup.

Verification link:
${verificationUrl}

This verification link will expire in 24 hours.

© ${new Date().getFullYear()} Technically Fit. All rights reserved.`;
  }

  /**
   * Get the base URL for the application
   */
  private getBaseUrl(): string {
    // In production, this should be your actual domain
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    
    // For server-side rendering or development
    return process.env.PUBLIC_APP_URL || 'http://localhost:5173';
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();