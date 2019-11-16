const { fbDb } = require("../util/firebase");
const { validateParam, validateAddComment } = require("../util/validators");

exports.getScreams = (req, res) => {
  fbDb
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
};

exports.addScream = (req, res) => {
  let newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString(),
    likeCount: 0,
    commentCount: 0
  };

  fbDb
    .collection("screams")
    .add(newScream)
    .then(doc => {
      newScream.screamId = doc.id;
      return res.json(newScream);
    })
    .catch(err => {
      console.error("CREATE SCREAM ERROR", err);
      return res.status(500).json({
        error: "something went wrong"
      });
    });
};

exports.getScream = (req, res) => {
  const { valid } = validateParam(req.params.screamId);

  if (!valid) return res.status(404).json({ error: "Scream not found" });

  let screamData = {};
  fbDb
    .doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      } else {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return fbDb
          .collection("comments")
          .orderBy("createdAt", "desc")
          .where("screamId", "==", screamData.screamId)
          .get();
      }
    })
    .then(data => {
      screamData.comments = [];
      if (data === undefined || data === null || data.length === 0) {
        return res.json(screamData);
      } else {
        data.forEach(doc => {
          screamData.comments.push(doc.data());
        });
        return res.json(screamData);
      }
    })
    .catch(err => {
      console.error("GET SCREAM ERROR", err);
      return res.status(500).json({ error: err.code });
    });
};

exports.addComment = (req, res) => {
  const { errors, valid } = validateAddComment(req.params.screamId, req.body);

  if (!valid) {
    return res.status(400).json(errors);
  }
  let newComment = {
    screamId: req.params.screamId,
    userHandle: req.user.handle,
    body: req.body.body,
    userImage: req.user.imageUrl,
    createdAt: new Date().toISOString()
  };

  fbDb
    .doc(`/screams/${req.params.screamId}`)
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      } else {
        return doc.ref.update({ commentCount: doc.data().commentCount + 1 });
      }
    })
    .then(() => {
      return fbDb.collection("comments").add(newComment);
    })
    .then(docRef => {
      newComment.id = docRef.id;
      return res.json(newComment);
    })
    .catch(err => {
      console.error("CREATE SCREAM ERROR", err);
      return res.status(500).json({
        error: "something went wrong"
      });
    });
};

exports.likeScream = (req, res) => {
  const { valid } = validateParam(req.params.screamId);
  if (!valid) return res.status(404).json({ error: "Scream not found" });

  const likeDoc = fbDb
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDoc = fbDb.doc(`/screams/${req.params.screamId}`);

  let screamData;

  screamDoc
    .get()
    .then(doc => {
      if (!doc.exists)
        return res.status(404).json({ error: "Scream not found" });
      else {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDoc.get();
      }
    })
    .then(data => {
      if (!data.empty) {
        return res.status(400).json({ error: "Scream already liked" });
      } else {
        const newLike = {
          userHandle: req.user.handle,
          screamId: req.params.screamId
        };

        return fbDb
          .collection("likes")
          .add(newLike)
          .then(() => {
            screamData.likeCount++;
            return screamDoc.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      }
    })
    .catch(err => {
      console.error("LIKE ERROR", err);
      return res.status(500).json({ error: "something went wrong!" });
    });
};

exports.unlikeScream = (req, res) => {
  const { valid } = validateParam(req.params.screamId);
  if (!valid) return res.status(404).json({ error: "Scream not found" });

  const likeDoc = fbDb
    .collection("likes")
    .where("userHandle", "==", req.user.handle)
    .where("screamId", "==", req.params.screamId)
    .limit(1);

  const screamDoc = fbDb.doc(`/screams/${req.params.screamId}`);

  let screamData;

  screamDoc
    .get()
    .then(doc => {
      if (!doc.exists)
        return res.status(404).json({ error: "Scream not found" });
      else {
        screamData = doc.data();
        screamData.screamId = doc.id;
        return likeDoc.get();
      }
    })
    .then(data => {
      if (data.empty) {
        return res.status(400).json({ error: "Scream not yet liked" });
      } else {
        return fbDb
          .doc(`/likes/${data.docs[0].id}`)
          .delete()
          .then(() => {
            screamData.likeCount--;
            return screamDoc.update({ likeCount: screamData.likeCount });
          })
          .then(() => {
            return res.json(screamData);
          });
      }
    })
    .catch(err => {
      console.error("UNLIKE ERROR", err);
      return res.status(500).json({ error: "something went wrong!" });
    });
};

exports.deleteScream = (req, res) => {
  const { valid } = validateParam(req.params.screamId);
  if (!valid) return res.status(404).json({ error: "Scream not found" });

  const screamDoc = fbDb.doc(`/screams/${req.params.screamId}`);
  screamDoc
    .get()
    .then(doc => {
      if (!doc.exists) {
        return res.status(404).json({ error: "Scream not found" });
      } else {
        if (doc.data().userHandle !== req.user.handle) {
          return res.status(403).json({ error: "Unauthorized" });
        } else {
          return screamDoc.delete();
        }
      }
    })
    .then(() => {
      return res.json({ message: "Scream deleted successfully" });
    })
    .catch(err => {
      console.error("DELETE SCREAM ERROR", err);
      return res.status(500).json({ error: "something went wrong!" });
    });
};
