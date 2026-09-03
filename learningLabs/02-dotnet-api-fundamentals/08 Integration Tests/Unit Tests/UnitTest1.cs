using System.Net.Http.Json;
using System.Text.Json;
using _05;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.VisualStudio.TestPlatform.CommunicationUtilities;

namespace Unit_Tests;

public class UnitTest1 : WebApplicationFactory<Program>
{
    [Fact]
    public async Task Health()
    {
        String url = "/api/health";
        var client = CreateClient();
        var response = await client.GetAsync(url);
        Assert.True(response.IsSuccessStatusCode);
        Assert.Equal(200, (int)response.StatusCode);
    }

    [Fact]
    public async Task PostValid()
    {
        var validJson = new
        {
            type = "telemetry",
            version = 1,
            seq = 42,
            timestampUtc = "2026-06-27T01:23:45Z",
            lat = -41.2865,
            lon = 174.7762,
            altitudeMetres = 25.4,
            groundSpeedKmh = 52.8,
            headingDegrees = 135.0,
            batteryVolts = 12.4
        };

        // Post a telemetry event (valid)
        String url = "/api/postTelemetry";
        var client = CreateClient();
        HttpContent httpContent = JsonContent.Create(validJson);
        var response = await client.PostAsync(url, httpContent);
        Assert.True(response.IsSuccessStatusCode);
        Assert.Equal(201, (int)response.StatusCode);

        // Try to get the latest data
        SystemTelemetryDataPoint? point = await client.GetFromJsonAsync<SystemTelemetryDataPoint>("api/telemetry/latest");
        Assert.NotNull(point);
    }

    [Fact]
    public async Task PostInvalid()
    {
        // Post an invalid telemetry event
        var invalidJson = new
        {
            type = "telemetry",
            version = 0,
            seq = 42,
            timestampUtc = "2026-06-27T01:23:45Z",
            lat = -41.2865,
            lon = 174.7762,
            altitudeMetres = 25.4,
            groundSpeedKmh = 52.8,
            headingDegrees = 135.0,
            batteryVolts = 12.4
        };

        String url = "/api/postTelemetry";
        var client = CreateClient();
        HttpContent httpContent = JsonContent.Create(invalidJson);
        var response = await client.PostAsync(url, httpContent);
        Assert.False(response.IsSuccessStatusCode);
        Assert.Equal(400, (int)response.StatusCode);
    }
}