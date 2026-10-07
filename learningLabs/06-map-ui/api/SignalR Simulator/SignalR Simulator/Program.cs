using _05;
using DealingWithJsonErrors;
using Microsoft.AspNetCore.SignalR;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddSignalR();
builder.Services.AddHostedService<MessagePublisher>();

var app = builder.Build();

app.MapHub<PublisherHub>("/events");

app.Run("http://localhost:5001");

public sealed class PublisherHub : Hub
{
}

public sealed record Message(string Text);

public sealed class MessagePublisher(
    IHubContext<PublisherHub> hub,
    ILogger<MessagePublisher> logger)
    : BackgroundService
{
    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        List<TelemetryDataPoint> telemetryDataPoints = getTelemetryDataPoints(100);
        List<SystemTelemetryDataPoint> systemTelemetryDataPoints = getSystemDataTelemetryPoints(telemetryDataPoints);
        Console.WriteLine("Finished creating data");
        
        while (!stoppingToken.IsCancellationRequested)
        {
            for (int i = 0; i < telemetryDataPoints.Count; i++)
            {
                var message = new Message(JsonSerializer.Serialize(telemetryDataPoints[i]));

                await hub.Clients.All.SendAsync(
                    "MessagePublished",
                    message,
                    stoppingToken);

                logger.LogInformation(
                    "Published: {Text}",
                    message.Text);

                await Task.Delay(
                    TimeSpan.FromMilliseconds(500),
                    stoppingToken);
            }
        }
    }
    
    
    // This is just a simulator so using generated telemetry instead of reading from an ndjson file is ok for now
    private List<SystemTelemetryDataPoint> getSystemDataTelemetryPoints(List<TelemetryDataPoint> telemetryPoints)
        {
            List<SystemTelemetryDataPoint> points = new List<SystemTelemetryDataPoint>();

            foreach (TelemetryDataPoint point in telemetryPoints)
            {
                // Upcast to a SystemDataTelemetryPoint
                // todo ignoring the null case for now
                DateTimeOffset receivedTime = point.TimestampUtc.AddSeconds(1);
                SystemTelemetryDataPoint systemTelemetryDataPoint = new SystemTelemetryDataPoint(point, receivedTime);
                points.Add(systemTelemetryDataPoint);
            }

            return points;
        }


        private List<TelemetryDataPoint> getTelemetryDataPoints(int numPoints)
        {
            DateTimeOffset dateTimeOffset = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
            List<TelemetryDataPoint> points = new List<TelemetryDataPoint>();
            for (int i = 0; i < numPoints; i++)
            {
                double[] coordinates = calculateCoordinates(i, numPoints);
                
                // calculate the heading
                double heading = 0;

                if (points.Count > 1)
                {
                    heading = calculateHeadingDegrees(points[i - 1], coordinates);
                }
                
                TelemetryDataPoint point = new TelemetryDataPoint
                {
                    Type = "telemetry",
                    Version = 1,
                    Seq = i + 1,
                    TimestampUtc = dateTimeOffset,
                    Lat = coordinates[0],
                    Lon = coordinates[1],
                    AltitudeMetres = 1.0,
                    GroundSpeedKmh = 1.0,
                    HeadingDegrees = heading,
                    BatteryVolts = 1
                };
                points.Add(point);
                dateTimeOffset = dateTimeOffset.AddSeconds(1);
            }
            return points;
        }

        private double calculateHeadingDegrees(TelemetryDataPoint previous, double[] coordinates)
        {
            double previousLatRad = previous.Lat * Math.PI / 180;
            double previousLonRad = previous.Lon * Math.PI / 180;
            double latestLatRad = coordinates[0] * Math.PI / 180;
            double latestLonRad = coordinates[1] * Math.PI / 180;
            
            double deltaLon = latestLonRad - previousLonRad;
            // Apply the components of the bearing formula
            double y = Math.Sin(deltaLon) * Math.Cos(latestLatRad);
            double x = (Math.Cos(previousLatRad) * Math.Sin(latestLatRad) -
                        Math.Sin(previousLatRad) * Math.Cos(latestLatRad) * Math.Cos(deltaLon));
    
            // Calculate initial bearing in radians and convert to degrees
            double initialBearingRad = Math.Atan2(y, x);
            double initialBearingDeg = initialBearingRad * 180 / Math.PI;
    
            // Normalize to 0° - 360°
            double compassHeading = (initialBearingDeg + 360) % 360;

            return compassHeading;

        }

        private double[] calculateCoordinates(int i, int numPoints)
        {
            // We'll generate a circle of coordinates around a fixed point
            float radiusMeters = 100;
            float earthRadiusMeters = 6378137;

            // Calculate the angular distance for the circle
            float angularDistanceRadians = radiusMeters / earthRadiusMeters;

            // Centre points
            double centerLatitude = -40.957876;
            double centerLongitude = 174.973096;

            double centerLatitudeRadians = centerLatitude * Math.PI / 180;
            double centerLongitudeRadians = centerLongitude * Math.PI / 180;

            // Calculate coordinates
            double bearingRadians = (2 * Math.PI * i) / numPoints;
            double latOutRad = Math.Asin(Math.Sin(centerLatitudeRadians) * Math.Cos(angularDistanceRadians) +
                                         Math.Cos(centerLatitudeRadians) * Math.Sin(angularDistanceRadians) *
                                         Math.Cos(bearingRadians));
            double latOutDeg = latOutRad * (180 / Math.PI);
            double lonOutRad = centerLongitudeRadians + Math.Atan2(
                Math.Sin(bearingRadians) * Math.Sin(angularDistanceRadians) * Math.Cos(centerLatitudeRadians),
                Math.Cos(angularDistanceRadians) - Math.Sin(centerLatitudeRadians) * Math.Sin(latOutRad)
            );

            // Normalize longitude to be between -180 and +180 degrees
            double lonOutDeg = ((lonOutRad * (180 / Math.PI)) + 540) % 360 - 180;

            return [latOutDeg, lonOutDeg];
        }

        private void transmitData(List<SystemTelemetryDataPoint> points)
        {
            // We'll send data at regular intervals here
            foreach (SystemTelemetryDataPoint point in points)
            {
                Console.WriteLine(point.ToString());
            }
        }
}