#!/usr/bin/env bash
set -euo pipefail

sudo mkdir -p /opt/habitflow
sudo cp -r . /opt/habitflow
sudo chown -R ec2-user:ec2-user /opt/habitflow

cd /opt/habitflow/frontend

if command -v yum >/dev/null 2>&1; then
  sudo yum install -y nodejs npm nginx
elif command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y nodejs npm nginx
elif command -v apt-get >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo apt-get install -y nodejs npm nginx
else
  echo "Unsupported package manager. Install nodejs, npm, and nginx manually."
  exit 1
fi

npm install
npm run build

sudo cp /opt/habitflow/nginx/habitflow.conf /etc/nginx/conf.d/habitflow.conf
sudo rm -f /etc/nginx/sites-enabled/default || true
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
