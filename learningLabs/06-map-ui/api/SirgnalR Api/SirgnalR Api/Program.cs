using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddHostedService<PublisherListener>();

// 1. Define the policy BEFORE builder.Build()
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173") // Vite frontend
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();
app.UseCors("SignalRPolicy");
app.MapHub<RelayHub>("/events");
app.Run("http://localhost:5002");

public sealed class RelayHub : Hub
{
}

public sealed record Message(string Text);

public sealed class PublisherListener(
    IHubContext<RelayHub> relayHub,
    ILogger<PublisherListener> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        await using var connection = new HubConnectionBuilder()
            .WithUrl("http://localhost:5001/events")
            .WithAutomaticReconnect()
            .Build();

        connection.On<Message>(
            "MessagePublished",
            async message =>
            {
                logger.LogInformation(
                    "Received: {Message}",
                    message.Text);

                // Pass messages to the UI
                await relayHub.Clients.All.SendAsync(
                    "MessagePublished",
                    message,
                    stoppingToken);
            });

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await connection.StartAsync(stoppingToken);
                logger.LogInformation("Connected to PublisherService");
                break;
            }
            catch when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogWarning("Connection failed; retrying");

                await Task.Delay(
                    TimeSpan.FromSeconds(2),
                    stoppingToken);
            }
        }

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }
}