using System.Text.Json;
using _02_Posting_Api;
using _02_Posting_Api.Validation;
using _05;
using DealingWithJsonErrors;
using Microsoft.AspNetCore.Mvc;

public class Program
{
    public static void Main(string[] args)
    {
        // Load validators
        var builder = WebApplication.CreateBuilder(args);
        builder.Services.AddProblemDetails();
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

        builder.Services.AddScoped<TelemetryValidator>();
        builder.Services.AddScoped<TelemetryValidationFilter>();

        builder.Services.AddSingleton<Handler>();
        builder.Services.AddHostedService<BackgroundWorker>();

        var app = builder.Build();
        app.UseExceptionHandler();

        var apiGroup = app.MapGroup("/api");

        // Create an instance of the handler
        // Handler handler = new Handler();

        apiGroup.MapPost("/telemetry", ([FromBody] TelemetryDataPoint telemetry, Handler handler) =>
        {
            Console.WriteLine(telemetry);
            handler.parseData(telemetry);
        }).AddEndpointFilter<TelemetryValidationFilter>();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.Run();
    }
}