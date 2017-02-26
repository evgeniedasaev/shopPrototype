var mongoose = require('mongoose');
var materializedPlugin = require('mongoose-materialized');
var Product = require('../models/product');
var Property = require('../models/property');
var PropertyValue = require('../models/property_value');
var Schema = mongoose.Schema;

var catalogSchema = new Schema({
    _export_id: {type: Number, defult: 0},
    childs: [{type: Schema.Types.ObjectId, ref: 'Catalog'},],
    name: {type: String, required: true},
    code: {type: String, required: true},
    full_path: {type: String},
    filter: [{
        property: {type: Schema.Types.ObjectId, ref: 'Property'},
        value: {type: Schema.Types.ObjectId, ref: 'PropertyValue'},
        index: {type: String, required: true},
        amount: {type: Number, default: 0},
        availables: [{type: Schema.Types.ObjectId, ref: 'PropertyValue'}]  
    }]
});
catalogSchema.plugin(materializedPlugin);

catalogSchema.methods.buildFilter = function(product) {
    var catalog = this;
    var Catalog = catalog.model('Catalog');

    var propertyIds = [], valueIds = [];    
    product.properties.forEach(function(property) {
        propertyIds.push(property.property);

        property.values.forEach(function(value) {
            valueIds.push(value.value);
        });
    });

    return Promise.all([
        Property.find({_id: {$in: propertyIds}}).exec(),
        PropertyValue.find({_id: {$in: valueIds}}).exec()
    ]).
    then(function(results) {
        var filterUpdates = [];

        var properties = results[0];
        var values = results[1];
        var values_by_properties = values.reduce(function ( total, current ) {
            if (typeof total[ current.property ] === 'undefined')
                total[ current.property ] = [];

            total[ current.property ].push(current);

            return total;
        }, {});

        properties.forEach(function(property) {
            if (property._id in values_by_properties) {
                values_by_properties[property._id].forEach(function(value) {
                    var value_index = property.code + '#' + value.code;
                    var availables = values.filter(function(available_value) {
                        return value._id != available_value._id;
                    });

                    var filterUpdate = Catalog.findOne(
                        {_id: catalog._id, 'filter.index': value_index}, 
                        {'filter.$': 1}
                    ).exec().
                    then(function(catalogExist){
                        var updateCatalog;
                        var countProductAmount = Product.count({'properties.values.index': value_index}).exec();

                        if (catalogExist !== null) {
                            return countProductAmount.then(function(amount) {
                                return Catalog.update(
                                    { _id: catalog._id, 'filter.index': value_index },
                                    { 
                                        $set: { 'filter.$.amount': amount },
                                        $push: {'filter.$.availables': {$each: availables} }
                                    }
                                );
                            });
                        } 
                        
                        if (catalogExist === null) {
                            return countProductAmount.then(function(amount) {
                                return Catalog.update(
                                    { _id: catalog._id },
                                    { 
                                        $push: {'filter': {
                                                property: property._id,
                                                value: value._id,
                                                index: value_index,
                                                amount: amount,
                                                availables: availables
                                        } }
                                    }
                                );
                            });                                  
                        }
                    });

                    filterUpdates.push(filterUpdate);                    
                });
            }
        });

        return Promise.all(filterUpdates);
    }).
    then(function() {
        return Catalog.findOne({_id: catalog.parentId}).exec();
    }).
    then(function(parent) {
        if (!parent)
            return Promise.resolve();

        return parent.buildFilter(product);
    });
}

catalogSchema.pre('save', function (next) {
    if (!this.full_path) {
        this.full_path = '/catalog/' + this.code + '/';
        // console.log(this.full_path);
    }

    next();
});

catalogSchema.post('save', function (catalog) {
    var old_full_path;
    
    return catalog.getParent().
    then(function(parent) {
        if (!parent) return Promise.resolve();

        old_full_path = catalog.full_path;
        catalog.full_path = parent.full_path + catalog.code + '/';            

        return Promise.resolve();
    }).
    then(function() {
        return catalog.getChildren();
    }).
    then(function(childs) {
        if (!childs) return Promise.resolve();

        var promises = [];

        if (catalog.full_path != old_full_path) {
            catalog.childs = childs;
            // console.log('by parent', catalog.full_path, old_full_path);
            promises.push(catalog.save());
        }
        
        childs.forEach(function(child) {
            var old_full_path = child.full_path;
            child.full_path = catalog.full_path + child.code + '/';

            if (child.full_path != old_full_path) {
                // console.log('by childs', child.full_path, old_full_path);
                promises.push(child.save());
            }
        });

        return Promise.all(promises);
    });
});

var Catalog = mongoose.model('Catalog', catalogSchema);

module.exports = Catalog;