using System.Diagnostics.CodeAnalysis;

namespace DealingWithJson {
	class Program {
		// use init to make the record immutable and 'required' because all fields must exist

		public record TelemetryDataPoint {
			public required string Type { get; init; }
			public required int Version { get; init; }
			public required int Seq { get; init; }
			public required DateTimeOffset TimestampUtc { get; init; }
			public required double Lat { get; init; }
			public required double Lon { get; init; }
			public required double AltitudeMetres { get; init; }
			public required double GroundSpeedKmh { get; init; }
			public required double HeadingDegrees { get; init; }
			public required double BatteryVolts { get; init; }
		};

		// use inheritance
		public record SystemTelemetryDataPoint : TelemetryDataPoint {
			public required DateTimeOffset ReceivedTimeUts { get; init; }

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
				this.ReceivedTimeUts = systemDateTimeOffset;
			}
		}

		public static void Main(String[] args) {
			for (int i = 0; i < 10; i++) {
				DateTimeOffset dateTimeOffset = DateTime.UtcNow;
				TelemetryDataPoint point = new TelemetryDataPoint() {
					Type = "telemetry",
					Version = 1,
					Seq = 1,
					TimestampUtc = dateTimeOffset,
					Lat = -41.2861,
					Lon = 174.7762,
					AltitudeMetres = 120.5,
					GroundSpeedKmh = 38.2,
					HeadingDegrees = 94,
					BatteryVolts = 11.7
				};

				Thread.Sleep(1000);
				SystemTelemetryDataPoint systemTelemetryDataPoint = new SystemTelemetryDataPoint(point, DateTimeOffset.UtcNow);
				Console.WriteLine(systemTelemetryDataPoint);
			}
		}
	}
}