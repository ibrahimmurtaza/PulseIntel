# Use a multi-tenant workspace model with global users

PulseIntel will ship as a multi-tenant SaaS from day one, with a single global user identity that can hold memberships in multiple tenants and workspaces. We chose this over a single-tenant-first model because tenancy, identity, and authorization boundaries are costly to retrofit later, and the product's target audience naturally fits a shared SaaS operating model.
