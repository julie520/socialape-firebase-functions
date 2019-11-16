const { fbDb, fbAuth, bucket } = require("../util/firebase");
const { validateSignup, validateLogin } = require("../util/validators");
const BusBoy = require("busboy");
const path = require("path");
const os = require("os");
const fs = require("fs");

exports.signup = (req, res) => {
  const { errors, valid } = validateSignup(req.body);
  if (!valid) {
    return res.status(400).json(errors);
  }

  const { email, password, handle } = req.body;
  // google image url https://firebasestorage.googleapis.com/v0/b/social-ape-9cc19.appspot.com/o/no-image.png?alt=media
  const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/no-image.png?alt=media`;
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
        userId,
        email,
        imageUrl,
        createdAt: new Date().toISOString()
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

exports.uploadImage = (req, res) => {
  const busboy = new BusBoy({ headers: req.headers });

  let imageToBeUploaded = {};
  let imageFileName;

  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, file, filename, encoding, mimetype);
    if (mimetype !== "image/jpeg" && mimetype !== "image/png") {
      return res.status(400).json({ error: "Wrong file type submitted" });
    }
    // my.image.png => ['my', 'image', 'png']
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    // 32756238461724837.png
    imageFileName = `${Math.round(
      Math.random() * 1000000000000
    ).toString()}.${imageExtension}`;
    const filepath = path.join(os.tmpdir(), imageFileName);
    imageToBeUploaded = { filepath, mimetype };
    console.log("imageToBeUploaded", imageToBeUploaded);
    file.pipe(fs.createWriteStream(filepath));
  });
  busboy.on("finish", () => {
    const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${process.env.FIREBASE_STORAGE_BUCKET}/o/${imageFileName}?alt=media`;
    console.log("imageUrl", imageUrl);
    console.log("filepath", imageToBeUploaded.filepath);
    console.log("contentType", imageToBeUploaded.mimetype);
    bucket
      .upload(imageToBeUploaded.filepath, {
        resumable: false,
        metadata: {
          metadata: {
            contentType: imageToBeUploaded.mimetype
          }
        }
      })
      .then(() => {
        return fbDb.doc(`/users/${req.user.handle}`).update({ imageUrl });
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" });
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({ error: "something went wrong" });
      });
  });
  busboy.end(req.rawBody);
};
