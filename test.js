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

getModel();