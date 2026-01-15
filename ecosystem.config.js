// ================================
// PM2 ECOSYSTEM CONFIGURATION
// The RD Station - Production Setup
// ================================

module.exports = {
  apps: [{
    // Application name
    name: 'rd-station',

    // Entry point
    script: './server.js',

    // Instances (set to 'max' for cluster mode, or 1 for single instance)
    // Hostinger: Start with 1, scale if needed
    instances: 1,

    // Execution mode: 'cluster' or 'fork'
    exec_mode: 'fork',

    // Watch for file changes (disable in production)
    watch: false,

    // Maximum memory restart (auto-restart if exceeded)
    max_memory_restart: '500M',

    // Environment variables
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    },

    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },

    // Logging
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true,

    // Auto-restart settings
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Cron jobs (if PM2 cron is needed)
    // cron_restart: '0 0 * * *',  // Restart daily at midnight (optional)

    // Merge logs from cluster
    merge_logs: true,

    // Source map support
    source_map_support: true,

    // Instance variables
    instance_var: 'INSTANCE_ID',

    // Post-deployment hooks (optional)
    post_update: ['npm install', 'echo "Deployment successful"'],

    // Pre-deployment hooks (optional)
    pre_deploy_local: 'echo "Preparing deployment..."',
    post_deploy: 'npm install && pm2 reload ecosystem.config.js --env production && pm2 save'
  }],

  // Deployment configuration (optional, for PM2 deploy feature)
  deploy: {
    production: {
      user: 'your-ssh-user',
      host: 'your-hostinger-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/rd-station.git',
      path: '/home/your-user/rd-station',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': '',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};
