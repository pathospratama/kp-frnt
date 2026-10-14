import os
import json
from collections import defaultdict

# =====================================================
# EXTENSIONS
# =====================================================

ALLOWED_EXT = {
    ".py",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".env",
    ".txt",
    ".md",
    ".xml",
    ".ini",
    ".cfg",
    ".conf",
    ".properties",
    ".sql",
    ".sh",
    ".dockerignore",
    ".DS_Store",
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",

}

# =====================================================
# EXCLUDED DIRECTORIES
# =====================================================

EXCLUDE_DIRS = {
    ".git",
    ".idea",
    "__pycache__",
    "venv",
    ".venv",
    "utilitasDB",
    "eksternlTOLS",
    ".turbo",
    ".cache",
    "captures",
    "node_modules",
    ".git",
    ".zscripts",
    "db",
    "download",
    "examples",
    "mini-services",
    "prisma",
    ".next",

}

# =====================================================
# ARCHITECTURE DETECTION
# =====================================================

ARCHITECTURE_PATTERNS = {
    "FastAPI": [
        "FastAPI(",
        "APIRouter(",
    ],

    "Next.js": [
        "next.config",
        "app/page.tsx",
    ],

    "Prisma": [
        "schema.prisma",
    ],

    "Docker": [
        "Dockerfile",
    ],

    "Kafka": [
        "kafka",
    ],

    "ML Model": [
        "tensorflow",
        "torch",
        "sklearn",
        "transformer",
        "lstm",
    ],

    "AI Agents": [
        "agent",
        "orchestrator",
    ],

    "Supabase": [
        "supabase",
    ],

    "Vercel": [
        "vercel.json",
    ],

    "HuggingFace": [
        ".space-config",
    ],
}

# =====================================================
# BUILD TREE
# =====================================================

def build_tree(start_path, prefix=""):
    tree = []

    try:
        items = sorted(os.listdir(start_path))
    except:
        return tree

    items = [x for x in items if x not in EXCLUDE_DIRS]

    for i, item in enumerate(items):

        path = os.path.join(start_path, item)

        connector = "└── " if i == len(items)-1 else "├── "

        if os.path.isdir(path):
            tree.append(prefix + connector + f"📁 {item}")

            extension = "    " if i == len(items)-1 else "│   "

            tree.extend(
                build_tree(path, prefix + extension)
            )

        else:
            tree.append(prefix + connector + f"📄 {item}")

    return tree

# =====================================================
# READ FILES
# =====================================================

def collect_files(root_dir):

    files_data = []

    for root, dirs, files in os.walk(root_dir):

        dirs[:] = [
            d for d in dirs
            if d not in EXCLUDE_DIRS
        ]

        for file in files:

            ext = os.path.splitext(file)[1]

            if ext not in ALLOWED_EXT and file not in {
                "Dockerfile",
                "requirements.txt",
                "pyproject.toml",
                "vercel.json",
            }:
                continue

            path = os.path.join(root, file)

            rel_path = os.path.relpath(path, root_dir)

            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()

            except Exception as e:
                content = f"[ERROR] {e}"

            files_data.append({
                "path": rel_path,
                "content": content
            })

    return files_data

# =====================================================
# DETECT FEATURES
# =====================================================

def detect_features(files_data):

    detected = defaultdict(list)

    for file in files_data:

        path = file["path"]
        content = file["content"].lower()

        for feature, patterns in ARCHITECTURE_PATTERNS.items():

            for pattern in patterns:

                if (
                    pattern.lower() in content
                    or pattern.lower() in path.lower()
                ):
                    detected[feature].append(path)

    return detected

# =====================================================
# ANALYZE PROJECT STRUCTURE
# =====================================================

def analyze_structure(files_data):

    analysis = {
        "api_routes": [],
        "agents": [],
        "ml_models": [],
        "providers": [],
        "streaming": [],
        "middleware": [],
        "configs": [],
    }

    for file in files_data:

        path = file["path"]

        # API
        if "route" in path or "api/" in path:
            analysis["api_routes"].append(path)

        # AGENTS
        if "agent" in path:
            analysis["agents"].append(path)

        # ML
        if "ml_models" in path:
            analysis["ml_models"].append(path)

        # PROVIDERS
        if "provider" in path:
            analysis["providers"].append(path)

        # STREAMING
        if "stream" in path or "kafka" in path:
            analysis["streaming"].append(path)

        # MIDDLEWARE
        if "middleware" in path:
            analysis["middleware"].append(path)

        # CONFIG
        if (
            "config" in path
            or path.endswith(".env")
            or path.endswith(".json")
            or path.endswith(".toml")
        ):
            analysis["configs"].append(path)

    return analysis

# =====================================================
# GENERATE REPORT
# =====================================================

def generate_report(root_dir):

    output = []

    files_data = collect_files(root_dir)

    detected = detect_features(files_data)

    structure = analyze_structure(files_data)

    # =================================================
    # SUMMARY
    # =================================================

    output.append("===== UNIVERSAL PROJECT ANALYZER =====\n")

    output.append("PROJECT:")
    output.append(os.path.basename(root_dir))
    output.append("")

    output.append("DETECTED ARCHITECTURE:")

    for feature in detected:
        output.append(f"- {feature}")

    output.append("")

    # =================================================
    # MODULE ANALYSIS
    # =================================================

    for section, items in structure.items():

        output.append(f"===== {section.upper()} =====")

        if items:
            for item in items:
                output.append(f"- {item}")
        else:
            output.append("None")

        output.append("")

    # =================================================
    # FILE CONTENTS
    # =================================================

    output.append("===== FILE CONTENTS =====\n")

    for file in files_data:

        output.append(f"===== FILE: {file['path']} =====")

        output.append(file["content"])

        output.append("\n")

    # =================================================
    # TREE
    # =================================================

    output.append("===== PROJECT TREE =====\n")

    output.append(os.path.basename(root_dir) + "/")

    output.extend(build_tree(root_dir))

    return "\n".join(output)

# =====================================================
# MAIN
# =====================================================

if __name__ == "__main__":

    root = os.getcwd()

    report = generate_report(root)

    output_file = "universal_project_analysis.txt"

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(report)

    print(f"DONE -> {output_file}")