using _04_Short_Buffer;
using _05;
using DealingWithJsonErrors;

// No validation in this lab because we just want to test saving state


var builder = WebApplication.CreateBuilder(args);

var app = builder.Build();

var apiGroup = app.MapGroup("/api");

TelemetryBuffer<SystemTelemetryDataPoint> telemetryBuffer = new TelemetryBuffer<SystemTelemetryDataPoint>(5);

apiGroup.MapPost("/telemetry", (TelemetryDataPoint telemetry) =>
{
    var systemTelemetry = new SystemTelemetryDataPoint(
        telemetry,
        DateTimeOffset.UtcNow);

    // Add tou our buffer
    telemetryBuffer.Enqueue(systemTelemetry);

    return Results.Created("/api/telemetry/recent", systemTelemetry);
});

apiGroup.MapGet("/telemetry/recent", (int? itemsToGet) =>
{
    if (telemetryBuffer.Count == 0)
    {
        return Results.NotFound(new
        {
            message = "No telemetry has been accepted yet."
        });
    }

    if (itemsToGet != null)
    {
        return Results.Ok(telemetryBuffer.GetLastX(itemsToGet.Value));
    }

    return Results.Ok(telemetryBuffer.GetAll());
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();