# Use shared-schema multi-tenancy with tenant IDs

PulseIntel will isolate tenant data inside a shared application schema by attaching tenant ownership to records and enforcing tenant scoping in the application and query layer. We chose this over per-tenant schemas or databases because it keeps migrations, operations, and cross-tenant product evolution much simpler in v1 while still fitting the scale and deployment model we expect early on.
