using System.Text.Json;

namespace DealingWithJson {
	class Program
	{
		// use init to make the record immutable and 'required' because all fields must exist
		public record DataPoint {
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
		}

		public static void Main(String[] args) {
			DataPoint pointOne = new DataPoint() {
				Type = "telemetry",
				Version = 1,
				Seq = 1,
				TimestampUtc = DateTimeOffset.Parse("2026-06-10T04:00:01Z"),
				Lat = -41.2861,
				Lon = 174.7762,
				AltitudeMetres = 120.5,
				GroundSpeedKmh = 38.2,
				HeadingDegrees = 94,
				BatteryVolts = 11.7
			};

			// Write to file
			string fileName = "test.json";
			string json = JsonSerializer.Serialize(pointOne);
			File.WriteAllText(fileName, json);
			Console.WriteLine(json);

			// Read valid JSON
			string jsonString = File.ReadAllText(fileName);
			DataPoint deserialized = JsonSerializer.Deserialize<DataPoint>(jsonString)!;
			Console.WriteLine("Deserialized: " + deserialized);

			// Read some invalid JSON
			String invalid = "{'Type':'telemetry','Version':1,'Seq':1,'TimestampUtc':'2026-06-10T04:00:01+00:00','Lat':-41.2861,'Lon':174.7762,'AltitudeMetres':120.5,'GroundSpeedKmh':38.2,'HeadingDegrees':94,'BatteryVolts':11.7}";
			//
			try {
				DataPoint? deserializedInvalid = JsonSerializer.Deserialize<DataPoint>(invalid);

				// Deserialization was successful
			}
			catch (JsonException ex) {
				Console.WriteLine("Caught deserialization error (invalid json");
			}

			// Missing field
			string missingField = "{\"Version\":1,\"Seq\":1,\"TimestampUtc\":\"2026-06-10T04:00:01Z\",\"Lat\":-41.2861,\"Lon\":174.7762,\"AltitudeMetres\":120.5,\"GroundSpeedKmh\":38.2,\"HeadingDegrees\":94,\"BatteryVolts\":11.7}";

			try {
				DataPoint? deserializedMissingField = JsonSerializer.Deserialize<DataPoint>(missingField);
			}
			catch (JsonException ex) {
				Console.WriteLine("Caught deserialization error (missing field)");
			}

			string? nullJson = null;

			if (nullJson != null) {
				// We can safely deserialize
			} else {
				Console.WriteLine("Caught nullJson");
			}
		}
	}
}