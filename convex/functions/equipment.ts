import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';

// Add new equipment
export const addEquipment = mutation({
  args: {
    name: v.string(),
    type: v.string(),
    description: v.optional(v.string()),
    image: v.optional(v.string()),
    createdBy: v.string(),
  },
  handler: async ({ db }, { name, type, description, image, createdBy }) => {
    const createdAt = Date.now();
    const id = await db.insert('equipment', {
      name,
      type,
      description,
      image,
      createdBy,
      createdAt,
    });
    return { success: true, id };
  },
});

// Fetch all equipment
export const fetchEquipment = query({
  args: {},
  handler: async ({ db }) => {
    return await db.query('equipment').collect();
  },
});

// Update equipment
export const updateEquipment = mutation({
  args: {
    id: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      type: v.optional(v.string()),
      description: v.optional(v.string()),
      image: v.optional(v.string()),
    }),
  },
  handler: async ({ db }, { id, updates }) => {
    const equipmentId = id as Id<'equipment'>;
    await db.patch(equipmentId, updates);
    return { success: true };
  },
});

// Delete equipment
export const deleteEquipment = mutation({
  args: {
    id: v.string(),
  },
  handler: async ({ db }, { id }) => {
    const equipmentId = id as Id<'equipment'>;
    await db.delete(equipmentId);
    return { success: true };
  },
});