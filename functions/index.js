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
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
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
      .catch(err => {
        console.log("CREATE NOTIFICATION ON LIKE ERROR", err);
      });
  });

exports.deleteNotificationOnUnlike = functions
  .region("asia-east2")
  .firestore.document("likes/{id}")
  .onDelete(snapshot => {
    fbDb
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.log("DELETE NOTIFICATION ON UNLIKE ERROR", err);
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
        if (
          doc.exists &&
          doc.data().userHandle !== snapshot.data().userHandle
        ) {
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
      .catch(err => {
        console.log("CREATE NOTIFICATION ON COMMENT ERROR", err);
      });
  });

exports.onUserImageChange = functions
  .region("asia-east2")
  .firestore.document("/users/{userId}")
  .onUpdate(change => {
    console.log("before", change.before.data());
    console.log("after", change.after.data());
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      console.log("ON USER IMAGE CHANGE","Image has changed")
      let batch = fbDb.batch();
      return fbDb
        .collection("screams")
        .where("userHandle", "==", change.before.data().handle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const scream = fbDb.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          })          
          return fbDb
          .collection("comments")
          .where("userHandle", "==", change.before.data().handle)
          .get();
        })
        .then(data => {
          data.forEach(doc => {
            const comment = fbDb.doc(`/comments/${doc.id}`);
            batch.update(comment, { userImage: change.after.data().imageUrl });
          })  
          return batch.commit()
        });
    } else return true;
  });

  exports.onSreamDelete = functions.region("asia-east2").firestore.document("/screams/{screamId}")
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId
    const batch = fbDb.batch()
    return fbDb.collection("comments").where("screamId","==",screamId).get()
    .then(data => {
      data.forEach(doc => {
        batch.delete(fbDb.doc(`/comments/${doc.id}`))
      })
      return fbDb.collection("likes").where("screamId","==",screamId).get()
    })
    .then(data => {
      data.forEach(doc => {
        batch.delete(fbDb.doc(`/likes/${doc.id}`))
      })
      return fbDb.collection("notifications").where("screamId","==",screamId).get()
    })
    .then(data => {
      data.forEach(doc => {
        batch.delete(fbDb.doc(`/notifications/${doc.id}`))
      })
      return batch.commit()
    })
    .catch(err => console.log("ON SCREAM DELETE ERROR", err));
  })