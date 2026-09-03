namespace _05;

public class ParsedData
{
	private readonly Utilities.JSONCode _jsonCode;
	private readonly SystemTelemetryDataPoint? _telemetry;

	public ParsedData(Utilities.JSONCode jsonCode, SystemTelemetryDataPoint? telemetry = null)
	{
		_jsonCode = jsonCode;
		_telemetry = telemetry;
	}

	public Utilities.JSONCode GetCode()
	{
		return _jsonCode;
	}

	public SystemTelemetryDataPoint? GetTelemetry()
	{
		return _telemetry;
	}
}