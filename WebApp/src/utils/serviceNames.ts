export const serviceNameMap: Record<string, string> = {
  'onze': 'Onze',
  'megagoal': 'MegaGoal',
  'megaauth': 'MegaAuth',
  'megahome': 'MegaHome',
  'megamedia': 'MegaMedia',
};

export const getDisplayServiceName = (serviceName: string): string => {
  return serviceNameMap[serviceName.toLowerCase()] || serviceName;
}; 