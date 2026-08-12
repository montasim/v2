import sys
import gi

gi.require_version("Atspi", "2.0")
from gi.repository import Atspi


def children(node):
    try:
        return [node.get_child_at_index(i) for i in range(node.get_child_count())]
    except Exception:
        return []


def walk(node, depth=0, limit=2500, rows=None):
    if rows is None:
        rows = []
    if len(rows) >= limit:
        return rows
    try:
        role = node.get_role_name()
        name = (node.get_name() or "").strip().replace("\n", " ")
        description = (node.get_description() or "").strip().replace("\n", " ")
    except Exception:
        return rows
    if name or description or role in {"document web", "heading", "link", "push button"}:
        rows.append((depth, role, name, description))
    for child in children(node):
        walk(child, depth + 1, limit, rows)
    return rows


desktop = Atspi.get_desktop(0)
apps = children(desktop)
if len(sys.argv) > 1 and sys.argv[1] == "apps":
    for app in apps:
        print(app.get_name())
    raise SystemExit(0)

brave = next(
    (app for app in apps if "brave" in (app.get_name() or "").lower()),
    None,
)
if brave is None:
    raise SystemExit("Brave accessibility tree not found")

for depth, role, name, description in walk(brave):
    indent = "  " * min(depth, 12)
    detail = f" | {description}" if description else ""
    print(f"{indent}{role}: {name}{detail}")
