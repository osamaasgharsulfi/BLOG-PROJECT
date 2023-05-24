var admin = require("firebase-admin");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const { responseMessage } = require('../models/responseMessage')
const moment = require('moment')
const rateLimit = require("express-rate-limit");

const NodeCache = require("node-cache");
const myCache = new NodeCache({ deleteOnExpire: true });

// exports.checkIP = async (req, res, next) => {
//     try {
//         const clientIP = req.headers['x-appengine-user-ip'] || req.header['x-forwarded-for']
//         // const clientIP = '115.186.137.41'

//         const IP = await db.collection('IP').doc(clientIP).get()

//         // Check if IP is blocked or not
//         if (new Date() < new Date(IP?.data()?.blockTime?.toDate())) {
//             return responseMessage(res, 403, 0, 'Too many attempts form this IP. Try after 10 minutes', null)
//         }

//         // Check if 4 requests reached in 3 seconds or not
//         if (new Date() < new Date(IP?.data()?.time?.toDate())) {
//             console.log('hi there')
//             const count = IP?.data()?.count
//             db.collection('IP').doc(clientIP).set({
//                 count: count + 1,
//             }, { merge: true })
//         } else {

//             console.log('I am in else')

//             const exp = new Date(Date.now() + 3 * 1000)
//             db.collection('IP').doc(clientIP).set({
//                 IP: clientIP,
//                 time: exp,
//                 count: 0
//             }, { merge: true })
//         }

//         // let count = IP?.data()?.count

//         if (new Date() < new Date(IP?.data()?.time?.toDate()) && IP?.data()?.count == 3) {
//             let blockTime = new Date(Date.now() + 10 * 60 * 1000) // set time faward 10 minutes
//             db.collection('IP').doc(clientIP).set({
//                 count: 0,
//                 blockTime: blockTime
//             }, { merge: true })
//             return responseMessage(res, 403, 0, 'Too many attempts from this IP. Please try again after 10 minutes', null)
//         }

//         next()
//     }
//     catch (error) {
//         console.log(error)
//         return responseMessage(res, 401, 0, error.message, null)
//     }
// }

exports.checkIP = async (req, res, next) => {   

    const clientIP = req.headers['x-appengine-user-ip'] || req.header['x-forwarded-for']

    // const clientIP = '115.186.137.41'

    getIP = myCache.get('myKey')
    // console.log(getIP)
    // console.log('Expire Time:', myCache.getTtl('myKey'))

    if (getIP?.IP == clientIP && getIP?.count == 3) {
        return responseMessage(res, 403, 0, 'To many request form this IP. Try again after 5 Minutes.')
    }

    if (getIP?.IP == clientIP && getIP?.count < 3) {    
        updatecount = getIP.count + 1
        // console.log('updatecount', updatecount)
        // myCache.del('myKey')
        obj = { IP: clientIP, count: updatecount };
        myCache.set("myKey", obj, 300);
        value1 = myCache.get('myKey')
        // console.log(value1)
    }
    else {
        console.log('I am in else condition')
        obj = { IP: clientIP, count: 0 };
        myCache.set("myKey", obj, 60);
    }
    next()
}

// exports.checkIP = rateLimit({
//     max: 3 ,                       // Number of attempts user can perform
//     windowMs: 10 * 60 * 1000,     //  block certain IP for 5 minutes 5 * 60 * 1000
//     standardHeaders: true,        /// Return rate limit info in the `RateLimit-*` headers
//     message:  'Too many attempts from this IP, please try again after 30 seconds',
//     keyGenerator: function (req) {
//         let ip = req.headers['x-appengine-user-ip'] || req.header['x-forwarded-for']
//         req.ip = ip
//         // req.ip = "ip address";
//         return req.ip;
//       }
// })



