# Store evidence snapshots in S3 with metadata in PostgreSQL

PulseIntel will store evidence metadata and references in PostgreSQL while keeping captured evidence snapshots and larger payloads in S3. We chose this so provenance remains queryable in the core application without turning PostgreSQL into a blob store.
