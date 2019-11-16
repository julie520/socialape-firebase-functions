const functions = require("firebase-functions");
const app = require("express")();
require("dotenv").config();

// authentication middleware
const { auth } = require("./util/middleware");

// controller
const { getScreams, addScream } = require("./controllers/screams");
const { signup, login, uploadImage } = require("./controllers/users");

// screams routes
app.get("/screams", getScreams);
app.post("/scream", auth, addScream);

// users route
app.post("/signup", signup);
app.post("/login", login);
app.post("/user/image",auth,uploadImage);

// https://baseurl.com/api/
exports.api = functions.region("asia-east2").https.onRequest(app);
