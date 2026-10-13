namespace RentCar.Shared.Security;

public class JwtSettings
{
    public const string SectionName = "JwtSettings";
    public string SecretKey { get; set; } = "RentCar_SuperSecretKey_For_Microservices_Auth_2026_Secure_Key_!";
    public string Issuer { get; set; } = "RentCar.UserService";
    public string Audience { get; set; } = "RentCar.Platform";
    public int ExpiryMinutes { get; set; } = 120;
}
