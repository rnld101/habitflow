# HabitFlow

Production-style 3-tier microservice app with React frontend, FastAPI backend services, and PostgreSQL on AWS RDS.

## 1. Folder Structure

```text
habitflow/
  .env.example
  requirements.txt
  README.md
  nginx/
    habitflow.conf
  sql/
    schema.sql
  auth-service/
    app.py
    database.py
    models.py
    security.py
    requirements.txt
    .env.example
  habit-service/
    app.py
    database.py
    models.py
    security.py
    requirements.txt
    .env.example
  journal-service/
    app.py
    database.py
    models.py
    security.py
    requirements.txt
    .env.example
  frontend/
    package.json
    .env.example
    public/
      index.html
    src/
      index.js
      App.js
      styles.css
      config.js
      api.js
      components/
        LoginPage.jsx
        HabitDashboard.jsx
        JournalPage.jsx
  scripts/
    backend_bootstrap.sh
    frontend_bootstrap.sh
    install_systemd.sh
    start_backend_services.sh
    start_frontend_service.sh
    ami_prep_backend.sh
    ami_prep_frontend.sh
  systemd/
    auth.service
    habit.service
    journal.service
    frontend.service
```

## 2. Editable Configuration Locations (EDIT HERE)

- Frontend API base URL: `frontend/src/config.js`
```js
const API_BASE_URL = "http://<INTERNAL-ALB-DNS>"
```
- Nginx proxy target: `nginx/habitflow.conf`
  - `proxy_pass http://<INTERNAL-ALB-DNS>;`
- Backend DB/JWT env files:
  - `auth-service/.env`
  - `habit-service/.env`
  - `journal-service/.env`
- Required placeholders:
  - `<RDS-ENDPOINT>`
  - `<DB_NAME>`
  - `<DB_USER>`
  - `<DB_PASSWORD>`
  - `<JWT_SECRET>`
  - `<Route53-DNS>`
  - `<EXTERNAL-ALB-DNS>`
  - `<INTERNAL-ALB-DNS>`

## 3. Microservices Endpoints

- Auth Service (`:8001`)
  - `POST /auth/register`
  - `POST /auth/login`
  - `GET /auth/me`
- Habit Service (`:8002`)
  - `POST /habits`
  - `GET /habits`
  - `PUT /habits/{id}`
  - `DELETE /habits/{id}`
  - `POST /habits/{id}/track`
  - `GET /habits/month?year=YYYY&month=MM`
- Journal Service (`:8003`)
  - `POST /journal`
  - `GET /journal`
  - `PUT /journal/{id}`
  - `DELETE /journal/{id}`

## 4. Database Schema

```bash
psql "host=<RDS-ENDPOINT> dbname=<DB_NAME> user=<DB_USER> password=<DB_PASSWORD> sslmode=require" -f sql/schema.sql
```

## 5. Security Group Design

- `sg-external-alb`
  - Inbound: `80,443` from `0.0.0.0/0`
  - Outbound: all
- `sg-frontend-ec2`
  - Inbound: `80` from `sg-external-alb`
  - SSH `22` from bastion/admin CIDR
  - Outbound: all
- `sg-internal-alb`
  - Inbound: `80` from `sg-frontend-ec2`
  - Outbound: to `sg-backend-ec2`
- `sg-backend-ec2`
  - Inbound: `8001-8003` from `sg-internal-alb`
  - SSH `22` from bastion/admin CIDR
  - Outbound: `5432` to RDS SG
- `sg-rds`
  - Inbound: `5432` from `sg-backend-ec2`

## 6. NACL Recommendations

- Public subnet NACL
  - Allow inbound `80/443`, ephemeral return traffic
  - Allow outbound all (or restricted as policy requires)
- Private app subnet NACL
  - Allow inbound app ports from public subnet CIDR
  - Allow outbound `5432` to DB subnets + ephemeral return
- DB subnet NACL
  - Allow inbound `5432` from private app subnet CIDR
  - Allow outbound ephemeral return

## 7. Manual AWS Deployment Steps

### Step 1: Create VPC
Create VPC CIDR (example `10.20.0.0/16`). Enable DNS hostnames.

### Step 2: Create Subnets
Create:
- Public Subnet AZ1 (`10.20.1.0/24`)
- Public Subnet AZ2 (`10.20.2.0/24`)
- Private App Subnet AZ1 (`10.20.11.0/24`)
- Private App Subnet AZ2 (`10.20.12.0/24`)

### Step 3: Create Security Groups
Create SGs exactly as above.

### Step 4: Create RDS
- Engine: PostgreSQL
- Multi-AZ: recommended
- Private subnets only
- Attach `sg-rds`
- Note endpoint `<RDS-ENDPOINT>`

### Step 5: Launch Backend EC2
- Launch in private app subnets
- Attach `sg-backend-ec2`
- Use SSM Session Manager or bastion for access

