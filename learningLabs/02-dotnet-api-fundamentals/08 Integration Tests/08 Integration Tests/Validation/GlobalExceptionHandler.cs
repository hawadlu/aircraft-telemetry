namespace _03_API_Validation;

using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

public sealed class GlobalExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is ValidationException validationException)
        {
            httpContext.Response.StatusCode = StatusCodes.Status400BadRequest;
            httpContext.Response.ContentType = "application/problem+json";

            var problem = new ValidationProblemDetails(
                validationException.Errors.ToDictionary(
                    error => error.Key,
                    error => error.Value))
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid telemetry payload.",
                Detail = "One or more telemetry fields failed validation.",
                Instance = httpContext.Request.Path
            };

            await httpContext.Response.WriteAsJsonAsync(problem, cancellationToken);
            return true;
        }

        httpContext.Response.StatusCode = StatusCodes.Status500InternalServerError;
        httpContext.Response.ContentType = "application/problem+json";

        var genericProblem = new ProblemDetails
        {
            Status = StatusCodes.Status500InternalServerError,
            Title = "An unexpected error occurred.",
            Instance = httpContext.Request.Path
        };

        await httpContext.Response.WriteAsJsonAsync(genericProblem, cancellationToken);
        return true;
    }
}