//gérer les erreurs de manière centralisée
const errorHandler=(err,req,res,next) => {
    // Détermine le code de statut HTTP à utiliser
    const statusCode = res.statusCode ? res.
    statusCode : 500
    // Définit le code de statut de la réponse
    res.status(statusCode)

     // Construit et envoie une réponse JSON avec des détails sur l'erreur
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "development" ?
         err.stack : null,
    })
};

module.exports = errorHandler;