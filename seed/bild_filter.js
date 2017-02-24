var mongoose = require('mongoose');
var Promise = require('bluebird');

mongoose.connect('localhost:27017/shopping');
mongoose.Promise = Promise;

var Product = require('../models/product');
var Catalog = require('../models/catalog');

Product.find({}).populate('catalog').exec().
then(function(products) {
    return Promise.reduce(products, function(updated, product) {
        if (product.catalog === null) {
            return Promise.resolve("No catalog");
        }

        return product.catalog.buildFilter(product).
        then(function() {
            return updated++;
        }).
        catch(function(error){
            console.log(error);
        });
    }, 0);
}).then(function(){
    console.log('finished');
    mongoose.disconnect();
    process.exit();  
}).
catch(function(error){
    console.log(error);
});