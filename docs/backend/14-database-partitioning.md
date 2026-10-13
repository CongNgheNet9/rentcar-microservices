# 14. Database Partitioning Evaluation

## 1. Purpose and decision

This document evaluates SQL Server table partitioning for the Vehicle Rental System as a learning exercise. It does not authorize a production schema change.

**Decision: keep the current Booking DB tables unpartitioned.** The available evidence is insufficient to show a booking-table size, maintenance, or query-performance problem. The B12 baseline used 100 synthetic vehicles, exercised catalog reads and availability checks for only 30 seconds, and did not establish a representative booking-history dataset or measure SQL Server I/O, storage, maintenance duration, or partition elimination.

Partitioning is not sharding: partitions remain in one database and are managed by one SQL Server instance. It can help with partition elimination, sliding-window retention, and partition-level maintenance when data and query patterns align. It does not by itself distribute work across servers or make an unbounded query faster.

## 2. Candidate and workload fit

The only plausible initial candidate is `Bookings`, because it is expected to accumulate historical records. `BookingStatusHistory` may grow alongside it, but should be evaluated separately rather than partitioned automatically.

The current Booking Service has multiple access patterns:

- Customer history filters by `CustomerUserId` and sorts by `CreatedAtUtc`.
- Administrative lists can filter by status, vehicle, customer, and pickup-time range, then sort by creation time.
- Availability and booking creation check reservation-holding statuses and interval overlap by `VehicleId`, `PickupUtc`, and `ReturnUtc`.
- Lifecycle history is retrieved by `BookingId`.

A time partition key such as `CreatedAtUtc` may support retention and time-bounded history queries. It does **not** naturally eliminate partitions for the booking-overlap predicate, which has no `CreatedAtUtc` restriction. Existing access paths and the same-vehicle concurrency guarantee must remain correct regardless of physical layout.

## 3. SQL Server design constraints and trade-offs

Before any experiment, inspect the actual generated schema and supported SQL Server version. A partitioned table needs a partition function, partition scheme, and aligned indexes where appropriate. Partitioning a table with primary/unique indexes and foreign keys can require index/key redesign; SQL Server's unique-index alignment rules mean the partition key may need to be included in unique keys, or a deliberate nonaligned-index strategy must be justified. Such a change affects key width, lookups, foreign keys, and maintenance.

Other costs include:

- selecting a boundary and range type that match retention and query semantics
- creating future partitions before inserts cross a boundary
- handling empty, full, and split/merge partitions safely
- ensuring query predicates permit partition elimination
- rebuilding/statistics maintenance across partitions
- additional deployment, migration, monitoring, and recovery complexity
- possible loss of performance or extra I/O if queries touch every partition

Partitioning does not replace the existing overlap transaction lock, interval predicate, or indexes. No business invariant may depend on a partition boundary.

## 4. Experiment plan (disposable database only)

Run an experiment only after D08 establishes a representative booking workload and baseline.

1. Create a disposable SQL Server database from the current Booking Service migrations. Never repartition the local/demo database or production data for this experiment.
2. Generate deterministic booking-history datasets at multiple sizes. Record row counts and distributions by customer, vehicle, status, creation time, and rental period; include enough historical ranges to exercise all partitions.
3. Capture a baseline on the unpartitioned schema for customer history, admin list filters, availability overlap checks, inserts, lifecycle transitions, index/storage size, and maintenance duration. Record execution plans and logical reads, not just API latency.
4. Build a separate partitioned schema variant using `CreatedAtUtc` only if retention/time-range maintenance is a tested objective. Use the same data, indexes where comparable, SQL Server configuration, and query mix.
5. Verify actual partition elimination for time-bounded queries and verify that overlap checks still use an appropriate access path and preserve same-vehicle correctness under concurrent requests.
6. Compare before/after latency distributions, logical reads, CPU/I/O, storage, write cost, maintenance cost, and operational complexity. Define acceptance criteria before running the comparison; thresholds are TBD until a representative workload exists.
7. Discard the variant if it does not demonstrate a material benefit for the stated objective or if it weakens booking correctness or materially complicates operations.

## 5. Adoption gate

Do not adopt table partitioning unless all of the following are true:

- booking data volume or retention/maintenance requirements are measured and documented
- a representative query workload demonstrates that the chosen key helps those queries or operations
- a controlled comparison shows a material benefit under agreed thresholds
- SQL Server index, key, foreign-key, migration, and partition-maintenance consequences are reviewed
- the full booking concurrency and lifecycle integration suite passes on the candidate schema
- restore, partition-boundary maintenance, monitoring, and rollback procedures are documented

Until then, the existing unpartitioned Booking DB is the simplest and approved choice.
