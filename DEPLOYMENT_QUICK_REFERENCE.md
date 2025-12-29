# JabClub Deployment - Quick Reference

Quick commands and configurations for deploying and managing the JabClub Booking System.

## Initial Setup Commands

```bash
# 1. Update system
apt update && apt upgrade -y

# 2. Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. Install PostgreSQL
apt install -y postgresql postgresql-contrib

# 4. Install PM2
npm install -g pm2

# 5. Install Nginx
apt install -y nginx

# 6. Create app directory
mkdir -p /var/www/jabclub
cd /var/www/jabclub
```

## Database Setup

```bash
# Create database and user
sudo -u postgres psql
```

```sql
CREATE USER jabclub_user WITH PASSWORD 'your_password';
CREATE DATABASE jabclub_production OWNER jabclub_user;
GRANT ALL PRIVILEGES ON DATABASE jabclub_production TO jabclub_user;
\q
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://jabclub_user:password@localhost:5432/jabclub_production?schema=public"
JWT_SECRET="your_32_char_random_string"
JWT_EXPIRES_IN="24h"
PORT=5000
NODE_ENV="production"
UPLOAD_DIR="/var/www/jabclub/uploads"
MAX_FILE_SIZE=5242880
FRONTEND_URL="https://app.jabclub.com"
```

### Frontend (.env.production.local)
```env
NEXT_PUBLIC_API_URL="https://app.jabclub.com/api"
```

## Deployment Commands

```bash
# Quick deploy (from project root)
./deploy.sh

# Manual deployment
cd /var/www/jabclub

# Backend
cd backend
npm ci --production=false
npm run build
npx prisma generate
npx prisma migrate deploy

# Frontend
cd ../frontend
npm ci --production=false
npm run build

# Start with PM2
cd ..
pm2 start ecosystem.config.js --env production
pm2 save
```

## PM2 Commands

```bash
pm2 status                          # View all processes
pm2 logs                            # View all logs
pm2 logs jabclub-backend            # Backend logs only
pm2 logs jabclub-frontend           # Frontend logs only
pm2 monit                           # Monitor resources
pm2 restart ecosystem.config.js     # Restart all
pm2 stop ecosystem.config.js        # Stop all
pm2 delete ecosystem.config.js      # Delete all processes
pm2 save                            # Save process list
pm2 startup systemd                 # Enable startup on boot
```

## Nginx Commands

```bash
nginx -t                            # Test configuration
systemctl reload nginx              # Reload configuration
systemctl restart nginx             # Restart Nginx
systemctl status nginx              # Check status
tail -f /var/log/nginx/error.log    # View error logs
tail -f /var/log/nginx/access.log   # View access logs
```

## SSL Certificate

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Obtain certificate
certbot --nginx -d app.jabclub.com

# Test renewal
certbot renew --dry-run

# Manual renewal
certbot renew
```

## Database Commands

```bash
# Connect to database
psql -U jabclub_user -d jabclub_production -h localhost

# Run migrations
cd /var/www/jabclub/backend
npx prisma migrate deploy

# Seed database
npm run prod:seed

# Backup database
pg_dump -U jabclub_user -h localhost jabclub_production | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore database
gunzip < backup_YYYYMMDD.sql.gz | psql -U jabclub_user -h localhost jabclub_production
```

## Update Application

```bash
cd /var/www/jabclub
git pull origin main
cd backend && npm ci && npm run build && npx prisma migrate deploy
cd ../frontend && npm ci && npm run build
cd .. && pm2 restart ecosystem.config.js
```

## Troubleshooting

```bash
# Check if ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :5000

# Check disk space
df -h

# Check memory usage
free -h

# Check system resources
htop

# View PM2 logs
pm2 logs --lines 100

# Check PostgreSQL status
systemctl status postgresql

# Restart everything
pm2 restart ecosystem.config.js
systemctl restart nginx
systemctl restart postgresql
```

## File Permissions

```bash
# Set ownership
chown -R www-data:www-data /var/www/jabclub

# Set permissions
chmod -R 755 /var/www/jabclub
chmod -R 775 /var/www/jabclub/uploads
```

## Firewall (UFW)

```bash
# Enable firewall
ufw enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Check status
ufw status
```

## Default Credentials

After seeding the database:
- **Email:** admin@jabclub.com
- **Password:** Admin123!

**⚠️ Change immediately after first login!**

## Important Paths

- Application: `/var/www/jabclub`
- Uploads: `/var/www/jabclub/uploads`
- Backend logs: `/var/www/jabclub/backend/logs/`
- Frontend logs: `/var/www/jabclub/frontend/logs/`
- Nginx config: `/etc/nginx/sites-available/jabclub`
- SSL certs: `/etc/letsencrypt/live/app.jabclub.com/`

## Health Checks

```bash
# Check if backend is responding
curl http://localhost:5000/api/health

# Check if frontend is responding
curl http://localhost:3000

# Check if Nginx is proxying correctly
curl https://app.jabclub.com
```

## Generate JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
