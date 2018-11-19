// Copyright 2016 Eyevinn Technology. All rights reserved
// Use of this source code is governed by a MIT License
// license that can be found in the LICENSE file.
// Author: Jonas Birme (Eyevinn Technology)
var express = require('express');
var router = express.Router();
const fs = require('fs');
const path = require('path');
var AWS = require('aws-sdk');
var s3 = new AWS.S3();

function initiateDefaultConf() {
  return {
    "row0": [],
    "row1": [],
    "row2": []
  };
}

/* GET home page. */
router.get('/', function(req, res) {
  conf = req.query.config;
  var confobj = initiateDefaultConf();
  if(conf) {
    if(conf.startsWith('s3')){
      console.log("Loading config " + conf);
      var params = {
        Bucket: conf.split("s3://")[1].split("/")[0],
        Key: conf.split("s3://")[1].split("/")[1]
      };

      s3.getObject(params, function(err, data) {
        if (err){ 
          console.log(err, err.stack);
        }else{
          var confobj = JSON.parse(data.Body.toString());
        }

        res.render('index', { title: 'Multiview OTT', conf: JSON.stringify(confobj) });
      });
  
    }else{
      var confpath = '../config/'+conf;
      console.log("Loading config " + confpath);
      if (fs.existsSync(path.join(__dirname, confpath))) {
        var confobj = JSON.parse(fs.readFileSync(path.join(__dirname, confpath), 'utf8'));
      }

      res.render('index', { title: 'Multiview OTT', conf: JSON.stringify(confobj) });
    }
  }
  //res.render('index', { title: 'Multiview OTT', conf: JSON.stringify(confobj) });
});

module.exports = router;
