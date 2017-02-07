module.exports = function(query, createObject) {
    var mongoose = require('mongoose');
    mongoose.connect('localhost:27017/shopping');

    var mysql      = require('mysql');
    var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'djxj9TUY',
    database : 'interalliance_beta',
    });

    connection.connect();

    connection.query(query, function(err, rows, fields) {
        if (err) {
            throw err;
            exit();
        }

        if (!rows.length) {
            exit();
        }

        var done = 0;
        for (var i = 1; i<rows.length; i++) {
            var item = createObject(rows[i], function(item) {
                item.save();                
            });

            done++;
            if (done === rows.length) {
                exit();
            }
        }
    });

    function exit() {
        connection.end();
        mongoose.disconnect();
        process.exit();
    }

}