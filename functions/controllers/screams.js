const { fbDb } = require("../util/firebase");

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
  const newScream = {
    body: req.body.body,
    userHandle: req.user.handle,
    createdAt: new Date().toISOString()
  };

  fbDb
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
};
