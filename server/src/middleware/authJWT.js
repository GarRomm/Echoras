'use strict';

const jwt = require('jsonwebtoken');

/**
 * Middleware Express d'authentification par JWT (JSON Web Token).
 *
 * Un JWT est un jeton signé qui contient les informations de l'utilisateur
 * (id, rôle, expiration) directement dans le token. Le serveur n'a pas besoin
 * de stocker de session : il vérifie uniquement la signature avec JWT_SECRET.
 * C'est ce qu'on appelle une authentification "stateless".
 */

function authJWT(req, res, next) {
  // On lit le token depuis un cookie httpOnly, et non depuis le header Authorization.
  // Un cookie httpOnly est inaccessible au JavaScript du navigateur : même si un attaquant
  // injecte du JS malveillant dans la page (attaque XSS), il ne peut pas lire ni voler
  // le token. C'est le principal avantage par rapport au stockage en localStorage.
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });

  try {
    // jwt.verify fait deux choses en un seul appel :
    // 1. Vérifie que la signature HMAC correspond à JWT_SECRET (le token n'a pas été falsifié).
    // 2. Vérifie que le champ "exp" (expiration) n'est pas dépassé.
    // Si tout est valide, il retourne le payload décodé (id, role, email, etc.)
    // qu'on attache à req.user pour que les routes suivantes puissent l'utiliser.
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    // On renvoie intentionnellement un message générique sans préciser si le token
    // est expiré ou s'il a été falsifié. Donner cette information permettrait à un
    // attaquant de savoir s'il doit forger un nouveau token ou simplement attendre
    // qu'un token volé soit encore valide.
    res.status(401).json({ error: 'Session invalide ou expirée' });
  }
}

/**
 * Fabrique de middleware pour le contrôle d'accès par rôle (RBAC).
 * S'utilise après authJWT dans la chaîne de middlewares Express.
 *
 * Exemple : router.delete('/user/:id', authJWT, requireRole('ADMIN'), deleteUser)
 *
 * @param {...string} roles - les rôles autorisés (VISITOR, USER, ADMIN)
 */
function requireRole(...roles) {
  // On retourne une fonction middleware plutôt que d'être un middleware direct,
  // ce qui permet de paramétrer les rôles à l'endroit où la route est déclarée.
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès refusé' });
    }
    next();
  };
}

module.exports = { authJWT, requireRole };
