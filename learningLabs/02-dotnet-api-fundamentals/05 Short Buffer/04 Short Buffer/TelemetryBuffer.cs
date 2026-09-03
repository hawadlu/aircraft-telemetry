namespace _04_Short_Buffer;

public class TelemetryBuffer<T>
{
    private readonly Queue<T> queue = new Queue<T>();

    public int MaxSize { get; }

    public TelemetryBuffer(int maxSize)
    {
        MaxSize = maxSize;
    }

    public void Enqueue(T item)
    {
        queue.Enqueue(item);

        // If we exceed max size, drop the oldest item
        if (queue.Count > MaxSize)
        {
            queue.Dequeue();
        }
    }

    public List<T> GetLastX(int itemsToGet)
    {
        if (itemsToGet <= 0)
        {
            return [];
        }

        return queue
            .TakeLast(itemsToGet)
            .ToList();
    }

    public List<T> GetAll()
    {
        return queue.ToList();
    }

    public T Dequeue() => queue.Dequeue();
    public int Count => queue.Count;
}