
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
//qr
const Jimp = require("jimp");
const qrCode = require('qrcode-reader');

const { MultiFormatReader, BarcodeFormat, DecodeHintType, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } = require('@zxing/library');
const jpeg = require('jpeg-js');

const javascriptBarcodeReader = require('javascript-barcode-reader');
const Quagga = require('quagga').default;

var fs = require('fs');

var path = require('path');
const { Storage } = require('@google-cloud/storage');
var stream = require('stream');
require('dotenv').config();

const app = express();


app.use(cors());
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb' }));
// app.use(express.bodyParser({ limit: '50mb' }));
// app.use(bodyParser.json({ limit: '100mb' }));
// app.use(bodyParser.urlencoded({ extended: true, limit: '100mb' }));
const port = process.env.PORT || 6600;




// Imports the Google Cloud client library.
const vision = require('@google-cloud/vision');
const CREDENTIALS = JSON.parse(process.env.VISION_AI_SERVICE);

const CONFIG = {
    credentials: {
        private_key: CREDENTIALS.private_key,
        client_email: CREDENTIALS.client_email
    }
};

const client = new vision.ImageAnnotatorClient(CONFIG);

const productClient = new vision.ProductSearchClient(CONFIG);

const gcs = new Storage({
    // keyFilename: path.join(__dirname, "/deft-striker-serviceMailKey.json"),
    // keyFilename: process.env.VISION_AI_SERVICE,
    credentials: {
        private_key: CREDENTIALS.private_key,
        client_email: CREDENTIALS.client_email
    },
    project_id: "deft-striker-354916"
});

// gcs.getBuckets().then(x => console.log(x));

app.get('/', (req, res) => {
    res.send('Hello World node js.. atlast rupom yo yo!');
});

app.get('/vision', (req, res) => {

    const img_path = req.query.path;

    if (img_path) {
        const detailsOfImg = async (path_img) => {
            const request = {
                // image: {
                //     content: path_img
                // },
                image: {
                    source: {
                        filename: path_img,
                        // imageUri: path_img,
                    },
                },
                features: [
                    {
                        maxResults: 01,
                        type: "LANDMARK_DETECTION"
                    },
                    {
                        maxResults: 10,
                        type: "OBJECT_LOCALIZATION"
                    },
                    {
                        maxResults: 01,
                        type: "TEXT_DETECTION"
                    },
                    {
                        maxResults: 01,
                        type: "LOGO_DETECTION"
                    },
                    {
                        maxResults: 01,
                        type: "LABEL_DETECTION"
                    },
                    {
                        maxResults: 03,
                        type: "FACE_DETECTION"
                    },
                ]
            };

            const [resultNew] = await client.annotateImage(request);
            console.log(resultNew);

            const imgDetails = [
                {
                    object: resultNew?.localizedObjectAnnotations[0]?.name,
                    text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
                    brand: resultNew?.logoAnnotations[0]?.description,
                    landName: resultNew?.landmarkAnnotations[0]?.description
                }
            ]
            console.log(imgDetails);
            res.send(imgDetails);
        }
        detailsOfImg(img_path);
    }
    else {
        res.send("vision");
    }
});


