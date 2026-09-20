using System.ComponentModel.DataAnnotations;

namespace DealingWithJsonErrors;

public record TelemetryDataPoint
{

	[Required]
	public required string Type { get; init; }

	[Range(1, int.MaxValue)]
	public required int Version { get; init; }

	[Range(1, int.MaxValue)]
	public required int Seq { get; init; }

	[Required]
	public required DateTimeOffset TimestampUtc { get; init; }

	[Range(-90, 90)]
	public required double Lat { get; init; }

	[Range(-180, 180)]
	public required double Lon { get; init; }

	[Range(0, int.MaxValue)]
	public required double AltitudeMetres { get; init; }

	[Range(-10, int.MaxValue)]
	public required double GroundSpeedKmh { get; init; }

	[Range(0.01, 360)]
	public required double HeadingDegrees { get; init; }

	[Range(0, 100)]
	public required double BatteryVolts { get; init; }
};
