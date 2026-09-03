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

apiGroup.MapPost("/postTelemetry", async (HttpRequest request) =>
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
    }
    catch (JsonException ex)
    {
        Log.Warning(ex, "Rejected invalid telemetry JSON.");
        return Results.BadRequest("Invalid telemetry JSON.");
    }

    if (telemetry is null)
    {
        Log.Warning("Rejected empty telemetry request body.");
        return Results.BadRequest("Telemetry body is required.");
    }

    await AppendRawTelemetry(rawJson);

    var systemTelemetry = new SystemTelemetryDataPoint(
        telemetry,
        DateTimeOffset.UtcNow);

    return Results.Created("/api/postTelemetry", systemTelemetry);
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