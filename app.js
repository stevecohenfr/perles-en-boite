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

/**
 * ============================================
 * =============== Database ===================
 * ============================================
 */

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
    var id = db.get('constants.AUTO_INCREMENT.users').value();
    db.update('constants.AUTO_INCREMENT.users', n => n + 1).write();
    db.get('users').push({ id: id, email: email}).write()
};

var deleteUser = function(email) {
    db.get('users').remove({ email: email }).write();
};

var addPerle = function(perle, owner) {
    var id = db.get('constants.AUTO_INCREMENT.perles').value();
    db.update('constants.AUTO_INCREMENT.perles', n => n + 1).write();
    db.get('perles').push({ id: id, text: perle, owner: owner }).write();
};

/**
 * ============================================
 * ================= Emails ===================
 * ============================================
 */

var sendmail = function(to, subject, text) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        secure: 'true',
        port: '465',
        auth: {
            type: 'OAuth2',
            user: process.env.GMAIL_AUTH_USER,
            clientId: process.env.GMAIL_AUTH_CLIENT_ID,
            clientSecret: process.env.GMAIL_AUTH_CLIENT_SECRET,
            refreshToken: process.env.GMLAIL_AUTH_REFRESH_TOKEN
        }
    });

    let mailOptions = {
        from: process.env.GMAIL_FROM,
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, function(e, r) {
        if (e) {
            console.log(e);
        }
        //else {
          //  console.log(r);
        //}
        transporter.close();
    });
};

var imap = new Imap({
    user: process.env.GMAIL_AUTH_USER,
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

    sendmail(emails, "La perle du jour !", Buffer.from(perle.text, 'base64'));
};


if (argv.readmails) {
    readNewMails(function(mails) {
        Object.keys(mails).forEach(function(key) {
            let mail = mails[key];
            console.log("New mail from <%s> : %s", mail.from[0], mail.subject[0]);
            if (mail.subject[0] === 'join') {
                addUser(mail.from[0]);
                sendmail(
                    mail.from[0],
                    "Vous venez de rejoindre Perles-en-boite!",
                    "Bonjour,"+
                    "\n\n"+
                    "Merci d'avoir rejoint la communauté Perles-en-boite!\n"+
                    "Vous faites maintenant parti de la liste de diffusion et recevrez tous les jours un email avec une de nos plus belles perles !\n\n"+
                    "Pour partager une perles répondez à ce mail avec comme sujet 'perle' et comme texte votre perle, c'est super simple !\n\n"+
                    "Pour vous désabonner, c'est aussi simple, mettez comme sujet 'leave' et vous serez supprimés de la liste de diffusion !\n\n"+
                    "N'hésiez pas à partager, il suffit que n'importe lequel de vos amis envoie un email à cette adresse avec comme sujet 'join' :)\n\n"+
                    "Bonne journée avec Perles-en-boite !"
                );
            }else if (mail.subject[0] === 'leave') {
                deleteUser(mail.from[0]);
                sendmail(
                    mail.from[0],
                    "Désinscription de Perles-en-boite !",
                    "Bonjour,"+
                    "\n\n"+
                    "Nous avons le regret de vous voir quitter Perles-en-boite !\n"+
                    "Nous espérons cependant que vous avez passé de bons moment à lire les perles que vous avez reçus !\n\n"+
                    "N'hésitez pas à vous réabonner un de ces jours en répondant à ce mail avec comme sujet 'join' vous serez toujours le bien venu !\n\n"+
                    "A un de ces jours !\n\n"+
                    "--\n\n"+
                    "Perles-en-boite"
                );
            }else if (mail.subject[0] === 'perle') {
                addPerle(mail.body, mail.from[0]);
                sendmail(
                    mail.from[0],
                    "Nous avons bien reçu votre perle !",
                    "Bonjour,"+
                    "\n\n"+
                    "Nous avons bien reçu votre perle !\n"+
                    "Nous espérons qu'elle égaillera la journées de nos abonnées ! N'hésitez pas à nous partager toujours plus de perles pour toujours plus de plaisir !\n\n"+
                    "Vous pouvez aussi inviter vos amis à rejoindre la communauté, il leur suffit d'envoyer un mail avec comme sujet 'join', c'est super simple !\n\n"+
                    "Merci encore :)\n\n"+
                    "--\n\n"+
                    "Perles-en-boite"
                );
            }
        });
    });
}

if (argv.sendperle) {
    sendDailyPerle();
}