export const serviceNameMap: Record<string, string> = {
  'megagoal': 'MegaGoal',
  'megaauth': 'MegaAuth',
  'megahome': 'MegaHome',
  'megamedia': 'MegaMedia',
};

export const getDisplayServiceName = (serviceName: string): string => {
  return serviceNameMap[serviceName.toLowerCase()] || serviceName;
}; 