using System;
using System.IO;
using System.Text.Json;
using _05;
using DealingWithJsonErrors;

public class Program
{
    public static ParsedData ParseTelemetryDataPoint(string point, JsonValidator validator)
    {
        // Validate the JSON
        Utilities.JSONCode code = validator.Validate(point);

        if (code.Equals(Utilities.JSONCode.OK))
        {
            // Deserialize the JSON
            TelemetryDataPoint? result = JsonSerializer.Deserialize<TelemetryDataPoint>(point);

            if (result is null) return new ParsedData(Utilities.JSONCode.UnknownError);

            // In reality the DateTimeOffset would come from the ground station.
            SystemTelemetryDataPoint systemTelemetryDataPoint =
                new SystemTelemetryDataPoint(result, DateTimeOffset.Now);
            return new ParsedData(Utilities.JSONCode.OK, systemTelemetryDataPoint);
        }

        return new ParsedData(code);
    }

    public static void Main(String[] args)
    {
        string filePath = "data.ndjson";

        JsonValidator validator = new JsonValidator();

// Reads and processes one line at a time
        foreach (string line in File.ReadLines(filePath))
        {
            Console.WriteLine(line);
            Utilities.JSONCode code = validator.Validate(line);
            Console.WriteLine(code);
            Thread.Sleep(50);
        }
    }
}