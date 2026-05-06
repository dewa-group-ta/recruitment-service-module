import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { MoreThan, Repository } from "typeorm";
import { AuthToken } from "../entities/auth-token.entity";
import { Applicant } from "../entities/applicant.entity";
import { EmailService } from "../../../shared/services/email.service";
import { NotificationService } from "../../../shared/services/notification.service";
import { TokenType } from "../../../shared/enums/pipeline.enum";
import * as bcrypt from "bcrypt";
import { randomBytes } from "crypto";

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(AuthToken)
    private readonly tokenRepository: Repository<AuthToken>,
    @InjectRepository(Applicant)
    private readonly applicantRepository: Repository<Applicant>,
    private readonly emailService: EmailService,
    private readonly notificationService: NotificationService
  ) {}

  /**
   * Generate and send login token for applicant
   * @param applicantId - Applicant ID
   * @param jobTitle - Job title for email context
   * @returns Generated token
   */
  async generateAndSendLoginToken(
    applicantId: string,
    jobTitle: string
  ): Promise<string> {
    // Get applicant details
    const applicant = await this.applicantRepository.findOne({
      where: { id: applicantId }
    });

    if (!applicant) {
      throw new Error("Applicant not found");
    }

    // Generate unique token
    const token = this.generateToken();

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create token record
    const authToken = this.tokenRepository.create({
      email: applicant.email,
      token,
      type: TokenType.LOGIN,
      expiresAt,
      isUsed: false,
      applicantId
    });

    await this.tokenRepository.save(authToken);

    const applicationLink = `${process.env.FRONTEND_URL}/validate-token?token=${token}`;

    // Send token via email
    await this.emailService.sendApplicationReceivedEmail(
      applicant.email,
      applicant.fullName,
      jobTitle,
      applicationLink
    );

    return token;
  }

  /**
   * Validate login token and return applicantId if valid.
   * Optionally records IP address and user agent for auditing.
   * @param token - The login token to validate
   * @param ipAddress - (Optional) IP address of the requester
   * @param userAgent - (Optional) User agent string of the requester
   * @returns Applicant ID if valid, null if invalid or expired
   */
  async validateLoginToken(
    token: string,
    ipAddress: string,
    userAgent: string
  ): Promise<string | null> {
    // Find the token record
    const authToken = await this.tokenRepository.findOne({
      where: {
        token,
        type: TokenType.LOGIN,
        isUsed: false
      }
    });

    if (!authToken) {
      // Token not found or already used
      return null;
    }

    // Check if token is expired
    if (new Date() > authToken.expiresAt) {
      return null;
    }

    // Mark token as used and record audit info
    authToken.isUsed = true;
    authToken.usedAt = new Date();
    authToken.ipAddress = ipAddress;
    authToken.userAgent = userAgent;

    await this.tokenRepository.save(authToken);

    return authToken.applicantId;
  }

  /**
   * Validate login token
   * @param token - Token to validate
   * @returns Applicant ID if valid, null if invalid
   */
  async validateToken(
    token: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<string | null> {
    const authToken = await this.tokenRepository.findOne({
      where: {
        token,
        type: TokenType.LOGIN,
        isUsed: true,
        // ipAddress,
        // userAgent,
        expiresAt: MoreThan(new Date())
      }
    });

    if (!authToken) {
      return null;
    }

    // Check if token is expired
    if (new Date() > authToken.expiresAt) {
      return null;
    }

    return authToken.applicantId;
  }

  /**
   * Generate unique token
   * @returns Generated token
   */
  private generateToken(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";

    // Use crypto randomBytes for secure random selection
    const randomBuffer = randomBytes(8);
    for (let i = 0; i < 8; i++) {
      // Convert each byte to a valid index in chars
      const idx = randomBuffer[i] % chars.length;
      result += chars.charAt(idx);
    }

    return bcrypt.hashSync(result, 10);
  }

  /**
   * Generate and send login token for existing applicant
   * @param email - Applicant email address
   * @returns Generated token
   */
  async generateAndSendLoginTokenByEmail(email: string): Promise<string> {
    // Check if applicant exists
    const applicant = await this.applicantRepository.findOne({
      where: { email }
    });

    if (!applicant) {
      throw new Error("Applicant not found with this email address");
    }

    // Check for recent token requests (rate limiting - 1 minute cooldown)
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    console.log(
      `Checking rate limit for email: ${applicant.email}, oneMinuteAgo: ${oneMinuteAgo.toISOString()}`
    );

    const recentToken = await this.tokenRepository
      .createQueryBuilder("token")
      .where("token.email = :email", { email: applicant.email })
      .andWhere("token.type = :type", { type: TokenType.LOGIN })
      .andWhere("token.createdAt >= :oneMinuteAgo", { oneMinuteAgo })
      .orderBy("token.createdAt", "DESC")
      .getOne();

    console.log(
      `Recent token found:`,
      recentToken
        ? {
            id: recentToken.id,
            createdAt: recentToken.createdAt.toISOString(),
            email: recentToken.email
          }
        : "None"
    );

    if (recentToken) {
      const timeRemaining = Math.ceil(
        (recentToken.createdAt.getTime() + 60000 - Date.now()) / 1000
      );
      console.log(`Time remaining: ${timeRemaining} seconds`);
      if (timeRemaining > 0) {
        throw new Error(
          `Please wait ${timeRemaining} seconds before requesting another login token`
        );
      }
    }

    // Generate unique token
    const token = this.generateToken();

    // Set expiration time (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create token record
    const authToken = this.tokenRepository.create({
      email: applicant.email,
      token,
      type: TokenType.LOGIN,
      expiresAt,
      isUsed: false,
      applicantId: applicant.id
    });

    await this.tokenRepository.save(authToken);

    const loginLink = `${process.env.FRONTEND_URL}/validate-token?token=${token}`;

    // Try to send using system configuration template first, fallback to direct email
    try {
      const notificationSent =
        await this.notificationService.sendCustomNotification(
          "notification_applicant_login_token",
          { email: applicant.email, name: applicant.fullName },
          {
            applicant_name: applicant.fullName,
            application_link: loginLink
          }
        );

      if (!notificationSent) {
        // Fallback to direct email if notification template not found
        await this.emailService.sendEmail({
          to: { email: applicant.email, name: applicant.fullName },
          subject: "Your Login Token - Recruitment System",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Login to Your Account</h2>
              <p>Hello ${applicant.fullName},</p>
              <p>You requested to login to your recruitment account. Click the link below to access your account:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginLink}" 
                   style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Login to My Account
                </a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${loginLink}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't request this login, please ignore this email.</p>
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #666; font-size: 12px;">
                This is an automated message from the Recruitment System. Please do not reply to this email.
              </p>
            </div>
          `,
          text: `
            Login to Your Account
            
            Hello ${applicant.fullName},
            
            You requested to login to your recruitment account. Use the link below to access your account:
            
            ${loginLink}
            
            This link will expire in 24 hours.
            
            If you didn't request this login, please ignore this email.
            
            ---
            This is an automated message from the Recruitment System.
          `
        });
      }
    } catch (error) {
      // Log the error and fallback to direct email if notification service fails
      console.error(
        "Notification service failed, falling back to direct email:",
        error
      );
      await this.emailService.sendEmail({
        to: { email: applicant.email, name: applicant.fullName },
        subject: "Your Login Token - Recruitment System",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Login to Your Account</h2>
            <p>Hello ${applicant.fullName},</p>
            <p>You requested to login to your recruitment account. Click the link below to access your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginLink}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Login to My Account
              </a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666;">${loginLink}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't request this login, please ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 12px;">
              This is an automated message from the Recruitment System. Please do not reply to this email.
            </p>
          </div>
        `,
        text: `
          Login to Your Account
          
          Hello ${applicant.fullName},
          
          You requested to login to your recruitment account. Use the link below to access your account:
          
          ${loginLink}
          
          This link will expire in 24 hours.
          
          If you didn't request this login, please ignore this email.
          
          ---
          This is an automated message from the Recruitment System.
        `
      });
    }

    return token;
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    const expiredTokens = await this.tokenRepository
      .createQueryBuilder()
      .delete()
      .where("expires_at < :now", { now: new Date() })
      .execute();

    console.log(`Cleaned up ${expiredTokens.affected} expired tokens`);
  }
}
