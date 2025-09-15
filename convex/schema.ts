import { defineSchema, defineTable } from 'convex/schema';

export default defineSchema({
  equipment: defineTable({
    name: 'string', // Name of the equipment
    type: 'string', // Type or category of the equipment
    description: 'string', // Optional description
    image: 'string', // URL or file reference for an image
    createdBy: 'string', // User ID of the creator
    createdAt: 'number', // Timestamp for creation
  }),
});