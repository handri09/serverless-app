import * as AWS from 'aws-sdk';
// // TODO: Implement the fileStogare logic

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);
const bucketName = process.env.ATTACHMENT_S3_BUCKET;
const s3 = new XAWS.S3({
  signatureVersion: 'v4'
})

export function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: bucketName,
    Key: todoId,
    Expires: 10000
  })
}
