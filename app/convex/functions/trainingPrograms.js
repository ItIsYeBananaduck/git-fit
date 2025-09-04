import { mutation } from "convex/server";

export const addTrainingProgram = mutation(async ({ db }, { name, description, price }) => {
  const program = {
    name,
    description,
    price,
    createdAt: new Date(),
  };
  const id = await db.insert("trainingPrograms", program);
  return { id, ...program };
});

export const getTrainingPrograms = query(async ({ db }) => {
  return await db.query("trainingPrograms").collect();
});
