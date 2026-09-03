using System.Net;
using _01_Basic_API.Components;
using _05;
using DealingWithJsonErrors;

var builder = WebApplication.CreateBuilder(args);

// Service has to be added before the web application is built
builder.Services.AddHealthChecks()
    .AddCheck<HealthCheck>("Sample");

var app = builder.Build();

var apiGroup = app.MapGroup("/api");

// Map the health check to an endpoint
app.MapHealthChecks("/health");

apiGroup.MapPost("/postTelemetry", (TelemetryDataPoint telemetry) =>
{
    SystemTelemetryDataPoint systemTelemetry = new SystemTelemetryDataPoint(telemetry, DateTimeOffset.UtcNow);
    return Results.Created("/api/postTelemetry", systemTelemetry);
});

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();