var admin = require("firebase-admin");
const db = admin.firestore();
const { responseMessage } = require('../models/responseMessage');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios')
const moment = require('moment')
const Jazzcash = require('jazzcash-checkout')
const crypto = require('crypto');
const { config } = require("process");

exports.jazzCashPayment = async (req, res) => {
    try {

        // let { cardNumber, expMonth, expYear, cvv } = req.body
        // if (!cardNumber || !expMonth || !expYear || !cvv) return responseMessage(res, 401, 0, 'All Fields are required', null)

        // console.log(req.body)

        // let pp_TxnRefNo = uuidv4()
        // // console.log('pp_TxnRefNo: ', pp_TxnRefNo)
        // // return

        // let date = moment().format('yyyy MM DD HHmmss')
        // console.log(date) //2023-01-26T07:55:50.389Z
        // // let pp_TxnDate = date.split('-')
        // // console.log('pp_TxnDate: ', pp_TxnDate)


        // let data = {
        //     pp_Version: "1.1",
        //     pp_TxnType: "MPAY",
        //     pp_TxnRefNo: "T20170518161116",
        //     pp_Amount: "100",
        //     pp_TxnCurrency: "PKR",
        //     pp_TxnExpiryDateTime: "20170520161116",
        //     pp_BillReference: "billRef",
        //     pp_Description: "Description of transaction",
        //     pp_CustomerCardNumber: "5123450000000008",
        //     pp_CustomerCardExpiry: "0517",
        //     pp_CustomerCardCvv: "100",
        //     pp_SecureHash: "osama",
        //     pp_Frequency: "RECURRING"
        //     }
        // console.lo

        // let payload = {
        //     "pp_Version": "1.1",
        //     "pp_TxnType": "MPAY",
        //     "pp_TxnRefNo": "T20230126151857",
        //     "pp_MerchantID": "MC53383",
        //     "pp_Password": "9403z72y0x",
        //     "pp_Amount": "10000",
        //     "pp_TxnCurrency": "PKR",
        //     "pp_TxnDateTime": "20170518161116",
        //     "pp_TxnExpiryDateTime": "20170520161116",
        //     "pp_BillReference": "billRef",
        //     "pp_Description": "Description of transaction",
        //     "pp_CustomerCardNumber": "5123450000000008",
        //     "pp_CustomerCardExpiry": "0517",
        //     "pp_CustomerCardCvv": "100",
        //     "pp_SecureHash": "",
        //     "pp_Frequency": "RECURRING"
        // }

        // Jazzcash.credentials({
        //     config: {
        //         merchantId: process.env.MERCHANT_ID, // Merchant Id
        //         password: "9403z72y0x", // Password
        //         hashKey: "gg9z129b3f", // Hash Key
        //     },
        //     environment: 'sandbox' // available environment live or sandbox
        // });

        // // //   set jazzcash data fields according to your request
        // let data = {
        //     "pp_IsRegisteredCustomer": "yes",
        //     "pp_ShouldTokenizeCardNumber": "yes",
        //     "pp_CustomerID": "25352",
        //     "pp_CustomerEmail": "abc@abc.com",
        //     "pp_CustomerMobile": "03331234567",
        //     "pp_Version": "2.0",
        //     "pp_TxnType": "MPAY",
        //     "pp_TxnRefNo": "T20230127144724",
        //     "pp_MerchantID": "MC53383",
        //     "pp_Password": "9403z72y0x",
        //     "pp_Amount": "100",
        //     "pp_TxnCurrency": "PKR",
        //     "pp_TxnDateTime": "20230127144842",
        //     "pp_TxnExpiryDateTime": "20230127144842",
        //     "pp_BillReference": "billRef",
        //     "pp_Description": "Description of transaction",
        //     "pp_CustomerCardNumber": "5123456789012346",
        //     "pp_CustomerCardCVV": "123",
        //     "pp_CustomerCardExpiry": "01/39",
        //     "pp_UsageMode": "API"
        // }
        // Jazzcash.setData(data);

        // # returns jazzcash response
        // # REQUEST TYPES (PAY, WALLET, INQUIRY, REFUND)
        // let finaldata = await Jazzcash.createRequest("PAY")
        // console.log(finaldata)
        // return responseMessage(res, 200, 1, 'success', finaldata)

        // var sHash = HMACSHA256Encode(hash, jazz.salt);

        // res = JSON.parse(res); // don't parse for PAY
        // console.log(res);
        // let cardResponse = await axios.post('https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Purchase/PAY',payload)

        let date = moment().utcOffset(5).format('YYYYMMDDhhmmss')
        console.log(date)

        let data = {
            "pp_IsRegisteredCustomer": "yes",
            "pp_ShouldTokenizeCardNumber": "yes",
            "pp_CustomerID": "25352",
            "pp_CustomerEmail": "abc@abc.com",
            "pp_CustomerMobile": "03331234567",
            "pp_Version": "2.0",
            "pp_TxnType": "MPAY",
            "pp_TxnRefNo": 'T' + date,
            "pp_MerchantID": "MC53383",
            "pp_Password": "9403z72y0x",
            "pp_Amount": "100",
            "pp_TxnCurrency": "PKR",
            "pp_TxnDateTime": date,
            "pp_TxnExpiryDateTime": date,
            "pp_BillReference": "billRef",
            "pp_Description": "Descriptionoftransaction",
            "pp_CustomerCardNumber": "5123456789012346",
            "pp_CustomerCardCVV": "100",
            "pp_CustomerCardExpiry": "01/39",
            "pp_DiscountedAmount": "",
            "pp_DiscountBank": "",
            "pp_UsageMode": "API"
        }

        let arr = [data.pp_CustomerID, data.pp_CustomerEmail, data.pp_CustomerMobile, data.pp_Version, data.pp_TxnType, data.pp_TxnRefNo,
        data.pp_MerchantID, data.pp_Password, data.pp_CustomerCardCVV, data.pp_TxnDateTime, data.pp_CustomerCardExpiry, data.pp_TxnCurrency,
        data.pp_Amount, data.pp_UsageMode, data.pp_BillReference, data.pp_Description, data.pp_TxnExpiryDateTime, data.pp_CustomerCardNumber]
        arr.sort((a, b) => { a - b })

        console.log(arr)

        let str = ''


        arr.forEach((data) => {

            str = str + '&' + data

        })

        str = 'gg9z129b3f' + str
        console.log(str)
        let salt = 'gg9z129b3f'

        let secureHash = crypto.createHash('sha256').update(str + salt).digest('hex')


        return responseMessage(res, 200, 1, 'success', secureHash)
    }
    catch (err) {
        return responseMessage(res, 400, 0, 'error occured', err.message)
    }

    //   console.log(cardResponse)    
}



