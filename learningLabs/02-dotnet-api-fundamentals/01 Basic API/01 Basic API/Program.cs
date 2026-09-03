using _01_Basic_API.Components;

var builder = WebApplication.CreateBuilder(args);

// Service has to be added before the web application is built
builder.Services.AddHealthChecks()
    .AddCheck<HealthCheck>("Sample");

var app = builder.Build();

// Map the health check to an endpoint
app.MapHealthChecks("/health");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.Run();