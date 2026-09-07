# Use a shared observation envelope with kind-specific payloads

PulseIntel will model observations with a shared cross-source envelope for timestamps, provenance, and analysis, while keeping kind-specific payloads for source-specific details. We chose this over a single flat observation shape or fully separate models because it gives charting, alerting, and evidence a consistent backbone without forcing very different source data into an unnatural one-size-fits-all record.
