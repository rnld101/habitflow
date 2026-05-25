#!/usr/bin/env bash
set -euo pipefail

cd /opt/habitflow/frontend
npm install
npm run build

sudo cp /opt/habitflow/nginx/habitflow.conf /etc/nginx/conf.d/habitflow.conf
sudo rm -f /etc/nginx/sites-enabled/default || true
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx

sudo cloud-init clean
sudo rm -f /var/lib/cloud/instances/*/sem/* || true
sudo truncate -s 0 /var/log/cloud-init.log /var/log/cloud-init-output.log || true
echo "Frontend instance prepared for AMI creation"
