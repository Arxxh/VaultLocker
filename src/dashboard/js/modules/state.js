import { getStoredSession } from '../authStorage';

const state = {
  cachedCredentials: [],
  initialized: false,
  currentSession: null,
  currentProfile: null,
  selectedCredential: null,
  modalUnlocked: false,
};

export const getCachedCredentials = () => state.cachedCredentials;
export const setCachedCredentials = (credentials = []) => {
  state.cachedCredentials = Array.isArray(credentials) ? credentials : [];
};

export const isInitialized = () => state.initialized;
export const markInitialized = () => {
  state.initialized = true;
};

export const getCurrentSession = () => state.currentSession;
export const getSession = () => state.currentSession;
export const setCurrentSession = (session) => {
  state.currentSession = session;
};

export const getCurrentProfile = () => state.currentProfile;
export const setCurrentProfile = (profile) => {
  state.currentProfile = profile;
};

export const getSelectedCredential = () => state.selectedCredential;
export const setSelectedCredential = (credential) => {
  state.selectedCredential = credential;
};

export const isModalUnlocked = () => state.modalUnlocked;
export const setModalUnlocked = (value) => {
  state.modalUnlocked = Boolean(value);
};

export const resetModalState = () => {
  state.selectedCredential = null;
  state.modalUnlocked = false;
};

export const resolveActiveUserId = () => {
  const session = state.currentSession ?? getStoredSession();
  const user = session?.user;

  if (!user) {
    return null;
  }

  const candidate = user.id || user._id || user.uid || user.email;
  return candidate ? String(candidate) : null;
};
