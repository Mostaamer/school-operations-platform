export const schoolStructure = {
  'Primary': { 
    code: 'PRI', 
    years: ['1', '2', '3', '4', '5', '6'] 
  },
  'Preparatory': { 
    code: 'PRE', 
    years: ['1', '2', '3'] 
  },
  'Secondary': { 
    code: 'SEC', 
    years: ['1', '2', '3'] 
  }
};

export const generateClassId = (st: string, gr: string, se: string) => {
  const stageObj = schoolStructure[st as keyof typeof schoolStructure];
  if (!stageObj) return '';
  // هنا التعديل: سنأخذ الرقم مباشرة كما هو (gr)
  return `${stageObj.code}-${gr}-${se}`;
};
