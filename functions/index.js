const functions = require("firebase-functions");
const express = require("express");
const app = express();
const http = require("http");
const path = require("path");
const bodyParser = require("body-parser");
const cors = require('cors')
// const rateLimit = require("express-rate-limit");
const NodeCache = require("node-cache");
const myCache = new NodeCache();

// const session = require('express-session')
// app.use(session({
  
//   // It holds the secret key for session
//   secret: 'My_Secret_is_secured',

//   // Forces the session to be saved
//   // back to the session store
//   resave: true,

//   // Forces a session that is "uninitialized"
//   // to be saved to the store
//   saveUninitialized: true
// }))






// myCache.set(key, val, [ttl])
// const requestIp = require('request-ip');
// // const clientIP = req.headers['x-appengine-user-ip'] || req.header['x-forwarded-for']
// // app.use(requestIp.mw());
// const limiter = rateLimit({
//   windowMs: 1000, // 12 hour duration in milliseconds
//   max: 2,
//   message: "IP address blocked!",
//   headers: true,
//   standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
//   legacyHeaders: false, // Disable the `X-RateLimit-*` headers
// })
// app.use(limiter);
// console.log(limiter)

// const limiter = (req, res => {

//   const clientIP = req.headers['x-appengine-user-ip'] || req.header['x-forwarded-for']

//   obj = { IP: clientIP };
//   data = myCache.set("mkey", obj, 20000);

// })
// app.use(limiter)





app.use(cors({ origin: true }))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
require("dotenv");
var admin = require("firebase-admin");


app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));


var serviceAccount = require("./fb-config.json");
const { request, response } = require("express");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(require("./Routes/users.routes"));
app.use(require("./Routes/Blog.Routes"));
app.use(require("./Routes/Notification.routes"));
app.use(require("./Routes/Admin.Routes"));
app.use(require('./Routes/test.Routes'))
app.use(require('./Routes/payemnt.routes'))
app.use(require('./Routes/easypaisaPayemnt.Routes'))


exports.app = functions.https.onRequest(app);