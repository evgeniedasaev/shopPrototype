module.exports = function(query, createObject) {
    var mongoose = require('mongoose');
    mongoose.connect('localhost:27017/shopping');

    var Promise = require('bluebird');
    mongoose.Promise = Promise;

    var mysql      = require('mysql');
    var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'djxj9TUY',
    database : 'interalliance_beta',
    });

    connection.connect();
    connection.query(query, function(err, rows, fields) {
        function exit() {
            connection.end();
            mongoose.disconnect();
            process.exit();
        };

        if (err) {
            throw err;
            exit();
        }

        if (!rows.length)
            exit();

        Promise.reduce(rows, function(updated, row) {
            return createObject(row).
            then(function() {
                return updated++;
            });
        }, 0).
        then(function(){
            console.log("finished");
            exit();  
        }).
        catch(function(error){
            console.log(error);
            exit();  
        });         
    });
}