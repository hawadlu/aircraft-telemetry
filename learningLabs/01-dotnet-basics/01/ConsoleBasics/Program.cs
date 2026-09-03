if (args.Length != 0)
{
    String mode = args[0];

    if (mode == "alpha") Console.WriteLine("mode alpha");
    else if (mode == "beta") Console.WriteLine("mode beta");
} else {
    Console.WriteLine("No arguments supplied");
}