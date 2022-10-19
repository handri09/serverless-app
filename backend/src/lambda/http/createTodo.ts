import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { buildTodo } from '../../helpers/todos'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newTodo: CreateTodoRequest = JSON.parse(event.body)
    if (!newTodo.name) {
      throw new Error(`Invalid Todo Name`)
    }
    // TODO: Implement creating a new TODO item
    const userId = getUserId(event)
    const todoItem = await buildTodo(newTodo, userId)

    if (todoItem)
      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Contol-Allow-Credentials': true
        },
        body: JSON.stringify({
          item: todoItem
        })
      }

    if (!todoItem)
      return {
        statusCode: 500,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: "buildTodo generate an issues"
      }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
