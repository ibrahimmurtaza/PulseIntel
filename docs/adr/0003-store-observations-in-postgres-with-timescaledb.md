# Store observations in PostgreSQL with TimescaleDB

PulseIntel will use PostgreSQL as the primary data store and the TimescaleDB extension for time-series observations and metric workloads. We chose this over a separate time-series database so the product can keep a simpler operational model while still supporting efficient retention, aggregation, and time-window queries.
