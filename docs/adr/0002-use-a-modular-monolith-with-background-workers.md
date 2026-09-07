# Use a modular monolith with background workers for v1

PulseIntel will ship as a modular monolith for the core application, with separate background workers handling ingestion, alert evaluation, and other asynchronous jobs. We chose this over a service-per-capability architecture because it keeps development and operations simpler in v1 while still giving us clean module boundaries and queue-driven scaling where the workload actually needs it.
