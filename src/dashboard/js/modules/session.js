import { api } from '../../utils/api';
import { getSessionOrRedirect, hydrateSessionFromExtensionStorage } from '../authStorage';
import {
  getCurrentProfile,
  getCurrentSession,
  resolveActiveUserId,
  setCurrentProfile,
  setCurrentSession,
} from './state';

export const bootstrapSession = async () => {
  await hydrateSessionFromExtensionStorage();
  const session = getSessionOrRedirect();
  setCurrentSession(session);
  return session;
};

export const loadProfile = async () => {
  const session = getCurrentSession();
  if (!session?.token) return null;

  const profile = await api.fetchProfile(session.token);
  setCurrentProfile(profile);
  return profile;
};

export const getSession = () => getCurrentSession();
export const getProfile = () => getCurrentProfile();
export { resolveActiveUserId };
