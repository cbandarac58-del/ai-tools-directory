import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tools = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/tools" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    description: z.string(),
    longReview: z.string(),
    category: z.string(),
    subCategory: z.string(),
    pricingType: z.enum(['Free', 'Freemium', 'Paid', 'Free Trial']),
    tags: z.array(z.string()),
    websiteUrl: z.string(),
    features: z.array(z.string()),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    faq: z.array(z.object({
      question: z.string(),
      answer: z.string()
    })),
    image: z.string(),
    dateAdded: z.string()
  })
});

export const collections = {
  tools
};
