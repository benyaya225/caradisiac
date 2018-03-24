var jsonfile = require('jsonfile');
var fs = require('fs');
var readline = require('readline');
var elasticsearch = require('elasticsearch');

var file = 'package.json';

// Streaming the stock.json file
var models = jsonfile.readFileSync(file);

// connect to elasticsearch
var client = new elasticsearch.Client({
  host: 'localhost:9200',
  log: 'trace'
});
const { getBrands } = require('node-car-api');
const { getModels } = require('node-car-api');



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