var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    product: {type: Schema.Types.ObjectId, ref: 'Product'},
    property: {type: Schema.Types.ObjectId, ref: 'Property'},
    name: {type: String, required: true}
});

module.exports = mongoose.model('ProductAttribute', schema);