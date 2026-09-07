# Delegate authentication to Auth0

PulseIntel will use Auth0 for authentication and identity lifecycle instead of building custom JWT-based auth in-house. We chose this because multi-tenant SaaS identity, invite flows, and account security are important but not part of PulseIntel's core product differentiation, and Auth0 reduces the amount of security-sensitive infrastructure we need to own in v1.
