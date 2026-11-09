#!/usr/bin/env bash
# Local worktree metadata; shared objects/refs stay in the original repository.
set -euo pipefail
cd "$(dirname "$0")/.."
export GIT_DIR="$PWD/.uat-git"
export GIT_WORK_TREE="$PWD"
exec git -c user.name=Codex -c user.email=codex@openai.com "$@"
