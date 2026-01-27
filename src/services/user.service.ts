// import { httpClient } from '../api/httpClient';
// import { endpoints } from '../api/endpoints';
// import type { Result, User } from '../types/index';

class UserService {
  // async me(): Promise<Result<User>> {
  //   return httpClient.get<User>(endpoints.users.me, {
  //     service: 'users',
  //     auth: true,
  //   });
  // }

  // async list(): Promise<Result<User[]>> {
  //   return httpClient.get<User[]>(endpoints.users.list, {
  //     service: 'users',
  //     auth: true,
  //   });
  // }

  // async getById(id: string): Promise<Result<User>> {
  //   return httpClient.get<User>(endpoints.users.byId(id), {
  //     service: 'users',
  //     auth: true,
  //   });
  // }

  // async update(id: string, patch: Partial<User>): Promise<Result<User>> {
  //   return httpClient.patch<User>(endpoints.users.byId(id), patch, {
  //     service: 'users',
  //     auth: true,
  //   });
  // }

  // async remove(id: string): Promise<Result<{ success: boolean }>> {
  //   return httpClient.delete<{ success: boolean }>(endpoints.users.byId(id), {
  //     service: 'users',
  //     auth: true,
  //   });
  // }
}

export const userService = new UserService();
