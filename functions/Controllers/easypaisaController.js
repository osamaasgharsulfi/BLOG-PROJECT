var admin = require("firebase-admin");
const db = admin.firestore();

exports.easypaisaMATransaction = async (req, res) => {
    try {
        var axios = require('axios');
        var usernamePass = 'OsamaAsghar:osamaasghar073@123'
        const encodedusernamePass = Buffer.from(usernamePass).toString('base64')
        console.log(encodedusernamePass)


        var config = {
            method: 'post',
            url: 'https://api.eu-de.apiconnect.appdomain.cloud/easypaisaapigw-telenorbankpk-tmbdev/dev-catalog/initiate-ma-transaction',
            headers: {
                Authorization: 'Bearer REPLACE_BEARER_TOKEN',
                Credentials: encodedusernamePass,
                'content-type': 'application/json',
                accept: 'application/json'
            },
            body: {
                signature: 'uknal',
                request: {
                    orderId: '2065308779020288',
                    storeId: '6924178452119552',
                    transactionAmount: '3938127494250496',
                    transactionType: 'durme',
                    mobileAccountNo: '5117705146116721',
                    emailAddress: 'osamaasghar073@gmail.com'
                }
            },
            JSON: true
        }

        axios(config)
            .then(function (response) {
                console.log(JSON.stringify(response.data));
            })
            .catch(function (error) {
                console.log(error);
                return res.status(200).send({data: error})
            });

    }
    catch (error) {
        console.log(error)
    }
}

