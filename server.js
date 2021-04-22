"use strict";

const S3Downloader      = require('fastboot-s3-downloader');
const S3Notifier        = require('fastboot-s3-notifier');
const RedisCache        = require('fastboot-redis-cache');
const FastBootAppServer = require('fastboot-app-server');
const ExpressHTTPServer = require('fastboot-app-server/src/express-http-server');
const ExpressbasicAuth  = require('fastboot-app-server/src/basic-auth');



const S3_BUCKET    = process.env.FASTBOOT_S3_BUCKET;
const S3_KEY       = process.env.FASTBOOT_S3_KEY;
const REDIS_HOST   = process.env.FASTBOOT_REDIS_HOST;
const REDIS_PORT   = process.env.FASTBOOT_REDIS_PORT;
const REDIS_EXPIRY = process.env.FASTBOOT_REDIS_EXPIRY;
const USERNAME     = process.env.FASTBOOT_USERNAME;
const PASSWORD     = process.env.FASTBOOT_PASSWORD;
const IMAGE_HOST   = process.env.FASTBOOT_IMAGE_HOST;

let downloader = new S3Downloader({
  bucket: S3_BUCKET,
  key: S3_KEY
});

let notifier = new S3Notifier({
  bucket: S3_BUCKET,
  key: S3_KEY
});

let cache;
if (REDIS_HOST || REDIS_PORT) {
  cache = new RedisCache({
    host: REDIS_HOST,
    port: REDIS_PORT,
    expiration: REDIS_EXPIRY
  });
} else {
  console.log('No FASTBOOT_REDIS_HOST or FASTBOOT_REDIS_PORT provided; caching is disabled.');
}

const httpServer = new ExpressHTTPServer(/* {options} */);

const app = httpServer.app;
if (IMAGE_HOST) {
  app.get(/^((?!\/assets\/).)*\.(png)|(jpg)|(gif)|(jpeg)|(pdf)$/, function (req, res) {
    res.redirect(IMAGE_HOST + '/'+ req.path);
  });
}
app.use(ExpressbasicAuth(USERNAME, PASSWORD));

let server = new FastBootAppServer({
  downloader: downloader,
  httpServer: httpServer,
  notifier: notifier,
  username: USERNAME,
  password: PASSWORD,
  cache: cache,
});

server.start();
