export const schoolStructure = {
  'Primary': { code: 'PRI', years: ['1', '2', '3', '4', '5', '6'], label: 'الابتدائية' },
  'Preparatory': { code: 'PRE', years: ['1', '2', '3'], label: 'الإعدادية' },
  'Secondary': { code: 'SEC', years: ['1', '2', '3'], label: 'الثانوية' }
};

export const generateClassId = (st: string, gr: string, se: string) => {
  const stageObj = schoolStructure[st as keyof typeof schoolStructure];
  if (!stageObj) return '';
  return `${stageObj.code}-${gr}-${se}`;
};