// exports.jazzCashPayment = async (req, res) => {
//     try {
//         const secret = 'gg9z129b3f';
//         const data =
//         {
//             pp_IsRegisteredCustomer: "yes",
//             pp_ShouldTokenizeCardNumber: "yes",
//             pp_CustomerID: "25352",
//             pp_CustomerEmail: "abc@abc.com",
//             pp_CustomerMobile: "03331234567",
//             pp_Version: "2.0",
//             pp_TxnType: "MPAY",
//             pp_TxnRefNo: "T20230127144724",
//             pp_MerchantID: "MC53383",
//             pp_Password: "9403z72y0x",
//             pp_Amount: "100",
//             pp_TxnCurrency: "PKR",
//             pp_TxnDateTime: "20230127144842",
//             pp_TxnExpiryDateTime: "20230127144842",
//             pp_BillReference: "billRef",
//             pp_Description: "Descriptionoftransaction",
//             pp_CustomerCardNumber: "5123456789012346",
//             pp_CustomerCardCVV: "123",
//             pp_CustomerCardExpiry: "12/22",
//             pp_DiscountedAmount: "",
//             pp_DiscountBank: "",
//             pp_ReturnURL: "https://us-central1-user-management-api-888d4.cloudfunctions.net/app/returnURL"
//         }

