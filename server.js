const express = require('express');
var app = express();
var router = express.Router();  

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    hosts: ['https://localhost:9200'],
    log: 'trace'
});
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const { getBrands } = require('node-car-api');
const { getModels } = require('node-car-api');

var port = process.env.PORT || 9292;




router.get('/',function (req, res) {
    res.json({ message: 'Connected to the api!' });
});

function Brands() {
    return new Promise((resolve, reject) => {
        getBrands()
            .then((brands) => {
                return resolve(brands);
            })
            .catch((err) => { return resolve("ERR") })
    })
}

function Models(brand) {
    return new Promise((resolve, reject) => {
        getModels(brand)
            .then((models) => { resolve(models) })
            .catch((err) => { resolve("ERR") })
    })
}

router.get('/populate',function (req, res) {//Endpoint api/Populate
    var brands = ["PEUGEOT", "DACIA",];
    const requests = brands.map(brand => Models(brand))
    Promise.all(requests)
        .then(results => {
            var models = [].concat.apply([], results)
            var fileToBulk = [];
            models.forEach(model => {
                if (model != "ERR") {
                    fileToBulk.push({ index: { _index: 'models', _type: 'model', _id: model.uuid } })
                    fileToBulk.push(model)
                }
            });
            client.bulk({
                body: fileToBulk
            }, (err, resp) => {
                if (err) res.send(err)
                else {
                    client.indices.putMapping({
                        index: "models",
                        type: "model",
                        body: {
                            "properties": {
                                "volume": {
                                    "type": "text",
                                    "fielddata": true
                                }
                            }
                        }
                    }).then((result) => {
                        res.send(resp);
                    })
                        .catch((err) => {
                            console.log(err)
                            res.send(err)
                        })

                }
            })
        })
        .catch(err => {
            console.log("Error in promise all")
            console.log(err)
        })
})


router.get('/cars',function (req, res) {

    client.search({
        index: "models",
        type: "model",
        body: {
            "sort": [
                {
                    "volume": { "order": "desc" }
                }
            ]
        }
    }, (err, resp) => {
        res.send(resp)
    });
})

app.use('/api', router);

app.listen(port, 'localhost', function () {
    console.log("Connected on "+port);
});