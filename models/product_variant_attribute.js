var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    product: {type: Schema.Types.ObjectId, ref: 'Product'},
    product_variant: {type: Schema.Types.ObjectId, ref: 'ProductVariant'},
    property: {type: Schema.Types.ObjectId, ref: 'Property'},
    property_value: {type: Schema.Types.ObjectId, ref: 'PropertyValue'},
    name: {type: String, required: true}
});

module.exports = mongoose.model('ProductAttribute', schema);