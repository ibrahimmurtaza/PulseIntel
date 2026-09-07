# Allow custom metrics to depend on an acyclic metric graph

PulseIntel will allow custom metrics to reference other custom metrics inside the same workspace, as long as the resulting dependency graph is acyclic. We chose this so teams can build useful derived measures incrementally without allowing circular definitions that would make materialization, debugging, and alert evaluation unstable.
