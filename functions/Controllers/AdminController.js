const admin = require("firebase-admin");
const { date } = require("joi");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const { upload } = require('../utils/UploadImage')
const { responseMessage } = require('../models/responseMessage');

exports.createCategories = async (req, res) => {
    try {
        let role = req.role
        let UserID = req.id
        if (role != 1) return responseMessage(res, 401, 0, 'User cannot access this route')
        let { category } = req.body
        const categoryExists = await db.collection('Category').where('category', '==', category).get()
        if (!categoryExists.empty) return responseMessage(res, 403, 0, `Category ${category} already exists.`)
        db.collection('Category').add({
            category: category,
            UserID: UserID,
            createdAt: FieldValue.serverTimestamp()
        })
        return responseMessage(res, 201, 1, 'Category addded Successfully',)
    }
    catch (error) {
        console.log(error)
        return responseMessage(res, 400, 0, 'Error Occured', error.message)
    }
}


exports.DisbaleBlog = async (req, res) => {
    try {
        let role = req.role
        let UserID = req.id
        if (role != 1) return responseMessage(res, 401, 0, 'User cannot access this route')
        let { userID, BlogID, disable } = req.body

        const UserExists = db.collection('Users').doc(userID).get()

        const BlogExists = db.collection('Users').doc(userID).collection('Blog').doc(BlogID).get()

        Promise.all([UserExists, BlogExists]).then((values) => {
            if (!values[0].exists) return responseMessage(res, 404, 0, `No User exists with ID: ${userID} `)

            if (!values[1].exists) return responseMessage(res, 404, 0, `No Blog exists with ID: ${BlogID} `)

            if (disable == true) {

                if (values[1].data().disable == true) return responseMessage(res, 200, 1, 'Blog already Disbaled ', null)

                values[1].ref.set({ disable: true }, { merge: true })

                return responseMessage(res, 200, 1, 'Blog Disbaled Succcessfully', null)
            }

            if (disable == false) {

                if (values[1].data().disable == false) return responseMessage(res, 200, 1, 'Blog already Enabled ', null)

                values[1].ref.set({ disable: false }, { merge: true })

                return responseMessage(res, 200, 1, 'Blog Enabled Succcessfully', null)
            }
        })
    }
    catch (error) {
        console.log(error)
        return responseMessage(res, 400, 0, 'Error Occured', error.message)
    }
}