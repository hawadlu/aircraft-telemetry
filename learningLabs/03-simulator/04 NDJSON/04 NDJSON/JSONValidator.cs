using _05;
using DealingWithJsonErrors;
using NJsonSchema;

public sealed class JsonValidator
{
	private readonly JsonSchema _schema;

	public JsonValidator()
	{
		_schema = JsonSchema.FromType<TelemetryDataPoint>();
	}

	public Utilities.JSONCode Validate(string? json)
	{
		if (string.IsNullOrWhiteSpace(json))
		{
			return Utilities.JSONCode.NullOrEmptyJson;
		}

		try
		{
			var errors = _schema.Validate(json);

			if (errors.Count > 0)
			{
				return Utilities.JSONCode.MissingData;
			}

			return Utilities.JSONCode.OK;
		}
		catch
		{
			return Utilities.JSONCode.MalformedJson;
		}
	}
}