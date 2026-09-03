using Microsoft.VisualStudio.TestTools.UnitTesting;
using DealingWithErrors;
using DealingWithJsonErrors;

namespace _05.Tests;

[TestClass]
public class DealingWithErrorsTest
{
	JsonValidator validator = new JsonValidator();
	[TestMethod]
	public void ParseTelemetryDataPoint_WithNull()
	{
		JsonValidator validator = new JsonValidator();
		ParsedData result = Program.ParseTelemetryDataPoint("", validator);

		// Assert
		Assert.AreEqual(Utilities.JSONCode.NullOrEmptyJson, result.GetCode());
	}

	[TestMethod]
	public void ParseTelemetryDataPoint_WithValidJson_ReturnsTelemetryPoint()
	{
		string json = "{\"Type\":\"telemetry\",\"Version\":1,\"Seq\":1,\"TimestampUtc\":\"2026-06-10T04:00:01Z\",\"Lat\":-41.2861,\"Lon\":174.7762,\"AltitudeMetres\":120.5,\"GroundSpeedKmh\":38.2,\"HeadingDegrees\":94,\"BatteryVolts\":11.7}";

		ParsedData result = Program.ParseTelemetryDataPoint(json, validator);

		// Assert
		Assert.IsNotNull(result.GetTelemetry());
		Assert.AreEqual(Utilities.JSONCode.OK, result.GetCode());
	}

	[TestMethod]
	public void ParseTelemetryDataPoint_WithMalformedJson_ReturnsMalformed()
	{
		string json = "{not valid json";

		ParsedData result = Program.ParseTelemetryDataPoint(json, validator);

		// Assert
		Assert.AreEqual(Utilities.JSONCode.MalformedJson, result.GetCode());
	}

	[TestMethod]
	public void ParseTelemetryDataPoint_WithMissingField_ReturnsNull()
	{
		string json = "{\"Type\":\"telemetry\",\"Version\":1,\"Seq\":1,\"TimestampUtc\":\"2026-06-10T04:00:01Z\",\"Lat\":-41.2861,\"Lon\":174.7762,\"AltitudeMetres\":120.5,\"GroundSpeedKmh\":38.2,\"HeadingDegrees\":94}";

		ParsedData result = Program.ParseTelemetryDataPoint(json, validator);

		// Assert
		Assert.AreEqual(Utilities.JSONCode.MissingData, result.GetCode());
	}
}