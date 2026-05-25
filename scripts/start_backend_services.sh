#!/usr/bin/env bash
set -euo pipefail

source /opt/habitflow/.venv/bin/activate

cd /opt/habitflow/auth-service && nohup uvicorn app:app --host 0.0.0.0 --port 8001 > /tmp/auth.log 2>&1 &
cd /opt/habitflow/habit-service && nohup uvicorn app:app --host 0.0.0.0 --port 8002 > /tmp/habit.log 2>&1 &
cd /opt/habitflow/journal-service && nohup uvicorn app:app --host 0.0.0.0 --port 8003 > /tmp/journal.log 2>&1 &