app.post('/vision', (req, res) => {

    const img_path = req.body.pic;

    const detailsOfImg = async (path_img) => {
        const request = {
            image: {
                content: path_img
            },
            // image: {
            //     source: {
            //         // filename: path_img,
            //         imageUri: path_img,
            //     },
            // },
            features: [
                {
                    maxResults: 01,
                    type: "LANDMARK_DETECTION"
                },
                {
                    maxResults: 01,
                    type: "OBJECT_LOCALIZATION"
                },
                {
                    maxResults: 01,
                    type: "TEXT_DETECTION"
                },
                {
                    maxResults: 01,
                    type: "LOGO_DETECTION"
                },
                {
                    maxResults: 01,
                    type: "LABEL_DETECTION"
                },
                {
                    maxResults: 03,
                    type: "FACE_DETECTION"
                },
            ]
        };

        const [resultNew] = await client.annotateImage(request);
        console.log(resultNew);


        //qr reader........................
        if (resultNew?.localizedObjectAnnotations[0]?.name == '2D barcode') {

            // //Zxing lib for qr code
            // const buffer = Buffer.from(path_img, "base64");
            // fs.writeFileSync("qrtemp.jpg", buffer);
            // var filePath = 'qrtemp.jpg';

            // // // library for bar code reader named ZXING(same code diye qr code o read hoy lol)
            // try {
            //     const jpegData = fs.readFileSync('qrtemp.jpg');
            //     const rawImageData = jpeg.decode(jpegData);

            //     const hints = new Map();
            //     const formats = [BarcodeFormat.QR_CODE];

            //     hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
            //     hints.set(DecodeHintType.TRY_HARDER, true);

            //     const reader = new MultiFormatReader();

            //     reader.setHints(hints);

            //     const len = rawImageData.width * rawImageData.height;

            //     const luminancesUint8Array = new Uint8Array(len);

            //     for (let i = 0; i < len; i++) {
            //         luminancesUint8Array[i] = ((rawImageData.data[i * 4] + rawImageData.data[i * 4 + 1] * 2 + rawImageData.data[i * 4 + 2]) / 4) & 0xFF;
            //     }

            //     const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, rawImageData.width, rawImageData.height);

            //     // console.log(luminanceSource);

            //     const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

            //     const decoded = reader.decode(binaryBitmap);

            //     console.log(decoded.text);

            //     const imgDetails = [
            //         {
            //             object: resultNew?.localizedObjectAnnotations[0]?.name,
            //             text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
            //             brand: resultNew?.logoAnnotations[0]?.description,
            //             landName: resultNew?.landmarkAnnotations[0]?.description,
            //             qrcode: decoded.text
            //         }
            //     ]
            //     console.log(imgDetails);
            //     res.send(imgDetails);

            // }
            // catch (err) {
            //     const imgDetails = [
            //         {
            //             object: resultNew?.localizedObjectAnnotations[0]?.name,
            //             text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
            //             brand: resultNew?.logoAnnotations[0]?.description,
            //             landName: resultNew?.landmarkAnnotations[0]?.description,
            //             qrcode: err
            //         }
            //     ]
            //     console.log(imgDetails);
            //     res.send(imgDetails);
            // }

            // jimp lib for qr code

            const buffer = Buffer.from(path_img, "base64");
            fs.writeFileSync("qrtemp.jpg", buffer);
            var filePath = 'qrtemp.jpg';
            try {
                const img = await Jimp.read(fs.readFileSync(filePath));
                // console.log("see here rupom, oder buffer")
                // console.log(img);
                const qr = new qrCode();
                const value = await new Promise((resolve, reject) => {
                    qr.callback = (err, v) => err != null ? reject(err) : resolve(v);
                    qr.decode(img.bitmap);
                });
                // return value.result;
                // resQr = value.result;
                const imgDetails = [
                    {
                        object: resultNew?.localizedObjectAnnotations[0]?.name,
                        // text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
                        brand: resultNew?.logoAnnotations[0]?.description,
                        landName: resultNew?.landmarkAnnotations[0]?.description,
                        qrcode: value.result
                    }
                ]
                console.log(imgDetails);
                res.send(imgDetails);

            }
            catch (error) {
                const imgDetails = [
                    {
                        object: resultNew?.localizedObjectAnnotations[0]?.name,
                        // text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
                        brand: resultNew?.logoAnnotations[0]?.description,
                        landName: resultNew?.landmarkAnnotations[0]?.description,
                        qrcode: error
                    }
                ]
                console.log(imgDetails);
                res.send(imgDetails);
            }

        }
        //bar reader........................
        else if (resultNew?.localizedObjectAnnotations[0]?.name == '1D barcode') {
            const buffer = Buffer.from(path_img, "base64");
            fs.writeFileSync("bartemp.jpg", buffer);
            var filePath = 'bartemp.jpg';
            // library for bar code reader named ZXING(same code diye qr code o read hoy lol)
            try {
                const jpegData = fs.readFileSync('bartemp.jpg');
                const rawImageData = jpeg.decode(jpegData);

                const hints = new Map();
                const formats = [BarcodeFormat.DATA_MATRIX];

                hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
                hints.set(DecodeHintType.TRY_HARDER, true);

                const reader = new MultiFormatReader();

                reader.setHints(hints);

                const len = rawImageData.width * rawImageData.height;

                const luminancesUint8Array = new Uint8Array(len);

                for (let i = 0; i < len; i++) {
                    luminancesUint8Array[i] = ((rawImageData.data[i * 4] + rawImageData.data[i * 4 + 1] * 2 + rawImageData.data[i * 4 + 2]) / 4) & 0xFF;
                }

                const luminanceSource = new RGBLuminanceSource(luminancesUint8Array, rawImageData.width, rawImageData.height);

                // console.log(luminanceSource);

                const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

                const decoded = reader.decode(binaryBitmap);

                console.log(decoded.text);

                const imgDetails = [
                    {
                        object: resultNew?.localizedObjectAnnotations[0]?.name,
                        // text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
                        brand: resultNew?.logoAnnotations[0]?.description,
                        landName: resultNew?.landmarkAnnotations[0]?.description,
                        barcode: decoded.text
                    }
                ]
                console.log(imgDetails);
                res.send(imgDetails);

            }
            catch (err) {
                const imgDetails = [
                    {
                        object: resultNew?.localizedObjectAnnotations[0]?.name,
                        // text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
                        brand: resultNew?.logoAnnotations[0]?.description,
                        landName: resultNew?.landmarkAnnotations[0]?.description,
                        barcode: err
                    }
                ]
                console.log(imgDetails);
                res.send(imgDetails);
            }

            //another library for bar code reader named javascriptBarcodeReader
            // const buffer = Buffer.from(path_img, "base64");
            // fs.writeFileSync("qrtemp.jpg", buffer);
            // var filePath = 'qrtemp.jpg';

            // javascriptBarcodeReader({
            //     /* Image file Path || {data: Uint8ClampedArray, width, height} || HTML5 Canvas ImageData */
            //     image: filePath,
            //     barcode: 'code-39',
            //     barcodeType: 'industrial',
            //     options: {
            //         useAdaptiveThreshold: true, // for images with sahded portions
            //         singlePass: true
            //     }
            // })
            //     .then(code => {
            //         console.log(code);
            //         const imgDetails = [
            //             {
            //                 object: resultNew?.localizedObjectAnnotations[0]?.name,
            //                 text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
            //                 brand: resultNew?.logoAnnotations[0]?.description,
            //                 landName: resultNew?.landmarkAnnotations[0]?.description,
            //                 barcode: code
            //             }
            //         ]
            //         console.log(imgDetails);
            //         res.send(imgDetails);

            //     })
            //     .catch(err => {
            //         console.log(err);
            //         const imgDetails = [
            //             {
            //                 object: resultNew?.localizedObjectAnnotations[0]?.name,
            //                 text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
            //                 brand: resultNew?.logoAnnotations[0]?.description,
            //                 landName: resultNew?.landmarkAnnotations[0]?.description,
            //                 barcode: 'unstable/blurry, cant read'
            //             }
            //         ]
            //         console.log(imgDetails);
            //         res.send(imgDetails);
            //     })

            //another library for bar code reader named Quagga
            // Quagga.decodeSingle({
            //     src: "qrtemp.jpg",
            //     numOfWorkers: 0,  // Needs to be 0 when used within node
            //     locate: true,
            //     inputStream: {
            //         size: 800  // restrict input-size to be 800px in width (long-side)
            //     },
            //     decoder: {
            //         readers: ["code_39_reader"] // List of active readers
            //     },
            // }, function (result) {
            //     if (result?.codeResult) {
            //         console.log("result", result.codeResult.code);
            //         const imgDetails = [
            //             {
            //                 object: resultNew?.localizedObjectAnnotations[0]?.name,
            //                 text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
            //                 brand: resultNew?.logoAnnotations[0]?.description,
            //                 landName: resultNew?.landmarkAnnotations[0]?.description,
            //                 barcode: result.codeResult.code
            //             }
            //         ]
            //         console.log(imgDetails);
            //         res.send(imgDetails);

            //     } else {
            //         console.log("not detected");
            //         const imgDetails = [
            //             {
            //                 object: resultNew?.localizedObjectAnnotations[0]?.name,
            //                 text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
            //                 brand: resultNew?.logoAnnotations[0]?.description,
            //                 landName: resultNew?.landmarkAnnotations[0]?.description,
            //                 barcode: "not detected"
            //             }
            //         ]
            //         console.log(imgDetails);
            //         res.send(imgDetails);
            //     }
            // });

        }
        // kinda onno kono object name hoile, image search or text reader
        else {

            const projectId = 'deft-striker-354916';
            const location = 'us-east1';
            const productSetId = 'highlights_1996';
            const productCategory = 'packagedgoods-v1';

            const filter = '';
            const productSetPath = productClient.productSetPath(
                projectId,
                location,
                productSetId
            );

            const request = {

                image: { content: path_img },
                features: [{ type: 'PRODUCT_SEARCH' }],
                imageContext: {
                    productSearchParams: {
                        productSet: productSetPath,
                        productCategories: [productCategory],
                        filter: filter,
                    },
                },
            };
            const [response] = await client.batchAnnotateImages({
                requests: [request],
            });
            console.log('Searching b64 Image');
            console.log(response['responses'][0]['productSearchResults']);
            // console.log()
            var imgSearchScore = 0;
            try {
                imgSearchScore = response['responses'][0]['productSearchResults']['results'][0]['score'];
            }
            catch (e) {
                imgSearchScore = 0;
            }



            console.log(imgSearchScore);

            // if (response['responses'][0]['productSearchResults'] || (response['responses'][0]['productSearchResults']['results'][0]['score']) < 0.4) {
            if (imgSearchScore < 0.6) {
                //only text read and return
                console.log("product result 0.6 er niche or khali")

                const imgDetails = [
                    {
                        object: resultNew?.localizedObjectAnnotations[0]?.name,
                        text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
                        brand: resultNew?.logoAnnotations[0]?.description,
                        landName: resultNew?.landmarkAnnotations[0]?.description,

                    }
                ]
                console.log(imgDetails);
                res.send(imgDetails);
            }
            else {
                //image search and return productName & id
                console.log("product paise")

                const searchResultsImg = response['responses'][0]['productSearchResults']['results'];
                const imgDetails = [
                    {
                        object: resultNew?.localizedObjectAnnotations[0]?.name,
                        text: (resultNew?.fullTextAnnotation?.text)?.replace("\n", " "),
                        brand: resultNew?.logoAnnotations[0]?.description,
                        landName: resultNew?.landmarkAnnotations[0]?.description,
                        productId: searchResultsImg[0]['product'].name.split('/').pop(-1),
                        productName: searchResultsImg[0]['product'].displayName,
                        resImgName: `${searchResultsImg[0]['image'].split('/').pop(-1)}.jpg`,
                        imgLink: `https://storage.googleapis.com/products_higlights2/${searchResultsImg[0]['image'].split('/').pop(-1)}.jpg`,
                        score: imgSearchScore
                    }
                ]
                console.log(imgDetails);
                res.send(imgDetails);
            }

        }

    }

    detailsOfImg(img_path);
});



