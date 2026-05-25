#!/usr/bin/env bash
set -euo pipefail

sudo systemctl daemon-reload
sudo systemctl enable auth.service habit.service journal.service
sudo systemctl restart auth.service habit.service journal.service

sudo cloud-init clean
sudo rm -f /var/lib/cloud/instances/*/sem/* || true
sudo truncate -s 0 /var/log/cloud-init.log /var/log/cloud-init-output.log || true
echo "Backend instance prepared for AMI creation"
