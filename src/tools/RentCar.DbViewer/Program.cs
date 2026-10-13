using Microsoft.Data.Sqlite;

Console.OutputEncoding = System.Text.Encoding.UTF8;

var baseDir = AppContext.BaseDirectory;
// Find root directory by searching upwards for src/backend
var currentDir = new DirectoryInfo(baseDir);
while (currentDir != null && !Directory.Exists(Path.Combine(currentDir.FullName, "src", "backend")))
{
    currentDir = currentDir.Parent;
}

if (currentDir == null)
{
    currentDir = new DirectoryInfo("E:\\docsrentcar");
}

var rootPath = currentDir.FullName;

Console.ForegroundColor = ConsoleColor.Yellow;
Console.WriteLine("================================================================================");
Console.WriteLine("            RIDELUX MICROSERVICES — DATABASE INSPECTION TOOL                   ");
Console.WriteLine("================================================================================");
Console.ResetColor();

var userDbPath = Path.Combine(rootPath, "src", "backend", "RentCar.UserService", "users.db");
var vehicleDbPath = Path.Combine(rootPath, "src", "backend", "RentCar.VehicleService", "vehicles.db");
var bookingDbPath = Path.Combine(rootPath, "src", "backend", "RentCar.BookingService", "bookings.db");

// 1. User DB
PrintHeader("1. USER SERVICE DATABASE (users.db)", userDbPath);
if (File.Exists(userDbPath))
{
    using var conn = new SqliteConnection($"Data Source={userDbPath};Mode=ReadOnly");
    conn.Open();

    PrintQuery(conn, "SELECT UserId, Name, Email, Role, Status, CreatedAtUtc FROM Users",
        new[] { "UserId", "Name", "Email", "Role", "Status", "CreatedAtUtc" });

    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine("\n  --- [Table: EmailVerifications] ---");
    Console.ResetColor();
    try
    {
        PrintQuery(conn, "SELECT Email, Code, Purpose, IsUsed, ExpiresAtUtc, CreatedAtUtc FROM EmailVerifications",
            new[] { "Email", "Code", "Purpose", "Used", "ExpiresAtUtc", "CreatedAtUtc" });
    }
    catch
    {
        Console.WriteLine("    (Table 'EmailVerifications' not created yet or empty)");
    }
}
else
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("  [!] users.db not found. Run UserService first to create.");
    Console.ResetColor();
}

// 2. Vehicle DB
PrintHeader("2. VEHICLE SERVICE DATABASE (vehicles.db)", vehicleDbPath);
if (File.Exists(vehicleDbPath))
{
    using var conn = new SqliteConnection($"Data Source={vehicleDbPath};Mode=ReadOnly");
    conn.Open();

    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine("  --- [Table: Vehicles] ---");
    Console.ResetColor();
    PrintQuery(conn, "SELECT Id, Brand, Model, LicensePlate, Year, PricePerDay, Status, IsActive FROM Vehicles",
        new[] { "Id", "Brand", "Model", "Plate", "Year", "$/Day", "Status", "Active" });

    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine("\n  --- [Table: VehicleTypes] ---");
    Console.ResetColor();
    PrintQuery(conn, "SELECT Id, Name, Description, IsActive FROM VehicleTypes",
        new[] { "Id", "Category Name", "Description", "Active" });

    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine("\n  --- [Table: Locations] ---");
    Console.ResetColor();
    PrintQuery(conn, "SELECT Id, Name, Description, IsActive FROM Locations",
        new[] { "Id", "Location Name", "Description", "Active" });
}
else
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("  [!] vehicles.db not found. Run VehicleService first to create.");
    Console.ResetColor();
}

