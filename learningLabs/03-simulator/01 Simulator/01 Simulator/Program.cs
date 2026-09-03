using _05;
using DealingWithJsonErrors;

public class Program
{
    public static void Main(string[] args)
    {
        List<TelemetryDataPoint> telemetryDataPoints = getTelemetryDataPoints(100);
        List<SystemTelemetryDataPoint> systemTelemetryDataPoints = getSystemDataTelemetryPoints(telemetryDataPoints);

        Console.WriteLine("Finished creating data");

        transmitData(systemTelemetryDataPoints);

        List<SystemTelemetryDataPoint> getSystemDataTelemetryPoints(List<TelemetryDataPoint> telemetryPoints)
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


        List<TelemetryDataPoint> getTelemetryDataPoints(int numPoints)
        {
            DateTimeOffset dateTimeOffset = DateTimeOffset.Parse("2026-01-01T00:00:00Z");
            List<TelemetryDataPoint> points = new List<TelemetryDataPoint>();
            for (int i = 0; i < numPoints; i++)
            {
                double[] coordinates = calculateCoordinates(i, numPoints);

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
                    HeadingDegrees = 180,
                    BatteryVolts = 1
                };
                points.Add(point);
                dateTimeOffset = dateTimeOffset.AddSeconds(1);
            }
            return points;
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

        void transmitData(List<SystemTelemetryDataPoint> points)
        {
            // We'll send data at regular intervals here
            foreach (SystemTelemetryDataPoint point in points)
            {
                Console.WriteLine(point.ToString());
            }
        }
    }
}