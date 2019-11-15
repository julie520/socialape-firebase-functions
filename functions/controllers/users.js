const { fbDb, fbAuth } = require("../util/firebase");
const { validateSignup, validateLogin } = require("../util/validators");

exports.signup = (req, res) => {
  const { errors, valid } = validateSignup(req.body);
  if (!valid) {
    return res.status(400).json(errors);
  }

  const { email, password, handle } = req.body;
  let token, userId;
  fbDb
    .doc(`/users/${handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "This handle is already taken" });
      } else {
        return fbAuth.createUserWithEmailAndPassword(email, password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle,
        email,
        createdAt: new Date().toISOString(),
        userId
      };
      return fbDb.doc(`/users/${handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })
    .catch(err => {
      console.error(err);
      if (
        err.code === "auth/email-already-in-use" ||
        err.code === "auth/invalid-email"
      ) {
        return res.status(400).json({
          email: err.message
        });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

exports.login = (req, res) => {
  const { errors, valid } = validateLogin(req.body);
  if (!valid) {
    return res.status(400).json(errors);
  }

  const { email, password } = req.body;

  fbAuth
    .signInWithEmailAndPassword(email, password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (
        err.code === "auth/invalid-email" ||
        err.code === "auth/user-disabled" ||
        err.code === "auth/wrong-password"
      ) {
        return res.status(403).json({
          email: err.message
        });
      } else if (err.code === "auth/user-not-found") {
        return res.status(404).json({
          email: "The email is not found"
        });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};
