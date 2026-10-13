using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RentCar.BookingService.Data;
using RentCar.BookingService.DTOs;
using RentCar.BookingService.Entities;
using RentCar.BookingService.Infrastructure.Redis;
using RentCar.BookingService.Infrastructure.Sharding;
using RentCar.BookingService.Services;
using RentCar.Shared.Constants;
using RentCar.Shared.Models;

namespace RentCar.BookingService.Controllers;

[ApiController]
[Route("bookings")]
[Authorize]
public class BookingsController : ControllerBase
{
    private readonly BookingDbContext _db;
    private readonly VehicleServiceClient _vehicleClient;
    private readonly BookingLockManager _lockManager;
    private readonly IRedisIdempotencyService _redisIdempotency;
    private readonly ILogger<BookingsController> _logger;

    private static readonly string[] ReservationHoldingStatuses = { "Pending", "Confirmed", "Active" };

    public BookingsController(
        BookingDbContext db,
        VehicleServiceClient vehicleClient,
        BookingLockManager lockManager,
        IRedisIdempotencyService redisIdempotency,
        ILogger<BookingsController> logger)
    {
        _db = db;
        _vehicleClient = vehicleClient;
        _lockManager = lockManager;
        _redisIdempotency = redisIdempotency;
        _logger = logger;
    }

    [HttpPost("availability")]
    public async Task<IActionResult> CheckAvailability([FromBody] CheckAvailabilityRequest request)
    {
        if (request.ReturnUtc <= request.PickupUtc)
        {
            return UnprocessableEntity(ApiProblemDetails.Create(
                422,
                "booking.invalid_period",
                "Invalid Rental Period",
                "Return time must be after pickup time.",
                Request.Path
            ));
        }

        // 1. Check vehicle service eligibility
        var eligibility = await _vehicleClient.CheckEligibilityAsync(request.VehicleId);
        if (eligibility == null)
        {
            return StatusCode(StatusCodes.Status502BadGateway, ApiProblemDetails.Create(
                502,
                "dependency.vehicle_service_error",
                "Bad Gateway",
                "Vehicle Service is temporarily unavailable.",
                Request.Path
            ));
        }

        if (!eligibility.IsEligible)
        {
            return Ok(new AvailabilityResponse
            {
                IsAvailable = false,
                Reason = eligibility.IneligibleReason ?? "Vehicle is currently unavailable for rental."
            });
        }

        // 2. Check overlap in Booking DB
        var overlap = await _db.Bookings
            .AsNoTracking()
            .Where(b => b.VehicleId == request.VehicleId
                     && ReservationHoldingStatuses.Contains(b.Status)
                     && b.PickupUtc < request.ReturnUtc
                     && b.ReturnUtc > request.PickupUtc)
            .FirstOrDefaultAsync();

        if (overlap != null)
        {
            return Ok(new AvailabilityResponse
            {
                IsAvailable = false,
                Reason = "OverlappingBooking",
                OverlappingBookingId = overlap.BookingId
            });
        }

        return Ok(new AvailabilityResponse
        {
            IsAvailable = true
        });
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequest request)
    {
        if (request.ReturnUtc <= request.PickupUtc)
        {
            return UnprocessableEntity(ApiProblemDetails.Create(
                422,
                "booking.invalid_period",
                "Invalid Rental Period",
                "Return time must be strictly after pickup time.",
                Request.Path
            ));
        }

        if (!Request.Headers.TryGetValue("Idempotency-Key", out var rawIdempotencyKey) ||
            string.IsNullOrWhiteSpace(rawIdempotencyKey))
        {
            return BadRequest(ApiProblemDetails.Create(
                400,
                "request.missing_idempotency_key",
                "Missing Idempotency Key",
                "The 'Idempotency-Key' HTTP header is required for booking creation.",
                Request.Path
            ));
        }

        var idempotencyKey = rawIdempotencyKey.ToString().Trim();
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(currentUserIdStr) || !Guid.TryParse(currentUserIdStr, out var customerUserId))
        {
            return Unauthorized(ApiProblemDetails.Create(
                401,
                "auth.invalid_token",
                "Unauthorized",
                "Invalid customer identity in token.",
                Request.Path
            ));
        }

