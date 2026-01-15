
import { ISuccessResponse, User } from '../models';
import request from '../utils/request';

export const getAdminUsers = () => {
  return request.get<any, ISuccessResponse<User[]>>("/admin/users");
};

export const deleteAdminUser = (id: number) => {
  return request.delete<any, ISuccessResponse<boolean>>(`/admin/users/${id}`);
};

export const setAdminUserExpiration = (id: number, days: number | null) => {
  return request.post<any, ISuccessResponse<User>>(`/admin/users/${id}/expiration`, { days });
};

export const getRegistrationSetting = () => {
    return request.get<any, ISuccessResponse<boolean>>("/admin/settings/registration");
};

export const toggleRegistrationSetting = (allowed: boolean) => {
    return request.post<any, ISuccessResponse<boolean>>("/admin/settings/registration", { allowed });
};
