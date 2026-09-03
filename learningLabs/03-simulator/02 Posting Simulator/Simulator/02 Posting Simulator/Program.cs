using _05;
using DealingWithJsonErrors;
using System.Text.Json;

public class Program
{
    public static async Task Main(string[] args)
    {
        List<TelemetryDataPoint> telemetryDataPoints = getTelemetryDataPoints(100);

        await transmitData(telemetryDataPoints);

        List<TelemetryDataPoint> getTelemetryDataPoints(int numPoints)
        {
            DateTimeOffset dateTimeOffset = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
            List<TelemetryDataPoint> points = new List<TelemetryDataPoint>();
            double[] previousCoordinates = [];

            for (int i = 0; i < numPoints; i++)
            {
                double[] coordinates = calculateCoordinates(i, numPoints);
                double headingDegrees = 0;

                // Calculate the heading
                if (previousCoordinates.Length > 0) headingDegrees = calculateHeading(coordinates, previousCoordinates);

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
                    HeadingDegrees = headingDegrees,
                    BatteryVolts = 1
                };
                points.Add(point);
                dateTimeOffset = dateTimeOffset.AddSeconds(1);

                previousCoordinates = coordinates;
            }
            return points;
        }

        double calculateHeading(double[] coordinates, double[] previousCoordinates)
        {
            // Convert to radians
            double startLatRad = previousCoordinates[0] * (Math.PI / 180);
            double startLonRad = previousCoordinates[1] * (Math.PI / 180);
            double endLatRad = coordinates[0] * (Math.PI / 180);
            double endLonRad = coordinates[1] * (Math.PI / 180);

            // Calculate longitude difference
            double deltaLon = endLonRad - startLonRad;

            // Calculate the vector components
            double vectorY = Math.Sin(deltaLon) * Math.Cos(endLatRad);
            double vectorX = Math.Sin(startLatRad) * Math.Sin(endLatRad) - Math.Sin(startLatRad) * Math.Cos(endLatRad) * Math.Cos(deltaLon);
            double headingRad = Math.Atan2(vectorY, vectorX);

            // Convert to degrees
            double headingDegRaw = headingRad * (180 / Math.PI);

            // Convert to compass heading
            return (headingDegRaw + 360) % 360;
        }


        double[] calculateCoordinates(int i, int numPoints)
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

        async Task transmitData(List<TelemetryDataPoint> points)
        {
            HttpClient client = new HttpClient();
            string postUrl = "http://localhost:8080/api/telemetry";
            string getUrl = "http://localhost:8080/api/telemetry/latest";

            // We'll send data at regular intervals here
            foreach (TelemetryDataPoint point in points)
            {
                bool success = await transmitPoint(point, client, postUrl);

                if (success)
                {
                    // Fetch the latest data and check it against the sent data
                    // request = new HttpRequestMessage(HttpMethod.Get, getUrl);
                    HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Get, getUrl);
                    HttpResponseMessage response = client.Send(request);
                    SystemTelemetryDataPoint systemTelemetryDataPoint = response.Content.ReadFromJsonAsync<SystemTelemetryDataPoint>().Result;

                    Console.WriteLine(point);
                    Console.WriteLine(systemTelemetryDataPoint);
                }
                else
                {
                    Console.WriteLine("Send data failed");
                }
            }
        }

        async Task<bool> transmitPoint(TelemetryDataPoint point, HttpClient client, String postUrl)
        {
            // Try five time to submit the data point.
            for (int i = 0; i < 5; i++)
            {
                try
                {
                    HttpRequestMessage request = new HttpRequestMessage(HttpMethod.Post, postUrl);
                    request.Content = JsonContent.Create(point);
                    Task<HttpResponseMessage> responseTask = client.SendAsync(request);
                    HttpResponseMessage response = await responseTask;
                    if (response.IsSuccessStatusCode)
                    {
                        return true;
                    }
                }
                catch (Exception e)
                {
                    Console.WriteLine("HTTP exception. " + e);
                    if (i < 4)
                    {
                        await Task.Delay(100);
                    }
                };
            }

            // Exhausted all attempts so mark this as failed
            return false;
        }
    }
}