var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

var schema = new Schema({
    product: {type: Schema.Types.ObjectId, ref: 'Product'},
    name: {type: String, required: true},
    price: {type: Number, required: true}
});
schema.plugin(findOrCreate);

module.exports = mongoose.model('ProductVariant', schema);