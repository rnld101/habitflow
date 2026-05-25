#!/usr/bin/env bash
set -euo pipefail

cd /opt/habitflow/frontend
npm install
npm run build

sudo cp /opt/habitflow/nginx/habitflow.conf /etc/nginx/conf.d/habitflow.conf
sudo rm -f /etc/nginx/sites-enabled/default || true
sudo nginx -t
sudo systemctl restart nginx