//         // var hash = "" + secret + "&" + data.pp_Amount + "&" + data.pp_BillReference + "&" + data.pp_DiscountBank + "&"
//         //     + "&" + data.pp_MerchantID + "&" + data.pp_Password + "&" + data.pp_ReturnURL + "&" + data.pp_TxnCurrency + "&" +
//         //       data.pp_TxnDateTime + "&" + data.pp_TxnExpiryDateTime + "&" + data.pp_TxnRefNo + "&" + data.pp_Version + "&"
//         //     + data.pp_ShouldTokenizeCardNumber + "&" + data.pp_IsRegisteredCustomer + "&" + data.pp_CustomerID + "&"
//         //     + data.pp_CustomerEmail + "&" + data.pp_CustomerMobile + "&" + data.pp_TxnType + "&" + data.pp_Description 
//         //     + "&" + data.pp_CustomerCardNumber  + "&" + data.pp_CustomerCardCVV +  "&" + data.pp_CustomerCardExpiry  
//         //     + "&" + data.pp_DiscountedAmount + "";


//         // // adding integrity salt in data 
//         // const dataString = JSON.stringify(data) + integritySalt

//         // console.log(dataString)

//         // // creating hash
//         // const hash1 = crypto.createHmac('SHA256', secret)
//         // .update(Buffer.from(hash, 'utf-8'))
//         // .digest('hex');




//         // console.log(hash);
//         return responseMessage(res, 200, 1, 'success', secureHash)



//     }
//     catch (err) {
//         return responseMessage(res, 400, 0, 'error occured', err.message)
//     }

//     //   console.log(cardResponse)    
// }


exports.returnURL = async (req, res) => {
    console.log('hi')
}


