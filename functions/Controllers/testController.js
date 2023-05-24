var admin = require("firebase-admin");
const bcrypt = require('bcrypt');
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const { responseMessage } = require('../models/responseMessage');
const { upload } = require('../utils/UploadImage')
var bucket = admin.storage().bucket('user-management-api-888d4.appspot.com');
const Busboy = require('busboy');
const http = require('http');
const os = require("os");
const fs = require("fs");
var path = require('path')
const { v4: uuidv4 } = require('uuid');
const pdf = require('html-pdf');
const { options, func } = require("joi");
// const PDFDocument = require("pdfkit-table");
// const PDFDocument = require('pdfkit');
const { response } = require("express");
const PDFDocument = require('./pdfTables');
const { fontSize, image, font } = require("./pdfTables");
const { text } = require("body-parser");
// const { Buffer } = require("stream/consumers");
const Buffer = require('buffer')

exports.uploadImage = async (req, res) => {
    try {
        let { image, folderName } = req.body

        let link = upload(folderName, image)
        if (link === true) return responseMessage(res, 401, 0, 'Only png and jpeg files are supported', null)

        db.collection('Images').add({
            image: link,
            createdAt: FieldValue.serverTimestamp()
        })

        return responseMessage(res, 200, 1, 'Image uploaded Successfully', link)

    }
    catch (error) {
        console.log(error)
        return responseMessage(res, 200, 0, 'Error Occured', error.message)
    }
}

exports.htmlToPdf = async (req, res) => {
    try {
        if (req.method !== "POST") {
            // Return a "method not allowed" error
            return res.status(405).end();
        } else {
            try {
                console.log("file upload started");
                //   console.log("data : " + req.body.name);
                const busboy = Busboy({ headers: req.headers });
                let dataFileName;
                let fileTobeUploaded = {};
                let formData = {};
                busboy.on("field", (fieldname, val) => {
                    console.log(`Processed field ${fieldname}: ${val}.`);

                    formData = { ...formData, [fieldname]: val };
                    // console.log('formdata: ',formData)
                }
                );
                busboy.on("file", (name, file, info) => {
                    const { filename, encoding, mimeType } = info;
                    //my.image.png
                    // console.log('file:  ', file)

                    const fileExtension = filename.split(".")[filename.split(".").length - 1];
                    console.log('file extension is', fileExtension)
                    if (fileExtension != 'html') return responseMessage(res, 401, 0, 'Only HTMl Files are allowed', null)
                    // console.log('mimeType:    ', mimeType)
                    //12345678900.png
                    dataFileName = `${Math.round(
                        Math.random() * 100000000000
                    )}.${fileExtension}`;
                    const filepath = path.join(os.tmpdir(), dataFileName);
                    fileTobeUploaded = { filepath, mimeType };
                    file.pipe(fs.createWriteStream(filepath));
                });

                busboy.on("finish", () => {
                    // path where file will be uploaded
                    if (!formData.folderName) return responseMessage(res, 401, 0, 'folderName is required!', null)
                    let key = formData.folderName
                    var randomfilename = uuidv4();
                    let filetypetmp = 'pdf'
                    const uploadTo = 'PDF' + "/" + key + "/" + randomfilename + "." + filetypetmp; // add the destination path
                    req.body = formData;
                    // console.log('file', file)


                    // convert html file into pdf
                    let htmlFilePath = `${fileTobeUploaded.filepath}`
                    if (htmlFilePath === 'undefined') return responseMessage(res, 401, 0, 'Please select file to be upload', null)
                    var data = ''
                    var options = { format: 'Letter' };
                    console.log('htmlFilePath', htmlFilePath)
                    const html = fs.createReadStream(htmlFilePath)
                    html.setEncoding('UTF8');
                    html.on('data', function (chunk) {
                        data += chunk;
                    });

                    html.on('end', function () {

                        pdf.create(data, options).toStream(function (err, stream) {
                            if (err) {
                                console.log(err);
                                res.status(500).send("Some kind of error...");
                                return;
                            }
                            const contenttype = "pdf/" + '.pdf'

                            // stream.pipe(res)
                            const file = bucket.file(uploadTo)
                            stream.pipe(file.createWriteStream({
                                public: true,
                                metadata: {
                                    metadata: {
                                        contentType: contenttype,
                                        firebaseStorageDownloadTokens: uuidv4(),
                                        cacheControl: "public, max-age=3000"
                                    }
                                },
                            }))
                                .on('error', function (err) {
                                    console.log(err)
                                })
                                .on('finish', function (finish) {
                                    console.log('succees')
                                    fs.unlinkSync(htmlFilePath)
                                })
                        })
                        let link = `http://storage.googleapis.com/user-management-api-888d4.appspot.com/${encodeURIComponent(uploadTo)}`
                        db.collection('uploads').add({
                            uploadItemUrl: link,
                            createdAt: FieldValue.serverTimestamp()
                        })
                        return responseMessage(res, 200, 1, 'Files uploaded Successfully', link)
                    });

                    html.on('error', function (err) {
                        console.log(err.stack);
                    });
                    // console.log('html', html)



                });
                busboy.end(req.rawBody);
            } catch (error) {
                console.log(error);
            }
        }

    }
    catch (error) {
        console.log(error)
        return responseMessage(res, 400, 0, 'Error Occured', error.message)
    }
}


