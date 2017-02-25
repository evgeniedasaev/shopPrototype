var mongoose = require('mongoose');
var Promise = require('bluebird');
mongoose.Promise = Promise;
mongoose.connect('localhost:27017/shopping');

var Product = require('../models/product');
var Property = require('../models/property');
var PropertyValue = require('../models/property_value');

var mysql = require('promise-mysql');
var pool = mysql.createPool({
    host     : 'localhost',
    user     : 'root',
    password : 'djxj9TUY',
    database : 'interalliance_beta',
});

var promises = [], amount = 92800, chunkSize = 1000;
for (var i = 0; i < Math.ceil(amount/chunkSize); i++) {  
        var handleChunck = pool.query(
            `SELECT  
                goods_property_values.id, 
                goods_property_values.good_id,
                goods_property_values.goods_property_id,
                goods_property_values.goods_property_possible_value_id
            FROM    
                goods_property_values
            JOIN 
                goods ON 
                    goods_property_values.good_id = goods.id
            JOIN
                goods_types ON 
                    goods_types.id = goods.type_id
            WHERE 
                goods.is_published = 1
            GROUP BY 
                goods_property_values.id
            ORDER BY
                goods_property_values.good_id,
                goods_property_values.goods_property_id,
                goods_property_values.goods_property_possible_value_id
            LIMIT ?
            OFFSET ?;`, 
            [chunkSize, (chunkSize * i)]
        ).
        then(function (rows) {
            var propertyIds, propertyValueIds, productIds;

            propertyIds = rows.map(function(row) {
                return row.goods_property_id;
            });
            propertyValueIds = rows.map(function(row) {
                return row.goods_property_possible_value_id;
            });
            productIds = rows.map(function(row) {
                return row.good_id;
            });

            var prepare_data = [
                new Promise(function(resolve, reject){
                    resolve(rows);
                }),
                Property.find({_export_id: {$in: propertyIds}}).exec(),
                PropertyValue.find({_export_id: {$in: propertyValueIds}}).exec(),
                Product.find({_export_id: {$in: productIds}}).exec()
            ];

            return Promise.all(prepare_data);
        }).
        then(function(results) {
            var rows, properties, values, products, binds = [];

            rows = results[0];
            properties = results[1].reduce(function ( total, current ) {
                total[ current._export_id ] = current;
                return total;
            }, {});
            values = results[2].reduce(function ( total, current ) {
                total[ current._export_id ] = current;
                return total;
            }, {});
            products = results[3].reduce(function ( total, current ) {
                total[ current._export_id ] = current;
                return total;
            }, {});

            if (rows.length) {
                for (var j = 0; j < rows.length; j++) {
                    var row, product, property, value;
                    
                    row = rows[j];
                    product = products[row.good_id];
                    property = properties[row.goods_property_id];
                    value = values[row.goods_property_possible_value_id];

                    if (
                        typeof product === 'undefined' ||
                        typeof property === 'undefined' ||
                        typeof value === 'undefined'
                    ) continue;

                    // console.log(product._id, product.title, property.name, value.name);                    
                    binds.push({
                        product: product,
                        property: property,
                        value: value
                    });                    
                }  
            }
 
            return Promise.reduce(binds, function(propertiesInserted, bind) {
                return bind.product.addPropertyValue(bind.property, bind.value).
                then(function() {
                    return propertiesInserted++;
                }).
                catch(function(error){
                    console.log(error);
                });
            }, 0);
        }).
        catch(function(error){
            console.log(error);
        });

        promises.push(handleChunck);
}

Promise.all(promises).then(function(){
    console.log('finished');
    mongoose.disconnect();
    process.exit();  
});