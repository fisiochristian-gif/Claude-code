================================================================================
    THE RD STATION - HOSTINGER DEPLOYMENT GUIDE
    Complete Step-by-Step Manual for Production Deployment
================================================================================

VERSION: 2.0
LAST UPDATED: January 15, 2026
AUTHOR: DevOps Team - Rendite Digitali

================================================================================
TABLE OF CONTENTS
================================================================================
1. PRE-DEPLOYMENT CHECKLIST
2. HOSTINGER REQUIREMENTS
3. FILE UPLOAD METHODS
4. NODE.JS APPLICATION SETUP
5. ENVIRONMENT CONFIGURATION
6. DATABASE INITIALIZATION
7. SSL/HTTPS SETUP
8. PM2 PROCESS MANAGER
9. DOMAIN CONFIGURATION
10. POST-DEPLOYMENT TESTING
11. MONITORING & MAINTENANCE
12. TROUBLESHOOTING
13. LUMOS LUNA SDK CONFIGURATION

================================================================================
1. PRE-DEPLOYMENT CHECKLIST
================================================================================

✅ BEFORE YOU START:

□ Hostinger VPS or Business hosting plan with Node.js support
□ Domain name purchased and added to Hostinger
□ SSL certificate (free Let's Encrypt available)
□ FTP/SFTP credentials ready
□ SSH access enabled (for VPS plans)
□ Node.js version 16+ supported by host
□ At least 512MB RAM available
□ At least 1GB disk space available

✅ FILES TO UPLOAD (from your local repository):

REQUIRED FILES:
□ server.js (main backend server)
□ database.js (database module)
□ timer-manager.js (game timer management)
□ bot-ai.js (bot logic)
□ package.json (dependencies list)
□ ecosystem.config.js (PM2 configuration)
□ .env (create from .env.example)

REQUIRED FOLDERS:
□ public/ (entire frontend directory)
  ├── index.html
  ├── admin-station.html
  ├── app.js
  ├── styles*.css (all CSS files)
  └── modules/ (all JavaScript modules)

OPTIONAL BUT RECOMMENDED:
□ README.md
□ .gitignore
□ ecosystem.config.js

================================================================================
2. HOSTINGER REQUIREMENTS
================================================================================

MINIMUM SPECIFICATIONS:
- Node.js version: 16.x or higher
- RAM: 512MB minimum, 1GB recommended
- Disk Space: 1GB minimum, 2GB recommended
- CPU: 1 core minimum
- Bandwidth: Unlimited preferred

SUPPORTED HOSTINGER PLANS:
✅ VPS (Best option - full control)
✅ Business Hosting (with Node.js addon)
❌ Shared Hosting (Node.js not supported)

REQUIRED HOSTINGER FEATURES:
- Node.js application hosting
- SQLite support (or ability to install)
- WebSocket support (for Socket.IO)
- SSH access (highly recommended)
- Cron jobs support
- PM2 or equivalent process manager

================================================================================
3. FILE UPLOAD METHODS
================================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTION A: HOSTINGER FILE MANAGER (Easiest)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Log in to hPanel (panel.hostinger.com)
2. Go to "Files" → "File Manager"
3. Navigate to your domain's root directory (usually public_html/)
4. Click "Upload" button
5. Select all project files and folders
6. Wait for upload to complete

⚠️ NOTE: File Manager may timeout on large uploads. Use FTP for folders > 100MB.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTION B: FTP/SFTP (Recommended for large projects)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Get FTP credentials from hPanel
   - Go to "Files" → "FTP Accounts"
   - Note: Hostname, Username, Password, Port

STEP 2: Use an FTP client (FileZilla recommended)
   - Download FileZilla: https://filezilla-project.org
   - Host: ftp.your-domain.com
   - Username: your-ftp-username
   - Password: your-ftp-password
   - Port: 21 (FTP) or 22 (SFTP)

STEP 3: Upload project files
   - Connect to server
   - Navigate to public_html/ or your domain folder
   - Drag and drop all project files from local to remote
   - Maintain directory structure

⚠️ IMPORTANT: Upload .env file separately via hPanel File Manager to avoid FTP visibility issues.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTION C: SSH + GIT (Best for developers)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: Enable SSH in hPanel
   - Go to "Advanced" → "SSH Access"
   - Enable SSH and note credentials

STEP 2: Connect via SSH
   ssh your-username@your-ip-address
   # Enter password when prompted

STEP 3: Clone repository
   cd public_html/
   git clone https://github.com/your-repo/rd-station.git .
   # OR upload files via SCP

STEP 4: Install dependencies
   npm install --production

================================================================================
4. NODE.JS APPLICATION SETUP (hPanel)
================================================================================

STEP 1: ACCESS NODE.JS MANAGER
   - Log in to hPanel
   - Go to "Advanced" → "Node.js"
   - Or search "Node.js" in top search bar

STEP 2: CREATE NEW APPLICATION
   Click "Create Application" button

STEP 3: CONFIGURE APPLICATION SETTINGS

   ┌─────────────────────────────────────────────────────────────┐
   │ Application Name:    rd-station                              │
   │ Node.js Version:     16.x or higher (latest stable)         │
   │ Application Mode:    Production                              │
   │ Application Root:    /public_html/your-domain                │
   │ Application URL:     https://your-domain.com                 │
   │ Application Startup: server.js                               │
   │ Port:                3000 (or Hostinger assigned port)       │
   └─────────────────────────────────────────────────────────────┘

STEP 4: ENVIRONMENT VARIABLES
   Add the following in hPanel Node.js Environment Variables:

   NODE_ENV=production
   PORT=3000
   DATABASE_PATH=./database.db
   SESSION_SECRET=your-random-secret-here

   ⚠️ Generate SESSION_SECRET:
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

STEP 5: SAVE CONFIGURATION
   Click "Create" or "Save"

STEP 6: INSTALL DEPENDENCIES
   - In hPanel Node.js manager, find your application
   - Click "Run npm install" button
   - Wait for completion (may take 2-5 minutes)

   ⚠️ If button not available, use SSH:
   cd /path/to/your/app
   npm install --production

================================================================================
5. ENVIRONMENT CONFIGURATION (.env file)
================================================================================

STEP 1: CREATE .env FILE
   - Navigate to your application root via File Manager or SSH
   - Create new file named ".env" (no extension)

STEP 2: COPY FROM .env.example
   Copy contents of .env.example to .env

STEP 3: CONFIGURE PRODUCTION VALUES

   ┌─────────────────────────────────────────────────────────────┐
   │ CRITICAL SETTINGS TO CHANGE:                                 │
   ├─────────────────────────────────────────────────────────────┤
   │ NODE_ENV=production                                          │
   │ PORT=3000                                                    │
   │ PUBLIC_URL=https://your-actual-domain.com                   │
   │ SESSION_SECRET=<generate-with-crypto>                       │
   │ CORS_ORIGIN=https://your-actual-domain.com                  │
   │ DATABASE_PATH=./database.db                                 │
   └─────────────────────────────────────────────────────────────┘

STEP 4: SET FILE PERMISSIONS
   Via SSH:
   chmod 600 .env

   Via File Manager:
   Right-click .env → Permissions → Set to 600 (rw-------)

⚠️ SECURITY: Never commit .env to git or share publicly!

================================================================================
6. DATABASE INITIALIZATION
================================================================================

STEP 1: VERIFY SQLite INSTALLATION
   Via SSH:
   sqlite3 --version

   If not installed (VPS only):
   sudo apt-get install sqlite3

STEP 2: DATABASE AUTO-INITIALIZATION
   The database.js module will auto-create database.db on first run.

   Tables created:
   ✓ users
   ✓ social_actions
   ✓ game_sessions
   ✓ game_players
   ✓ properties
   ✓ cards
   ✓ upvotes_tracking
   ✓ apr_distributions

STEP 3: VERIFY DATABASE CREATION
   After starting server, check:
   ls -lah database.db

   Should show file with ~100KB size

STEP 4: MANUAL INITIALIZATION (if needed)
   Via SSH:
   node -e "const db = require('./database'); db.initializeDatabase().then(() => console.log('Database initialized'));"

STEP 5: SET DATABASE PERMISSIONS
   chmod 644 database.db

================================================================================
7. SSL/HTTPS SETUP (CRITICAL FOR PRODUCTION)
================================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOSTINGER FREE SSL (Let's Encrypt)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: ENABLE SSL IN hPanel
   - Go to "Security" → "SSL"
   - Find your domain
   - Click "Install SSL" or "Manage"

STEP 2: SELECT SSL TYPE
   ✅ Choose "Free SSL" (Let's Encrypt)
   - Auto-renewal enabled
   - Valid for 90 days, auto-renews

STEP 3: VERIFY SSL INSTALLATION
   Wait 5-15 minutes for propagation
   Visit: https://your-domain.com

   Check for padlock icon 🔒 in browser

STEP 4: FORCE HTTPS REDIRECT
   Add to .htaccess in public_html/:

   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

STEP 5: UPDATE APPLICATION URLS
   - Update .env: PUBLIC_URL=https://your-domain.com
   - Update Socket.IO config to use secure WebSocket (wss://)

⚠️ Socket.IO may require additional configuration:
   Ensure Socket.IO uses secure: true in production

================================================================================
8. PM2 PROCESS MANAGER (Keep Server Running)
================================================================================

PM2 ensures your Node.js server:
✅ Runs continuously 24/7
✅ Auto-restarts on crashes
✅ Survives server reboots
✅ Provides monitoring and logs
✅ Manages monthly minting cron jobs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTION A: PM2 VIA SSH (VPS Plans)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: INSTALL PM2 GLOBALLY
   ssh your-username@your-server
   npm install -g pm2

STEP 2: START APPLICATION WITH PM2
   cd /path/to/your/app
   pm2 start ecosystem.config.js --env production

STEP 3: SAVE PM2 PROCESS LIST
   pm2 save

   This saves current processes to auto-start on reboot

STEP 4: SETUP PM2 STARTUP SCRIPT
   pm2 startup

   Follow on-screen instructions (may require sudo)

STEP 5: VERIFY PM2 IS RUNNING
   pm2 list
   pm2 status rd-station

   Should show:
   ┌─────┬──────────────┬─────────┬─────────┬──────────┐
   │ id  │ name         │ status  │ cpu     │ memory   │
   ├─────┼──────────────┼─────────┼─────────┼──────────┤
   │ 0   │ rd-station   │ online  │ 0.5%    │ 85.2 MB  │
   └─────┴──────────────┴─────────┴─────────┴──────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OPTION B: HOSTINGER NODE.JS MANAGER (Business Plans)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1: USE BUILT-IN PROCESS MANAGER
   - In hPanel Node.js manager
   - Find your application
   - Click "Start" button
   - Application mode: "Production"

STEP 2: ENABLE AUTO-RESTART
   - Toggle "Auto-restart on crash"
   - Toggle "Auto-start on server boot"

STEP 3: MONITOR APPLICATION
   - View logs in hPanel
   - Check status: should show "Running"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PM2 COMMANDS REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

pm2 start ecosystem.config.js --env production   # Start application
pm2 stop rd-station                               # Stop application
pm2 restart rd-station                            # Restart application
pm2 reload rd-station                             # Zero-downtime reload
pm2 delete rd-station                             # Remove from PM2
pm2 logs rd-station                               # View logs (real-time)
pm2 logs rd-station --lines 100                   # View last 100 lines
pm2 monit                                         # Real-time monitoring
pm2 status                                        # List all processes
pm2 save                                          # Save current process list
pm2 resurrect                                     # Restore saved processes
pm2 flush                                         # Clear logs

================================================================================
9. DOMAIN CONFIGURATION
================================================================================

STEP 1: POINT DOMAIN TO HOSTINGER
   If domain not on Hostinger:
   - Get Hostinger nameservers from hPanel
   - Update at your domain registrar:
     ns1.dns-parking.com
     ns2.dns-parking.com

STEP 2: ADD DOMAIN IN hPanel
   - Go to "Domains"
   - Click "Add Domain"
   - Enter: your-domain.com

STEP 3: CONFIGURE DNS RECORDS
   - Go to "DNS/Name Servers" → "DNS Zone Editor"
   - Ensure A record points to your VPS IP

   Type: A
   Name: @
   Points to: your-vps-ip-address
   TTL: 14400

STEP 4: WAIT FOR DNS PROPAGATION
   - Can take 24-48 hours
   - Check: https://dnschecker.org

STEP 5: VERIFY DOMAIN ACCESS
   Visit: https://your-domain.com
   Should load The RD Station login page

================================================================================
10. POST-DEPLOYMENT TESTING
================================================================================

✅ CRITICAL TESTS TO PERFORM:

□ TEST 1: SERVER HEALTH
   Visit: https://your-domain.com
   Expected: Login page loads with RD Station branding

□ TEST 2: WEBSOCKET CONNECTION
   Open browser console (F12)
   Look for: "Socket.IO connected" message
   Expected: No WebSocket errors

□ TEST 3: USER REGISTRATION
   - Enter username
   - Click "CONNETTI"
   - Expected: Redirects to RD Station Hub

□ TEST 4: STAKING SETUP
   - Navigate to Staking Hub
   - Select a tier (e.g., Gold Commander)
   - Click "Verify & Save"
   - Expected: Credits minted, countdown timer starts

□ TEST 5: ADMIN PANEL
   Visit: https://your-domain.com/admin-station.html
   Expected: Stats display correctly

□ TEST 6: SSL CERTIFICATE
   Check padlock icon 🔒 in browser
   Expected: Valid SSL, no warnings

□ TEST 7: MONTHLY MINTING CRON
   Via SSH:
   pm2 logs rd-station | grep "monthly minting"
   Expected: Cron job scheduled message

□ TEST 8: DATABASE PERSISTENCE
   Restart server:
   pm2 restart rd-station

   Log back in:
   Expected: User data persists, minting timer continues

□ TEST 9: TRADE SYSTEM
   - Join Luncopoly game
   - Propose trade to another player
   - Wait 60 seconds
   - Expected: Auto-accept after 1 minute

□ TEST 10: SOCIAL TASKS
   - Complete a social task
   - Check balance increase
   - Expected: Points and credits awarded

================================================================================
11. MONITORING & MAINTENANCE
================================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DAILY MONITORING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Check server status
   pm2 status

   All processes should be "online"

□ Check error logs
   pm2 logs rd-station --err --lines 50

   Look for recurring errors

□ Check resource usage
   pm2 monit

   RAM should be < 500MB
   CPU should be < 50% average

□ Verify cron jobs ran
   grep "monthly minting" logs/pm2-combined.log

   Should see daily check messages

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WEEKLY MAINTENANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Backup database
   cp database.db backups/database_$(date +%Y%m%d).db

   Keep last 7 backups

□ Check disk space
   df -h

   Ensure > 20% free

□ Review user activity
   Visit admin panel: /admin-station.html
   Check:
   - Total users growth
   - Credits burned count
   - Active games

□ Update dependencies (if needed)
   npm outdated
   npm update --production
   pm2 restart rd-station

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MONTHLY MAINTENANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

□ Verify SSL renewal
   Check expiry date: https://www.ssllabs.com/ssltest/

□ Database optimization
   sqlite3 database.db "VACUUM;"

□ Clear old logs
   pm2 flush
   rm -f logs/*.log.old

□ Security updates
   npm audit
   npm audit fix --production

□ Test restore from backup
   cp database.db database.db.current
   cp backups/database_latest.db database.db
   pm2 restart rd-station
   # Test application
   mv database.db.current database.db

================================================================================
12. TROUBLESHOOTING
================================================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE: Application won't start
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOLUTION:
1. Check syntax errors:
   node -c server.js

2. Check logs:
   pm2 logs rd-station --err

3. Verify dependencies:
   npm install --production

4. Check port availability:
   netstat -tuln | grep 3000

5. Verify .env file exists:
   ls -la .env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE: WebSocket connection fails
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOLUTION:
1. Check CORS settings in .env:
   CORS_ORIGIN=https://your-exact-domain.com

2. Verify SSL is enabled:
   Browser should show 🔒

3. Check Socket.IO path:
   Should be: wss://your-domain.com/socket.io

4. Test WebSocket:
   Visit: https://www.websocket.org/echo.html
   Connect to: wss://your-domain.com/socket.io

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE: Database not initializing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOLUTION:
1. Check file permissions:
   chmod 755 .
   chmod 644 database.db (if exists)

2. Manual initialization:
   node -e "const db = require('./database'); db.initializeDatabase();"

3. Check disk space:
   df -h

4. Verify SQLite installed:
   sqlite3 --version

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE: Monthly minting not working
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOLUTION:
1. Check cron job is scheduled:
   pm2 logs | grep "Monthly minting cron"

2. Verify timestamps in database:
   sqlite3 database.db "SELECT id_univoco, next_minting_timestamp FROM users WHERE next_minting_timestamp IS NOT NULL;"

3. Manual trigger (testing):
   curl -X POST http://localhost:3000/api/staking/check-minting

4. Check server timezone:
   date
   # Should match your expected timezone

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE: High memory usage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOLUTION:
1. Check PM2 memory limit:
   pm2 show rd-station | grep memory

2. Increase max_memory_restart in ecosystem.config.js:
   max_memory_restart: '500M' → '1G'

3. Clear trade system memory:
   Trades auto-cleanup after 60 seconds

4. Restart application:
   pm2 restart rd-station

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUE: Admin panel shows 0 stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SOLUTION:
1. Check database has data:
   sqlite3 database.db "SELECT COUNT(*) FROM users;"

2. Test API endpoint:
   curl http://localhost:3000/api/admin/stats

3. Check browser console (F12):
   Look for fetch errors

4. Verify CORS headers:
   Response should include Access-Control-Allow-Origin

================================================================================
13. LUMOS LUNA SDK CONFIGURATION (FUTURE MAINNET BRIDGE)
================================================================================

⚠️ CURRENTLY: Application runs in SIMULATION mode (no real LUNC transactions)

WHEN READY FOR MAINNET BRIDGE:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1: OBTAIN LUMOS LUNA API CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Visit: https://lumos.finance (or equivalent Terra Classic bridge)
2. Create developer account
3. Generate API key and secret
4. Configure webhook URL for callbacks

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2: UPDATE .env FILE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Add to .env:

# MAINNET CONFIGURATION
TERRA_LCD_URL=https://terra-classic-lcd.publicnode.com
TERRA_CHAIN_ID=columbus-5

# LUMOS LUNA SDK
LUMOS_API_KEY=your_actual_api_key
LUMOS_API_SECRET=your_actual_secret
LUMOS_WEBHOOK_URL=https://your-domain.com/api/webhooks/lumos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3: IMPLEMENT BLOCKCHAIN MODULE (TO BE ADDED)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create: blockchain-bridge.js

const axios = require('axios');

async function depositLUNC(userId, amount, txHash) {
  // Verify transaction on Terra Classic
  const tx = await verifyTerraTransaction(txHash);

  // Confirm amount matches
  if (tx.amount === amount) {
    // Credit user account
    await db.depositLUNC(userId, amount, txHash);
    return { success: true };
  }
}

async function withdrawLUNC(userId, amount, terraAddress) {
  // Deduct from user balance
  // Create withdrawal transaction
  // Send LUNC via Lumos Luna SDK
  // Return transaction hash
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4: SECURITY CONSIDERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ BEFORE ENABLING MAINNET:

□ Implement multi-signature wallet for cold storage
□ Set up rate limiting for deposits/withdrawals
□ Add KYC/AML verification (if required)
□ Implement transaction confirmation threshold (e.g., 6 blocks)
□ Set daily withdrawal limits
□ Enable 2FA for admin operations
□ Implement hot/cold wallet separation
□ Regular security audits
□ Purchase insurance for custodial funds
□ Legal compliance check

⚠️ RECOMMENDATION: Start with TESTNET first to validate integration

================================================================================
DEPLOYMENT CHECKLIST - FINAL VERIFICATION
================================================================================

BEFORE ANNOUNCING GO-LIVE:

✅ PRE-LAUNCH:
□ All files uploaded to Hostinger
□ Node.js application started
□ PM2 process manager running
□ Database initialized with all tables
□ SSL certificate active (🔒 padlock visible)
□ Domain pointing correctly
□ .env configured with production values
□ Monthly minting cron scheduled
□ Admin panel accessible

✅ FUNCTIONALITY:
□ User registration works
□ Login/logout works
□ Staking setup functional
□ Monthly minting timer displays
□ Luncopoly game loads
□ Trade system functional (1-min auto-accept)
□ Social tasks award points/credits
□ Admin panel shows stats
□ WebSocket connection stable

✅ PERFORMANCE:
□ Page loads in < 3 seconds
□ No console errors in browser (F12)
□ Server RAM usage < 500MB
□ PM2 shows "online" status
□ No error spikes in logs

✅ SECURITY:
□ HTTPS enforced (HTTP redirects to HTTPS)
□ .env file has 600 permissions
□ SESSION_SECRET is random 32+ characters
□ CORS limited to production domain
□ Database file has proper permissions
□ Admin panel not indexed by search engines

✅ MONITORING:
□ PM2 startup script configured
□ Daily backup cron job set
□ Error notification emails configured
□ Uptime monitoring tool active (optional)

================================================================================
SUPPORT & RESOURCES
================================================================================

HOSTINGER SUPPORT:
- Live Chat: Available 24/7 in hPanel
- Help Center: https://support.hostinger.com
- Community: https://community.hostinger.com

DOCUMENTATION:
- Node.js on Hostinger: https://support.hostinger.com/en/articles/5386743
- PM2 Documentation: https://pm2.keymetrics.io/docs/usage/quick-start/
- Socket.IO: https://socket.io/docs/v4/

TERRA CLASSIC RESOURCES:
- Terra Classic Documentation: https://docs.terra.money
- LUNC Community: https://terra.sc
- Block Explorer: https://finder.terra.money/mainnet

================================================================================
END OF DEPLOYMENT GUIDE
================================================================================

Version: 2.0
Last Updated: January 15, 2026
Status: PRODUCTION READY ✅

For technical support: support@renditedigitali.com
For partnership inquiries: info@renditedigitali.com

================================================================================