exports.pdf = async (req, res) => {
    try {
        const doc = new PDFDocument();
        doc.pipe(fs.createWriteStream("./document1.pdf"));
        (async function () {
            // table
            const table = {
                // { label: 'Title', fontSize: 30, color: 'blue', fontFamily: "./fonts/type.ttf" }
                // { label: 'Title', fontSize: 30, color: 'blue', fontFamily: "./fonts/type.ttf" },
                subtitle: "Name: Muhammad Umer",
                subtitle1: "Email: Umer@gamil.com",
                headers: [
                    { label: "Blood-Pressure", property: 'BP', width: 100, headerColor: 'gray', renderer: null },
                    { label: "Readings", property: 'Readings', width: 80, headerColor: 'gray', renderer: null },
                    { label: "Date", property: 'date', width: 140, headerColor: 'gray', renderer: null },
                    { label: "Time", property: 'time', width: 120, headerColor: 'gray', renderer: null }
                ],
                // complex data
                datas: [
                    {
                        BP: '            1',
                        Readings: '  80/120',
                        date: '23 Janurary 2023',
                        time: '02:45 PM',
                    },
                    {
                        BP: '            2',
                        Readings: '  80/120',
                        date: '23 Janurary 2023',
                        time: '02:45 PM',
                    },
                    {
                        BP: '            3',
                        Readings: '  80/120',
                        date: '23 Janurary 2023',
                        time: '02:45 PM',
                    },
                    {
                        BP: '            4',
                        Readings: '  80/120',
                        date: '23 Janurary 2023',
                        time: '02:45 PM',
                    },
                    {
                        BP: '            5',
                        Readings: '  80/120',
                        date: '23 Janurary 2023',
                        time: '02:45 PM',
                    },
                    // { 
                    //   options: { fontSize: 10, separation: true},
                    //   BP: 'bold:BP 2', 
                    //   description: 'bold:Lorem ipsum dolor.', 
                    //   date: 'bold:23 Janurary 2023', 
                    // //   price3: { 
                    // //     label: 'PRICE $3', options: { fontSize: 12 } 
                    // //   }, 
                    //   time: '02:45 PM', 
                    // //   price4: '4', 
                    // },
                ]
            };
            const options = {
                // properties
                title: { label: 'Vital Reports', fontSize: 30, color: 'balck' },
                subtitle: { label: 'subtitle', fontSize: 10, color: 'black' },
                subtitle1: { label: 'subtitle1', fontSize: 10, color: 'black' },
                // width: 500, // {Number} default: undefined // A4 595.28 x 841.89 (portrait) (about width sizes)
                // x: 0, // {Number} default: undefined | To reset x position set "x: null"
                // y: 0, // {Number} default: undefined | 
                // divider: {
                //   header: { disabled: false, width: 2, opacity: 1 },
                //   horizontal: { disabled: false, width: 0.5, opacity: 0.5 },
                // },
                padding: 5, // {Number} default: 0
                columnSpacing: 5, // {Number} default: 5
                hideHeader: false,
                headerAlign,
                // minRowHeight: 0,
                // functions
                prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10), // {Function} 
                prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => {
                    doc.font("Helvetica").fontSize(10);
                    indexColumn === 0 && doc.addBackground(rectRow, 'white', 0.15);


                }
            }

            doc.table(table, options)
            doc.end();
        })();

        return responseMessage(res, 200, 1, 'PDF created successfully.', null)


    }
    catch (error) {
        console.log(error)
        return responseMessage(res, 400, 0, 'Error Occured', error.message)
    }
}



