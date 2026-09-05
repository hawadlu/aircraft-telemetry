using _03_API_Validation;
using DealingWithJsonErrors;

namespace _02_Posting_Api.Validation;

public sealed class TelemetryValidationFilter : IEndpointFilter
{
    private readonly TelemetryValidator _validator;

    public TelemetryValidationFilter(TelemetryValidator validator)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var telemetry = context.Arguments
            .OfType<TelemetryDataPoint>()
            .FirstOrDefault();

        if (telemetry is null)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["body"] = ["Telemetry payload is required."]
            });
        }

        _validator.ValidateAndThrow(telemetry);

        return await next(context);
    }
}