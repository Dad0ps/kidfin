---
name: Version freeze
description: KidFin must stay on version 1.0 in the README until the user says to move forward
type: project
---

KidFin must remain at Version 1.0 in the README until explicitly told otherwise.

**Why:** User wants to control when the version number advances.
**How to apply:** Do not bump the version in README.md or any user-facing version strings. The SW cache name (kidfin-vN) is a separate deploy mechanism and can change independently.
