"use strict";

exports.join = {
    success: {
        subject: "Vous venez de rejoindre Perles-en-boite!",
        text: `Bonjour,
        
        
Merci d'avoir rejoint la communauté Perles-en-boite!

Vous faites maintenant parti de la liste de diffusion et recevrez tous les jours un email avec une de nos plus belles perles !

Pour partager une perles répondez à ce mail avec comme sujet 'perle' et comme texte votre perle, c'est super simple !

Pour vous désabonner, c'est aussi simple, mettez comme sujet 'leave' et vous serez supprimés de la liste de diffusion !

N'hésiez pas à partager, il suffit que n'importe lequel de vos amis envoie un email à cette adresse avec comme sujet 'join' :)

Bonne journée avec Perles-en-boite !`
    },
    fail: {
        already_exists: {
            subject: "Vous avez déjà rejoint Perles-en-boite!",
            text: `Bonjour,
            
            
Vous souhaitez rejoindre la communauté de Perles-en-boite mais on dirait que votre adresse fait déjà parti de la liste de diffusion.

Vous n'avez donc rien à faire, vous recevrez votre perle du jour chaque jour sans rien d'autre à faire !

A bientot !

--

Perles-en-boite`
        }
    }
};

exports.leave = {
    success: {
        subject: "Désinscription de Perles-en-boite !",
        text: `Bonjour,
        
        
Nous avons le regret de vous voir quitter Perles-en-boite !

Nous espérons cependant que vous avez passé de bons moment à lire les perles que vous avez reçus !

N'hésitez pas à vous réabonner un de ces jours en répondant à ce mail avec comme sujet 'join' vous serez toujours le bien venu !

A un de ces jours !

--

Perles-en-boite`
    },
    fail: {
        not_found: {
            subject: "Vous souhaitez quitter Perles-en-boite",
            text: `Bonjour,
            
            
Vous souhaitez quitter la communauté Perles-en-boite et nous le regrettons.

Cependant nous n'avons pas pu vous trouver dans la liste des abonnées et n'avons donc pas pu vous désinscrire.

Si vous continuez de recevoir les perles quotidiennes, merci d'envoyer un email au gérant de la liste de diffusion.

--

Perles-en-boite`
        }
    }
};

exports.perle = {
    success: {
        subject: "Nous avons bien reçu votre perle !",
        text: `Bonjour,
               
                
Nous avons bien reçu votre perle !

Nous espérons qu'elle égaillera la journée de nos abonnées ! N'hésitez pas à nous partager toujours plus de perles pour toujours plus de plaisir !

Vous pouvez aussi inviter vos amis à rejoindre la communauté, il leur suffit d'envoyer un mail avec comme sujet 'join', c'est super simple !

Merci encore :)

--

Perles-en-boite`
    },
    fail:{

    }

};

exports.help = {
    subject: "Perles-en-boite - Comment ça marche",
    text: `Bonjour,
    
    
Perle en boite à un principe simple: partager le plus simplement possible toute les magnifiques perles qu'on peut rencontrer dans notre travail.
Que ce soit un mail d'un client ou d'un collaboratuer, une ligne de code aberrante, ou tout simplement une petite anecdote (en restant toujours dans le cadre du travail).  

Pour simplifier l'utilisation du service, il n'y pas de site internet, tout se passe par email graçe à des commandes que vous placez dans le sijet du mail.

Par exemple :
---
Sujet du mail: perle
Corps du mail: 
Vu dans le projet ACME :
   
   var x = "toto";
   
   function getX() {
        return x;
   }
   
   if (x === getX()) {
        //do something
   }else {
        //do otherthing
   }

Moi: 🤔...🤦
---

Vous recevez une confirmation par email et votre perle sera dans la liste des perles tirée au sort chaque jour pour être partagée !


Voici la liste des commandes :

   - join: rejoindre la liste de diffusion, vous recevrez une perle chaque jour pour égailler votre joournée
   - leave: quitter la liste de diffusion, vous ne recevrez plus de perle chaque jour et votre journée sera triste !
   - perle: pour nous partager votre perle ! Attention les perles doivent être au format texte, pas de HTML, pas de signature, pas d'images. Juste du texte :)
   - help: pour recevoir un mail explicatif du fonctionnement
   - ?: identique à 'help'
   
--

Perles-en-boite`
};

exports.unknown = {
    subject: "Perles-en-boite - {command}: Commande inconnue",
    text: `Bonjour,
    
    
La commande "{command}" n'existe pas. Voici la liste des commandes:

   - join: rejoindre la liste de diffusion, vous recevrez une perle chaque jour pour égailler votre joournée
   - leave: quitter la liste de diffusion, vous ne recevrez plus de perle chaque jour et votre journée sera triste !
   - perle: pour nous partager votre perle ! Attention les perles doivent être au format texte, pas de HTML, pas de signature, pas d'images. Juste du texte :)
   - help: pour recevoir un mail explicatif du fonctionnement
   - ?: identique à 'help'`
};