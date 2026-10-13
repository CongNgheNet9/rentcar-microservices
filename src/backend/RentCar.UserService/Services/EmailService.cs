using System.Net;
using System.Net.Mail;

namespace RentCar.UserService.Services;

public interface IEmailService
{
    Task<bool> SendVerificationCodeAsync(string toEmail, string code, string purpose);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration config, ILogger<EmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public async Task<bool> SendVerificationCodeAsync(string toEmail, string code, string purpose)
    {
        var host = _config["SmtpSettings:Host"] ?? "smtp.gmail.com";
        var port = int.TryParse(_config["SmtpSettings:Port"], out var p) ? p : 587;
        var senderEmail = _config["SmtpSettings:SenderEmail"];
        var senderPassword = _config["SmtpSettings:SenderPassword"];
        var senderName = _config["SmtpSettings:SenderName"] ?? "RideLux Luxury Fleet";

        _logger.LogInformation("================================================================================");
        _logger.LogInformation(">>> [GMAIL VERIFICATION OTP]");
        _logger.LogInformation(">>> Recipient: {Email}", toEmail);
        _logger.LogInformation(">>> 6-Digit Code: {Code}", code);
        _logger.LogInformation(">>> Purpose: {Purpose}", purpose);
        _logger.LogInformation(">>> Expires: 10 minutes");
        _logger.LogInformation("================================================================================");

        // If credentials are provided, attempt real SMTP delivery via Gmail
        if (!string.IsNullOrWhiteSpace(senderEmail) && !string.IsNullOrWhiteSpace(senderPassword))
        {
            try
            {
                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = true,
                    Credentials = new NetworkCredential(senderEmail, senderPassword),
                    Timeout = 8000
                };

                var mail = new MailMessage
                {
                    From = new MailAddress(senderEmail, senderName),
                    Subject = $"[{code}] Your RideLux Gmail Verification Code",
                    IsBodyHtml = true,
                    Body = $@"
<div style=""font-family: Arial, sans-serif; background-color: #0b0b0b; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 520px; margin: 0 auto; border: 1px solid #DFB15B;"">
    <div style=""text-align: center; margin-bottom: 24px;"">
        <h1 style=""color: #DFB15B; letter-spacing: 4px; margin: 0;"">RIDELUX</h1>
        <p style=""color: #888888; font-size: 11px; letter-spacing: 2px; text-transform: uppercase;"">LUXURY FLEET VERIFICATION</p>
    </div>
    <div style=""background-color: #171717; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #333333;"">
        <p style=""font-size: 14px; color: #cccccc; margin-top: 0;"">Use the following one-time verification code to complete your registration:</p>
        <div style=""font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #DFB15B; background-color: #222222; padding: 16px; border-radius: 8px; margin: 20px 0; font-family: monospace;"">
            {code}
        </div>
        <p style=""font-size: 12px; color: #888888; margin-bottom: 0;"">This code is valid for 10 minutes. Do not share this code with anyone.</p>
    </div>
    <p style=""font-size: 11px; color: #555555; text-align: center; margin-top: 24px;"">© 2026 RideLux Technologies Inc. All rights reserved.</p>
</div>"
                };

                mail.To.Add(toEmail);
                await client.SendMailAsync(mail);
                _logger.LogInformation(">>> Real SMTP message dispatched successfully to {Email}", toEmail);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(">>> SMTP dispatch warning: {Message}. (Falling back to simulated code logging)", ex.Message);
            }
        }

        return true;
    }
}
