export const getToken = () => {
  return localStorage.getItem('token');
};

export const setToken = (token: string) => {
  return localStorage.setItem('token', token);
};

export const getDeploymentId = () => {
  return localStorage.getItem('deploymentId');
};

export const setDeploymentId = (deploymentId: string) => {
  return localStorage.setItem('deploymentId', deploymentId);
};

export const getPolicyAddresses = (): Record<string, boolean> => {
  return JSON.parse(localStorage.getItem('policyAddresses') || '{}') ?? {};
};

export const setPolicyAddresses = (policyAddresses: Record<string, boolean>) => {
  localStorage.setItem('policyAddresses', JSON.stringify(policyAddresses));
};
