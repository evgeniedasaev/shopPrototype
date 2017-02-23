var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var propertiesSchema = new Schema({
    property: {type: Schema.Types.ObjectId, ref: 'Property'},
    values: [{
        value: {type: Schema.Types.ObjectId, ref: 'PropertyValue'},
        index: {type: String}
    }]
});

var userSchema = new Schema({
    _export_id: {type: Number, index: true},
    catalog: {type: Schema.Types.ObjectId, ref: 'Catalog'},   
    imagePath: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true},
    properties: [propertiesSchema]
});

userSchema.methods.addPropertyValue = function(property, value) {
    var product, productModel, value_index;
    
    product = this;
    productModel = product.model('Product');
    value_index = property.code + "#" + value.code;

    return productModel.findOne(
        {_id: product._id, 'properties.values.index': value_index}, 
        {'properties.values.$': 1}
    ).exec().
    then(function(bindExist) {
        if (bindExist === null) {            
            return product.model('Product').findOne(
                {_id: product._id, 'properties.property': property}, 
                {'properties.$': 1}
            ).exec().
            then(function(propertyExist) {
                var valueObj = {
                    value: value,
                    index: value_index
                };

                if (propertyExist !== null) {
                    // console.log('propertyExist', product._id, value_index);
                    return productModel.update(
                        { _id: product._id, 'properties.property': property },
                        { $push: { "properties.$.values": valueObj } }
                    );
                } else {
                    // console.log('propertyNotExist', product._id, product.properties, value_index);
                    product.properties.push({
                        property: property,
                        values: [valueObj]
                    });
                    
                    return product.save();
                }  
            }).
            catch(function(error){
                console.log(error);
            });
        }
    }).
    catch(function(error){
        console.log(error);
    });
};

module.exports = mongoose.model('Product', userSchema);