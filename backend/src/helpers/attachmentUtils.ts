import * as AWS from 'aws-sdk';
import { TodosAccess } from './todosAccess';
import { TodoItem } from '../models/TodoItem';
// // TODO: Implement the fileStogare logic

const todoAccess = new TodosAccess();
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

export async function updateTodoUrl( userId: string, todoId: string): Promise<TodoItem>{
  return await todoAccess.updateTodoUrl({
      userId,
      todoId,
      attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`,
  })
}
