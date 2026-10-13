using System.Text.Json.Serialization;

namespace RentCar.Shared.Models;

public class ApiProblemDetails
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = "about:blank";

    [JsonPropertyName("title")]
    public string Title { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public int Status { get; set; }

    [JsonPropertyName("detail")]
    public string Detail { get; set; } = string.Empty;

    [JsonPropertyName("instance")]
    public string? Instance { get; set; }

    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("traceId")]
    public string TraceId { get; set; } = Guid.NewGuid().ToString("N");

    [JsonPropertyName("errors")]
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public Dictionary<string, string[]>? Errors { get; set; }

    public static ApiProblemDetails Create(
        int status,
        string code,
        string title,
        string detail,
        string? instance = null,
        Dictionary<string, string[]>? errors = null)
    {
        return new ApiProblemDetails
        {
            Status = status,
            Code = code,
            Title = title,
            Detail = detail,
            Instance = instance,
            Errors = errors
        };
    }
}
