import { useQuery, useMutation } from "convex/react";

const TrainingPrograms = () => {
  const trainingPrograms = useQuery("getTrainingPrograms");
  const addProgram = useMutation("addTrainingProgram");

  const handleAddProgram = async () => {
    await addProgram({
      name: "Sample Program",
      description: "A great training program",
      price: 99.99,
    });
  };

  return (
    <div>
      <h1>Training Programs</h1>
      <button onClick={handleAddProgram}>Add Program</button>
      <ul>
        {trainingPrograms?.map((program) => (
          <li key={program.id}>{program.name} - ${program.price}</li>
        ))}
      </ul>
    </div>
  );
};

export default TrainingPrograms;