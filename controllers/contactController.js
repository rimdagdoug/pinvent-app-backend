const expressAsyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const contactUs = expressAsyncHandler(async(req, res) => {
  const { subject, message } = req.body;

  // Vérifier si l'utilisateur est authentifié
  if (!req.user) {
    res.status(401);
    throw new Error("User not authenticated");
  }

  const userId = req.user.id;

  // Rechercher l'utilisateur dans la base de données
  const user = await User.findById(userId);

  if (!user) {
    res.status(400);
    throw new Error("User not found, please sign up");
  }

  // Validation des champs
  if (!subject || !message) {
    res.status(400);
    throw new Error("Please add subject and message");
  }

  // Paramètres pour l'envoi d'email
  const send_to = process.env.EMAIL_USER;
  const sent_from = process.env.EMAIL_USER;
  const reply_to = user.email;

  try {
    // Appel à la fonction d'envoi d'email (supposons que vous l'avez définie ailleurs)
    await sendEmail(subject, message, send_to, sent_from, reply_to);
    res.status(200).json({ success: true, message: "Email sent" });
  } catch (error) {
    res.status(500);
    throw new Error("Email not sent, please try again");
  }
});

module.exports = {
  contactUs,
};
