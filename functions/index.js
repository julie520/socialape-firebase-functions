const functions = require("firebase-functions");
const app = require("express")();
require("dotenv").config();

// authentication middleware
const { auth } = require("./util/middleware");

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
  getUserDetails
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

// https://baseurl.com/api/
exports.api = functions.region("asia-east2").https.onRequest(app);
