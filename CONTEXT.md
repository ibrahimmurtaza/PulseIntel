# PulseIntel

PulseIntel is a multi-tenant market intelligence product for teams that monitor external signals and internal metrics together. Its core collaboration model is a shared workspace with saved dashboards and live discussion around changing data.

## Language

**Tenant**:
A customer account boundary that owns users, workspaces, and data isolation in PulseIntel.
_Avoid_: Company, organization, account

**Tenant Home**:
The landing area for a tenant that helps a user choose or navigate to their available workspaces.
_Avoid_: Dashboard, homepage, workspace default

**Workspace**:
A collaborative area inside a tenant where a team organizes dashboards, sources, alerts, and discussion.
_Avoid_: Project, team space, board

**Archived Workspace**:
A workspace that has been removed from active use but retained for recovery, history, or controlled deletion.
_Avoid_: Deleted workspace, disabled project, hidden board

**Workspace Restore**:
The act of bringing an archived workspace back with its full operational state and history.
_Avoid_: Reactivation, unarchive, rebuild

**Dashboard**:
A saved intelligence surface in a workspace that presents charts, feeds, metrics, and related collaboration.
_Avoid_: Report, page, screen

**Dashboard Clone**:
A new dashboard created by copying the structure and configuration of an existing dashboard.
_Avoid_: Template, duplicate page, preset

**User**:
A person with a single global identity who can belong to one or more tenants and workspaces.
_Avoid_: Seat, login, operator

**Membership**:
The relationship that grants a user a role within a tenant or workspace.
_Avoid_: Access, invite, assignment

**Invitation**:
A tenant-initiated request for a user to join PulseIntel with specific tenant or workspace membership.
_Avoid_: Signup, registration, access request

**Insight**:
A durable workspace finding captured by a team to explain a meaningful change, pattern, or conclusion drawn from the data.
_Avoid_: Note, comment, annotation

**Insight Evidence Link**:
A required reference from an insight to the supporting observation, annotation target, or evidence it is based on.
_Avoid_: Optional citation, loose reference, attachment

**Locked Insight**:
An insight marked finalized and read-only for normal editors until it is reopened by an authorized user.
_Avoid_: Archived insight, closed note, immutable finding

**Annotation**:
A note attached to a widget, observation, or time range to add local context or discussion.
_Avoid_: Insight, comment thread, marker

**Comment Thread**:
A sequence of replies attached to an insight or annotation to capture ongoing discussion.
_Avoid_: Conversation, chat, discussion log

**Observation**:
A timestamped fact captured from an internal or external source and stored for charting, alerting, and analysis.
_Avoid_: Event, record, datapoint

**Article Identity**:
A stable identity used to deduplicate the same news article across repeated collections or multiple feeds while preserving collection history.
_Avoid_: Feed item, post, duplicate entry

**Observation History**:
The immutable record of what PulseIntel captured and when it captured it.
_Avoid_: Latest state, overwrite log, corrected value

**Retention Policy**:
The rule that determines how long full-resolution observation history is kept and when older history is downsampled.
_Avoid_: TTL, archive rule, purge policy

**Metric**:
A named time-series measure shown on dashboards and used in comparison, alerting, and analysis.
_Avoid_: KPI, signal, datapoint

**Base Metric**:
A source-backed metric definition owned at the tenant level and reused by workspaces.
_Avoid_: Raw metric, system metric, canonical KPI

**Metric Unit**:
The explicit measurement type attached to a metric, such as currency, percentage, count, or score.
_Avoid_: Display label, suffix, formatting hint

**Unit Validation**:
The rule that prevents a custom metric formula from combining incompatible metric units unless an explicit conversion exists.
_Avoid_: Type check, format check, unit warning

**Metric Dimension**:
An optional tag-like attribute attached to metric observations so a series can be segmented by values such as plan, region, or channel.
_Avoid_: Label, property, arbitrary field

**Custom Metric**:
A metric defined by a workspace formula that derives values from other workspace metrics.
_Avoid_: Calculated field, expression, formula

**Formula Function Set**:
The approved categories of operations and helper functions allowed in custom metric formulas.
_Avoid_: Scripting API, code runtime, query language

**Metric Materialization**:
The asynchronous production of stored custom metric values from upstream observations or metrics.
_Avoid_: Compute-on-read, live formula evaluation, recalculation

