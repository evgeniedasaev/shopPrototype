require('./seeder')(
    `SELECT goods.id, goods.name, goods.price, goods.description, goods.image150
     FROM goods
     JOIN goods_variants ON goods_variants.good_id = goods.id
     WHERE goods.is_published = 1
     GROUP BY goods.id;`, 
    function(exportItem, success) {
        var Product = require('../models/product');

        Product.findOrCreate({
            _export_id: exportItem.id
        }, {
            _export_id: exportItem.id,
            imagePath: "https://www.qpstol.ru/global_images/goods/" + exportItem.image150,
            title: exportItem.name,
            description: exportItem.description,
            price: exportItem.price
        }, function(err, property) {
            if (err) {
                console.log(err);
            }

            success(property);
        });
    }
);
