import * as AWS from 'aws-sdk';
import { createLogger } from '../utils/logger';
import { TodoItem } from '../models/TodoItem';
import { TodoUpdate } from '../models/TodoUpdate';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { Types } from 'aws-sdk/clients/s3';

const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);
const logger = createLogger('Todos');

// TODO: DATALAYER LOGIC.
export class TodosAccess {
  constructor(
    private readonly docClient: DocumentClient = new AWS.DynamoDB.DocumentClient(),
    private readonly todoTable = process.env.TODOS_TABLE,
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly s3Client: Types = new AWS.S3({ signatureVersion: 'v4' })
    ) {
  }

  // GET TODO.
  async getTodos(userId: string): Promise<TodoItem[]> {
    
    const params = {
      TableName: this.todoTable,
      KeyConditionExpression: "#userId = :userId",
      ExpressionAttributeNames: {
          "#userId": "userId"
      },
      ExpressionAttributeValues: {
          ":userId": userId
      }
    };

    const result = await this.docClient.query(params).promise();
    const items = result.Items;
    return items as TodoItem[];
  }

  // CREATE TODO.
  async createTodo(todoItem: TodoItem): Promise<TodoItem> {
    try {
      await this.docClient.put({
          TableName: this.todoTable,
          Item: todoItem
      }).promise();
      return todoItem;
    } catch (e) {
      logger.error(`Failed in creating Todo: `, e.message)
      return null
    }
  }

  // UPDATE TODO.
  async updateTodo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
    console.log("Update Todo Function");
    const params = {
        TableName: this.todoTable,
        Key: {
            "userId": userId,
            "todoId": todoId
        },
        UpdateExpression: "set #a = :a, #b = :b, #c = :c",
        ExpressionAttributeNames: {
            "#a": "name",
            "#b": "dueDate",
            "#c": "done"
        },
        ExpressionAttributeValues: {
            ":a": todoUpdate['name'],
            ":b": todoUpdate['dueDate'],
            ":c": todoUpdate['done']
        },
        ReturnValues: "ALL_NEW"
    };

    const result = await this.docClient.update(params).promise();
    const attributes = result.Attributes;
    return attributes as TodoUpdate;
  }

  async createAttachmentPresignedUrl(todoId: string): Promise<string> {
    console.log("URL Generator Function");

    return this.s3Client.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: todoId,
        Expires: 1000,
    });
    // return url as string;
  }

  async deleteToDo(todoId: string, userId: string): Promise<string> {
    console.log("Deleting Todo Function");

    const params = {
      TableName: this.todoTable,
      Key: {
          "userId": userId,
          "todoId": todoId
      },
    };

    await this.docClient.delete(params).promise();
    return "" as string;
  }

  async updateTodoUrl(updatedTodo: any): Promise<TodoItem> {
    await this.docClient.update({
        TableName: this.todoTable,
        Key: { 
            todoId: updatedTodo.todoId, 
            userId: updatedTodo.userId },
        ExpressionAttributeNames: {"#A": "attachmentUrl"},
        UpdateExpression: "set #A = :attachmentUrl",
        ExpressionAttributeValues: {
            ":attachmentUrl": updatedTodo.attachmentUrl,
        },
        ReturnValues: "UPDATED_NEW"
    }).promise()

    return updatedTodo
  }

  async setTodoAttachmentUrl(todoId: string, userId: string): Promise<string> {
    logger.info('Generating upload Url')
    const url = await this.s3.getSignedUrl('putObject', {
        Bucket: this.bucketName,
        Key: todoId,
        Expires: 10000,
    });
    await this.docClient.update({
      TableName: this.todoTable,
      Key: { userId, todoId},
      UpdateExpression: "set attachmentUrl=:URL",
      ExpressionAttributeValues: {
        ":URL": url.split("?")[0]
      },
      ReturnValues: "UPDATED_NEW"
      })
      .promise();
      return url;
    }
  
}
