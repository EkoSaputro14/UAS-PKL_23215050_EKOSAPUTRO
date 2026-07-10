#!/usr/bin/env python3
"""
Mimotes Bug Auto-Filler
=======================
Scans project for issues and auto-generates Obsidian bug notes.

Usage:
    python scripts/auto-fill-bugs.py              # Full scan
    python scripts/auto-fill-bugs.py --from-debt  # From TECH_DEBT.md only
    python scripts/auto-fill-bugs.py --from-logs  # From Docker logs only
    python scripts/auto-fill-bugs.py --from-tests # From test results only
"""

import os
import re
import json
import subprocess
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
VAULT_DIR = PROJECT_ROOT / "docs-obsidian"
BUGS_DIR = VAULT_DIR / "bugs"
TEMPLATE = VAULT_DIR / "Template_Log_Error.md"

# Ensure bugs directory exists
BUGS_DIR.mkdir(exist_ok=True)


def slugify(text: str) -> str:
    """Convert text to filename-safe slug."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_]+', '-', text)
    return text[:60]


def parse_tech_debt() -> list[dict]:
    """Parse .ai/TECH_DEBT.md for known issues."""
    debt_file = PROJECT_ROOT / ".ai" / "TECH_DEBT.md"
    if not debt_file.exists():
        print(f"⚠️  {debt_file} not found")
        return []

    content = debt_file.read_text(encoding="utf-8")
    issues = []
    current_severity = "unknown"
    current_id = None

    for line in content.split("\n"):
        line = line.strip()

        # Detect severity headers
        if "## Critical" in line:
            current_severity = "critical"
        elif "## High" in line:
            current_severity = "high"
        elif "## Medium" in line:
            current_severity = "medium"
        elif "## Low" in line:
            current_severity = "low"
        elif "## Resolved" in line:
            current_severity = "resolved"

        # Detect issue IDs
        id_match = re.match(r"###\s+(SEC-\d+|DEBT-\d+|PH\d+-\d+):\s+(.+)", line)
        if id_match:
            current_id = id_match.group(1)
            title = id_match.group(2)

            # Parse status
            status = "open"
            if current_severity == "resolved":
                status = "resolved"

            # Parse details from following lines
            description = ""
            action = ""
            risk = ""
            for next_line in content.split("\n")[content.split("\n").index(line)+1:]:
                next_line = next_line.strip()
                if next_line.startswith("###") or next_line.startswith("##"):
                    break
                if next_line.startswith("- **Status**:"):
                    status_text = next_line.split(":", 1)[1].strip()
                    if "Active" in status_text or "Partial" in status_text:
                        status = "open"
                    elif "Resolved" in status_text:
                        status = "resolved"
                elif next_line.startswith("- **Risk**:"):
                    risk = next_line.split(":", 1)[1].strip()
                elif next_line.startswith("- **Action**:"):
                    action = next_line.split(":", 1)[1].strip()

            if status == "open":
                issues.append({
                    "id": current_id,
                    "title": title,
                    "severity": current_severity,
                    "status": status,
                    "risk": risk,
                    "action": action,
                    "source": "TECH_DEBT.md"
                })

    return issues


def parse_docker_logs() -> list[dict]:
    """Scan Docker logs for errors."""
    issues = []
    try:
        result = subprocess.run(
            ["docker", "logs", "mimotes-app-1", "--tail", "200"],
            capture_output=True, text=True, timeout=10
        )
        logs = result.stderr + result.stdout

        # Find error patterns
        error_patterns = [
            (r"Error:\s+(.+)", "Runtime Error"),
            (r"TypeError:\s+(.+)", "Type Error"),
            (r"ReferenceError:\s+(.+)", "Reference Error"),
            (r"PrismaClientKnownRequestError", "Database Error"),
            (r"ECONNREFUSED", "Connection Refused"),
            (r"ENOTFOUND", "DNS Error"),
            (r"UnhandledPromiseRejection", "Unhandled Promise"),
            (r"WARNING.*rate.limit", "Rate Limit Warning"),
        ]

        seen_errors = set()
        for pattern, category in error_patterns:
            for match in re.finditer(pattern, logs):
                error_msg = match.group(1) if match.lastindex else match.group(0)
                error_key = f"{category}:{error_msg[:50]}"
                if error_key not in seen_errors:
                    seen_errors.add(error_key)
                    issues.append({
                        "id": f"LOG-{len(issues)+1:03d}",
                        "title": f"{category}: {error_msg[:80]}",
                        "severity": "high",
                        "status": "open",
                        "risk": error_msg,
                        "action": f"Investigate {category.lower()}",
                        "source": "Docker Logs"
                    })

    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("⚠️  Docker not available or container not running")

    return issues


def parse_test_results() -> list[dict]:
    """Run tests and capture failures."""
    issues = []
    try:
        result = subprocess.run(
            ["npm", "test", "--", "--reporter=json"],
            capture_output=True, text=True, timeout=60,
            cwd=str(PROJECT_ROOT)
        )

        # Parse vitest JSON output
        try:
            test_output = json.loads(result.stdout)
            for test in test_output.get("testResults", []):
                for assertion in test.get("assertionResults", []):
                    if assertion.get("status") == "failed":
                        issues.append({
                            "id": f"TEST-{len(issues)+1:03d}",
                            "title": f"Test Failed: {assertion.get('title', 'Unknown')}",
                            "severity": "medium",
                            "status": "open",
                            "risk": assertion.get("failureMessages", [""])[0][:200],
                            "action": f"Fix test in {test.get('name', 'unknown')}",
                            "source": "Vitest"
                        })
        except json.JSONDecodeError:
            # Check for common test errors in stdout/stderr
            if "FAIL" in result.stdout or "Error" in result.stderr:
                issues.append({
                    "id": "TEST-001",
                    "title": "Test Suite Failed",
                    "severity": "medium",
                    "status": "open",
                    "risk": (result.stderr or result.stdout)[:300],
                    "action": "Investigate test failures",
                    "source": "Vitest"
                })

    except (subprocess.TimeoutExpired, FileNotFoundError):
        print("⚠️  npm test not available")

    return issues


def generate_bug_note(issue: dict) -> str:
    """Generate Obsidian bug note from template."""
    now = datetime.now().strftime("%Y-%m-%d")
    priority_map = {"critical": "critical", "high": "high", "medium": "medium", "low": "low"}

    note = f"""---
