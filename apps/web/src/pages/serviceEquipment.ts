/** Which equipment categories relate to each service (for internal linking). */
export const SERVICE_EQUIPMENT: Record<string, { category?: string; featured?: boolean }> = {
  'equipment-rental': { featured: true },
  'rigging-lifting': { category: 'cranes' },
  'heavy-transport': { category: 'earthmoving' },
  warehousing: { category: 'forklifts' },
};