exports.windCaveRestAPI = async (req, res) => {
    try {
        // return responseMessage(res, 200, 1, 'Hi', null)
        // var data = JSON.stringify({
        //     "type": "purchase",
        //     "amount": "12345.00",
        //     "currency": "NZD",
        //     "merchantReference": "1234ABC",
        //     "card": {
        //         "cardHolderName": "JOHN T DOE",
        //         "cardNumber": "4111111111111111",
        //         "dateExpiryMonth": "01",
        //         "dateExpiryYear": "18",
        //         "cvc2": "111"
        //     },
        //     "customer": {
        //         "firstName": "John",
        //         "lastName": "Doe",
        //         "email": "john.doe@hosting.com",
        //         "phoneNumber": "+6421384236",
        //         "homePhoneNumber": "+649384236",
        //         "account": "9999999999999999",
        //         "shipping": {
        //             "name": "JOHN TT DOE",
        //             "address1": "15 elsewhere lane",
        //             "address2": "",
        //             "address3": "",
        //             "city": "deliverytown",
        //             "countryCode": "NZ",
        //             "postalCode": "90210",
        //             "phoneNumber": "+43543435",
        //             "state": ""
        //         },
        //         "billing": {
        //             "name": "JOHN TT DOE",
        //             "address1": "15 elsewhere lane",
        //             "address2": "",
        //             "address3": "",
        //             "city": "deliverytown",
        //             "countryCode": "NZ",
        //             "postalCode": "90210",
        //             "phoneNumber": "+43543435",
        //             "state": ""
        //         }
        //     },
        //     "browser": {
        //         "ipAddress": "123.123.123.123",
        //         "userAgent": "Mozilla/5.0 Windows NT 10.0; Win64; x64; rv:59.0 Gecko/20100101 Firefox/59.0"
        //     },
        //     "avs": {
        //         "postCode": "AB10 1AA",
        //         "streetAddress": "1 islington lane",
        //         "avsAction": 0
        //     },
        //     "metaData": [],
        //     "amountSurcharge": "1.50",
        //     "storeCard": true,
        //     "storedCardIndicator": "single",
        //     "installmentCount": 5,
        //     "installmentNumber": 1,
        //     "installmentExpiry": "2050-12-22",
        //     "recurringExpiry": "2050-12-22",
        //     "debtRepaymentIndicator": 0,
        //     "notificationUrl": "https://mybiz.com/txn_result?123",
        //     "extendedData": {
        //         "merchantInvoiceNumber": "455555",
        //         "purchaseOrderDate": "2021-12-13",
        //         "purchaseOrderNumber": "011163",
        //         "taxAmount": 12.34,
        //         "taxRate": 15,
        //         "taxCode": "XYZ",
        //         "taxIndicator": true,
        //         "nationalTaxAmount": 2.34,
        //         "additionalTaxAmount": 66.1,
        //         "additionalTaxRate": 20,
        //         "merchantTaxId": "RW23435",
        //         "purchaserTaxId": "WR7654",
        //         "commodityCode": "QQQ",
        //         "discountAmount": 5.43,
        //         "freightAmount": 155,
        //         "dutyAmount": 23.01,
        //         "shipFromPostalCode": "760",
        //         "shipFromState": "Kansas",
        //         "shipFromCountry": "USA",
        //         "authorizedContactName": "Olly Onion",
        //         "departmentName": "Accounts",
        //         "customerCode": "ZX44323334",
        //         "merchantPostalCode": "670",
        //         "merchantStateCode": "Ohio",
        //         "merchantMinorityCode": "Bacon"
        //     },
        //     "lineItems": [
        //         {
        //             "amount": 412.34,
        //             "amountIsTaxInclusive": false,
        //             "taxAmount": 41.23,
        //             "taxRate": 10,
        //             "additionalTaxAmount": 0.66,
        //             "additionalTaxRate": 20,
        //             "discountAmount": 5.43,
        //             "discountRate": 10,
        //             "totalAmountIsTaxInclusive": true,
        //             "totalAmount": 413,
        //             "productCode": "25342",
        //             "description": "rind bacon",
        //             "quantity": 600,
        //             "unitOfMeasure": "kg",
        //             "unitPrice": 3.23,
        //             "consumptionDate": "2021-12-13"
        //         }
        //     ],
        //     "pax": {
        //         "name": "John smith",
        //         "origin": "Ohare Chicago USA",
        //         "ticketNumber": "RWW",
        //         "travelAgentInfo": "Flight Center",
        //         "legs": [
        //             {
        //                 "carrier": "Cathay Pacific",
        //                 "dateDepart": "2021-12-13",
        //                 "leg": "1",
        //                 "class": "First",
        //                 "fareBasis": "F",
        //                 "flightNumber": "JFK123",
        //                 "stopOverCode": "A"
        //             }
        //         ]
        //     }
        // });

        var data = JSON.stringify({
            "type": "purchase",
            "amount": "12.34",
            "currency": "NZD",
            "merchantReference": "1234ABC",
            "card": {
                "cardHolderName": "JOHN T DOE",
                "cardNumber": "4111111111111111",
                "dateExpiryMonth": "12",
                "dateExpiryYear": "26",
                "cvc2": "123"
            }
        })

        var config = {
            method: 'post',
            // maxBodyLength: Infinity,
            url: 'https://sec.windcave.com/api/v1/transactions',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Basic ABC123'
            }, 
            data: data
        };

        axios(config)
            .then(function (response) {
                console.log(JSON.stringify('result: ',response.data));
                let data = JSON.stringify(response.data)
                return responseMessage(res, 200, 1, 'succes', data)
            })
            .catch(function (error) {
                console.log(error);
                return responseMessage(res, 500, 0, 'Errror Occured', error)
            });

    }
    catch (error) {
        console.log(error)
        return responseMessage(res, 500, 0, 'Error Ocuured', null)
    }

}