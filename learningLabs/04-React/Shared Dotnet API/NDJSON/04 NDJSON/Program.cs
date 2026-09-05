using System;
using System.IO;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;

public class Program
{
    public static async Task Main(String[] args)
    {
        string filePath = "data.ndjson";
        HttpClient client = new HttpClient();
        string postUrl = "http://localhost:3000/api/telemetry";

        // Reads and processes one line at a time
        foreach (string telemetry in File.ReadLines(filePath))
        {
            // As a test we'll fail randomly about once in every three transmits
            bool fail = Random.Shared.Next(1, 4) == 2;

            if (!fail)
            {
                // We'll only accept the json if it is actually a valid telemetry point
                // Further sequence validation is to be done with the API
                Console.WriteLine(telemetry);
                await transmitPoint(telemetry, client, postUrl);

                // We'll sleep somewhere from 1ms to 2000ms
                Thread.Sleep(Random.Shared.Next(2001));
            }
        }
    }

    static async Task transmitPoint(String telemetry, HttpClient client, String postUrl)
    {
        // Try to submit the data point
        try
        {
            // 1. Explicitly set the media type to JSON (or text/plain if required)
            using HttpContent content = new StringContent(telemetry, Encoding.UTF8, "application/json");

            // 2. Await the call directly without the separate Task variable
            using HttpResponseMessage response = await client.PostAsync(postUrl, content);

        }
        catch (Exception e)
        {
            Console.WriteLine("HTTP exception. " + e);
        }
    }
}