title: "Bug: {issue['title'][:80]}"
status: open
priority: {priority_map.get(issue['severity'], 'medium')}
component: API
severity: {issue['severity']}
reporter: auto-fill
assignee: ""
date_reported: {now}
date_resolved: ""
version: 0.1.0
source: {issue['source']}
issue_id: {issue['id']}
tags:
  - bug
  - auto-generated
aliases:
  - {issue['id']}
---

# 🐛 Bug: {issue['title'][:80]}

> [!bug] Error Logs
> **Issue ID**: `{issue['id']}`
> **Source**: {issue['source']}
> **Error Message**:
> ```
> {issue.get('risk', 'N/A')}
> ```
>
> **First Observed**: {now}
> **Severity**: {issue['severity']}

---

## 📋 Metadata

| Field | Value |
|-------|-------|
| **Status** | `open` |
| **Priority** | `{priority_map.get(issue['severity'], 'medium')}` |
| **Component** | API |
| **Severity** | `{issue['severity']}` |
| **Reporter** | auto-fill |
| **Source** | {issue['source']} |

---

## 🔍 Description

> [!note] Summary
> Auto-generated from {issue['source']}: {issue['title'][:100]}

### Risk Assessment

> [!warning] Impact
> {issue.get('risk', 'N/A')}

---

## 🔧 Resolution Plan

> [!tip] Recommended Action
> {issue.get('action', 'Investigate and fix')}

- [ ] Investigate root cause
- [ ] Implement fix
- [ ] Add/update tests
- [ ] Verify fix works
- [ ] Deploy to staging
- [ ] Deploy to production

---

## 📝 Investigation Notes

### Debug Commands

