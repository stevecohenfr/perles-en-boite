#!/bin/sh
pm2 start app.js --name "peb-smile-read" --log-date-format 'DD-MM-YYYY HH:mm:ss.SSS' --cron "* * * * *" --no-autorestart --interpreter "/home/steve/.nvm/versions/node/v11.3.0/bin/node" -- --readmails
pm2 start app.js --name "peb-smile-send" --log-date-format 'DD-MM-YYYY HH:mm:ss.SSS' --cron "0 10 * * *" --no-autorestart --interpreter "/home/steve/.nvm/versions/node/v11.3.0/bin/node" -- --sendperle
