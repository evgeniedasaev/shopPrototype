require('./seeder')(
    `SELECT id, 
            good_id,
            name,
            price
    FROM    goods_variants;`, 
    function(exportItem, success) {
        var Product = require('../models/product');
        var ProductVariant = require('../models/product_variant');

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
