import fs from "fs";
import path from "path";
import matter from "gray-matter";

const ROADMAP_PATH = path.join(process.cwd(), "content", "roadmap.md");

export interface RoadmapSection {
  title: string;
  content: string;
  items: string[];
}

export interface RoadmapData {
  title: string;
  description: string;
  sections: RoadmapSection[];
}

/**
 * Parse markdown list items from a section body (lines starting with - or *).
 */
function parseListItems(content: string): string[] {
  const items: string[] = [];
  const lines = content.split("\n").map((line) => line.trim());
  for (const line of lines) {
    const match = line.match(/^[-*]\s+(.+)$/);
    const text = match?.[1];
    if (text) items.push(text.trim());
  }
  return items.filter(Boolean);
}

/**
 * Split markdown content by ## headers and return sections with title and body.
 */
function splitByH2(markdown: string): { title: string; body: string }[] {
  const sections: { title: string; body: string }[] = [];
  const parts = markdown.split(/^##\s+(.+)$/gm);
  // parts[0] can be leading content before first ##; then [title, body, title, body, ...]
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim() ?? "";
    const body = parts[i + 1]?.trim() ?? "";
    if (title) sections.push({ title, body });
  }
  return sections;
}

/**
 * Load and parse the roadmap from content/roadmap.md.
 * Returns null if the file does not exist.
 */
export function getRoadmap(): RoadmapData | null {
  if (!fs.existsSync(ROADMAP_PATH)) return null;
  const raw = fs.readFileSync(ROADMAP_PATH, "utf-8");
  const { data, content } = matter(raw);
  const title = (data.title as string) ?? "Roadmap";
  const description = (data.description as string) ?? "";
  const sectionPairs = splitByH2(content.trim());
  const sections: RoadmapSection[] = sectionPairs.map(({ title: sectionTitle, body }) => ({
    title: sectionTitle,
    content: body,
    items: parseListItems(body),
  }));
  return { title, description, sections };
}