```bash
# Check app logs
docker logs mimotes-app-1 --tail 100

# Run specific test
npm run test -- -t "{issue['title'][:50]}"

# Check database
docker exec mimotes-db-1 psql -U mimotes -d mimotes -c "SELECT ..."
```

---

## 🔗 Related

- **Tech Debt Registry**: [[00_Dashboard_Proyek|Dashboard]]
- **System Specs**: [[01_System_Specs]]
- **Bug Template**: [[Template_Log_Error]]

---

*Auto-generated by `scripts/auto-fill-bugs.py` on {now}*
"""
    return note


def generate_dashboard_update(issues: list[dict]) -> str:
    """Generate updated dashboard data."""
    now = datetime.now().strftime("%Y-%m-%d %H:%M")

    open_bugs = [i for i in issues if i["status"] == "open"]
    critical = [i for i in open_bugs if i["severity"] == "critical"]
    high = [i for i in open_bugs if i["severity"] == "high"]
    medium = [i for i in open_bugs if i["severity"] == "medium"]

    summary = f"""---
title: Auto-Fill Summary
generated: {now}
total_issues: {len(open_bugs)}
critical: {len(critical)}
high: {len(high)}
medium: {len(medium)}
tags:
  - auto-generated
  - summary
---

# 📊 Auto-Fill Summary — {now}

| Severity | Count | Issues |
|----------|-------|--------|
| 🔴 Critical | {len(critical)} | {', '.join(i['id'] for i in critical) or 'None'} |
| 🟠 High | {len(high)} | {', '.join(i['id'] for i in high) or 'None'} |
| 🟡 Medium | {len(medium)} | {', '.join(i['id'] for i in medium) or 'None'} |

---

## Generated Bug Notes

"""
    for issue in open_bugs:
        slug = slugify(issue['title'])
        summary += f"- [[{slug}|{issue['id']}: {issue['title'][:60]}]]\n"

    summary += f"""
---

*Auto-generated by `scripts/auto-fill-bugs.py`*
"""
    return summary


def main():
    import sys

    mode = "full"
    if "--from-debt" in sys.argv:
        mode = "debt"
    elif "--from-logs" in sys.argv:
        mode = "logs"
    elif "--from-tests" in sys.argv:
        mode = "tests"

    print(f"🔍 Scanning project (mode: {mode})...\n")

    all_issues = []

    if mode in ("full", "debt"):
        print("📋 Parsing TECH_DEBT.md...")
        debt_issues = parse_tech_debt()
        print(f"   Found {len(debt_issues)} open issues")
        all_issues.extend(debt_issues)

    if mode in ("full", "logs"):
        print("🐳 Scanning Docker logs...")
        log_issues = parse_docker_logs()
        print(f"   Found {len(log_issues)} errors")
        all_issues.extend(log_issues)

    if mode in ("full", "tests"):
        print("🧪 Running test suite...")
        test_issues = parse_test_results()
        print(f"   Found {len(test_issues)} failures")
        all_issues.extend(test_issues)

    print(f"\n📝 Generating {len(all_issues)} bug notes...")

    generated = 0
    for issue in all_issues:
        slug = slugify(issue['title'])
        note_path = BUGS_DIR / f"{issue['id']}-{slug}.md"

        # Don't overwrite existing notes
        if note_path.exists():
            print(f"   ⏭️  {note_path.name} (exists)")
            continue

        note_content = generate_bug_note(issue)
        note_path.write_text(note_content, encoding="utf-8")
        print(f"   ✅ {note_path.name}")
        generated += 1

    # Generate summary
    if all_issues:
        summary_path = VAULT_DIR / "auto-fill-summary.md"
        summary_content = generate_dashboard_update(all_issues)
        summary_path.write_text(summary_content, encoding="utf-8")
        print(f"\n📊 Dashboard updated: auto-fill-summary.md")

    print(f"\n✨ Done! Generated {generated} new notes, {len(all_issues)} total issues found.")
    print(f"   Notes location: {BUGS_DIR}")


if __name__ == "__main__":
    main()
