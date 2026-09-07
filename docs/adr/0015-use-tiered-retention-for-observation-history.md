# Use tiered retention for observation history

PulseIntel will keep full-resolution observation history for a defined retention window, then retain older history in downsampled or aggregated form for longer-term analysis. We chose this over indefinite raw retention because the product needs credible historical analysis without letting storage and query costs scale linearly forever.
