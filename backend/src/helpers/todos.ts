import { TodosAccess } from './todosAccess';
import { TodoItem } from '../models/TodoItem';
import { CreateTodoRequest } from '../requests/CreateTodoRequest';
import { createLogger } from '../utils/logger';
import * as uuid from 'uuid';
import { parseUserId } from "../auth/utils";
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import {TodoUpdate} from '../models/TodoUpdate';

// TODO: BUSINESS LOGIC.
const logger = createLogger('Todos')
const todoAccess = new TodosAccess();

export async function getTodos(jwtToken: string): Promise<TodoItem[]> {
  const userId = parseUserId(jwtToken);
  return todoAccess.getTodos(userId);
}

export async function buildTodo(createTodoRequest: CreateTodoRequest, userId: string): Promise<TodoItem> {
  const todoId = uuid.v4()
  try {
      const result = await todoAccess.createTodo({
        todoId,
        userId,
        done: false,
        attachmentUrl: '',
        createdAt: new Date().toISOString(),
        ...createTodoRequest
      })
      logger.info(`buildTodo results: ${result}`)
      return result
  } catch (e) {
      logger.error(`Failed in creating Todo: `, e.message)
      return null
  }
}

export function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, jwtToken: string): Promise<TodoUpdate> {
  const userId = parseUserId(jwtToken);
  return todoAccess.updateTodo(updateTodoRequest, todoId, userId);
}

export async function createAttachmentPresignedUrl(todoId: string, jwtToken: string): Promise<string> {
  const userId = parseUserId(jwtToken)
  const url = await todoAccess.setTodoAttachmentUrl(todoId, userId);
  return url
}

export function deleteTodo(todoId: string, jwtToken: string): Promise<string> {
  const userId = parseUserId(jwtToken);
  return todoAccess.deleteToDo(todoId, userId);
}

export async function updateTodoUrl(updateTodo, userId: string, todoId: string): Promise<TodoItem>{
  return await todoAccess.updateTodoUrl({
      userId,
      todoId,
      attachmentUrl: updateTodo.attachmentUrl,
  })
}
