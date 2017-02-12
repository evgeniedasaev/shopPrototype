require('./seeder')(
    `SELECT goods.id, goods.name, goods.price, goods.description, goods.image150, goods.type_id
     FROM goods
     JOIN goods_types ON goods_types.id = goods.type_id
     WHERE goods.is_published = 1
     GROUP BY goods.id;`, 
    function(exportItem, success) {
        var Product = require('../models/product');
        var Catalog = require('../models/catalog');

        Product.findOneAndUpdate({_export_id: exportItem.id}, {
            _export_id: exportItem.id,
            imagePath: "https://www.qpstol.ru/global_images/goods/" + exportItem.image150,
            title: exportItem.name,
            description: exportItem.description,
            price: exportItem.price
        }, { upsert: true, new: true, setDefaultsOnInsert: true }, function(err, product) {
            if (err) {
                console.log(err);
            }

            Catalog.findOne({_export_id: exportItem.type_id}, function(err, catalog) {
                if (err) {
                    console.log(err);
                }

                if (catalog) {
                    product.catalog = catalog._id;
                }                

                product.save(function(error) {
                    if (error) {
                        console.log(error);
                        return;
                    }
                }); 
            });
        });
    }
);
