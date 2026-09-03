using _05;
using DealingWithJsonErrors;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace _02_Posting_Api;

public class Handler
{
    List<int> receivedSeq;
    bool stale;
    private int staleThresholdMs = 1500;
    DateTimeOffset? lastReceived;
    CancellationTokenSource _cts;

    public Handler()
    {
        Console.WriteLine("Initializing handler");
        this.receivedSeq = new List<int>();
        this.stale = false;
        this.lastReceived = null;

        // Start the timer
        // this._cts = new CancellationTokenSource();
        // _ = RunInfiniteTimerAsync(TimeSpan.FromMilliseconds(500), this._cts.Token);
    }

    public void parseData(TelemetryDataPoint telemetry)
    {
        // We'll parse the data here
        // Throw away out-of-order requests. This also removes duplicate requests
        if (receivedSeq.Count == 0 || telemetry.Seq > receivedSeq.Last())
        {
            receivedSeq.Add(telemetry.Seq);

            // Continue parsing
            DateTimeOffset now = DateTimeOffset.UtcNow;

            // This is where we'd create the system telemetry

            lastReceived = now;
            stale = false;
            Console.WriteLine("Update last received: " + this.lastReceived);
        }
    }

    public async Task RunBackgroundWorkAsync(
        CancellationToken cancellationToken)
    {
        Console.WriteLine($"[Background Check] {this.lastReceived}");
        if (this.lastReceived == null)
        {
        Console.WriteLine("No data yet");
        }
        else
        {
        // There is data, check when it was last received
        TimeSpan interval = DateTimeOffset.UtcNow - lastReceived.Value;
        Console.WriteLine("Data interval: " + interval.TotalMilliseconds);
        if (interval.TotalMilliseconds > staleThresholdMs)
        {
        stale = true;
        Console.WriteLine("Data is stale.");
        }
        Console.WriteLine("Stale: " + stale);
        }
    }
}