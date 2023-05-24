const admin = require("firebase-admin");
const { date, equal } = require("joi");
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const { upload } = require('../utils/UploadImage')
const { responseMessage } = require('../models/responseMessage');
var bucket = admin.storage().bucket('user-management-api-888d4.appspot.com');


exports.AddBlog = async (req, res) => {
  try {
    let UserID = req.id

    let { title, content, image, tags, categoryID } = req.body

    let VerifyCategory = db.collection('Category').doc(categoryID).get()

    // if (!VerifyCategory.exists) return responseMessage(res, 400, 0, `Category does not exist`, null)

    let checkTitle = db.collectionGroup('Blog').where('disable', '==', false).where('title', '==', title).get()

    // if( !checkTitle.empty ) return responseMessage(res, 200, 0, 'Title already exists. Please try different title.')

    let loggedinUserData = db.collection('Users').doc(UserID).get();

    if(!image){
      image = ''
    }

    Promise.all([VerifyCategory, loggedinUserData, checkTitle]).then(values => {

      if (!values[0].exists) return responseMessage(res, 400, 0, `Category does not exist`, null)

      if (!values[2].empty) return responseMessage(res, 409, 0, 'Title already exists. Please try different title.')

      let firstname = values[1].data().firstname

      let CapName = firstname.charAt(0).toUpperCase() + firstname.slice(1)

      let lastname = values[1].data().lastname

      let CapLast = lastname.charAt(0).toUpperCase() + lastname.slice(1)

      let authorName = `${CapName} ${CapLast}`

      let link = upload('BlogPictures', image)
      if (link === true) return responseMessage(res, 401, 0, 'Only png and jpeg files are supported', null)

      // let tag = []
      // tags.forEach(element => { tag.push(element.toLowerCase()) })

      db.collection('Users').doc(UserID).collection('Blog').add({
        title: title,
        content: content,
        categoryName: values[0].data().category,
        category: categoryID,
        tags: tags,
        image: link,
        createdAt: FieldValue.serverTimestamp(),
        UserID: UserID,
        disable: false,
        authorName: authorName
      })

      // update  Total Blogs in user document
      let count = values[1].data()?.TotalBlogs || 0
      db.collection('Users').doc(UserID).set({ TotalBlogs: count + 1 }, { merge: true })
      return responseMessage(res, 201, 1, 'Blog Posted Successfully')

    })

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}

// Serach Blog by Slug ( title )
exports.Searchbyslug = async (req, res) => {
  try {
    let UserID = req.id
    let { title } = req.body

    let SearchBlog = db.collectionGroup('Blog').where('title', '==', title).where('disable', '==', false).get()

    const likeBlog = db.collectionGroup('BlogLikes').where('UserID', '==', UserID).orderBy('BlogCreatedat').get()

    Promise.all([SearchBlog, likeBlog]).then(values => {

      if (values[0].empty) return responseMessage(res, 200, 0, 'No Blog Found!', null)

      var blogArr = values[0].docs.map((x) => {
        let data = x.data()
        delete data['disable']
        return { ...data, id: x.id, createdAt: data.createdAt.toDate(), updatedAt: data?.updatedAt?.toDate() }
      })

      var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

      let array = []

      for (let k = 0; k < blogArr.length; k++) {
        var check = true
        for (var i = 0; i < likeArr.length; i++) {
          if (blogArr[k].id === likeArr[i].BlogID) {

            check = false
            let m = { ...blogArr[k], status: true }
            array.push(m)
            likeArr.splice(i, 1)
            break;
          }
        }

        if (check) {
          array.push({ ...blogArr[k], status: false })
        }

        if (likeArr.length == 0) {
          array = array.concat(blogArr.slice(k + 1, blogArr.length))
          break
        }
      }

      return responseMessage(res, 200, 1, 'Success', { TotalBlogs: array.length, Blogs: array })

    })

    // if (SearchBlog.empty) return responseMessage(res, 404, 1, 'No Blog Found', null)
    // let GET = []
    // SearchBlog.forEach((doc) => {
    //   let data = doc.data()
    //   delete data["disable"]
    //   let ID = doc.id
    //   GET.push({ ID, ...data })
    // })

    // return responseMessage(res, 200, 1, 'Success', GET)
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


exports.UpdateBlog = async (req, res) => {
  try {
    let { BlogID } = req.body
    let UserID = req.id
    // console.log('UserID', UserID)

    if (req.body.image) {
      var link = upload('BlogPictures', req.body.image)
      image = link
      req.body.image = image
    }
    // console.log(image)
    await db.collection('Users').doc(UserID).collection('Blog').doc(BlogID).update({
      ...req.body,
      updatedAt: FieldValue.serverTimestamp()
    })
      .then(pro => {
        if (pro) return responseMessage(res, 200, 1, `Blog Updated Successfully`)
      })
      .catch(error => {
        if (error) return responseMessage(res, 404, 0, `NO Blog Found with ID: ${BlogID}`)
      })
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


exports.BlogComments = async (req, res) => {
  try {
    let { userId, BlogID, comment } = req.body
    let UserID = req.id
    // console.log(UserID)

    const loggedinUserData = db.collection('Users').doc(UserID).get()

    const userExists = db.collection('Users').doc(userId).get()

    const BlogExists = db.collection('Users').doc(userId).collection('Blog').doc(BlogID).get()

    Promise.all([userExists, BlogExists, loggedinUserData]).then(values => {

      if (!values[0].exists) return responseMessage(res, 404, 0, `No User found with id: ${userId} `, null)

      if (!values[1].exists) return responseMessage(res, 404, 0, `No Blog found with id: ${BlogID} `, null)

      // console.log(values[2].data())

      values[1].ref.collection('Comments').add({
        comment: comment,
        UserID: UserID,
        firstname: values[2].data().firstname,
        lastname: values[2].data().lastname,
        email: values[2].data().email,
        BlogID: BlogID,
        createdAt: FieldValue.serverTimestamp()
      })
      // update Total comments in blog document
      let count = values[1]?.data()?.TotalComments || 0;
      values[1].ref.set({ TotalComments: count + 1 }, { merge: true })
      return responseMessage(res, 201, 1, 'Comment added Successfuly')
    })
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


exports.replyComments = async (req, res) => {
  try {
    let { comment, userId, BlogID, CommentID } = req.body

    let UserID = req.id

    const loggedinUserData = db.collection('Users').doc(UserID).get()

    const UserExists = db.collection('Users').doc(userId).get()

    const BlogExists = db.collection('Users').doc(userId).collection('Blog').doc(BlogID).get()

    const CommentExists = db.collection('Users').doc(userId).collection('Blog').doc(BlogID).collection('Comments').doc(CommentID).get()

    Promise.all([UserExists, BlogExists, CommentExists, loggedinUserData]).then(values => {

      if (!values[0].exists) return responseMessage(res, 404, 0, `No User Found with id: ${userId}`)

      if (!values[1].exists) return responseMessage(res, 404, 0, `No Blog exist with id: ${BlogID}`)

      if (!values[2].exists) return responseMessage(res, 404, 0, `No comment exist with id: ${CommentID} `)

      values[2].ref.collection('Comments').add({
        comment: comment,
        UserID: UserID,
        firstname: values[3].data().firstname,
        lastname: values[3].data().lastname,
        email: values[3].data().email,
        BlogID: BlogID,
        Replied_to_Comment_id: CommentID,
        createdAt: FieldValue.serverTimestamp()
      })

      let data = values[1].data()
      let count = data?.TotalReplyComments || 0
      values[1].ref.set({ TotalReplyComments: count + 1 }, { merge: true })
      return responseMessage(res, 201, 1, 'Comment added successfully')
    })
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}

// Show a  certain Blog Comments
exports.getBlogComments = async (req, res) => {
  try {
    let { BlogID } = req.body

    const getBlogComments = await db.collectionGroup('Comments').where('BlogID', '==', BlogID).orderBy('createdAt', 'desc').get()

    if (getBlogComments.empty) return responseMessage(res, 200, 0, 'No cooments found!', null)

    let resArr = []

    getBlogComments.forEach(doc => {
      let CommentID = doc.id
      let createdAt = doc.data().createdAt.toDate()
      resArr.push({ CommentID, ...doc.data(), createdAt })
    })

    return responseMessage(res, 200, 1, 'success', resArr)

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


exports.BlogLikes = async (req, res) => {
  try {
    let { userId, BlogID } = req.body
    let UserID = req.id

    const UserExists = db.collection('Users').doc(userId).get();

    const BlogExists = db.collection('Users').doc(userId).collection('Blog').doc(BlogID).get()

    const CheckLike = db.collection('Users').doc(userId).collection('Blog').doc(BlogID).collection('BlogLikes')
      .where('BlogID', '==', BlogID).where('UserID', '==', UserID).get()

    Promise.all([UserExists, BlogExists, CheckLike]).then(values => {

      if (!values[0].exists) return responseMessage(res, 404, 0, `No User found with id: ${userId}`)

      if (!values[1].exists) return responseMessage(res, 404, 0, `No Blog exists with the ID: ${BlogID} `)

      if (values[2].empty) {
        values[1].ref.collection('BlogLikes').add({
          BlogID: BlogID,
          UserID: UserID,
          createdAt: FieldValue.serverTimestamp(),
          BlogCreatedat: values[1].data().createdAt
        })
        let count = values[1].data()?.Total_Likes || 0;
        values[1].ref.set({ Total_Likes: count + 1 }, { merge: true })
        return responseMessage(res, 200, 1, 'Blog liked!')
      }
      else {
        values[2].docs[0].ref.delete()
        let count = values[1].data()?.Total_Likes || 0;
        if(count > 0 ){
        values[1].ref.set({ Total_Likes: count - 1 }, { merge: true })
        }
        return responseMessage(res, 200, 1, 'like remove')
      }
    })
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Top 5 blogs with more likes
exports.most_like_blogs = async (req, res) => {
  try {

    let UserID = req.id
    const snapshot = db.collectionGroup('Blog').where('Total_Likes', '>', 0).where('disable', '==', false).orderBy('Total_Likes', 'desc').limit(5).get()

    const likeBlog = db.collectionGroup('BlogLikes').where('UserID', '==', UserID).orderBy('BlogCreatedat').get()

    Promise.all([snapshot, likeBlog]).then(values => {

      if (values[0].empty) return responseMessage(res, 404, 1, 'No Blogs liked yet!', null)

      var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

      var blogArr = values[0].docs.map((x) => {
        let data = x.data()
        delete data['disable']
        return { ...data, id: x.id, createdAt: data.createdAt.toDate(), updatedAt: data?.updatedAt?.toDate() }
      })

      let array = []

      for (let k = 0; k < blogArr.length; k++) {
        var check = true
        for (var i = 0; i < likeArr.length; i++) {
          if (blogArr[k].id === likeArr[i].BlogID) {

            check = false
            let m = { ...blogArr[k], status: true }
            array.push(m)
            likeArr.splice(i, 1)
            break;
          }
        }
        // console.log('hi', count, blogArr[k].id)
        // console.log('check', check)
        if (check) {
          array.push({ ...blogArr[k], status: false })
        }
        if (likeArr.length == 0) {
          // console.log('array', array.length)
          // console.log('blogArr.slice(0, k )', blogArr.slice(k + 1, blogArr.length).length)
          array = array.concat(blogArr.slice(k + 1, blogArr.length))
          break
        }
      }

      return responseMessage(res, 200, 1, 'Success', { TotalBlogs: array.length, Blogs: array })
    })


  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Top 5 blogs with more comments
exports.most_comments = async (req, res) => {
  try {
    let UserID = req.id
    const snapshot = db.collectionGroup('Blog').where('TotalComments', '>', 0).where('disable', '==', false).orderBy('TotalComments', 'desc').limit(5).get()

    const likeBlog = db.collectionGroup('BlogLikes').where('UserID', '==', UserID).orderBy('BlogCreatedat').get()

    Promise.all([snapshot, likeBlog]).then(values => {

      if (values[0].empty) return responseMessage(res, 404, 1, 'No comments on Blog yet', null)

      var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

      var blogArr = values[0].docs.map((x) => {
        let data = x.data()
        delete data['disable']
        return { ...data, id: x.id, createdAt: data.createdAt.toDate(), updatedAt: data?.updatedAt?.toDate() }
      })

      let array = []

      for (let k = 0; k < blogArr.length; k++) {
        var check = true
        for (var i = 0; i < likeArr.length; i++) {
          if (blogArr[k].id === likeArr[i].BlogID) {

            check = false
            let m = { ...blogArr[k], status: true }
            array.push(m)
            likeArr.splice(i, 1)
            break;
          }
        }

        if (check) {
          array.push({ ...blogArr[k], status: false })
        }
        if (likeArr.length == 0) {
          array = array.concat(blogArr.slice(k + 1, blogArr.length))
          break
        }
      }

      return responseMessage(res, 200, 1, 'Success', { TotalBlogs: array.length, Blogs: array })
    })

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Show Blogs to the user
exports.allBlogs = async (req, res) => {
  try {
    let UserID = req.id

    const allUsers = db.collection('Users').get()

    const allBlogs =  db.collectionGroup('Blog').where('disable', '==', false).orderBy('createdAt', 'desc').get()

    const likeBlog =  db.collectionGroup('BlogLikes').where('UserID', '==', UserID).orderBy('BlogCreatedat').get()

    if (allBlogs.empty) return responseMessage(res, 404, 1, 'No Blogs to Display', null)

    Promise.all([allBlogs, likeBlog, allUsers]).then(values => {

      if (values[0].empty) return responseMessage(res, 404, 1, 'No Blogs to Display', null)

      var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

      var userArr = values[2].docs.map((x) => { return { ...x.data(), UserID: x.id } })

      var blogArr = values[0].docs.map((x) => {
        let data = x.data()
        delete data['disable']
        return { ...data, id: x.id, createdAt: data.createdAt.toDate(), updatedAt: data?.updatedAt?.toDate() }
      })

      let array = []

      for (let k = 0; k < blogArr.length; k++) {
        var check = true
        for (var i = 0; i < likeArr.length; i++) {
          if (blogArr[k].id === likeArr[i].BlogID) {

            check = false
            let m = { ...blogArr[k], status: true }
            array.push(m)
            likeArr.splice(i, 1)
            break;
          }
        }

        if (check) {
          array.push({ ...blogArr[k], status: false })
        }
        if (likeArr.length == 0) {
          array = array.concat(blogArr.slice(k + 1, blogArr.length))
          break
        }
      }

      let data = [] //UserID
      for(let i = 0; i < array.length; i++){

        for (let m = 0; m < userArr.length; m++ ){

          if( array[i].UserID === userArr[m].UserID ){
            let profileImage =  userArr[m].photo
            let combineData = { ...array[i], profileImage }
            data.push(combineData)
          }
        }
      }

      return responseMessage(res, 200, 1, 'Success', { TotalBlogs: array.length, Blogs: data })
    })
    
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Top 20 blogs order by time
exports.getBlogs = async (req, res) => {
  try {
    let UserID = req.id
    const Top20Blogs = db.collectionGroup('Blog').where('disable', '==', false).orderBy('createdAt', 'desc').limit(20).get()
    const likeBlog = db.collectionGroup('BlogLikes').where('UserID', '==', UserID).orderBy('BlogCreatedat').get()

    Promise.all([Top20Blogs, likeBlog]).then(values => {

      if (values[0].empty) return responseMessage(res, 200, 0, 'No Blogs to display', null)

      var blogArr = values[0].docs.map((x) => {
        let data = x.data()
        delete data['disable']
        return { ...data, id: x.id, createdAt: data.createdAt.toDate(), updatedAt: data?.updatedAt?.toDate() }
      })

      var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

      let array = []

      for (let k = 0; k < blogArr.length; k++) {
        var check = true
        for (var i = 0; i < likeArr.length; i++) {
          if (blogArr[k].id === likeArr[i].BlogID) {

            check = false
            let m = { ...blogArr[k], status: true }
            array.push(m)
            likeArr.splice(i, 1)
            break;
          }
        }
        // console.log('hi', count, blogArr[k].id)
        // console.log('check', check)
        if (check) {
          array.push({ ...blogArr[k], status: false })
        }
        // count++
        if (likeArr.length == 0) {
          console.log('array', array.length)
          console.log('blogArr.slice(0, k )', blogArr.slice(k + 1, blogArr.length).length)
          array = array.concat(blogArr.slice(k + 1, blogArr.length))
          break
        }
      }
      // console.log('count', count)

      // console.log('array lenght', array.length)

      // return res.status(200).send(array)


      return responseMessage(res, 200, 1, 'Success', { TotalBlogs: array.length, Blogs: array })

    })

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


//  Get user Blog only
exports.getUserBlogs = async (req, res) => {
  try {
    let UserID = req.id
    const MyBlogs = db.collection('Users').doc(UserID).collection('Blog').get()
    const likeBlog = db.collectionGroup('BlogLikes').where('UserID', '==', UserID).orderBy('BlogCreatedat').get()

    Promise.all([MyBlogs, likeBlog]).then(values => {

      if (values[0].empty) return responseMessage(res, 200, 0, 'No Blogs to display', null)

      var blogArr = values[0].docs.map((x) => { return { ...x.data(), id: x.id, createdAt: x.data().createdAt.toDate() } })

      var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

      let array = []

      for (let k = 0; k < blogArr.length; k++) {
        var check = true
        for (var i = 0; i < likeArr.length; i++) {
          if (blogArr[k].id === likeArr[i].BlogID) {

            check = false
            let m = { ...blogArr[k], status: true }
            array.push(m)
            likeArr.splice(i, 1)
            break;
          }
        }
        // console.log('hi', count, blogArr[k].id)
        // console.log('check', check)
        if (check) {
          array.push({ ...blogArr[k], status: false })
        }
        // count++
        if (likeArr.length == 0) {
          console.log('array', array.length)
          console.log('blogArr.slice(0, k )', blogArr.slice(k + 1, blogArr.length).length)
          array = array.concat(blogArr.slice(k + 1, blogArr.length))
          break
        }
      }
      // console.log('count', count)

      // console.log('array lenght', array.length)

      // return res.status(200).send(array)

      return responseMessage(res, 200, 1, 'Success', { TotalBlogs: array.length, Blogs: array })

    })

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


//  get logged in User Blog only
exports.getBlogbyID = async (req, res) => {
  try {

    let UserID = req.id
    let { userId, BlogID } = req.body
    // console.log(req.body)
    const MyBlog = db.collection('Users').doc(userId).collection('Blog').doc(BlogID).get()
    // if (!MyBlog.exists) return responseMessage(res, 400, 0, 'No blog found', null)

    const likeBlog = db.collectionGroup('BlogLikes').where('UserID', '==', UserID).where('BlogID', '==', BlogID).get()

    // Promise.all([MyBlog, likeBlog]).then(values => {

    //   if (!values[0].exists) return responseMessage(res, 200, 0, 'No Blog Found!', null)

    //   let d = values[0].data()

    //   let createdAt = values[0].data().createdAt.toDate()
    //   let r = { ...d, createdAt }
    //   var blogArr = [r]

    //   var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

    //   // console.log(likeArr)

    //   let array = []
    //   // console.log(values[0].id)

    //   for (let k = 0; k < blogArr.length; k++) {
    //     var check = true
    //     for (var i = 0; i < likeArr.length; i++) {
    //       if (values[0].id === likeArr[i].BlogID) {

    //         check = false
    //         let m = { ...blogArr, status: true }
    //         array.push(m)
    //         likeArr.splice(i, 1)
    //         break;
    //       }
    //     }

    //     if (check) {
    //       array.push({ ...blogArr, status: false })
    //     }
    //     // console.log(array)


    //     // if (likeArr.length == 0) {
    //     //   array = array.concat(blogArr.slice(k + 1, blogArr.length))
    //     //   break
    //     // }
    //   }
    //   // // console.log(array)
    //   // let createdAt = array[0]['0'].createdAt.toDate()
    //   //   // console.log(createdAt)
    //   //   let result = { ...array,  createdAt: createdAt }
    //   //   console.log(result)

    //   return responseMessage(res, 200, 1, 'Success', array)

    // })

    // console.log(MyBlog.data())

    Promise.all([MyBlog, likeBlog]).then(values => {

      if (!values[0].exists) return responseMessage(res, 200, 0, 'No Blog Found!', null)

      if (!values[1].empty) {
        let blog = values[0].data()
        let createdAt = values[0].data().createdAt.toDate()
        let r = { ...blog, createdAt }
        let m = { ...r, status: true }
        let data = {
          UserID: m.UserID,
          BlogID: BlogID,
          title: m.title,
          authorName: m.authorName,
          image: m.image,
          tags: m.tags,
          content: m.content,
          categoryName: m.categoryName,
          category: m.category,
          status: m.status,
          TotalComments: m.TotalComments,
          Total_Likes: m.Total_Likes,
          TotalReplyComments: m.TotalReplyComments,
          disable: m.disable,
          createdAt: m.createdAt
        }
        return responseMessage(res, 200, 1, 'success', data)
      }
      let blog = values[0].data()
      let createdAt = values[0].data().createdAt.toDate()
      let m = { ...blog, createdAt }
      let data = {
        UserID: m.UserID,
        BlogID: BlogID,
        title: m.title,
        authorName: m.authorName,
        image: m.image,
        tags: m.tags,
        content: m.content,
        categoryName: m.categoryName,
        category: m.category,
        status: false,
        TotalComments: m.TotalComments,
        Total_Likes: m.Total_Likes,
        TotalReplyComments: m.TotalReplyComments,
        disable: m.disable,
        createdAt: m.createdAt
      }
      return responseMessage(res, 200, 1, 'Success', data)
    })

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


exports.getCategories = async (req, res) => {
  try {
    const getCategories = await db.collection('Category').orderBy('createdAt', 'desc').get()
    if (getCategories.empty) return responseMessage(res, 404, 1, 'No Categories to Display')
    let category = []
    getCategories.forEach(doc => {
      let data = doc.data()
      delete data['updatedAt']
      delete data['createdAt']
      delete data['UserID']
      // delete data['createdAt']
      let ID = doc.id
      category.push({ ID, ...data })
    })
    return responseMessage(res, 200, 1, 'Success', { TotalCategories: category.length, category })
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Search Blog by category
exports.SearchbyCategory = async (req, res) => {
  try {
    let UserID = req.id
    let { category } = req.body

    let SearchBlog = db.collectionGroup('Blog').where('category', '==', category).where('disable', '==', false).get()

    const likeBlog = db.collectionGroup('BlogLikes').where('UserID', '==', UserID).orderBy('BlogCreatedat').get()

    Promise.all([SearchBlog, likeBlog]).then(values => {

      if (values[0].empty) return responseMessage(res, 200, 0, 'No Blog Found!', null)

      var blogArr = values[0].docs.map((x) => {
        let data = x.data()
        delete data['disable']
        return { ...data, id: x.id, createdAt: x.data().createdAt.toDate(), }
      })

      var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

      let array = []

      for (let k = 0; k < blogArr.length; k++) {
        var check = true
        for (var i = 0; i < likeArr.length; i++) {
          if (blogArr[k].id === likeArr[i].BlogID) {

            check = false
            let m = { ...blogArr[k], status: true }
            array.push(m)
            likeArr.splice(i, 1)
            break;
          }
        }

        if (check) {
          array.push({ ...blogArr[k], status: false })
        }

        if (likeArr.length == 0) {
          array = array.concat(blogArr.slice(k + 1, blogArr.length))
          break
        }
      }

      return responseMessage(res, 200, 1, 'Success', { TotalBlogs: array.length, Blogs: array })

    })

    // if (SearchBlog.empty) return responseMessage(res, 404, 1, 'No Blog Found', null)
    // let GET = []
    // SearchBlog.forEach((doc) => {
    //   let data = doc.data()
    //   delete data["disable"]
    //   let ID = doc.id
    //   GET.push({ ID, ...data })
    // })

    // return responseMessage(res, 200, 1, 'Success', GET)
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Search Blog by Tags
exports.SearchbyTags = async (req, res) => {
  try {
    let UserID = req.id
    let { tags } = req.body
    let tag = []
    tags.forEach(pro => { tag.push(pro.toLowerCase()) })
    // console.log(tag)

    let SearchBlog = db.collectionGroup('Blog').where('tags', 'array-contains-any', tag).where('disable', '==', false).get()

    const likeBlog = db.collectionGroup('BlogLikes').where('UserID', '==', UserID).orderBy('BlogCreatedat').get()

    Promise.all([SearchBlog, likeBlog]).then(values => {

      if (values[0].empty) return responseMessage(res, 200, 0, 'No Blog Found!', null)

      var blogArr = values[0].docs.map((x) => {
        let data = x.data()
        delete data['disable']
        return { ...data, id: x.id, createdAt: data.createdAt.toDate(), updatedAt: data?.updatedAt?.toDate() }
      })

      var likeArr = values[1].docs.map((x) => { return { ...x.data(), id: x.id } })

      let array = []

      for (let k = 0; k < blogArr.length; k++) {
        var check = true
        for (var i = 0; i < likeArr.length; i++) {
          if (blogArr[k].id === likeArr[i].BlogID) {

            check = false
            let m = { ...blogArr[k], status: true }
            array.push(m)
            likeArr.splice(i, 1)
            break;
          }
        }

        if (check) {
          array.push({ ...blogArr[k], status: false })
        }

        if (likeArr.length == 0) {
          array = array.concat(blogArr.slice(k + 1, blogArr.length))
          break
        }
      }

      return responseMessage(res, 200, 1, 'Success', { TotalBlogs: array.length, Blogs: array })

    })


    // if (SearchBlog.empty) return responseMessage(res, 203, 1, 'No Blog Found', null)
    // let resArr = []
    // SearchBlog.forEach(doc => {
    //   let data = doc.data()
    //   delete data['disable']
    //   let id = doc.id
    //   resArr.push({ id, ...data })
    // })

    // return responseMessage(res, 200, 1, 'Success', resArr)
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Delete Blog by ID
exports.DeleteBlog = async (req, res) => {
  try {
    let UserID = req.id
    let { BlogID } = req.body

    let delBlog = await db.collection('Users').doc(UserID).collection('Blog').doc(BlogID).get()

    if (!delBlog.exists) return responseMessage(res, 200, 0, `No Blog Found with id: ${BlogID}`, null)

    // we can delete it with full link also but I will try it later

    let folder = 'BlogPictures'
    let image = delBlog.data().image
    // console.log('image link: ', image)
    let imagename = image.split('%2F')
    // console.log('image name after %2F', imagename[1])
    let filename = imagename[1]

    const filepath = folder + "/" + filename
    // console.log('filepath: ', filepath)

    let file = bucket.file(filepath)

    file.delete()

    function clearCollection(path) {
      const ref = db.collection(path)
      ref.onSnapshot((snapshot) => {
        snapshot.docs.forEach((doc) => {
          ref.doc(doc.id).delete()
        })
      })
    }

    clearCollection('BlogLikes')
    clearCollection('Comments')

    delBlog.ref.delete()

    return responseMessage(res, 200, 1, `Blog with ID: ${BlogID} deleted succesfully!`, null)

    // async function deleteCollection(db, collectionPath, batchSize) {
    //   const collectionRef = db.collection(collectionPath);
    //   const query = collectionRef.orderBy('createdAt').limit(batchSize);

    //   return new Promise((resolve, reject) => {
    //     deleteQueryBatch(db, query, resolve).catch(reject);
    //   });
    // }

    // async function deleteQueryBatch(db, query, resolve) {
    //   const snapshot = await query.get();

    //   const batchSize = snapshot.size;
    //   if (batchSize === 0) {
    //     // When there are no documents left, we are done
    //     resolve();
    //     return;
    //   }

    //   // Delete documents in a batch
    //   const batch = db.batch();
    //   snapshot.docs.forEach((doc) => {
    //     batch.delete(doc.ref);
    //   });
    //   await batch.commit();

    //   // Recurse on the next process tick, to avoid
    //   // exploding the stack.
    //   process.nextTick(() => {
    //     deleteQueryBatch(db, query, resolve);
    //   });
    // }

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}