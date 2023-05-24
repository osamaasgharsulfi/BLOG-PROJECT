var admin = require("firebase-admin");
const bcrypt = require('bcrypt');
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/sendEmail');
const otpGenerator = require('otp-generator');
const moment = require('moment')
// var bucket = admin.storage().bucket('my-second-project-b9c7c.appspot.com');
const { v4: uuidv4 } = require('uuid');
const { responseMessage } = require('../models/responseMessage')
const EmailRegix = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
const { upload } = require('../utils/UploadImage');
const { count } = require("console");
const { image } = require("pdfkit");

// Register User
exports.signup = async (req, res) => {
  try {
    let { firstname, lastname, email, phoneno, password, photo, about } = req.body

    // Check if User already exists or not
    const emailExists = db.collection("Users").where('email', '==', email).get();

    const phonenoExists = db.collection('Users').where('phoneno', '==', phoneno).get()

    // Hasing password
    let hashpassword = bcrypt.hash(password, 10)

    Promise.all([emailExists, phonenoExists, hashpassword]).then((values) => {

      if (!values[0].empty) return responseMessage(res, 401, 0, "Email already exists")

      if (!values[1].empty) return responseMessage(res, 401, 0, "Phone number already exists")

      var link = ''

      if(photo){

      var link = upload('ProfilePictures', photo)
      if (link === true) return responseMessage(res, 401, 0, 'Only png and jpeg files are supported', null)

      }
      db.collection('Users').add({
        firstname: firstname,
        lastname: lastname,
        email: email,
        phoneno: phoneno,
        password: values[2],
        about: about,
        createdAt: FieldValue.serverTimestamp(),
        photo: link,
        role: 0
      }).catch(error => {
        console.log(error)
      })
      return responseMessage(res, 201, 1, "User has been registered successfully")
    })
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Verify Email
exports.VerifyEmail = async (req, res) => {
  try {
    const { email, OTP } = req.body

    const UserExists = await db.collection('Users').doc(email).collection('OTP').doc(email).get()

    if (!UserExists.exists) return res.status(404).send({ ErrorMessage: 'No user found' })

    if (UserExists.data().alreadyUsed === 'true') return res.status(401).send({ ErrorMessage: 'User already Verified' })

    if (UserExists.data().sendedOTP != OTP) return res.status(401).send({ ErrorMessage: 'Invalid OTP' })

    if (new Date() > new Date(UserExists.data().expiresAt.toDate())) return res.status(401).send({ ErrorMessage: 'OTP Expires' })

    UserExists.ref.set({ alreadyUsed: 'true' }, { merge: true })

    db.collection('Users').doc(email).set({ Verified: 'true' }, { merge: true })

    return res.status(200).send({ message: 'User Verified' })

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}



// Send OTP 3 attempts will be given to User after that User will be blocked for 5 hours
exports.SendOTP = async (req, res) => {
  try {
    const { email } = req.body
    // console.log(email)

    const UserExists = await db.collection('Users').where('email', '==', email).get()

    if (UserExists.empty) return responseMessage(res, 404, 0, 'Invalid E-mail')
    // console.log(UserExists.docs[0].data())

    // Check User Mail Blocked Time expires or not
    if (new Date() < new Date(UserExists?.docs[0]?.data()?.EmailBlocked?.toDate())) {
      let start = moment(new Date())
      let end = moment(new Date(UserExists?.docs[0].data()?.EmailBlocked?.toDate()))
      let duration = moment.duration(end.diff(start))
      var seconds = parseInt(duration.asSeconds()) % 60;
      var minutes = parseInt(duration.asMinutes()) % 60;
      var hours = parseInt(duration.asHours()) % 60;
      console.log(hours)
      if (hours && minutes && seconds) return responseMessage(res, 401, 0, `Please wait for ${hours} hours ${minutes} minutes ${seconds} seconds. After this you will be unblocked.`)
      if (minutes && seconds) return responseMessage(res, 401, 0, `Please wait for ${minutes} minutes ${seconds} seconds. After this you will be unblocked.`)
      return responseMessage(res, 401, 0, `Please wait for ${seconds} seconds. After this you will be unblocked.`)
    }


    // Next OTP will be send after 5 minutes
    if (new Date() < new Date(UserExists?.docs[0]?.data()?.OTPExpireTime?.toDate())) {
      let start = moment(new Date())
      let end = moment(new Date(UserExists?.docs[0].data()?.OTPExpireTime?.toDate()))
      let duration = moment.duration(end.diff(start))
      var seconds = parseInt(duration.asSeconds()) % 60;
      var minutes = parseInt(duration.asMinutes()) % 60;
      if (minutes && seconds) return responseMessage(res, 401, 0, `Please wait for ${minutes} minutes ${seconds} seconds. Next OTP will be send after this time.`)
      return responseMessage(res, 401, 0, `Please wait for ${seconds} seconds. Next OTP will be send after this time.`)
    }

    // Sending OTP and set its expires time
    let exp = new Date(Date.now() + 5 * 60 * 1000)
    // // console.log('exp', exp)
    var array = new Uint32Array(6);
    array[0] = Math.floor(Math.random() * 10);
    array[1] = Math.floor(Math.random() * 10);
    array[2] = Math.floor(Math.random() * 10);
    array[3] = Math.floor(Math.random() * 10);
    array[4] = Math.floor(Math.random() * 10);
    array[5] = Math.floor(Math.random() * 10);
    //    this.window.crypto.getRandomValues(array);
    var OTP = String(array[0]) + String(array[1]) + String(array[2]) + String(array[3]) + String(array[4]) + String(array[5])


    //   async function resetpasswordviaemail(email) {
    //     var array = new Uint32Array(6);
    //     array[0] = Math.floor(Math.random() * 10);
    //     array[1] = Math.floor(Math.random() * 10);
    //     array[2] = Math.floor(Math.random() * 10);
    //     array[3] = Math.floor(Math.random() * 10);
    //     array[4] = Math.floor(Math.random() * 10);
    //     array[5] = Math.floor(Math.random() * 10);
    //     //    this.window.crypto.getRandomValues(array);
    //     var code = String(array[0]) + String(array[1]) + String(array[2]) + String(array[3]) + String(array[4]) + String(array[5])
    //     db.collection('resetpassword').doc(email).set({
    //         rcode: code,
    //         attempt: 3
    //     })

    //     const msg = {
    //         to: email,
    //         from: "info@f3timetracker.com",
    //         subject: "Reset Password For Eizhar",
    //         text: "Request for resetting your password for " + email + ", Below is code to reset your password",
    //         html: "Request for resetting your password for " + email + ", Below is code to reset your password<br>" + "<strong>" + array[0] + " " + array[1] + " " + array[2] + " " + array[3] + " " + array[4] + " " + array[5] + " " + "</strong>"
    //     };
    //     sgMial.send(msg);

    // }

    sendEmail(email, OTP)
    let count = UserExists?.docs[0]?.data()?.OTPCount || 0


    // blocking User for 5 hours after 3 time succesfully sending OTP
    if (UserExists?.docs[0]?.data()?.OTPCount === 3) {

      let Emailexp = new Date(Date.now() + 5 * 60 * 60 * 1000)
      // console.log(exp)
      UserExists.docs[0].ref.update({ OTP: OTP, OTPExpireTime: exp, OTPCount: 0, EmailBlocked: Emailexp })
      return responseMessage(res, 401, 0, `You have been Blocked for 5 hours. Next OTP will be send after this time.`)

    }

    UserExists.docs[0].ref.update({ OTP: OTP, OTPExpireTime: exp, OTPCount: count + 1, VerifiedCount: 0, OTPVerified: false })

    return responseMessage(res, 200, 1, `OTP send successfully Check your email address`)

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}



// Send OTP again
// exports.ResendOTP = async (req, res) => {
//   try {
//     const { email } = req.body
//     // console.log(email)

//     const UserExists = await db.collection('Users').where('email', '==', email).get()

//     if (UserExists.empty) return responseMessage(res, 404, 0, 'Invalid E-mail')
//     // console.log(UserExists.docs[0].data())

//     // Next OTP will be send after 60 seconds
//     if (new Date() < new Date(UserExists?.docs[0]?.data()?.OTPExpireTime?.toDate())) {
//       let start = moment(new Date())
//       let end = moment(new Date(UserExists?.docs[0].data()?.OTPExpireTime?.toDate()))
//       let duration = moment.duration(end.diff(start))
//       var seconds = parseInt(duration.asSeconds()) % 60;
//       return responseMessage(res, 401, 0, `Please wait for ${seconds} seconds. Next OTP will be send after this time.`)
//     }

//     // Sending OTP and set its expires time
//     let OTP = otpGenerator.generate(6, { upperCaseAlphabets: true, specialChars: false });
//     let exp = new Date(Date.now() + 1 * 60 * 1000)
//     sendEmail(email, OTP)

//     UserExists.docs[0].ref.set({ OTP: OTP, OTPExpireTime: exp }, { merge: true })

//     return responseMessage(res, 200, 1, `OTP send successfully Check your email address`)

//   }
//   catch (error) {
//     console.log(error)
//     return responseMessage(res, 400, 0, 'Error Occured', error.message)
//   }
// }


// login Users
exports.login = async (req, res) => {
  try {
    let query = db.collection("Users");
    if (req.body.login.match(EmailRegix)) {
      query = query.where('email', '==', req.body.login)
    } else {
      query = query.where('phoneno', '==', req.body.login)
    }
    const snapshot = await query.get()
    // console.log(msg)
    if (snapshot.empty) return responseMessage(res, 401, 0, "Invalid Credientials", null)

    // check if user is blocked or not
    if (new Date() < new Date(snapshot.docs[0].data()?.BlockTime?.toDate())) {
      let start = moment(new Date())
      let end = moment(new Date(snapshot.docs[0].data()?.BlockTime?.toDate()))
      let duration = moment.duration(end.diff(start))
      var minutes = parseInt(duration.asMinutes()) % 60;
      var seconds = parseInt(duration.asSeconds()) % 60;
      if (minutes && seconds) return responseMessage(res, 403, 0, `You account is blocked!. Time Left: ${minutes} Minute and ${seconds} Seconds`)
      return responseMessage(res, 403, 0, `You account is blocked!. Time Left: ${seconds} Seconds`)
    }

    // compare password
    const passwordValid = await bcrypt.compare(req.body.password, snapshot.docs[0].data().password)
    if (!passwordValid) {
      // Block user after 3 unsuccessfull attempts
      let count = snapshot.docs[0].data().attemptcount || 0
      if (count == 2) {
        const exp = new Date(Date.now() + 2 * 60 * 1000)
        snapshot.docs[0].ref.set({ BlockTime: exp, attemptcount: 0 }, { merge: true })
        return responseMessage(res, 403, 0, 'Your account is blocked for 2 minutes.')
      }
      snapshot.docs[0].ref.set({ attemptcount: count + 1 }, { merge: true })
      return responseMessage(res, 403, 0, `Invalid Credientials. You have ${2 - count} attempt left.`)
    }

    // Token Generation
    let data = snapshot.docs[0]?.data()
    let id = snapshot.docs[0].id
    let role = data?.role
    var token = jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "1 day" })
    // delete data['password']
    // delete data['attemptcount']
    // delete data['expiresAt']
    // delete data['createdAt']
    // delete data['BlockTime']
    // delete data['role']
    // delete data['token']
    // delete data['OTPExpireTime']
    // delete data['EmailBlocked']
    // delete data['OTPCount']
    // delete data['OTP']
    snapshot.docs[0].ref.set({ attemptcount: 0 }, { merge: true })
    snapshot.docs[0].ref.update({ token: token })
    data = {
      id: id,
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      phoneno: data.phoneno,
      about: data.about,
      photo: data.photo,
      TotalBlogs: data.TotalBlogs,
      createdAt: data.createdAt.toDate(),
      token: token
    }

    // const clientIP = req.headers['x-appengine-user-ip'] || req.header['x-forwarded-for']

    // console.log(clientIP)

    return responseMessage(res, 200, 1, 'Success', data)

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}

// Verify OTP
exports.VerifyOTP = async (req, res) => {
  try {
    const { OTP, email } = req.body

    const Checkemail = await db.collection('Users').where('email', '==', email).get()
    if (Checkemail.empty) return responseMessage(res, 400, 0, 'Email not found!', null)

    if (Checkemail.docs[0].data().OTP !== OTP) {

      let count = Checkemail.docs[0]?.data()?.VerifiedCount || 0

      // NUll OTP after 3 Inavlid OTP Counts
      if (count === 3) {
        db.collection('Users').doc(Checkemail.docs[0].id).update({ OTP: null })
        return responseMessage(res, 409, 0, 'You have tried three unsuccessfull attempts. Please click resend OTP to get new OTP.', null)
      }

      // add counts
      db.collection('Users').doc(Checkemail.docs[0].id).update({ VerifiedCount: count + 1 })

      return responseMessage(res, 409, 0, ' Invalid OTP')

    }

    if (Checkemail.docs[0]?.data()?.OTPVerified === true) return responseMessage(res, 401, 0, 'This OTP is already Verified. Please Click Resend OTP to generate new OTP.')

    if (new Date() > new Date(Checkemail.docs[0].data().OTPExpireTime.toDate())) return responseMessage(res, 401, 0, `OTP Expires!.`)

    // NUll the OTP after OTP is verified so that it cannot be used again
    db.collection('Users').doc(Checkemail.docs[0].id).update({ OTPVerified: true, VerifiedCount: 0 })

    return responseMessage(res, 200, 1, ' OTP verified successfully')

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}

// Forgot Password
exports.ForgotPassword = async (req, res) => {
  try {
    const { OTP, password, confirmpassword } = req.body
    const CheckOTP = await db.collection('Users').where('OTP', '==', OTP).get()
    if (CheckOTP.empty) return responseMessage(res, 404, 0, 'OTP incorrect')

    if (new Date() > new Date(CheckOTP.docs[0].data().OTPExpireTime.toDate())) return responseMessage(res, 401, 0, `OTP Expires!.`)

    const hashpassword = await bcrypt.hash(confirmpassword, 10)

    CheckOTP.docs[0].ref.set({ password: hashpassword, OTP: null }, { merge: true })

    return responseMessage(res, 200, 1, ' Pasword Changed Successfully')
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// ChangePassword
exports.ChangePassword = async (req, res) => {
  try {
    let { OldPassword, password, confirmpassword } = req.body
    let UserID = req.id

    if (OldPassword == password) return responseMessage(res, 403, 0, ' Try different pasword, you have used this pasword before ')

    const getUser = db.collection('Users').doc(UserID).get()

    let hashpassword = bcrypt.hash(confirmpassword, 10)

    Promise.all([getUser, hashpassword]).then(values => {

      if (!values[0].exists) return responseMessage(res, 401, 0, 'User not found', null)

      const matchPass = bcrypt.compareSync(OldPassword, values[0].data().password)

      if (!matchPass) return responseMessage(res, 401, 0, 'Invalid Password')

      values[0].ref.set({ password: values[1] }, { merge: true })

      return responseMessage(res, 200, 1, 'Password Changed Successfully')

    })

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Logout
exports.Logout = async (req, res) => {
  try {
    let UserID = req.id
    const Logout = db.collection('Users').doc(UserID).set({ token: null }, { merge: true })
    return responseMessage(res, 200, 1, 'User logout Successfully')
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}


// Practice
exports.Pratcice = async (req, res) => {
  try {
    Promise.resolve(1)
      .then((res) => {
        console.log(res)
        return res * 2
      })
      .then((res) => {
        console.log(res)
        return res * 2
      })
      .then((res) => {
        console.log(res)
        return res * 2
      })
      .finally((res) => {
        console.log(res)
      })
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}

// Count docs with aggregation queries
exports.count = async (req, res) => {
  try {

    const collectionRef = db.collection('Category')
    const snapshot = await collectionRef.count().get();
    console.log(snapshot.data().count);

    return responseMessage(res, 200, 1, 'Total Users are: ', snapshot.data().count)

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)

  }
}

// Bubble Sorting 
exports.sort = async (req, res) => {
  try {
    let { arr } = req.body
    console.log('hi')
    console.log(arr)
    for (let i = 0; i < arr.length - 1; i++) {

      for (let j = 0; j < arr.length - i - 1; j++) {

        if (arr[j] > arr[j + 1]) {

          let temp = arr[j]
          arr[j] = arr[j + 1]
          arr[j + 1] = temp
        }
      }
    }

    return responseMessage(res, 200, 1, 'Sorted Array: ', arr)
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured:', error.message)
  }
}



// Insertion Sorting 
exports.insertionsorting = async (req, res) => {
  try {
    let { arr } = req.body
    console.log('hi')
    console.log(arr)
    for (let i = 1; i < arr.length; i++) {

      let numbertoinsert = arr[i]
      let j = i - 1

      while (j >= 0 && arr[j] > numbertoinsert) {

        arr[j + 1] = arr[j]
        j = j - 1
      }
      arr[j + 1] = numbertoinsert
    }

    return responseMessage(res, 200, 1, 'Inertion Sorted Array: ', arr)
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured:', error.message)
  }
}


// Quick Sorting 
exports.Quicksorting = async (req, res) => {
  try {
    let { arr } = req.body

    function quicksort(arr) {

      if (arr.length < 2) return arr
      let pivot = arr[arr.length - 1]
      // console.log('pivot', pivot)

      let left = []
      let right = []
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] < pivot) {
          left.push(arr[i])
        }
        else {
          right.push(arr[i])
        }
        // console.log('left', left)
        // console.log('right', right)
        // arr = left.concat(pivot, right)
        // console.log(arr)
      }
      return [...quicksort(left), pivot, ...quicksort(right)]
    }

    return responseMessage(res, 200, 1, 'Quick Sorted Array: ', quicksort(arr))
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured:', error.message)
  }
}


// stack 
exports.stack = async (req, res) => {
  try {

    class Stack {
      constructor() {
        this.items = []
      }

      push(element) {
        this.items.push(element)
      }

      pop(element) {
        return this.items.pop(element)
      }

      peek() {
        return this.items[this.items.length - 1]
      }

      isEmpty() {
        return this.items.length === 0
      }

      size() {
        return this.items.length
      }

      print() {
        console.log(this.items.toString())
      }

    }

    const stack = new Stack()
    // console.log(stack.isEmpty())
    // return responseMessage(res, 200, 'stack check empty or not ', stack.isEmpty())

    stack.push(20)
    stack.push(10)
    stack.push(30)

    console.log(stack.size())
    stack.print()

    console.log(stack.pop())

    console.log(stack.peek())
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured:', error.message)
  }
}


// queue
exports.queue = async (req, res) => {
  try {

    class Queue {
      constructor() {
        this.items = []
      }

      enqueue(element) {
        this.items.push(element)
      }

      dequeue(element) {
        return this.items.shift(element)
      }

      peek() {
        if (!this.isEmpty()) {
          return this.items[0]
        }
        return null
      }

      isEmpty() {
        return this.items.length === 0
      }

      size() {
        return this.items.length
      }

      print() {
        console.log(this.items.toString())
      }

    }

    const queue = new Queue()
    console.log(queue.isEmpty())
    // return responseMessage(res, 200, 'queue check empty or not ', queue.isEmpty())

    queue.enqueue(10)
    queue.enqueue(20)
    queue.enqueue(30)

    console.log(queue.size())
    queue.print()

    console.log(queue.dequeue())

    console.log(queue.peek())
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured:', error.message)
  }
}


// linked list
exports.linkList = async (req, res) => {
  try {

    class Node {
      constructor(value) {
        this.value = value
        this.next = null
      }
    }

    class linkedList {
      constructor() {
        this.head = null
        this.size = 0
      }
      isEmpty() {
        return this.size === 0
      }

      getSize() {
        return this.size
      }

      prepend(value) {
        const node = new Node(value)
        if (this.isEmpty()) {
          this.head = node
        } else {
          node.next = this.head
          this.head = node
        }
        this.size++

      }

      print() {
        if (this.isEmpty()) {
          console.log('List is empty.')
        }
        else {
          let curr = this.head
          let listValues = ''
          while (curr) {
            listValues += `${curr.value} `
            curr = curr.next
          }
          console.log(listValues)
        }
      }
    }

    const list = new linkedList()
    console.log('List is Empty:', list.isEmpty())
    console.log('List-Size ', list.getSize())

    list.print()

    list.prepend(10)

    list.print()

    list.prepend(20)
    list.prepend(30)

    list.print()

  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured:', error.message)
  }
}

