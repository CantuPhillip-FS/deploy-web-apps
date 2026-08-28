export type Project = {
  name: string;
  blurb: string;
  tech: string[];
  repo: string;
  live?: string;
  note?: string;
};

export const PROJECTS: Project[] = [
  {
    name: "MatchPoint",
    blurb:
      "AI-powered job search app: upload a resume, get ranked job matches with fit signals, coach weak resume bullets, and track applications. Built with a team of four during Flatiron School's AI Engineering apprenticeship.",
    tech: ["React", "TypeScript", "FastAPI", "Python", "OpenAI", "Supabase"],
    repo: "https://github.com/dmboynton56/matchpoint",
    live: "https://matchpoint-web-gamma.vercel.app/jobs",
    note: "Team of four",
  },
  {
    name: "AppTrack",
    blurb:
      "Full-stack MERN job and opportunity tracker — typed end to end, containerized with Docker, and deployed across Vercel and Render.",
    tech: ["React", "TypeScript", "Node.js", "Express", "MongoDB", "Docker"],
    repo: "https://github.com/hereisphil/app-track",
    live: "https://app-track-frontend.vercel.app/",
  },
  {
    name: "ClientPulse",
    blurb:
      "Client-management app built three ways from one API: a React web app, a React Native mobile build, and an auth-hardened variant with JWT-protected routes.",
    tech: ["React", "React Native", "TypeScript", "Express", "MongoDB"],
    repo: "https://github.com/hereisphil/clientpulse",
    live: "https://clientpulse-frontend.vercel.app/",
  },
];
