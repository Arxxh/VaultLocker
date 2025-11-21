import { getCachedCredentials } from './state';
import { getProfile, getSession } from './session';

export const updateUserInfo = (user) => {
  if (!user) return;

  const userNameElement = document.getElementById('user-display-name');
  if (userNameElement) {
    userNameElement.textContent = user.email.split('@')[0];
  }

  const avatarElement = document.getElementById('user-avatar');
  if (avatarElement) {
    const initials = user.email.substring(0, 2).toUpperCase();
    avatarElement.textContent = initials;
  }

  const userEmailElement = document.getElementById('user-email');
  if (userEmailElement) {
    userEmailElement.textContent = user.email;
  }
};

export const renderProfileDetails = () => {
  const email = getProfile()?.email || getSession()?.user?.email;
  if (email) {
    const profileEmail = document.getElementById('profile-email');
    if (profileEmail) {
      profileEmail.textContent = email;
    }
  }

  const createdAt = getProfile()?.createdAt || getSession()?.user?.createdAt;
  const created = createdAt ? new Date(createdAt) : null;
  const createdElement = document.getElementById('profile-created');
  if (createdElement) {
    createdElement.textContent = created ? created.toLocaleString() : 'Sin fecha disponible';
  }

  const credentialCount =
    getProfile()?.credentialsCount ?? getCachedCredentials().length ?? getSession()?.user?.credentialsCount;
  const countElement = document.getElementById('profile-credentials');
  if (countElement) {
    countElement.textContent = String(credentialCount || 0);
  }
};
