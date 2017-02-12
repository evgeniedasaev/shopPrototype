var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    _export_id: {type: Number},
    catalog: {type: Schema.Types.ObjectId, ref: 'Catalog'},   
    imagePath: {type: String, required: true},
    title: {type: String, required: true},
    description: {type: String, required: true},
    price: {type: Number, required: true}
});

module.exports = mongoose.model('Product', schema);