        var isAdmin = User.IsInRole(UserRoles.Admin);

        // Calculate Request Hash for Idempotency
        var payloadToHash = $"{request.VehicleId}_{request.PickupLocationId}_{request.ReturnLocationId}_{request.PickupUtc:O}_{request.ReturnUtc:O}_{request.IsDirectPickup}";
        var requestHash = SHA256.HashData(Encoding.UTF8.GetBytes(payloadToHash));

        // 1. Fast Redis Replica Idempotency check
        var cachedRedis = await _redisIdempotency.GetRecordAsync(customerUserId, idempotencyKey);
        if (cachedRedis != null)
        {
            var cachedHash = Convert.FromBase64String(cachedRedis.RequestHashBase64);
            if (cachedHash.SequenceEqual(requestHash))
            {
                _logger.LogInformation("Replaying cached booking response from Redis for key {Key}", idempotencyKey);
                return Content(cachedRedis.ResponseBody, "application/json");
            }
            else
            {
                return Conflict(ApiProblemDetails.Create(
                    409,
                    "request.idempotency_conflict",
                    "Idempotency Key Conflict",
                    "The idempotency key was previously used with a different request payload.",
                    Request.Path
                ));
            }
        }

        // 2. Check DB Idempotency Records fallback
        var existingKeyRecord = await _db.IdempotencyRecords
            .AsNoTracking()
            .FirstOrDefaultAsync(k => k.CustomerUserId == customerUserId && k.IdempotencyKey == idempotencyKey);

        if (existingKeyRecord != null)
        {
            if (existingKeyRecord.RequestHash.SequenceEqual(requestHash))
            {
                // Replay idempotent response and backfill Redis
                await _redisIdempotency.SetRecordAsync(
                    customerUserId,
                    idempotencyKey,
                    requestHash,
                    existingKeyRecord.ResponseStatusCode,
                    existingKeyRecord.ResponseBody,
                    TimeSpan.FromHours(24));

                return Content(existingKeyRecord.ResponseBody, "application/json");
            }
            else
            {
                return Conflict(ApiProblemDetails.Create(
                    409,
                    "request.idempotency_conflict",
                    "Idempotency Key Conflict",
                    "The idempotency key was previously used with a different request payload.",
                    Request.Path
                ));
            }
        }

        // 3. Acquire vehicle-scoped distributed lock (Redis SET NX PX with in-memory fallback)
        using var lockScope = await _lockManager.AcquireLockAsync(request.VehicleId);

        // 4. Check vehicle eligibility via Vehicle Service
        var eligibility = await _vehicleClient.CheckEligibilityAsync(request.VehicleId);
        if (eligibility == null)
        {
            return StatusCode(StatusCodes.Status502BadGateway, ApiProblemDetails.Create(
                502,
                "dependency.vehicle_service_error",
                "Bad Gateway",
                "Vehicle Service could not be reached to verify vehicle availability.",
                Request.Path
            ));
        }

        if (!eligibility.IsEligible)
        {
            return Conflict(ApiProblemDetails.Create(
                409,
                "booking.vehicle_unavailable",
                "Vehicle Unavailable",
                eligibility.IneligibleReason ?? "Vehicle is not currently eligible for booking.",
                Request.Path
            ));
        }

        // 5. Recheck overlap under vehicle lock
        var hasOverlap = await _db.Bookings
            .AnyAsync(b => b.VehicleId == request.VehicleId
                        && ReservationHoldingStatuses.Contains(b.Status)
                        && b.PickupUtc < request.ReturnUtc
                        && b.ReturnUtc > request.PickupUtc);

        if (hasOverlap)
        {
            return Conflict(ApiProblemDetails.Create(
                409,
                "booking.vehicle_unavailable",
                "Booking Overlap Conflict",
                "The requested vehicle already has a reservation during this time period.",
                Request.Path
            ));
        }