### Step 6: Install dependencies
On backend EC2:
```bash
sudo yum update -y || sudo apt update -y
sudo yum install -y python3 python3-pip git || sudo apt install -y python3 python3-pip git
git clone <your-repo-url> /opt/habitflow
cd /opt/habitflow
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Step 7: Configure backend environment
```bash
cp auth-service/.env.example auth-service/.env
cp habit-service/.env.example habit-service/.env
cp journal-service/.env.example journal-service/.env
vi auth-service/.env
vi habit-service/.env
vi journal-service/.env
```
Set `<RDS-ENDPOINT>`, `<DB_NAME>`, `<DB_USER>`, `<DB_PASSWORD>`, `<JWT_SECRET>`.

### Step 8: Configure frontend environment
- Edit `frontend/src/config.js`:
```js
const API_BASE_URL = "http://<INTERNAL-ALB-DNS>"
```
- Edit Nginx config proxy target in `nginx/habitflow.conf`:
```nginx
proxy_pass http://<INTERNAL-ALB-DNS>;
```

### Step 9: Create Internal ALB
- Scheme: Internal
- Subnets: private app subnets
- SG: `sg-internal-alb`
- Listener: HTTP 80

### Step 10: Create External ALB
- Scheme: Internet-facing
- Subnets: public subnets
- SG: `sg-external-alb`
- Listener: HTTP 80 (HTTPS 443 with ACM recommended)

### Step 11: Configure Target Groups
Create TGs:
- `tg-auth` HTTP:8001 (backend instances)
- `tg-habit` HTTP:8002
- `tg-journal` HTTP:8003
- `tg-frontend` HTTP:80 (frontend nginx instances)

### Step 12: Configure Path Routing
Internal ALB listener rules:
- `/auth/*` -> `tg-auth`
- `/habits/*` -> `tg-habit`
- `/journal/*` -> `tg-journal`

External ALB default:
- `/` -> `tg-frontend`

### Step 13: Create Launch Templates
- Frontend LT:
  - Public subnet compatible AMI
  - `sg-frontend-ec2`
  - User data to run frontend bootstrap and nginx setup
- Backend LT:
  - Private subnet compatible AMI
  - `sg-backend-ec2`
  - User data to run backend bootstrap/systemd

### Step 14: Create Auto Scaling Groups
- Frontend ASG across public AZ1/AZ2
- Backend ASG across private AZ1/AZ2
Attach ASGs to corresponding target groups.

### Step 15: Create AMIs
After validating services are auto-starting, create:
- Backend golden AMI
- Frontend golden AMI

### Step 16: Update Launch Templates
Update frontend/backend launch template versions to use new AMIs and set ASG default version.

### Step 17: Configure Route53
Create Alias `A` record:
- Name: `<Route53-DNS>`
- Target: `<EXTERNAL-ALB-DNS>`

### Step 18: Validate deployment
- `curl http://<Route53-DNS>` should load frontend
- Login/register works
- Habit and journal CRUD works
- Reboot instance and confirm services auto-start (`nginx`, backend services)

## 8. Runtime Commands

Backend service local run:
```bash
cd auth-service && pip install -r requirements.txt && uvicorn app:app --host 0.0.0.0 --port 8001
cd habit-service && pip install -r requirements.txt && uvicorn app:app --host 0.0.0.0 --port 8002
cd journal-service && pip install -r requirements.txt && uvicorn app:app --host 0.0.0.0 --port 8003
```

Frontend production build and serve (Nginx):
```bash
cd frontend
npm install
npm run build
sudo cp /opt/habitflow/nginx/habitflow.conf /etc/nginx/conf.d/habitflow.conf
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

Do not use `npm start` in production.

## 9. Systemd Setup

```bash
sudo cp systemd/auth.service /etc/systemd/system/auth.service
sudo cp systemd/habit.service /etc/systemd/system/habit.service
sudo cp systemd/journal.service /etc/systemd/system/journal.service
sudo systemctl daemon-reload
sudo systemctl enable auth.service habit.service journal.service nginx
sudo systemctl restart auth.service habit.service journal.service nginx
```

## 10. Verification and Health Checks

```bash
curl http://127.0.0.1:8001/health
curl http://127.0.0.1:8002/health
curl http://127.0.0.1:8003/health
curl -I http://127.0.0.1/
sudo nginx -t
sudo systemctl status auth.service habit.service journal.service nginx --no-pager
journalctl -u nginx -n 100 --no-pager
```

Internal ALB health checks:
- `GET /health` on ports 8001/8002/8003

External ALB frontend health check:
- `GET /` on port 80

## 11. AMI Compatibility Notes

- Backend services use `Restart=always`
- Nginx enabled on boot for frontend
- Env vars externalized in `.env`
- No hardcoded private IPs
- Config is editable and survives reboot

## 12. Troubleshooting

- 502 from ALB:
  - Check target group health and service ports
  - `sudo systemctl status <service>`
- Nginx not serving app:
  - Verify `frontend/build` exists after `npm run build`
  - `sudo nginx -t`
  - `sudo systemctl restart nginx`
- DB connection failure:
  - Verify RDS SG allows `5432` from backend SG
  - Verify `.env` values
- JWT auth failing:
  - Ensure same `JWT_SECRET` in all backend services
- Frontend cannot reach APIs:
  - Confirm `frontend/src/config.js` points to `http://<INTERNAL-ALB-DNS>`
  - Confirm `nginx/habitflow.conf` proxy target is `<INTERNAL-ALB-DNS>`
- App fails after reboot:
  - `systemctl is-enabled nginx auth.service habit.service journal.service` must be `enabled`