**Metric Dependency Graph**:
The acyclic set of upstream metric relationships used to compute custom metrics inside a workspace.
_Avoid_: Formula chain, metric tree, dependency loop

**Alert Rule**:
A user-defined condition that watches observations or metrics and notifies a workspace when the condition is met.
_Avoid_: Trigger, monitor, alarm

**Alert Severity**:
The priority level attached to an alert rule so resulting alert events can be triaged and presented appropriately.
_Avoid_: Importance flag, urgency label, priority hint

**Alert Subscription**:
A user's delivery preference for a workspace alert rule.
_Avoid_: Notification setting, watcher, follower

**Default Subscription State**:
The initial alert-subscription behavior applied when a user first joins a workspace.
_Avoid_: Opt-in policy, onboarding default, notification preset

**Alert Event**:
A durable record created when an alert rule fires, used for in-app history and notification delivery.
_Avoid_: Notification, message, trigger log

**Acknowledged Alert Event**:
An alert event that a user has explicitly marked as seen by the team.
_Avoid_: Resolved alert, dismissed notification, closed incident

**Alert Cooldown**:
The minimum interval before the same alert rule may create another alert event for a still-relevant condition.
_Avoid_: Debounce, repeat delay, throttle

**Source**:
A tenant-owned definition of where observations come from, such as a feed, tracked page, or ingest endpoint.
_Avoid_: Connector, integration, scraper

**Source Health**:
The current collection reliability state of a source, inferred from recent collection runs and failures.
_Avoid_: Uptime, scraper status, sync health

**Widget**:
A dashboard component that presents a specific view of metrics, observations, alerts, or insights.
_Avoid_: Block, card, module

**Evidence**:
The captured reference that lets a team verify where an observation came from and why it is trustworthy.
_Avoid_: Proof, raw payload, artifact

**Citation Note**:
A short human-written explanation or reference attached to manual evidence so others can understand where the value came from.
_Avoid_: Description, comment, freeform note

**Evidence Snapshot**:
A stored copy of source material captured at collection time to support provenance and later verification.
_Avoid_: Blob, dump, archive

**Revision**:
An automatically recorded historical version of a dashboard, custom metric, or alert rule.
_Avoid_: Save, draft, history entry

**Snapshot**:
A named restore point created intentionally for a dashboard, custom metric, or alert rule.
_Avoid_: Backup, export, checkpoint

**Activity Feed**:
A user-visible stream of noteworthy workspace changes that supports team awareness without replacing the audit trail.
_Avoid_: Audit trail, event log, notification list

**Dashboard Time Range**:
The default time window applied across a dashboard, with optional widget-level overrides when a different range is needed.
_Avoid_: Global filter, chart window, date preset

**Workspace Role**:
The level of authority a membership has inside a workspace, limited to viewer, editor, or workspace admin in v1.
_Avoid_: Permission set, access level, profile

**Tenant Role**:
The level of authority a membership has across an entire tenant, limited to tenant owner, tenant admin, or member in v1.
_Avoid_: Account role, organization role, global role

**Source Kind**:
The explicit type of a source that determines how observations are collected and validated.
_Avoid_: Source type, connector type, integration category

**Manual Source**:
A source kind where users enter observations directly instead of collecting them automatically from an external system.
_Avoid_: Ad hoc entry, scratch input, one-off record

**Source Schedule**:
The cadence that controls when a source is collected or refreshed.
_Avoid_: Polling rule, cron, sync frequency

**Collection Run**:
A single attempt to collect data from a source, recorded with timing and success or failure status.
_Avoid_: Job, scrape, sync attempt

**Source Subscription**:
A workspace-level attachment to a tenant source that decides whether and how that workspace uses the source.
_Avoid_: Link, binding, source mapping

**Subscription Filter**:
Workspace-level scoping applied to a source subscription to narrow which observations are visible or relevant in that workspace.
_Avoid_: Query, tenant filter, source rewrite

**Ingest Credential**:
A workspace-scoped machine credential that authorizes KPI data to be pushed into PulseIntel.
_Avoid_: API key, token, secret

**Audit Trail**:
The recorded history of significant security, administration, and restore actions.
_Avoid_: Activity feed, log stream, event log
