require('./seeder')(
    `SELECT id, 
            good_id,
            code,
            name
    FROM    goods_attributes;`, 
    function(exportItem, success) {
        var Product = require('../models/product');
        var ProductAttribute = require('../models/product_attribute');

        Product.findOne({_export_id: exportItem.good_id}, function(err, product) {
            if (err) {
                console.log(err);
            }

            if (product) {
                ProductVariant.findOrCreate({
                    _export_id: exportItem.id
                }, {
                    _export_id: exportItem.id,
                    product: product,
                    name: exportItem.name,
                    price: exportItem.price
                }, function(err, value) {
                    if (err) {
                        console.log(err);
                    }

                    success(value);
                });
            }       
        });
    }
);
