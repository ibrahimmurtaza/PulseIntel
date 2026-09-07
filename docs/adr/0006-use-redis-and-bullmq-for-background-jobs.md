# Use Redis and BullMQ for background jobs

PulseIntel will use Redis with BullMQ to schedule and execute ingestion, alert evaluation, and other asynchronous jobs. We chose this over a heavier message broker because it integrates naturally with the TypeScript application, is fast to ship, and is a good fit for the queueing patterns we expect in v1.
