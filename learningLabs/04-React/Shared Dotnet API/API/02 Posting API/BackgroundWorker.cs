using _02_Posting_Api;

public class BackgroundWorker : BackgroundService
{
    private readonly Handler _handler;

    public BackgroundWorker(Handler handler)
    {
        _handler = handler;
    }

    protected override async Task ExecuteAsync(
        CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMilliseconds(1500));
        Console.WriteLine("Starting background worker...");

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            _handler.RunBackgroundWorkAsync();
        }
    }
}