        // Calculate rental days & price
        var rentalDays = Math.Max(1, (decimal)(request.ReturnUtc - request.PickupUtc).TotalDays);
        var totalPrice = Math.Round(rentalDays * eligibility.PricePerDay, 2);

        // 6. Admin vs Customer workflow logic
        string initialStatus;
        bool isPaid;
        string paymentStatus;
        Payment? adminExemptPayment = null;

        var bookingId = Guid.NewGuid();

        if (isAdmin)
        {
            // Admin accounts are EXEMPT from payment and can take car directly
            isPaid = true;
            paymentStatus = "Exempt (Admin)";
            initialStatus = request.IsDirectPickup ? "Active" : "Confirmed";

            var randomSuffix = RandomNumberGenerator.GetInt32(100000, 999999);
            adminExemptPayment = new Payment
            {
                PaymentId = Guid.NewGuid(),
                BookingId = bookingId,
                CustomerUserId = customerUserId,
                Amount = 0m,
                Currency = "USD",
                PaymentMethod = "AdminPrivilege",
                Status = "Completed",
                TransactionReference = $"ADM-EXEMPT-{DateTime.UtcNow:yyyyMMddHHmmss}-{randomSuffix}",
                PayerName = "System Administrator",
                Note = request.IsDirectPickup 
                    ? "Admin direct vehicle pickup - Exempt from payment" 
                    : "Admin reservation pre-approved - Exempt from payment",
                PaidAtUtc = DateTime.UtcNow,
                CreatedAtUtc = DateTime.UtcNow
            };
        }
        else
        {
            // Customer booking starts as Pending and requires Admin approval
            initialStatus = "Pending";
            isPaid = false;
            paymentStatus = "Unpaid";
        }

        var booking = new Booking
        {
            BookingId = bookingId,
            CustomerUserId = customerUserId,
            VehicleId = request.VehicleId,
            PickupLocationId = request.PickupLocationId,
            ReturnLocationId = request.ReturnLocationId,
            PickupUtc = request.PickupUtc,
            ReturnUtc = request.ReturnUtc,
            Status = initialStatus,
            TotalPrice = totalPrice,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        var historyReason = isAdmin
            ? (request.IsDirectPickup 
                ? "Admin direct vehicle pickup (Active immediately - Exempt from payment)" 
                : "Admin pre-confirmed booking (Confirmed - Exempt from payment)")
            : "Initial customer booking creation - Awaiting payment and administrator confirmation";

        var history = new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = null,
            NewStatus = initialStatus,
            ChangedAtUtc = DateTime.UtcNow,
            ChangedByUserId = customerUserId,
            Reason = historyReason
        };

        var bookingDto = new BookingDto
        {
            BookingId = booking.BookingId,
            CustomerUserId = booking.CustomerUserId,
            VehicleId = booking.VehicleId,
            PickupLocationId = booking.PickupLocationId,
            ReturnLocationId = booking.ReturnLocationId,
            PickupUtc = booking.PickupUtc,
            ReturnUtc = booking.ReturnUtc,
            Status = booking.Status,
            TotalPrice = booking.TotalPrice,
            IsPaid = isPaid,
            PaymentStatus = paymentStatus,
            CreatedAtUtc = booking.CreatedAtUtc,
            UpdatedAtUtc = booking.UpdatedAtUtc
        };

        var responseJson = JsonSerializer.Serialize(bookingDto);

        var idempotencyRecord = new IdempotencyRecord
        {
            CustomerUserId = customerUserId,
            IdempotencyKey = idempotencyKey,
            RequestHash = requestHash,
            BookingId = booking.BookingId,
            ResponseStatusCode = StatusCodes.Status201Created,
            ResponseBody = responseJson,
            CreatedAtUtc = DateTime.UtcNow
        };

        _db.Bookings.Add(booking);
        _db.BookingStatusHistories.Add(history);
        _db.IdempotencyRecords.Add(idempotencyRecord);

        if (adminExemptPayment != null)
        {
            _db.Payments.Add(adminExemptPayment);
        }

        await _db.SaveChangesAsync();

