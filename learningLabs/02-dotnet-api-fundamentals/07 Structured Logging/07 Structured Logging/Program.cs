using System.Text.Json;
using DealingWithJsonErrors;
using _05;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSerilog((services, loggerConfig) => loggerConfig
    .MinimumLevel.Information()
    .ReadFrom.Configuration(builder.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File(
        "logs/app-.txt",
        rollingInterval: RollingInterval.Day));

var app = builder.Build();

var apiGroup = app.MapGroup("/api");

apiGroup.MapPost("/postTelemetry", async (HttpRequest request, ILogger<Program> logger) =>
{
    var rawJson = await ReadRawBody(request);

    TelemetryDataPoint? telemetry;

    try
    {
        telemetry = JsonSerializer.Deserialize<TelemetryDataPoint>(
            rawJson,
            new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

        if (telemetry is null)
        {
            logger.LogInformation("Rejected empty telemetry request body.");
            return Results.BadRequest("Telemetry body is required.");
        }

        var systemTelemetry = new SystemTelemetryDataPoint(
            telemetry,
            DateTimeOffset.UtcNow);

        logger.LogInformation("Successfully created telemetry seq: {Seq}", telemetry?.Seq);
        await AppendRawTelemetry(rawJson);

        return Results.Created("/api/postTelemetry", systemTelemetry);
    }
    catch (Exception ex) {
        if (ex is JsonException) {
            logger.LogWarning(ex, "Rejected invalid telemetry JSON.");
            return Results.BadRequest("Invalid telemetry JSON.");
        }

        logger.LogError(ex, "Post failed: {Message}", ex.Message);
        return Results.InternalServerError("An unexpected error occurred.");
    }

});

app.Run();

static async Task<string> ReadRawBody(HttpRequest request)
{
    using var reader = new StreamReader(request.Body);
    return await reader.ReadToEndAsync();
}

static async Task AppendRawTelemetry(string rawJson)
{
    Directory.CreateDirectory("logs");

    await File.AppendAllTextAsync(
        "logs/raw-telemetry.txt",
        rawJson + Environment.NewLine);
}