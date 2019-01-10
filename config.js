'use strict';

exports.DATABASE_URL = process.env.DATABASE_URL || 'mongodb://localhost/blog-app';
exports.Test_DATABASE_URL = process.env.Test_DATABASE_URL || 'mongodb://masontang:abcdefg1@ds263642.mlab.com:63642/test-mongo'
exports.PORT = process.env.PORT || 8080;