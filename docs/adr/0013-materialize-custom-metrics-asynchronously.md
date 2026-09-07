# Materialize custom metrics asynchronously

PulseIntel will compute and store custom metric values asynchronously when upstream observations or metrics change, rather than evaluating every formula on read. We chose this because dashboards, alerting, and historical comparisons need predictable performance and stable derived values.
