module.exports = {
  apps: [
    {
      name: "abyndotxyz",
      script: "/var/www/abyndotxyz/start.sh",
      interpreter: "/bin/bash",
      cwd: "/var/www/abyndotxyz",
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "127.0.0.1"
      }
    }
  ]
};