using _03_API_Validation;
using _05;
using DealingWithJsonErrors;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

builder.Services.AddScoped<TelemetryValidator>();
builder.Services.AddScoped<TelemetryValidationFilter>();

var app = builder.Build();

app.UseExceptionHandler();

var apiGroup = app.MapGroup("/api");

apiGroup.MapPost("/postTelemetry", (TelemetryDataPoint telemetry) =>
    {
        var systemTelemetry = new SystemTelemetryDataPoint(
            telemetry,
            DateTimeOffset.UtcNow);

        return Results.Created("/api/postTelemetry", systemTelemetry);
    })
    .AddEndpointFilter<TelemetryValidationFilter>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();