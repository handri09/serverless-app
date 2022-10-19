import 'source-map-support/register';
import { createLogger } from '../../utils/logger';
import * as middy from 'middy';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { createAttachmentPresignedUrl, updateTodoUrl } from '../../helpers/todos';
import { getUploadUrl } from '../../helpers/attachmentUtils';
import { getUserId } from '../utils';

const logger = createLogger('generateUploadUrl');
const bucketName = process.env.ATTACHMENT_S3_BUCKET;

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing GenerateUploadUrl', event)
    const todoId = event.pathParameters.todoId
    // TODO: Return a presigned URL to upload a file for a TODO item with the provided id
    const authorization = event.headers.Authorization;
    const split = authorization.split(' ');
    const jwtToken = split[1];

    const uploadUrl = getUploadUrl(todoId)
    const userId = getUserId(event);
    const updatedTodo = {
      attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`
    }
    await updateTodoUrl(updatedTodo, userId, todoId)

    const url = await createAttachmentPresignedUrl(todoId, jwtToken);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        uploadUrl,
        url
      }),
    };
  }
)
