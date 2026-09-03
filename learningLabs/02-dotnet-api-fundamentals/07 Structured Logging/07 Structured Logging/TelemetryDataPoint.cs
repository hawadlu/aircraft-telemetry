using System.ComponentModel.DataAnnotations;

namespace DealingWithJsonErrors;

public record TelemetryDataPoint {
	[Required]
	public required string Type { get; init; }

	[Required]
	public required int Version { get; init; }

	[Required]
	public required int Seq { get; init; }

	[Required]
	public required DateTimeOffset TimestampUtc { get; init; }

	[Required]
	public required double Lat { get; init; }

	[Required]
	public required double Lon { get; init; }

	[Required]
	public required double AltitudeMetres { get; init; }

	[Required]
	public required double GroundSpeedKmh { get; init; }

	[Required]
	public required double HeadingDegrees { get; init; }

	[Required]
	public required double BatteryVolts { get; init; }
};
