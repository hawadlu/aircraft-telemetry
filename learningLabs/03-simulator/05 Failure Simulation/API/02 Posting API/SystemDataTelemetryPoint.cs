using System.Diagnostics.CodeAnalysis;
using DealingWithJsonErrors;

namespace _05;

// use inheritance
public record SystemTelemetryDataPoint : TelemetryDataPoint {
	public required DateTimeOffset ReceivedTimeUtc { get; init; }

	// Copy constructor mapping the base person
	[SetsRequiredMembers]
	public SystemTelemetryDataPoint(TelemetryDataPoint telemetry, DateTimeOffset systemDateTimeOffset)
	{
		this.Type = telemetry.Type;
		this.Version = telemetry.Version;
		this.Seq = telemetry.Seq;
		this.TimestampUtc = telemetry.TimestampUtc;
		this.Lat = telemetry.Lat;
		this.Lon = telemetry.Lon;
		this.AltitudeMetres = telemetry.AltitudeMetres;
		this.GroundSpeedKmh = telemetry.GroundSpeedKmh;
		this.HeadingDegrees = telemetry.HeadingDegrees;
		this.BatteryVolts = telemetry.BatteryVolts;

		// This is time that the ground receiver sends
		this.ReceivedTimeUtc = systemDateTimeOffset;
	}
}