app.post('/createProduct', (req, res) => {

    const refImgArray = req.body.picArray;
    const prodName = req.body.prodName;
    const prodId = req.body.prodId;
    // console.log("array");
    // console.log(refImgArray);
    // console.log("prodName");
    // console.log(prodName);
    // console.log("prodId");
    // console.log(prodId);

    const createImgSearchProduct = async (refImgArray, prodName, prodId) => {

        try {

            const projectId = 'deft-striker-354916';
            const location = 'us-east1';
            const productCategory = 'packagedgoods-v1'; //...........,,, shob product Catagory amra eki rakhbo
            const productSetId = 'highlights_1996';
            const productId = prodId;
            const productDisplayName = prodName;
            const myBucket = gcs.bucket('products_higlights2');

            /////////Creating a product,,,, ..........................................................!!!!!!!!!!!

            const locationPath = productClient.locationPath(projectId, location);
            const product = {
                displayName: productDisplayName,
                productCategory: productCategory,
            };
            const prodNewRequest = {
                parent: locationPath,
                product: product,
                productId: productId,
            };
            const [createdProduct] = await productClient.createProduct(prodNewRequest);
            console.log(`Product created, name: ${createdProduct.name}`);

            // Adding that product to the product set(highlights_1996)............................... !!!!!!!!!!!
            const productPath = productClient.productPath(projectId, location, productId);
            const productSetPath = productClient.productSetPath(
                projectId,
                location,
                productSetId
            );
            const prodToProdsetRequest = {
                name: productSetPath,
                product: productPath,
            };
            await productClient.addProductToProductSet(prodToProdsetRequest);
            console.log('Product added to product set.');


            for (let i = 0; i < refImgArray.length; i++) {

                //uploading image to google storage bucket...............................................!!!!!!!!!!!!!!!!!!!!!

                var bufferStream = new stream.PassThrough();
                // var b64Img = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
                var b64Img = refImgArray[i];
                bufferStream.end(Buffer.from(b64Img, 'base64'));

                var file = myBucket.file(`${productId}_${i + 1}.jpg`);
                //Pipe the 'bufferStream' into a 'file.createWriteStream' method.
                bufferStream.pipe(file.createWriteStream({
                    metadata: {
                        contentType: 'image/jpeg',
                        metadata: {
                            custom: 'metadata'
                        }
                    },
                    public: true,
                    validation: "md5"
                }))
                    .on('error', function (err) {
                        console.log(err);
                        res.send({ mssg: err });
                    })
                    .on('finish', async function () {
                        // The file upload is complete.
                        console.log(`file uploaded- ${productId}_${i + 1}.jpg`);

                        //adding images of that product(that type of product should be already in a product set), which is called Reference image -_- !!!!!!!!!!!!!!!!!!!!!!!!!!!

                        const referenceImageId = `${productId}_${i + 1}`;
                        const gcsUri = `gs://products_higlights2/${productId}_${i + 1}.jpg`; //eikhane ekta kaaj korte hobe,, nodejs e image upload dite hobe google cloud bucket e, then upload houar por response pathabe gscUri of that image
                        const formattedParent = productClient.productPath(projectId, location, productId);

                        const referenceImage = {
                            uri: gcsUri,
                        };
                        const refImgCreateRequest = {
                            parent: formattedParent,
                            referenceImage: referenceImage,
                            referenceImageId: referenceImageId,
                        };
                        const [response] = await productClient.createReferenceImage(refImgCreateRequest);
                        console.log(`response.name: ${response.name}`);
                        console.log(`response.uri: ${response.uri}`);
                        console.log(`successfully added all image as reference image`);

                    });


            }
            res.send({ mssg: "success" });


        }
        catch (err) {
            res.send({ mssg: err });
        }


    }

    // createImgSearchProduct(refImgArray, prodName, prodId);
    createImgSearchProduct(refImgArray, prodName, prodId);
})





app.get('/qr', (req, res) => {

    var Quaggar = require('quagga');

    Quaggar.decodeSingle({
        src: "rupom_bar39.jpg",
        locate: true,
        numOfWorkers: 0,  // Needs to be 0 when used within node
        inputStream: {
            size: 1000  // restrict input-size to be 800px in width (long-side)
        },
        frequency: 10,
        decoder: {
            readers: ["code_39_reader"] // List of active readers
        },
        debug: false,
    }, function (result) {
        if (result.codeResult) {
            console.log("result", result.codeResult.code);
        } else {
            console.log("not detected");
        }
    });



});




app.listen(port, () => {
    console.log(`listening on port`, port);
})
