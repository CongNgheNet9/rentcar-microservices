# 15. Database Sharding Evaluation

## 1. Purpose and decision

This document evaluates horizontal database sharding as a future learning exercise. It does not authorize a production topology or data migration.

**Decision: keep each service on one database; do not shard.** The project has no measured capacity limit, representative large booking workload, tenant requirement, or operational need for multiple database nodes. The initial B12 workload measured API reads against a small synthetic catalog and did not establish a database bottleneck.

Sharding splits rows across independently managed database instances. Unlike SQL Server table partitioning, it introduces cross-database routing and operational failure boundaries; it is not a routine next step after adding microservices or creating separate service databases.

## 2. Candidate keys and query locality

Booking data has competing access patterns:

| Candidate shard key | Potential locality | Main cost/risk |
|---|---|---|
| `CustomerUserId` | Customer booking history and customer-owned lifecycle operations | Availability/overlap checks are by `VehicleId`; concurrent customers booking the same vehicle may be routed to different shards, so local overlap checks cannot enforce correctness. |
| `VehicleId` | Booking overlap checks and same-vehicle reservation correctness | A customer's history spans many vehicle shards and requires scatter/gather, global ordering/pagination, and partial-failure semantics. |
| Time range (for example, `CreatedAtUtc`) | Time-bounded history/retention | Hot current shard, cross-range customer history, and no locality for same-vehicle overlap unless paired with a vehicle routing mechanism. |

The application must route every read and write to the owning shard. Cross-shard queries, unique constraints, transactions, migrations, backups, rebalancing, and recovery require explicit design. SQL foreign keys and uniqueness guarantees are generally local to a database; they cannot be assumed to protect global invariants across shards.

The most important invariant is that overlapping reservation-holding bookings for the same vehicle cannot both succeed. A customer-keyed shard layout would split competing requests across databases and invalidate today's single-database `sp_getapplock` guarantee. A vehicle-keyed layout preserves that locality but makes customer history distributed. No candidate is approved until the workload and consistency requirements establish which trade-off is acceptable.

## 3. Simpler scaling options to evaluate first

Use measured evidence to compare, in order:

1. Query plans, indexes, pagination, and transaction duration on the existing service-owned database.
2. SQL Server capacity and configuration, plus vertical scaling where suitable.
3. Table partitioning only for demonstrated time-range/retention/maintenance needs; see [14-database-partitioning.md](./14-database-partitioning.md).
4. Read replicas only if read pressure is measured and the system can tolerate the replica consistency model.
5. Sharding only after a single database and simpler options demonstrably cannot meet an approved capacity or availability objective.

This ordering is an evaluation aid, not a promise that every stage must be implemented.

## 4. Isolated experiment plan

If a real sharding learning experiment is later approved:

1. Keep it separate from the application’s normal local/demo database and use disposable databases with generated data.
2. Select a representative workload and define pre-run success criteria for p95/p99 latency, throughput, correctness, and operational cost.
3. Prototype routing for one candidate key at a time and explicitly implement customer history and same-vehicle overlap scenarios.
4. Run concurrent booking attempts from different customers for the same vehicle. Demonstrate a single authoritative conflict decision; a test that permits both shard-local transactions to commit is a correctness failure.
5. Test partial shard outages, timeout/retry behavior, duplicate requests, scatter/gather ordering and pagination, shard movement, backup/restore, and schema migration.
6. Compare against the single-database baseline with identical data and workload. Include application complexity and operational burden, not only throughput.
7. Do not migrate production/demo records unless a separately approved migration, rollback, and recovery plan exists.

## 5. Adoption gate

Sharding remains future work until all of the following are documented:

- a measured capacity or availability objective that one database cannot meet after simpler options
- a representative workload and baseline, including distribution/skew and hot-key analysis
- an approved shard key and routing owner for every read/write path
- a design that preserves same-vehicle booking correctness under concurrency
- explicit behavior for cross-shard history, global identifiers/uniqueness, retries, and partial failures
- tested data movement, schema rollout, backup/restore, monitoring, and recovery plans
- a controlled experiment with a material benefit against agreed criteria

Until then, keep one database per service and preserve the existing service ownership model.
