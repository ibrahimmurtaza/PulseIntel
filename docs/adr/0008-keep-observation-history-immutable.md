# Keep observation history immutable

PulseIntel will treat captured observations as immutable history, so corrections or re-captures create new records or explicit superseding records instead of overwriting what was previously observed. We chose this because market intelligence depends on auditability and trust, and rewriting history would make alerts, charts, and insights harder to explain later.
