require('./seeder')(
    `SELECT id, name, code 
     FROM goods_properties 
     WHERE for_interior = 0;`, 
    function(exportItem, success) {
        var Property = require('../models/property');

        Property.findOrCreate({
            _export_id: exportItem.id
        }, {
            _export_id: exportItem.id,
            name: exportItem.name,
            code: exportItem.code
        }, function(err, property) {
            if (err) {
                console.log(err);
            }

            success(property);
        });
    }
);
