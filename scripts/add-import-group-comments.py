from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
IGNORE_PARTS = {".git", "node_modules", ".next", "out", "build"}
EXTENSIONS = {".ts", ".tsx"}


def section(title: str) -> list[str]:
    return [
        "/*--------------------------------------------*",
        f" * {title}",
        " *--------------------------------------------*/",
    ]


def classify(source: str) -> str:
    if re.search(r"\.(css|scss)$", source):
        return "Styles"
    if source.startswith("../"):
        return "Parent Relative"
    if source.startswith("./"):
        return "Local Relative"
    if re.match(r"^@(root|lib|i18n|components|clientComponents|serverComponents)\b", source):
        return "Project Aliases"
    return "Framework and Third-Party"


def add_group_comments(file_path: Path) -> bool:
    text = file_path.read_text(encoding="utf-8")
    lines = text.split("\n")

    idx = 0
    while idx < len(lines) and not lines[idx].strip():
        idx += 1

    if idx < len(lines) and re.match(r"\s*['\"]use (client|server)['\"];?\s*$", lines[idx]):
        idx += 1
        while idx < len(lines) and not lines[idx].strip():
            idx += 1

    start = idx
    end = idx

    while end < len(lines):
        line = lines[end]
        if re.match(r"\s*import\b", line) or not line.strip():
            end += 1
            continue
        break

    import_block = lines[start:end]

    if not any(re.match(r"\s*import\b", line) for line in import_block):
        return False

    # Skip files that already contain explicit import section comments
    if any("/*--------------------------------------------*" in line for line in import_block):
        return False

    groups: list[list[str]] = []
    current: list[str] = []

    for line in import_block:
        if not line.strip():
            if current:
                groups.append(current)
                current = []
            continue
        current.append(line)

    if current:
        groups.append(current)

    if not groups:
        return False

    rebuilt: list[str] = []
    for group_index, group in enumerate(groups):
        first_import = next((line for line in group if re.match(r"\s*import\b", line)), "")
        match = re.search(r"from\s+['\"]([^'\"]+)['\"]|import\s+['\"]([^'\"]+)['\"]", first_import)
        source = ""
        if match:
            source = match.group(1) or match.group(2) or ""

        rebuilt.extend(section(classify(source)))
        rebuilt.extend(group)

        if group_index < len(groups) - 1:
            rebuilt.append("")

    updated_lines = [*lines[:start], *rebuilt, *lines[end:]]
    updated = "\n".join(updated_lines)

    if updated == text:
        return False

    file_path.write_text(updated, encoding="utf-8")
    return True


def should_process(path: Path) -> bool:
    if path.suffix not in EXTENSIONS:
        return False
    return not any(part in IGNORE_PARTS for part in path.parts)


def main() -> None:
    changed = 0
    for path in ROOT.rglob("*"):
        if path.is_file() and should_process(path):
            if add_group_comments(path):
                changed += 1

    print(f"Updated {changed} files with import group comments.")


if __name__ == "__main__":
    main()
