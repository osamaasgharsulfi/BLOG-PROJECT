var admin = require("firebase-admin");
const db = admin.firestore();
const jwt = require("jsonwebtoken");
const { responseMessage } = require("../models/responseMessage");

exports.verifyjwt = async (req, res, next) => {
    let token = req.headers.authorization
    if (!token) return responseMessage(res, 401, 0, "Token not provided!", null)
    let getToken = token.replace('Bearer ', '');
    try {
        const decoded = jwt.verify(getToken, process.env.JWT_SECRET);
        if (!decoded) return responseMessage(res, 401, 0, "Token not valid")
        req.id = decoded.id
        const checkToken = await db.collection('Users').doc(decoded.id).get()
        // console.log(checkToken.data().token, 'check tokennnnnnnnnnnnnnn');
        // console.log(getToken, 'get tokeen');
        if (checkToken.data().token != getToken) return responseMessage(res, 401, 0, 'You have been logout. Please login to generate a new token')
        req.role = decoded.role
        next()
    }
    catch (error) {
        console.log(error)
        return responseMessage(res, 401, 0, error.message, null)
    }
}
