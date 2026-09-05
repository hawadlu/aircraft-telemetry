using _05;
using DealingWithJsonErrors;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http.HttpResults;

namespace _02_Posting_Api;

public class Handler
{
    private readonly List<int> _receivedSeq;
    private bool _stale;
    private readonly int _staleThresholdMs = 1500;
    private DateTimeOffset? _lastReceivedTime;
    private SystemTelemetryDataPoint? _lastReceivedData;

    public Handler()
    {
        Console.WriteLine("Initializing handler");
        this._receivedSeq = new List<int>();
        this._stale = false;
        this._lastReceivedTime = null;

    }

    public void parseData(TelemetryDataPoint telemetry)
    {
        // We'll parse the data here
        // Throw away out-of-order requests. This also removes duplicate requests
        if (_receivedSeq.Count == 0 || telemetry.Seq > _receivedSeq.Last())
        {
            _receivedSeq.Add(telemetry.Seq);

            // Continue parsing
            DateTimeOffset now = DateTimeOffset.UtcNow;
            
            _lastReceivedTime = now;
            _stale = false;

            // This is where we'd create the system telemetry
            _lastReceivedData = new SystemTelemetryDataPoint(telemetry, now);
            Console.WriteLine("Update last received: " + this._lastReceivedTime);
        }
    }

    public SystemTelemetryDataPoint? getLatestSystemTelemetryDataPoint()
    {
        // We'll always append the current connection status before returning the data
        _lastReceivedData?.SetConnectionStatus(_stale);
        return _lastReceivedData;
    }

    public void RunBackgroundWorkAsync()
    {
        try
        {
            Console.WriteLine($"[Background Check] {this._lastReceivedTime}");
            if (this._lastReceivedTime == null)
            {
                Console.WriteLine("No data yet");
            }
            else
            {
                // There is data, check when it was last received
                TimeSpan interval = DateTimeOffset.UtcNow - _lastReceivedTime.Value;
                Console.WriteLine("Data interval: " + interval.TotalMilliseconds);
                if (interval.TotalMilliseconds > _staleThresholdMs)
                {
                    _stale = true;
                    Console.WriteLine("Data is stale.");
                }
                Console.WriteLine("Stale: " + _stale);
            }
        }
        catch (Exception exception)
        {
            Task.FromException(exception);
        }
    }
}