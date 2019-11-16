const functions = require("firebase-functions");
const app = require("express")();
require("dotenv").config();

// authentication middleware
const { auth } = require("./util/middleware");

const { fbDb } = require("./util/firebase");

// controller
const {
  getScreams,
  addScream,
  getScream,
  addComment,
  likeScream,
  unlikeScream,
  deleteScream
} = require("./controllers/screams");
const {
  signup,
  login,
  uploadImage,
  updateUerDetails,
  getUserDetails,
  getHandleDetails,
  markNotificationsRead
} = require("./controllers/users");

// screams routes
app.get("/screams", getScreams);
app.post("/scream", auth, addScream);
app.get("/scream/:screamId", getScream);
app.delete("/scream/:screamId", auth, deleteScream);
app.post("/scream/:screamId/comment", auth, addComment);
app.post("/scream/:screamId/like", auth, likeScream);
app.post("/scream/:screamId/unlike", auth, unlikeScream);

// users route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image", auth, uploadImage);
app.get("/user", auth, getUserDetails);
app.post("/user", auth, updateUerDetails);
app.get("/user/:handle", getHandleDetails);
app.post("/notifications", auth, markNotificationsRead);

// https://baseurl.com/api/
exports.api = functions.region("asia-east2").https.onRequest(app);

exports.createNotificationOnLike = functions
  .region("asia-east2")
  .firestore.document("likes/{id}")
  .onCreate(snapshot => {
    fbDb
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (!doc.exists) return;
        else {
          return fbDb.doc(`/notifications/${snapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            screamId: doc.id,
            type: "like",
            createdAt: new Date().toISOString()
          });
        }
      })
      .then(() => {
        return;
      })
      .catch(err => {
        console.log("CREATE NOTIFICATION ON LIKE ERROR", err);
        return;
      });
  });

exports.deleteNotificationOnUnlike = functions
  .region("asia-east2")
  .firestore.document("likes/{id}")
  .onDelete(snapshot => {
    fbDb
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .then(() => {
        return;
      })
      .catch(err => {
        console.log("DELETE NOTIFICATION ON UNLIKE ERROR", err);
        return;
      });
  });

exports.createNotificationOnComment = functions
  .region("asia-east2")
  .firestore.document("comments/{id}")
  .onCreate(snapshot => {
    fbDb
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (!doc.exists) return;
        else {
          return fbDb.doc(`/notifications/${snapshot.id}`).set({
            recipient: doc.data().userHandle,
            sender: snapshot.data().userHandle,
            read: false,
            screamId: doc.id,
            type: "comment",
            createdAt: new Date().toISOString()
          });
        }
      })
      .then(() => {
        return;
      })
      .catch(err => {
        console.log("CREATE NOTIFICATION ON COMMENT ERROR", err);
        return;
      });
  });
