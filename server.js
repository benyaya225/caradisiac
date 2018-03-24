const express = require('express');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    hosts: ['https://localhost:9200'],
    log: 'trace'
});
const { getBrands } = require('node-car-api');
const { getModels } = require('node-car-api');

var app = express();

function Brands() {
    return new Promise((resolve,reject)=>{
        getBrands()
        .then((brands)=>{
            return resolve(brands);
        })
        .catch((err)=>{return resolve("ERR")})
    })
}

function Models(brand) {
    return new Promise((resolve,reject)=>{
        getModels(brand)
        .then((models)=>{resolve(models)})
        .catch((err) => {resolve("ERR")})
    })
}

app.route("/populate").get(function (req, res) { 
                var brands = ["PEUGEOT","DACIA",];
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


    app.route("/cars").get(function (req, res) {
        
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



    app.listen(9292, 'localhost', function () {
        console.log("Connected");
    });