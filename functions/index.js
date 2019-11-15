const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://social-ape-9cc19.firebaseio.com"
});

const app = express();

app.get("/screams", (req, res) => {
  admin
    .firestore()
    .collection("screams")
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

  admin
    .firestore()
    .collection("screams")
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

// https://baseurl.com/api/
exports.api = functions.region("asia-east2").https.onRequest(app);
