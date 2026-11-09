#!/usr/bin/env bash
# This sandbox mounts the linked worktree's Git metadata read-only.
# Keep its HEAD/index here, while retaining the existing shared objects/refs.
set -euo pipefail
cd "$(dirname "$0")/.."
export GIT_DIR="$PWD/.uat-git"
export GIT_WORK_TREE="$PWD"
exec git -c user.name=Codex -c user.email=codex@openai.com "$@"
