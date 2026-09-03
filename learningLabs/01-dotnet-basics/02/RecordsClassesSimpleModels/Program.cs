// {
//     "type":"telemetry",
//     "version":1,"seq":1,
//     "timestampUtc":"2026-06-10T04:00:01Z",
//     "lat":-41.2861,
//     "lon":174.7762,
//     "altitudeMetres":120.5,
//     "groundSpeedKmh":38.2,
//     "headingDegrees":94,
//     "batteryVolts":11.7
// }

namespace RecordDemo;

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

class Program {
    static void Main(string[] args) {
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

        // Use a record `with` expression to create modified copies
        DataPoint pointTwo = pointOne with { Seq = 2, TimestampUtc = pointOne.TimestampUtc.AddSeconds(1) };
        DataPoint pointThree = pointOne with { Seq = 3, TimestampUtc = pointTwo.TimestampUtc.AddSeconds(1) };

        Console.WriteLine(pointOne);
        Console.WriteLine("Points are the same " + pointOne.Equals(pointTwo));

        if (pointThree.Seq > pointOne.Seq) {
            Console.WriteLine("Point three comes after point one");
        }

        Console.WriteLine(pointOne);
        Console.WriteLine(pointTwo);
        Console.WriteLine(pointThree);
    }
}