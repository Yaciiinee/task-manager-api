const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SG_API_KEY)




const sendWelcomeEmail = (email, name) => {

    sgMail.send({
        to: email, // Change to your recipient
        from: 'yac.zitouni1962@gmail.com', // Change to your verified sender
        subject: 'Welcome ',
        html: '<strong>الحمد لله لاإله إلا الله لاحول ولا قوة إلا بالله و الله أكبر</strong>',
        text: "Hi " + name + ", glad to see you here, we're on service"

    })
}



module.exports = {
    sendWelcomeEmail
}