        // 7. Store idempotency response in Redis with 24 hours TTL
        await _redisIdempotency.SetRecordAsync(
            customerUserId,
            idempotencyKey,
            requestHash,
            StatusCodes.Status201Created,
            responseJson,
            TimeSpan.FromHours(24));

        return StatusCode(StatusCodes.Status201Created, bookingDto);
    }

    [HttpGet("{bookingId}")]
    public async Task<IActionResult> GetBooking(Guid bookingId)
    {
        var booking = await _db.Bookings
            .Include(b => b.StatusHistory.OrderBy(h => h.ChangedAtUtc))
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
        {
            return NotFound(ApiProblemDetails.Create(
                404,
                "booking.not_found",
                "Booking Not Found",
                "Booking does not exist.",
                Request.Path
            ));
        }

        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole(UserRoles.Admin);

        if (!isAdmin && Guid.TryParse(currentUserIdStr, out var currentUserId) && booking.CustomerUserId != currentUserId)
        {
            return Forbid();
        }

        var latestPayment = booking.Payments
            .OrderByDescending(p => p.PaidAtUtc)
            .FirstOrDefault(p => p.Status == "Completed");

        var detail = new BookingDetailDto
        {
            BookingId = booking.BookingId,
            CustomerUserId = booking.CustomerUserId,
            VehicleId = booking.VehicleId,
            PickupLocationId = booking.PickupLocationId,
            ReturnLocationId = booking.ReturnLocationId,
            PickupUtc = booking.PickupUtc,
            ReturnUtc = booking.ReturnUtc,
            Status = booking.Status,
            TotalPrice = booking.TotalPrice,
            IsPaid = latestPayment != null,
            PaymentStatus = latestPayment != null ? "Paid" : "Unpaid",
            CreatedAtUtc = booking.CreatedAtUtc,
            UpdatedAtUtc = booking.UpdatedAtUtc,
            CancelledAtUtc = booking.CancelledAtUtc,
            CompletedAtUtc = booking.CompletedAtUtc,
            StatusHistory = booking.StatusHistory.Select(h => new BookingStatusHistoryDto
            {
                BookingStatusHistoryId = h.BookingStatusHistoryId,
                PreviousStatus = h.PreviousStatus,
                NewStatus = h.NewStatus,
                ChangedAtUtc = h.ChangedAtUtc,
                ChangedByUserId = h.ChangedByUserId,
                Reason = h.Reason
            }).ToList(),
            LatestPayment = latestPayment == null ? null : new PaymentReceiptDto
            {
                PaymentId = latestPayment.PaymentId,
                BookingId = booking.BookingId,
                Amount = latestPayment.Amount,
                Currency = latestPayment.Currency,
                PaymentMethod = latestPayment.PaymentMethod,
                Status = latestPayment.Status,
                TransactionReference = latestPayment.TransactionReference,
                CardLast4 = latestPayment.CardLast4,
                CardBrand = latestPayment.CardBrand,
                PayerName = latestPayment.PayerName,
                BankCode = latestPayment.BankCode,
                Note = latestPayment.Note,
                PaidAtUtc = latestPayment.PaidAtUtc,
                PickupUtc = booking.PickupUtc,
                ReturnUtc = booking.ReturnUtc,
                VehicleId = booking.VehicleId
            }
        };

        return Ok(detail);
    }

    [HttpGet]
    public async Task<IActionResult> GetBookings(
        [FromQuery] string? status,
        [FromQuery] long? vehicleId,
        [FromQuery] Guid? customerUserId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole(UserRoles.Admin);

        var query = _db.Bookings
            .Include(b => b.Payments)
            .AsQueryable();

        if (!isAdmin)
        {
            if (Guid.TryParse(currentUserIdStr, out var currentUserId))
            {
                query = query.Where(b => b.CustomerUserId == currentUserId);
            }
            else
            {
                return Unauthorized();
            }
        }
        else if (customerUserId.HasValue)
        {
            query = query.Where(b => b.CustomerUserId == customerUserId.Value);
        }

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(b => b.Status == status);
        }

        if (vehicleId.HasValue)
        {
            query = query.Where(b => b.VehicleId == vehicleId.Value);
        }

        var total = await query.CountAsync();
        var rawItems = await query
            .OrderByDescending(b => b.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var items = rawItems.Select(b =>
        {
            var isPaid = b.Payments.Any(p => p.Status == "Completed");
            return new BookingDto
            {
                BookingId = b.BookingId,
                CustomerUserId = b.CustomerUserId,
                VehicleId = b.VehicleId,
                PickupLocationId = b.PickupLocationId,
                ReturnLocationId = b.ReturnLocationId,
                PickupUtc = b.PickupUtc,
                ReturnUtc = b.ReturnUtc,
                Status = b.Status,
                TotalPrice = b.TotalPrice,
                IsPaid = isPaid,
                PaymentStatus = isPaid ? "Paid" : "Unpaid",
                CreatedAtUtc = b.CreatedAtUtc,
                UpdatedAtUtc = b.UpdatedAtUtc,
                CancelledAtUtc = b.CancelledAtUtc,
                CompletedAtUtc = b.CompletedAtUtc
            };
        }).ToList();

        return Ok(new PagedResponse<BookingDto>
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    #region Payment Operations

    [HttpPost("{bookingId}/pay")]
    public async Task<IActionResult> ProcessPayment(Guid bookingId, [FromBody] ProcessPaymentRequest request)
    {
        var booking = await _db.Bookings
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
        {
            return NotFound(ApiProblemDetails.Create(
                404,
                "booking.not_found",
                "Booking Not Found",
                "The booking requested for payment does not exist.",
                Request.Path
            ));
        }

        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole(UserRoles.Admin);
        if (!isAdmin && Guid.TryParse(currentUserIdStr, out var currentUserId) && booking.CustomerUserId != currentUserId)
        {
            return Forbid();
        }

        // Admin privilege: Admin is exempt from payment
        if (isAdmin)
        {
            var adminTxn = $"ADM-EXEMPT-{DateTime.UtcNow:yyyyMMddHHmmss}";
            return Ok(new PaymentReceiptDto
            {
                PaymentId = Guid.NewGuid(),
                BookingId = booking.BookingId,
                Amount = 0m,
                Currency = "USD",
                PaymentMethod = "AdminPrivilege",
                Status = "Completed",
                TransactionReference = adminTxn,
                PayerName = "System Administrator",
                Note = "Admin privilege - Exempt from payment",
                PaidAtUtc = DateTime.UtcNow,
                PickupUtc = booking.PickupUtc,
                ReturnUtc = booking.ReturnUtc,
                VehicleId = booking.VehicleId
            });
        }

        // Check if already paid
        var existingPayment = booking.Payments
            .OrderByDescending(p => p.PaidAtUtc)
            .FirstOrDefault(p => p.Status == "Completed");

        if (existingPayment != null)
        {
            return Ok(new PaymentReceiptDto
            {
                PaymentId = existingPayment.PaymentId,
                BookingId = booking.BookingId,
                Amount = existingPayment.Amount,
                Currency = existingPayment.Currency,
                PaymentMethod = existingPayment.PaymentMethod,
                Status = existingPayment.Status,
                TransactionReference = existingPayment.TransactionReference,
                CardLast4 = existingPayment.CardLast4,
                CardBrand = existingPayment.CardBrand,
                PayerName = existingPayment.PayerName,
                BankCode = existingPayment.BankCode,
                Note = existingPayment.Note,
                PaidAtUtc = existingPayment.PaidAtUtc,
                PickupUtc = booking.PickupUtc,
                ReturnUtc = booking.ReturnUtc,
                VehicleId = booking.VehicleId
            });
        }

        if (booking.Status == "Cancelled" || booking.Status == "Rejected")
        {
            return Conflict(ApiProblemDetails.Create(
                409,
                "payment.invalid_booking_status",
                "Invalid Booking Status",
                $"Cannot process payment for booking with status '{booking.Status}'.",
                Request.Path
            ));
        }

        // Generate Transaction Reference
        var randomSuffix = RandomNumberGenerator.GetInt32(100000, 999999);
        var txnRef = $"TXN-{DateTime.UtcNow:yyyyMMddHHmmss}-{randomSuffix}";

        // Card info detection
        string? cardBrand = null;
        string? cardLast4 = null;
        if (!string.IsNullOrWhiteSpace(request.CardNumber))
        {
            var cleanNum = new string(request.CardNumber.Where(char.IsDigit).ToArray());
            if (cleanNum.Length >= 4)
            {
                cardLast4 = cleanNum[^4..];
            }
            if (cleanNum.StartsWith("4")) cardBrand = "Visa";
            else if (cleanNum.StartsWith("5")) cardBrand = "MasterCard";
            else if (cleanNum.StartsWith("3")) cardBrand = "American Express";
            else cardBrand = "Credit/Debit Card";
        }
        else if (request.PaymentMethod.Equals("CreditCard", StringComparison.OrdinalIgnoreCase))
        {
            cardBrand = "Visa";
            cardLast4 = "8896";
        }

        var amount = booking.TotalPrice ?? 0m;
        var payment = new Payment
        {
            PaymentId = Guid.NewGuid(),
            BookingId = booking.BookingId,
            CustomerUserId = booking.CustomerUserId,
            Amount = amount,
            Currency = "USD",
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "CreditCard" : request.PaymentMethod,
            Status = "Completed",
            TransactionReference = txnRef,
            CardLast4 = cardLast4,
            CardBrand = cardBrand,
            PayerName = !string.IsNullOrWhiteSpace(request.CardHolderName) ? request.CardHolderName : "RideLux Customer",
            BankCode = request.BankCode,
            Note = request.PayerNote ?? $"Payment captured via {request.PaymentMethod}",
            PaidAtUtc = DateTime.UtcNow,
            CreatedAtUtc = DateTime.UtcNow
        };

        // Notice: Customer payment is captured, but booking status remains 'Pending' awaiting Admin approval!
        booking.UpdatedAtUtc = DateTime.UtcNow;

        var statusHistory = new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = booking.Status,
            NewStatus = booking.Status,
            ChangedAtUtc = DateTime.UtcNow,
            ChangedByUserId = Guid.TryParse(currentUserIdStr, out var uid) ? uid : null,
            Reason = $"Payment received via {payment.PaymentMethod} (${amount:N2}, Ref: {txnRef}). Awaiting administrator approval to confirm vehicle reservation."
        };

        _db.Payments.Add(payment);
        _db.BookingStatusHistories.Add(statusHistory);

        await _db.SaveChangesAsync();

        var receipt = new PaymentReceiptDto
        {
            PaymentId = payment.PaymentId,
            BookingId = booking.BookingId,
            Amount = payment.Amount,
            Currency = payment.Currency,
            PaymentMethod = payment.PaymentMethod,
            Status = payment.Status,
            TransactionReference = payment.TransactionReference,
            CardLast4 = payment.CardLast4,
            CardBrand = payment.CardBrand,
            PayerName = payment.PayerName,
            BankCode = payment.BankCode,
            Note = payment.Note,
            PaidAtUtc = payment.PaidAtUtc,
            PickupUtc = booking.PickupUtc,
            ReturnUtc = booking.ReturnUtc,
            VehicleId = booking.VehicleId
        };

        return Ok(receipt);
    }

    [HttpGet("{bookingId}/payment")]
    public async Task<IActionResult> GetBookingPayment(Guid bookingId)
    {
        var booking = await _db.Bookings
            .Include(b => b.Payments)
            .FirstOrDefaultAsync(b => b.BookingId == bookingId);

        if (booking == null)
        {
            return NotFound(ApiProblemDetails.Create(
                404,
                "booking.not_found",
                "Booking Not Found",
                "Booking does not exist.",
                Request.Path
            ));
        }

        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole(UserRoles.Admin);
        if (!isAdmin && Guid.TryParse(currentUserIdStr, out var currentUserId) && booking.CustomerUserId != currentUserId)
        {
            return Forbid();
        }

        var latestPayment = booking.Payments
            .OrderByDescending(p => p.PaidAtUtc)
            .FirstOrDefault(p => p.Status == "Completed");

        if (latestPayment == null)
        {
            return NotFound(ApiProblemDetails.Create(
                404,
                "payment.not_found",
                "Payment Not Found",
                "No completed payment recorded for this booking.",
                Request.Path
            ));
        }

        var receipt = new PaymentReceiptDto
        {
            PaymentId = latestPayment.PaymentId,
            BookingId = booking.BookingId,
            Amount = latestPayment.Amount,
            Currency = latestPayment.Currency,
            PaymentMethod = latestPayment.PaymentMethod,
            Status = latestPayment.Status,
            TransactionReference = latestPayment.TransactionReference,
            CardLast4 = latestPayment.CardLast4,
            CardBrand = latestPayment.CardBrand,
            PayerName = latestPayment.PayerName,
            BankCode = latestPayment.BankCode,
            Note = latestPayment.Note,
            PaidAtUtc = latestPayment.PaidAtUtc,
            PickupUtc = booking.PickupUtc,
            ReturnUtc = booking.ReturnUtc,
            VehicleId = booking.VehicleId
        };

        return Ok(receipt);
    }

    #endregion

    #region Lifecycle Operations

    [HttpPost("{bookingId}/confirm")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> ConfirmBooking(Guid bookingId)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
        if (booking == null) return NotFound(ApiProblemDetails.Create(404, "booking.not_found", "Not Found", "Booking not found."));

        if (booking.Status != "Pending")
        {
            return Conflict(ApiProblemDetails.Create(409, "booking.invalid_transition", "Invalid Transition", $"Cannot confirm booking in '{booking.Status}' status. Must be 'Pending'."));
        }

        var previous = booking.Status;
        booking.Status = "Confirmed";
        booking.UpdatedAtUtc = DateTime.UtcNow;

        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = previous,
            NewStatus = "Confirmed",
            ChangedAtUtc = DateTime.UtcNow,
            Reason = "Administrator confirmed booking."
        });

        await _db.SaveChangesAsync();
        return Ok(MapToDto(booking));
    }

    [HttpPost("{bookingId}/reject")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> RejectBooking(Guid bookingId, [FromBody] RejectBookingRequest? request)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
        if (booking == null) return NotFound(ApiProblemDetails.Create(404, "booking.not_found", "Not Found", "Booking not found."));

        if (booking.Status != "Pending")
        {
            return Conflict(ApiProblemDetails.Create(409, "booking.invalid_transition", "Invalid Transition", $"Cannot reject booking in '{booking.Status}' status. Must be 'Pending'."));
        }

        var previous = booking.Status;
        booking.Status = "Rejected";
        booking.UpdatedAtUtc = DateTime.UtcNow;

        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = previous,
            NewStatus = "Rejected",
            ChangedAtUtc = DateTime.UtcNow,
            Reason = request?.Reason ?? "Administrator rejected booking."
        });

        await _db.SaveChangesAsync();
        return Ok(MapToDto(booking));
    }

    [HttpPost("{bookingId}/pickup")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> RecordPickup(Guid bookingId)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
        if (booking == null) return NotFound(ApiProblemDetails.Create(404, "booking.not_found", "Not Found", "Booking not found."));

        if (booking.Status != "Confirmed")
        {
            return Conflict(ApiProblemDetails.Create(409, "booking.invalid_transition", "Invalid Transition", $"Cannot record pickup for booking in '{booking.Status}' status. Must be 'Confirmed'."));
        }

        var previous = booking.Status;
        booking.Status = "Active";
        booking.UpdatedAtUtc = DateTime.UtcNow;

        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = previous,
            NewStatus = "Active",
            ChangedAtUtc = DateTime.UtcNow,
            Reason = "Customer picked up vehicle; rental active."
        });

        await _db.SaveChangesAsync();
        return Ok(MapToDto(booking));
    }

    [HttpPost("{bookingId}/return")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> RecordReturn(Guid bookingId)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
        if (booking == null) return NotFound(ApiProblemDetails.Create(404, "booking.not_found", "Not Found", "Booking not found."));

        if (booking.Status != "Active")
        {
            return Conflict(ApiProblemDetails.Create(409, "booking.invalid_transition", "Invalid Transition", $"Cannot record return for booking in '{booking.Status}' status. Must be 'Active'."));
        }

        var previous = booking.Status;
        booking.Status = "Returned";
        booking.UpdatedAtUtc = DateTime.UtcNow;

        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = previous,
            NewStatus = "Returned",
            ChangedAtUtc = DateTime.UtcNow,
            Reason = "Vehicle returned by customer."
        });

        await _db.SaveChangesAsync();
        return Ok(MapToDto(booking));
    }

    [HttpPost("{bookingId}/complete")]
    [Authorize(Roles = UserRoles.Admin)]
    public async Task<IActionResult> CompleteBooking(Guid bookingId)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
        if (booking == null) return NotFound(ApiProblemDetails.Create(404, "booking.not_found", "Not Found", "Booking not found."));

        if (booking.Status != "Returned")
        {
            return Conflict(ApiProblemDetails.Create(409, "booking.invalid_transition", "Invalid Transition", $"Cannot complete booking in '{booking.Status}' status. Must be 'Returned'."));
        }

        var previous = booking.Status;
        booking.Status = "Completed";
        booking.CompletedAtUtc = DateTime.UtcNow;
        booking.UpdatedAtUtc = DateTime.UtcNow;

        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = previous,
            NewStatus = "Completed",
            ChangedAtUtc = DateTime.UtcNow,
            Reason = "Rental processing completed."
        });

        await _db.SaveChangesAsync();
        return Ok(MapToDto(booking));
    }

    [HttpPost("{bookingId}/cancel")]
    public async Task<IActionResult> CancelBooking(Guid bookingId, [FromBody] CancelBookingRequest? request)
    {
        var booking = await _db.Bookings.FirstOrDefaultAsync(b => b.BookingId == bookingId);
        if (booking == null) return NotFound(ApiProblemDetails.Create(404, "booking.not_found", "Not Found", "Booking not found."));

        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var isAdmin = User.IsInRole(UserRoles.Admin);

        if (!isAdmin && Guid.TryParse(currentUserIdStr, out var currentUserId) && booking.CustomerUserId != currentUserId)
        {
            return Forbid();
        }

        if (booking.Status != "Pending" && booking.Status != "Confirmed")
        {
            return Conflict(ApiProblemDetails.Create(
                409,
                "booking.invalid_transition",
                "Cancellation Not Allowed",
                $"Cannot cancel booking in '{booking.Status}' status. Only Pending or Confirmed bookings can be cancelled.",
                Request.Path
            ));
        }

        var previous = booking.Status;
        booking.Status = "Cancelled";
        booking.CancelledAtUtc = DateTime.UtcNow;
        booking.UpdatedAtUtc = DateTime.UtcNow;

        _db.BookingStatusHistories.Add(new BookingStatusHistory
        {
            BookingId = booking.BookingId,
            PreviousStatus = previous,
            NewStatus = "Cancelled",
            ChangedAtUtc = DateTime.UtcNow,
            Reason = request?.Reason ?? "Cancelled by customer."
        });

        await _db.SaveChangesAsync();
        return Ok(MapToDto(booking));
    }

    private static BookingDto MapToDto(Booking b)
    {
        return new BookingDto
        {
            BookingId = b.BookingId,
            CustomerUserId = b.CustomerUserId,
            VehicleId = b.VehicleId,
            PickupLocationId = b.PickupLocationId,
            ReturnLocationId = b.ReturnLocationId,
            PickupUtc = b.PickupUtc,
            ReturnUtc = b.ReturnUtc,
            Status = b.Status,
            TotalPrice = b.TotalPrice,
            CreatedAtUtc = b.CreatedAtUtc,
            UpdatedAtUtc = b.UpdatedAtUtc,
            CancelledAtUtc = b.CancelledAtUtc,
            CompletedAtUtc = b.CompletedAtUtc
        };
    }

    #endregion
}
