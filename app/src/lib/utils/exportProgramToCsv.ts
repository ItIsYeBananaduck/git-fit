// Utility to export a training program's exercises to CSV
// Usage: const csv = exportProgramToCsv(program)

export function exportProgramToCsv(program: {
    name: string;
    exercises: Array<{
        week?: number;
        day?: string;
        name: string;
        sets: number;
        reps: string | number;
        load?: string | number;
    }>;
}): string {
    const header = ["Week", "Day", "Exercise", "Sets", "Reps", "Load"];
    const rows = program.exercises.map(ex => [
        ex.week ?? "",
        ex.day ?? "",
        ex.name,
        ex.sets,
        ex.reps,
        ex.load ?? ""
    ]);
    const csv = [header, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
        .join("\n");
    return csv;
}
