const admin = require("firebase-admin");
const FieldValue = admin.firestore.FieldValue;
const db = admin.firestore();
const FCM = require('fcm-node')
var serverKey = require('../fb-config.json') //put the generated private key path here    
var fcm = new FCM(serverKey)
const { responseMessage } = require('../models/responseMessage')

exports.notification = async (req, res) => {
  try {

    var message = { //this may vary according to the message type (single recipient, multicast, topic, et cetera)
      to: 'osama asghar',
      // collapse_key: 'your_collapse_key',

      notification: {
        title: 'Test',
        body: 'Hi, How are you?'
      }

      // data: {  //you can send only notification or only data(or include both)
      //     my_key: 'my value',
      //     my_another_key: 'my another value'
      // }
    };

    fcm.send(message, function (err, response) {
      if (err) {
        console.log("Something has gone wrong!", err);
        return responseMessage(res, 400, 0, 'Error occured', err)
      } else {
        console.log("Successfully sent with response: ", response);
        return responseMessage(res, 200, 1, 'Success', response)
      }
    })
  }
  catch (error) {
    console.log(error)
    return responseMessage(res, 400, 0, 'Error Occured', error.message)
  }
}





