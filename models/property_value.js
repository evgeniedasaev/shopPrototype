var mongoose = require('mongoose');
var findOrCreate = require('mongoose-findorcreate');
var Schema = mongoose.Schema;

var schema = new Schema({
    property: {type: Schema.Types.ObjectId, ref: 'Property'},
    _export_id: {type: Number},
    name: {type: String, required: true},
    code: {type: String, required: true}
});
schema.plugin(findOrCreate);

module.exports = mongoose.model('PropertyValue', schema);