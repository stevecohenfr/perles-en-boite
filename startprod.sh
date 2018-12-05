#!/bin/sh
pm2 start app.js --name "peb-smile" --log-date-format 'DD-MM-YYYY HH:mm:ss.SSS' --cron "* * * * *" --no-autorestart --interpreter "/home/steve/.nvm/versions/node/v8.11.3/bin/node" -- --readmail
