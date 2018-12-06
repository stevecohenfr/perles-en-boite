const emails        = require('./emails.js');
const nodemailer    = require('nodemailer');
const xoauth2       = require('xoauth2');
const Imap          = require('imap');
const inspect       = require('util').inspect;
const fs            = require('fs');
const low           = require('lowdb');
const FileSync      = require('lowdb/adapters/FileSync');
const env           = require('dotenv').config();
const isBase64      = require('is-base64');
const argv          = require('yargs').argv;
const addrs         = require("email-addresses");

/**
 * ============================================
 * =============== Database ===================
 * ============================================
 */

String.prototype.replaceVars = function (hash) {
    var string = this, key; for (key in hash) string = string.replace(new RegExp('\\{' + key + '\\}', 'gm'), hash[key]); return string;
}

const adapter = new FileSync('db.json');
const db = low(adapter);

db.defaults({
    perles: [],
    users: [],
    constants: {
        AUTO_INCREMENT: {
            perles: 0,
            users: 0
        }
    },
    config: {}
}).write();

var addUser = function(email) {
    return new Promise(function(resolve, reject) {
        var data = addrs.parseOneAddress(email);
        if (db.get('users').find({ email : data.address }).size().value() > 0) {
            reject("already_exists");
        }else {
            var id = db.get('constants.AUTO_INCREMENT.users').value();
            db.update('constants.AUTO_INCREMENT.users', n => n + 1).write();
            db.get('users').push({ id: id, email: data.address}).write();
            resolve();
        }
    });
};

var deleteUser = function(email) {
    return new Promise(function(resolve, reject) {
        var data = addrs.parseOneAddress(email);
        if (db.get('users').find({ email : data.address }).size().value() > 0) {
            db.get('users').remove({ email: data.address }).write();
            resolve();
        }else {
            reject("not_found");
        }
    });
};

var addPerle = function(perle, owner) {
    return new Promise(function(resolve, reject) {
        var id = db.get('constants.AUTO_INCREMENT.perles').value();
        db.update('constants.AUTO_INCREMENT.perles', n => n + 1).write();
        db.get('perles').push({ id: id, text: perle, owner: owner }).write();
        resolve();
    });
};

/**
 * ============================================
 * ================= Emails ===================
 * ============================================
 */

var sendmail = function(to, mailOptions, vars) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD
        }
    });

    mailOptions.to = to;
    mailOptions.from = process.env.GMAIL_FROM;
    if (typeof vars === 'object') {
        mailOptions.subject = mailOptions.subject.replaceVars(vars);
        mailOptions.text = mailOptions.text.replaceVars(vars);
    }

    transporter.sendMail(mailOptions, function(e, r) {
        if (e) {
            console.log("Erreur d'envoie de mail: ", e);
        }
        //else {
        //  console.log(r);
        //}
        transporter.close();
    });
};

var imap = new Imap({
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true
});

function openInbox(cb) {
    imap.openBox('INBOX', false, cb);
}

var readNewMails = function(callback) {
    var mails = {};
    imap.once('ready', function() {
        openInbox(function(err, box) {
            if (err) throw err;
            console.log('Fetching new messages...');
            imap.search([ 'UNSEEN' ], function(err, results) {
                if(!results || results.length === 0){console.log("No unseen email available"); imap.end();return;}
                if (err) throw err;
                imap.setFlags(results, ['\\Seen'], function(err) { if (err) throw err; });
                var f = imap.fetch(results, {
                    bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
                    struct: true
                });
                f.on('message', function (msg, seqno) {
                    //console.log('Message #%d', seqno);
                    msg.on('body', function (stream, info) {
                        var buffer = '';
                        mails["#"+seqno] = {};
                        stream.on('data', function (chunk) {
                            buffer += chunk.toString('utf8');
                        });
                        stream.once('end', function () {
                            if (info.which === 'TEXT') {
                                var body = buffer;
                                if (!isBase64(body)) {
                                    body = Buffer.from(body).toString('base64');
                                }
                                Object.assign(mails["#"+seqno], { body: body });
                            }else {
                                var data = Imap.parseHeader(buffer);
                                Object.assign(mails["#"+seqno], data);
                            }
                            //console.log(prefix + 'Parsed header: %s', inspect(Imap.parseHeader(buffer)));
                        });
                    });
                    msg.once('attributes', function (attrs) {
                        //console.log(prefix + 'Attributes: %s', inspect(attrs, false, 8));
                    });
                    msg.once('end', function () {
                        //console.log(prefix + 'Finished');
                    });
                });
                f.once('error', function (err) {
                    console.log('Fetch error: ' + err);
                });
                f.once('end', function () {
                    console.log('Done fetching all messages!');
                    imap.end();
                    callback(mails);
                });
            });
        });
    });

    imap.once('error', function(err) {
        console.log(err);
    });

    imap.once('end', function() {
        console.log('Connection ended');
    });

    imap.connect();
};

var sendDailyPerle = function() {
    let nbPerles = db.get('perles').size().value();
    if (nbPerles === 0) {
        console.log("No perle in database.");
        return;
    }
    let rand = Math.floor((Math.random()*(nbPerles)));
    let perle = db.get('perles['+rand+']').value();
    let emails = db.get('users').map('email').value();

    sendmail(emails, {
        subject: "La perle du jour !",
        text: Buffer.from(perle.text, 'base64')
    });
};


if (argv.readmails) {
    readNewMails(function(mails) {
        Object.keys(mails).forEach(function(key) {
            let mail = mails[key];
            console.log("New mail from %s : %s", mail.from[0], mail.subject[0]);
            let subject = mail.subject[0].toLowerCase().trim();
            switch (subject) {
                case 'join':
                    addUser(mail.from[0])
                        .then(() => {
                            sendmail(mail.from[0], emails.join.success);
                        })
                        .catch(errorCode => {
                            sendmail(mail.from[0], emails.join.fail[errorCode]);
                        });
                break;
                case 'leave':
                    deleteUser(mail.from[0])
                        .then(() => {
                            sendmail(mail.from[0], emails.leave.success);
                        })
                        .catch(errorCode => {
                            sendmail(mail.from[0], emails.leave.fail[errorCode]);
                        });
                break;
                case 'perle':
                    addPerle(mail.body, mail.from[0])
                        .then(() => {
                            sendmail(mail.from[0], emails.perle.success);
                        })
                        .catch(errorCode => {
                            sendmail(mail.from[0], emails.perle.fail[errorCode]);
                        });
                break;
                case 'help':
                case '?':
                    sendmail(mail.from[0], emails.help);
                break;
                default:
                    //sendmail(mail.from[0], emails.unknown, { command: subject }) // Suppression du mail command not found, pour éviter les boucles infini (réponse auto)
                break;
            }
        });
    });
}

if (argv.sendperle) {
    sendDailyPerle();
}
