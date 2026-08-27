import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({
    pattern: "**/index.mdx",
    base: "./src/content/blog",
    // Folder name = slug, so the old /blog/<slug> URLs survive unchanged.
    generateId: ({ entry }) => entry.replace(/\/index\.mdx$/, ""),
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().max(70),
      description: z.string().max(160),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      tags: z.array(z.string()).default([]),
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog };
