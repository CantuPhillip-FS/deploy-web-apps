export type SkillGroup = {
  title: string;
  items: string[];
};

export const SKILLS: SkillGroup[] = [
  {
    title: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "SQL", "HTML & CSS"],
  },
  {
    title: "Frontend & Mobile",
    items: ["React", "React Native", "Next.js", "Astro", "SolidJS", "Tailwind CSS"],
  },
  {
    title: "Backend & Data",
    items: ["Node.js", "Express", "FastAPI", "Flask", "MongoDB", "PostgreSQL", "Supabase"],
  },
  {
    title: "Tools & Platforms",
    items: ["Git & GitHub", "Docker", "Vercel", "Jest", "Selenium", "OpenAI APIs"],
  },
];
