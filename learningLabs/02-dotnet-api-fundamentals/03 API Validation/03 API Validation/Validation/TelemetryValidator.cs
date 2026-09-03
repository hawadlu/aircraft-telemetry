using DealingWithJsonErrors;

namespace _03_API_Validation;

public sealed class TelemetryValidator
{
    public void ValidateAndThrow(TelemetryDataPoint telemetry)
    {
        var errors = new Dictionary<string, string[]>();

        if (string.IsNullOrWhiteSpace(telemetry.Type))
        {
            errors["type"] = ["Type is required."];
        }

        if (telemetry.Version < 1)
        {
            errors["version"] = ["Version must be greater than or equal to 1."];
        }

        if (telemetry.Seq < 1)
        {
            errors["seq"] = ["Seq must be greater than or equal to 1."];
        }

        if (telemetry.TimestampUtc == default)
        {
            errors["timestampUtc"] = ["TimestampUtc is required."];
        }

        if (telemetry.Lat < -90 || telemetry.Lat > 90)
        {
            errors["lat"] = ["Latitude must be between -90 and 90."];
        }

        if (telemetry.Lon < -180 || telemetry.Lon > 180)
        {
            errors["lon"] = ["Longitude must be between -180 and 180."];
        }

        if (telemetry.AltitudeMetres < 0 || telemetry.AltitudeMetres > 20000)
        {
            errors["altitudeMetres"] = ["AltitudeMetres must be between 0 and 20000."];
        }

        if (telemetry.GroundSpeedKmh < -10 || telemetry.GroundSpeedKmh > 2000)
        {
            errors["groundSpeedKmh"] = ["GroundSpeedKmh must be between -10 and 2000."];
        }

        if (telemetry.HeadingDegrees < 0 || telemetry.HeadingDegrees >= 360)
        {
            errors["headingDegrees"] = ["HeadingDegrees must be greater than or equal to 0 and less than 360."];
        }

        if (telemetry.BatteryVolts <= 0 || telemetry.BatteryVolts > 100)
        {
            errors["batteryVolts"] = ["BatteryVolts must be greater than 0 and less than or equal to 100."];
        }

        if (errors.Count > 0)
        {
            throw new ValidationException(errors);
        }
    }
}