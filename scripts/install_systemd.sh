#!/usr/bin/env bash
set -euo pipefail

sudo cp /opt/habitflow/systemd/auth.service /etc/systemd/system/auth.service
sudo cp /opt/habitflow/systemd/habit.service /etc/systemd/system/habit.service
sudo cp /opt/habitflow/systemd/journal.service /etc/systemd/system/journal.service

sudo systemctl daemon-reload
sudo systemctl enable auth.service habit.service journal.service nginx
sudo systemctl restart auth.service habit.service journal.service
sudo systemctl restart nginx

sudo systemctl status auth.service --no-pager
sudo systemctl status habit.service --no-pager
sudo systemctl status journal.service --no-pager
sudo systemctl status nginx --no-pager