// 3. Booking DB
PrintHeader("3. BOOKING SERVICE DATABASE (bookings.db)", bookingDbPath);
if (File.Exists(bookingDbPath))
{
    using var conn = new SqliteConnection($"Data Source={bookingDbPath};Mode=ReadOnly");
    conn.Open();

    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine("  --- [Table: Bookings] ---");
    Console.ResetColor();
    PrintQuery(conn, "SELECT BookingId, VehicleId, Status, TotalPrice, PickupUtc, ReturnUtc, CreatedAtUtc FROM Bookings",
        new[] { "BookingId", "VehicleId", "Status", "Total$", "PickupUtc", "ReturnUtc", "CreatedAtUtc" });

    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine("\n  --- [Table: IdempotencyRecords] ---");
    Console.ResetColor();
    PrintQuery(conn, "SELECT CustomerUserId, IdempotencyKey, BookingId, ResponseStatusCode, CreatedAtUtc FROM IdempotencyRecords",
        new[] { "CustomerUserId", "IdempotencyKey", "BookingId", "Status", "CreatedAtUtc" });

    Console.ForegroundColor = ConsoleColor.Cyan;
    Console.WriteLine("\n  --- [Table: Payments] ---");
    Console.ResetColor();
    try
    {
        PrintQuery(conn, "SELECT PaymentId, BookingId, Amount, PaymentMethod, Status, TransactionReference, PaidAtUtc FROM Payments",
            new[] { "PaymentId", "BookingId", "Amount$", "Method", "Status", "TransactionRef", "PaidAtUtc" });
    }
    catch
    {
        Console.WriteLine("    (Table 'Payments' not created yet or empty)");
    }
}
else
{
    Console.ForegroundColor = ConsoleColor.Red;
    Console.WriteLine("  [!] bookings.db not found. Run BookingService first to create.");
    Console.ResetColor();
}

Console.ForegroundColor = ConsoleColor.Yellow;
Console.WriteLine("\n================================================================================");
Console.WriteLine("                         DATABASE INSPECTION COMPLETED                         ");
Console.WriteLine("================================================================================");
Console.ResetColor();

static void PrintHeader(string title, string path)
{
    Console.ForegroundColor = ConsoleColor.Green;
    Console.WriteLine($"\n================================================================================");
    Console.WriteLine($"  {title}");
    Console.WriteLine($"  Path: {path}");
    Console.WriteLine($"================================================================================");
    Console.ResetColor();
}

static void PrintQuery(SqliteConnection conn, string sql, string[] headers)
{
    using var cmd = conn.CreateCommand();
    cmd.CommandText = sql;
    using var reader = cmd.ExecuteReader();

    var rows = new List<string[]>();
    while (reader.Read())
    {
        var row = new string[reader.FieldCount];
        for (int i = 0; i < reader.FieldCount; i++)
        {
            row[i] = reader.IsDBNull(i) ? "NULL" : reader.GetValue(i)?.ToString() ?? "";
        }
        rows.Add(row);
    }

    if (rows.Count == 0)
    {
        Console.ForegroundColor = ConsoleColor.DarkGray;
        Console.WriteLine("  (No rows found)");
        Console.ResetColor();
        return;
    }

    // Calculate column widths
    var colWidths = new int[headers.Length];
    for (int i = 0; i < headers.Length; i++)
    {
        colWidths[i] = headers[i].Length;
        foreach (var r in rows)
        {
            if (i < r.Length && r[i].Length > colWidths[i])
            {
                colWidths[i] = Math.Min(36, r[i].Length); // max 36 chars per col
            }
        }
    }

    // Print headers
    Console.ForegroundColor = ConsoleColor.White;
    Console.Write("  ");
    for (int i = 0; i < headers.Length; i++)
    {
        Console.Write(headers[i].PadRight(colWidths[i] + 2));
    }
    Console.WriteLine();

    // Print divider
    Console.Write("  ");
    for (int i = 0; i < headers.Length; i++)
    {
        Console.Write(new string('-', colWidths[i]).PadRight(colWidths[i] + 2));
    }
    Console.WriteLine();
    Console.ResetColor();

    // Print rows
    foreach (var r in rows)
    {
        Console.Write("  ");
        for (int i = 0; i < headers.Length; i++)
        {
            var val = i < r.Length ? r[i] : "";
            if (val.Length > 36) val = val.Substring(0, 33) + "...";
            Console.Write(val.PadRight(colWidths[i] + 2));
        }
        Console.WriteLine();
    }
    Console.ForegroundColor = ConsoleColor.DarkGray;
    Console.WriteLine($"  Total records: {rows.Count}");
    Console.ResetColor();
}
