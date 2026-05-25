#!/usr/bin/env bash
set -euo pipefail

sudo mkdir -p /opt/habitflow
sudo cp -r . /opt/habitflow
sudo chown -R ec2-user:ec2-user /opt/habitflow

cd /opt/habitflow
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

for svc in auth-service habit-service journal-service; do
  cp "$svc/.env.example" "$svc/.env"
  echo "Edit /opt/habitflow/$svc/.env before starting services"
done
