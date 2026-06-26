# Deployment Runbook: Hostinger VPS (Ubuntu)

This runbook guides you through deploying **The Helping Society** manually inside Docker containers on a Hostinger VPS running Ubuntu.

---

## Prerequisites

Before starting, ensure you have:
1.  **Domain & DNS Configuration**:
    *   A domain name pointing to your VPS static IP (e.g. `thehelpingsociety.in` and `www.thehelpingsociety.in` mapped via A records).
2.  **SSH Access**: Key-based root or sudo access to your Hostinger Ubuntu VPS.
3.  **Third-Party Credentials**:
    *   MongoDB Atlas connection string.
    *   Cloudinary API credentials.
    *   Hostinger SMTP credentials.

---

## Step 1: VPS Host Hardening & Firewall Setup

Log in to your VPS via SSH and perform basic hardening:

1.  Update the system:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
2.  Configure the **UFW Firewall** to allow only HTTP, HTTPS, and SSH:
    ```bash
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    sudo ufw allow 22/tcp       # Change if using a custom SSH port
    sudo ufw allow 80/tcp       # HTTP
    sudo ufw allow 443/tcp      # HTTPS
    sudo ufw enable
    ```
3.  Install Fail2ban to block SSH brute-force:
    ```bash
    sudo apt install fail2ban -y
    sudo systemctl enable fail2ban
    sudo systemctl start fail2ban
    ```

---

## Step 2: Install Docker and Docker Compose

Follow the official Docker commands to set up the repository and install Docker:

```bash
# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl gnupg -y
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Add the repository to Apt sources:
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update

# Install Docker Engine and Plugins:
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
```

Verify the installation:
```bash
docker --version
docker compose version
```

---

## Step 3: Create Server Folders & Setup SSL Directories

Create the directory hierarchy under `/opt/the-helping-society/`:

```bash
sudo mkdir -p /opt/the-helping-society/nginx/ssl-options
sudo mkdir -p /opt/the-helping-society/certbot/conf
sudo mkdir -p /opt/the-helping-society/certbot/www
```

Generate a secure **Diffie-Hellman Parameter** file for SSL:
```bash
sudo openssl dhparam -out /opt/the-helping-society/nginx/ssl-options/ssl-dhparams.pem 2048
```

---

## Step 4: Obtain Initial SSL Certificates (Bootstrap Certbot)

Nginx requires certificates to start. To get Let's Encrypt certificates for the first time without having Nginx running:

1.  Run a temporary standalone Certbot container:
    ```bash
    sudo docker run --rm -it \
      -p 80:80 \
      -v /opt/the-helping-society/certbot/conf:/etc/letsencrypt \
      -v /opt/the-helping-society/certbot/www:/var/www/certbot \
      certbot/certbot certonly --standalone \
      -d thehelpingsociety.in -d www.thehelpingsociety.in \
      --email admin@thehelpingsociety.in \
      --agree-tos --no-eff-email
    ```
2.  Once complete, verified certificates will be available in `/opt/the-helping-society/certbot/conf/live/thehelpingsociety.in/`.

---

## Step 5: Copy Application Deployment Files

Clone your repository (or copy these files directly via SCP) to `/opt/the-helping-society/`:

*   `docker-compose.prod.yml` (Production compose configuration)
*   `backend/` (containing source code, package.json, and `Dockerfile`)
*   `frontend/` (containing source code, package.json, and `Dockerfile`)
*   `nginx/default.conf` (Nginx production configuration, copied into the frontend container at build time)
*   `nginx/ssl-options/ssl-dhparams.pem` (Diffie-Hellman file, mounted into the frontend container at runtime)

---

## Step 6: Create Production Environment File

Create the production environment file:
```bash
sudo nano /opt/the-helping-society/.env.production
```
Paste in your live variables, referring to `.env.production.example`. 

Apply secure file permissions:
```bash
sudo chown root:root /opt/the-helping-society/.env.production
sudo chmod 600 /opt/the-helping-society/.env.production
```

---

## Step 7: Build and Launch Containers

Build the production containers and launch them in daemon mode using the production compose file:

```bash
cd /opt/the-helping-society
sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Verify that all containers are healthy:
```bash
sudo docker compose -f docker-compose.prod.yml ps
```

---

## Step 8: Set Up Let's Encrypt Certificate Auto-Renewal

Let's Encrypt certificates are valid for 90 days. Set up a cron job to automatically check and renew them:

1.  Open the crontab editor:
    ```bash
    sudo crontab -e
    ```
2.  Add the following line to run every month at 3 AM:
    ```cron
    0 3 1 * * docker run --rm -v /opt/the-helping-society/certbot/conf:/etc/letsencrypt -v /opt/the-helping-society/certbot/www:/var/www/certbot certbot/certbot renew --webroot -w /var/www/certbot && docker exec frontend-app nginx -s reload
    ```

---

## Useful Maintenance Commands

*   **View Container Logs**:
    ```bash
    sudo docker compose -f docker-compose.prod.yml logs -f
    ```
*   **Check Backend Container Health**:
    ```bash
    sudo docker inspect --format='{{json .State.Health}}' backend-app
    ```
*   **Stop services**:
    ```bash
    sudo docker compose -f docker-compose.prod.yml down
    ```
*   **Update / Redeploy Code**:
    ```bash
    git pull origin main
    sudo docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
    ```

---

## Local Development Execution

For running the application locally:
1. Ensure you have your development variables configured in `backend/.env`.
2. Run the default compose configuration:
   ```bash
   docker compose up --build
   ```
3. Open `http://localhost` to access the application.

