var mongoose = require('mongoose');
var materializedPlugin = require('mongoose-materialized');
var Property = require('../models/property');
var PropertyValue = require('../models/property_value');
var Schema = mongoose.Schema;

var filterSchema = new Schema({
    property: {type: Schema.Types.ObjectId, ref: 'Property'},
    values: [{
        value: {type: Schema.Types.ObjectId, ref: 'PropertyValue'},
        amount: {type: Number, default: 0},
        availables: [{type: Schema.Types.ObjectId, ref: 'PropertyValue'}]  
    }]
});

var catalogSchema = new Schema({
    _export_id: {type: Number, defult: 0},
    childs: [{type: Schema.Types.ObjectId, ref: 'Catalog'},],
    name: {type: String, required: true},
    code: {type: String, required: true},
    full_path: {type: String},
    filter: [filterSchema]
});
catalogSchema.plugin(materializedPlugin);

catalogSchema.methods.buildFilter = function(product) {
    var propertyIds = valueIds = valueIndexes = [];    
    product.properties.forEach(function(property) {
        propertyIds.push(property.property);

        property.values.forEach(function(value) {
            valueIds.push(value.value);
            valueIndexes.push(value.index);
        });
    });

    var prepare_data = [
        Property.find({_id: {$in: propertyIds}}).exec(),
        PropertyValue.find({_id: {$in: valueIds}}).exec()
    ];

    return Promise.all([
        Property.find({_id: {$in: propertyIds}}).exec(),
        PropertyValue.find({_id: {$in: valueIds}}).exec()
    ]).
    then(function(results) {
        var properties, values, filterUpdates = [];
        properties = results[0];
        values = results[1].reduce(function ( total, current ) {
            if (!current.property in total)
                total[ current.property ] = [];

            total[ current.property ].push(current);

            return total;
        }, {});

        var Product, Catalog, catalog;
        catalog = this;
        Catalog = catalog.model('Catalog');
        Product = product.model('Product');

        properties.forEach(function(property) {
            if (property._id in values) {
                values[property._id].forEach(function(value) {
                    var value_index, availables;

                    value_index = property.code + '#' + value.code;
                    availables = values[property._id].filter(function(available_value) {
                        return value._id != available_value._id;
                    });

                    filterUpdates.push(
                        Product.count({'properties.values.value_index': value_index}).exec().
                        then(function(amount) {
                            return Catalog.update(
                                {_id: product._id, 'filter.values.value': value}, 
                                { $push: { 'filter.$.values.$': {
                                    value: value,
                                    amount: amount,
                                    availables: availables
                                } } }, 
                                { upsert : true }
                            );
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