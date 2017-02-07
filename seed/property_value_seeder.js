require('./seeder')(
    `SELECT id, 
            goods_property_id, 
            name, 
            permalink
    FROM    goods_property_possible_values;`, 
    function(exportItem, success) {
        var Property = require('../models/property');
        var PropertyValue = require('../models/property_value');

        Property.findOne({_export_id: exportItem.goods_property_id}, function(err, property) {
            if (err) {
                console.log(err);
            }

            if (property) {
                PropertyValue.findOrCreate({
                    _export_id: exportItem.id
                }, {
                    _export_id: exportItem.id,
                    property: property,
                    name: exportItem.name,
                    code: exportItem.permalink
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
