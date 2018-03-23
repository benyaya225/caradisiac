const express = require('express');
const bodyParser = require('body-parser');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    hosts: 'https://localhost:9200',
    log: 'trace'
});
const { getBrands } = require('node-car-api');
const { getModels } = require('node-car-api');

const app = express();
var router = express.Router();


router.get('/populate', function (req, res, next) {
    async function getModel() {

        const brands = await getBrands();
        brands.forEach(async brand => {
            var bulkFile = [];
            const models = await getModels(brand);
            models.forEach(model => {
                var line = { brand: model.brand, model: model.model, volume: model.volume, uuid: model.uuid, name: model.name };
                var index = { index: { _index: 'models', _type: 'model', _id: model.uuid } };
                bulkFile.push(index);
                bulkFile.push(line);
            });
            //console.log(bulk);
        
            client.bulk({
                body: bulkFile
            }, function (error, response) {
                if (error) {
                    console.error(error);
                    return;
                }
                else {
                    console.log("i" + response);
                }
            });

        })
    }
})

app.listen(9292, 'localhost', function () {
    console.log("connected");
});


