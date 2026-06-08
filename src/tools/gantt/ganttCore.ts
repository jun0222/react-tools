export interface GanttTask {
  id: string;
  name: string;
  start: string;
  duration: string;
  crit?: boolean;
}

export interface GanttSection {
  id: string;
  name: string;
  tasks: GanttTask[];
}

export interface GanttData {
  title: string;
  dateFormat: string;
  sections: GanttSection[];
}

export const buildCode = (data: GanttData): string => {
  const lines: string[] = [`gantt`, `    title ${data.title}`, `    dateFormat ${data.dateFormat}`];
  for (const sec of data.sections) {
    lines.push(`    section ${sec.name}`);
    for (const task of sec.tasks) {
      const prefix = task.crit ? 'crit, ' : '';
      lines.push(`    ${task.name} :${prefix}${task.start}, ${task.duration}`);
    }
  }
  return lines.join('\n');
};
