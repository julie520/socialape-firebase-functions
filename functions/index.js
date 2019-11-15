const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const firebase = require("firebase");
const serviceAccount = require("./serviceAccountKey.json");
require("dotenv").config();
const app = express();

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.firestore();

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID
};

firebase.initializeApp(firebaseConfig);

app.get("/screams", (req, res) => {
  db.collection("screams")
    .orderBy("createdAt", "desc")
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
          screamId: doc.id,
          createdAt: doc.data().createdAt,
          ...doc.data()
        });
      });
      return res.json(screams);
    })
    .catch(err => {
      console.error("GET SCRAMS ERROR", err);
      return res.status(500).json({
        error: "something went wrong"
      });
    });
});

app.post("/scream", (req, res) => {
  const newScream = {
    body: req.body.body,
    userHandle: req.body.userHandle,
    createdAt: new Date().toISOString()
  };

  db.collection("screams")
    .add(newScream)
    .then(doc => {
      return res.json({ message: `document ${doc.id} created successfully` });
    })
    .catch(err => {
      console.error("CREATE SCREAM ERROR", err);
      return res.status(500).json({
        error: "something went wrong"
      });
    });
});

const isEmpty = string => {
  if (string.trim() === "") return true;
  return false;
};

const isEmail = email => {
  const regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (email.match(regEx)) return true;
  return false;
};

// Signup route
app.post("/signup", (req, res) => {
  const { email, password, confirmPassword, handle } = req.body;

  /// TODO: validate data
  let errors = {};
  if (isEmpty(email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "Email must not be valid email address";
  }

  if (isEmpty(password)) {
    errors.password = "Password must not be empty";
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = "Password must not be same";
  }

  if (isEmpty(handle)) {
    errors.handle = "Handle must not be empty";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  let token, userId;
  db.doc(`/users/${handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "This handle is already taken" });
      } else {
        return firebase.auth().createUserWithEmailAndPassword(email, password);
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
      return db.doc(`/users/${handle}`).set(userCredentials);
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
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  let errors = {};
  if (isEmpty(email)) {
    errors.email = "Email must not be empty";
  } else if (!isEmail(email)) {
    errors.email = "Email must not be valid email address";
  }

  if (isEmpty(password)) {
    errors.password = "Password must not be empty";
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json(errors);
  }

  firebase
    .auth()
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
});

// https://baseurl.com/api/
exports.api = functions.region("asia-east2").https.onRequest(app);