exports.pdfTable = async (req, res) => {
    try {
        const doc = new PDFDocument({ size: [850, 800] });
        // doc.size([500, 2000])
        doc.pipe(res)

        // doc.page()
        const title = 'Vital Report'
        doc.image('blood.jpg', 643, 70, { fit: [120, 120] })                    
        // doc.image('blood.jpg', 0, 15, { width: 300 })
            // .text('Proportional to width', 0, 0);


        doc.fontSize(30).fillColor('red').text(`${title}`.slice(0, 12), {
            // width: 410,
            // height: 400,
            align: 'justify',
            // lineBreak: false,
            continued: true
            // fontSize: '20'
            // underline: `${title}`,
            // wordSpacing: 2
        }).fontSize(14).fillColor('black').text(title.slice(13))
        doc.moveDown(3)
        const name = 'Name: Umer Swati'
        doc.text(`${name}`, {
            // width: 450,
            // height: 100,
            align: 'justify',
            // lineBreak: false,
            // underline: `${title}`,
        })
        doc.moveDown(1)
        const email = 'E-mail: UmerSwati@gmail.com'
        doc.text(`${email}`, {
            // width: 410,
            // height: 400,
            align: 'justify',
            // lineBreak: false,
            // underline: `${email}`,
        })
        doc.moveDown(1)
        const bp = 'Blood-Pressure'
        doc.font('Helvetica-Bold').text(`${bp}`, {
            // width: 410,
            // height: 400,
            align: 'justify',
            // lineBreak: false,
            // underline: `${email}`,
        })
        doc.moveDown(1)
        const headerFont = 'Helvetica-Bold'

        const table0 = {

            headers: ['Count', 'Readings', 'Date', 'Time'],
            rows: [
                ['1', '70/185', '24 Jan 2023', '02:25 AM'],
                ['3', '60/120', '23 Jan 2023', '09:25 AM'],
                ['4', '60/120', '23 Jan 2023', '09:25 AM'],
                ['5', '60/120', '23 Jan 2023', '09:25 AM'],
                ['6', '60/120', '23 Jan 2023', '09:25 AM'],
                ['7', '60/120', '23 Jan 2023', '09:25 AM'],
                ['8', '60/120', '23 Jan 2023', '09:25 AM'],
                ['9', '60/120', '23 Jan 2023', '09:25 AM'],
                ['10', '60/120', '23 Jan 2023', '09:25 AM'],
                ['11', '60/120', '23 Jan 2023', '09:25 AM'],
                ['12', '60/120', '23 Jan 2023', '09:25 AM'],
                ['13', '60/120', '23 Jan 2023', '09:25 AM'],
                ['14', '60/120', '23 Jan 2023', '09:25 AM'],
                ['15', '60/120', '23 Jan 2023', '09:25 AM'],
                ['16', '60/120', '23 Jan 2023', '09:25 AM'],
                ['17', '60/120', '23 Jan 2023', '09:25 AM'],
                ['18', '60/120', '23 Jan 2023', '09:25 AM'],
                ['19', '60/120', '23 Jan 2023', '09:25 AM'],
                ['20', '60/120', '23 Jan 2023', '09:25 AM']
                // ['2', 'Smells like funny', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla viverra at ligula gravida ultrices. Fusce vitae pulvinar magna.']
            ]
    };

        doc.table(table0, {
            // headers: [ {font : headerFont }],
            prepareHeader: () => { doc.font('Helvetica').fontSize(12) },
            prepareRow: (row, i) => { doc.font('Times-Roman').fontSize(12) }
        });

        // const table1 = {
        //     headers: ['Country', 'Conversion rate', 'Trend'],
        //     rows: [
        //         ['Switzerland', '12%', '+1.12%'],
        //         ['France', '67%', '-0.98%'],
        //         ['England', '33%', '+4.44%']
        //     ]
        // };

        // doc.moveDown().table(table1, 100, 350, { width: 300 });        

        doc.end()


        // res.status(200).send(response)
        // responseMessage(res, 200, 1, 'PDF created successfully.', null)


    }
    catch (error) {
        console.log(error)
        return responseMessage(res, 400, 0, 'Error Occured', error.message)
    }
}


