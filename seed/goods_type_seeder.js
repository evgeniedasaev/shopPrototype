require('./seeder')(
    `SELECT     id, 
                parent_id,
                name,
                permalink
    FROM        goods_types
    ORDER BY    nesting DESC, parent_id DESC;`, 
    function(exportItem, success) {
        var Catalog = require('../models/catalog');

        Catalog.findOneAndUpdate({_export_id: exportItem.id}, {
                _export_id: exportItem.id,
                name: exportItem.name,
                code: exportItem.permalink
        }, { upsert: true, new: true, setDefaultsOnInsert: true }, function(error, catalog) {
            if (error) {
                console.log(error);
                return;
            }

            catalog.save(function(error) {
                if (error) {
                    console.log(error);
                    return;
                }

                if (exportItem.parent_id) {
                    Catalog.findOne({_export_id: exportItem.parent_id}, function(error, parent) {
                        if (error) {
                            console.log(err);
                            return;
                        }

                        if (parent) {
                            parent.appendChild(catalog, function(err, catalog){
                                Catalog.update(
                                    { _id: parent._id }, 
                                    { $addToSet: { childs: catalog } }
                                );
                            });
                        }
                    });                
                }               
            });
        });
    }
);
