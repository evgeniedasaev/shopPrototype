require('./seeder')(
    `SELECT     goods_types.id, 
                goods_types.parent_id,
                goods_types.name,
                goods_types.permalink
    FROM        goods_types
    GROUP BY 	goods_types.id
    ORDER BY    nesting ASC, parent_id ASC;`, 
    function(exportItem, success) {
        var Catalog = require('../models/catalog');

        return Promise.all([
            Catalog.findOneAndUpdate({_export_id: exportItem.id}, {
                    _export_id: exportItem.id,
                    name: exportItem.name,
                    code: exportItem.permalink
            }, { upsert: true, new: true, setDefaultsOnInsert: true }).exec(),
            Catalog.findOne({_export_id: exportItem.parent_id}).exec()
        ]).
        then(function(results) {
            var saves = [], catalog = results[0], parent = results[1];

            if (parent) {
                catalog.parentId = parent._id;

                saves.push(Catalog.update(
                    { _id: parent._id }, 
                    { $addToSet: { childs: catalog } }
                ));
            }
            
            saves.push(catalog.save());

            return Promise.all(saves);
        });     
    }
);
