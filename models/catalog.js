var mongoose = require('mongoose');
var materializedPlugin = require('mongoose-materialized');
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
    var Product, Catalog, catalog;
    catalog = this;
    Catalog = catalog.model('Catalog');
    Product = product.model('Product');

    var propertyIds = [], valueIds = [], valueIndexes = [];    
    product.properties.forEach(function(property) {
        propertyIds.push(property.property);

        property.values.forEach(function(value) {
            valueIds.push(value.value);
            valueIndexes.push(value.index);
        });
    });

    return Promise.all([
        Property.find({_id: {$in: propertyIds}}).exec(),
        PropertyValue.find({_id: {$in: valueIds}}).exec()
    ]).
    then(function(results) {
        var properties, values, filterUpdates = [];
        properties = results[0];
        values = results[1];
        values_by_properties = values.reduce(function ( total, current ) {
            if (typeof total[ current.property ] === 'undefined')
                total[ current.property ] = [];

            total[ current.property ].push(current);

            return total;
        }, {});

        properties.forEach(function(property) {
            if (property._id in values_by_properties) {
                values_by_properties[property._id].forEach(function(value) {
                    var value_index, availables;

                    value_index = property.code + '#' + value.code;
                    availables = values.filter(function(available_value) {
                        return value._id != available_value._id;
                    });

                    filterUpdates.push(
                        Product.count({'properties.values.index': value_index}).exec().
                        then(function(amount) {
                            return Catalog.findOne(
                                {_id: catalog._id, 'filter.index': value_index}, 
                                {'filter.$': 1}
                            ).exec().
                            then(function(catalogExist){
                                if (catalogExist !== null) {
                                    return Catalog.update(
                                        { _id: catalog._id, 'filter.index': value_index },
                                        { 
                                            $set: { 'filter.$.amount': amount },
                                            $addToSet: {'filter.$.availables': availables}
                                        }
                                    );        
                                } else {
                                    console.log(catalog.filter, {
                                            property: property._id,
                                            value: value._id,
                                            index: value_index,
                                            amount: amount,
                                            availables: availables
                                    });
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
                                }
                            });
                        }).
                        catch(function(error){
                            console.log(error);
                        })
                    );                    
                });
            }
        });

        return Promise.all(filterUpdates);
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
    catalog.getParent(function(error, parent) {
        if (parent) {
            catalog.full_path = parent.full_path + catalog.code + '/';
            // console.log('by parent ', catalog.full_path);
            if (catalog.modified) {
                catalog.save();
            }        
        }
    });
    
    catalog.getChildren(function(err, childs){
        if (childs) {                
            childs.forEach(function(child) {
                child.full_path = catalog.full_path + child.code + '/';
                // console.log('by childs ', child.full_path);
                child.childs = childs;
                if (child.modified) {
                    child.save();
                }
            });
        }
    }); 
});

var Catalog = mongoose.model('Catalog', catalogSchema);

module.exports = Catalog;