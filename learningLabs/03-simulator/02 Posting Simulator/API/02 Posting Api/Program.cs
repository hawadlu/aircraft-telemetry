using System.Text.Json;
using _05;
using DealingWithJsonErrors;

// No validation in this lab because we just want to test saving state


var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

var apiGroup = app.MapGroup("/api");

SystemTelemetryDataPoint? lastData = null;

apiGroup.MapPost("/telemetry", (TelemetryDataPoint telemetry) =>
{
    Console.WriteLine("Incoming telemetry data point");
    // todo ignoring the null case for now
    // TelemetryDataPoint telemetry = JsonSerializer.Deserialize<TelemetryDataPoint>(jsonTelemetry);
    var systemTelemetry = new SystemTelemetryDataPoint(
        telemetry,
        DateTimeOffset.UtcNow);

    lastData = systemTelemetry;

    return Results.Created();
});

apiGroup.MapGet("/telemetry/latest", () => {
    Console.WriteLine("Getting latest telemetry data point");
    if (lastData != null) return Results.Ok(lastData);
    return Results.NotFound();
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();