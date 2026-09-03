using _01_Basic_API.Components;
using _03_API_Validation;
using _05;
using DealingWithJsonErrors;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddScoped<TelemetryValidator>();
builder.Services.AddScoped<TelemetryValidationFilter>();

// Service has to be added before the web application is built
builder.Services.AddHealthChecks()
    .AddCheck<HealthCheck>("Sample");


var app = builder.Build();

app.UseExceptionHandler();

var apiGroup = app.MapGroup("/api");

SystemTelemetryDataPoint? lastData = null;

// Map the health check to an endpoint
apiGroup.MapHealthChecks("/health");


apiGroup.MapGet("/telemetry/latest", () =>{
    if (lastData != null)
    {
        return Results.Ok(lastData);
    }
    return Results.NotFound();
});

apiGroup.MapPost("/postTelemetry", (TelemetryDataPoint telemetry) =>
    {
        var systemTelemetry = new SystemTelemetryDataPoint(
            telemetry,
            DateTimeOffset.UtcNow);

        lastData = systemTelemetry;
        return Results.Created("/api/postTelemetry", systemTelemetry);
    })
    .AddEndpointFilter<TelemetryValidationFilter>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();