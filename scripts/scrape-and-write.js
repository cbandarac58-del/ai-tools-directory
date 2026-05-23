import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure target output directory exists
const outputDir = path.join(__dirname, '../src/content/tools');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Fallback AI tools data in case scraper gets blocked or we want to pre-seed
const fallbackTools = [
  {
    title: "Cursor",
    slug: "cursor",
    description: "An AI-first code editor built on top of VS Code, featuring inline generation, codebase chat, and auto-debugging.",
    category: "Development",
    subCategory: "AI Code Editors",
    pricingType: "Freemium",
    websiteUrl: "https://cursor.com",
    tags: ["coding", "developer", "ide", "vscode"]
  },
  {
    title: "Perplexity AI",
    slug: "perplexity",
    description: "A conversational search engine that answers queries using natural language and provides cited sources in real-time.",
    category: "Search",
    subCategory: "AI Search Engines",
    pricingType: "Freemium",
    websiteUrl: "https://perplexity.ai",
    tags: ["search", "research", "chatgpt-alternative", "citations"]
  },
  {
    title: "Flux.1",
    slug: "flux-1",
    description: "A state-of-the-art open-weights image generation model developed by Black Forest Labs, offering exceptional text rendering and detail.",
    category: "Design",
    subCategory: "AI Image Generators",
    pricingType: "Free",
    websiteUrl: "https://blackforestlabs.ai",
    tags: ["image-generator", "open-source", "stable-diffusion", "creative"]
  },
  {
    title: "ElevenLabs",
    slug: "elevenlabs",
    description: "A leading AI voice generator and text-to-speech software that creates realistic voice clones and synthetic speech in multiple languages.",
    category: "Audio",
    subCategory: "Voice Cloning",
    pricingType: "Freemium",
    websiteUrl: "https://elevenlabs.io",
    tags: ["text-to-speech", "voice-cloning", "audiobook", "dubbing"]
  },
  {
    title: "NotebookLM",
    slug: "notebooklm",
    description: "An experimental personalized AI collaborator by Google, allowing users to upload documents and generate podcasts, summaries, and notes.",
    category: "Productivity",
    subCategory: "AI Assistants",
    pricingType: "Free",
    websiteUrl: "https://notebooklm.google",
    tags: ["notes", "google", "summarization", "audio-overview"]
  },
  {
    title: "v0.dev",
    slug: "v0",
    description: "A generative UI system by Vercel that produces clean, copy-pasteable React, Tailwind CSS, and HTML components from text prompts.",
    category: "Development",
    subCategory: "AI UI Generators",
    pricingType: "Freemium",
    websiteUrl: "https://v0.dev",
    tags: ["ui-generator", "nextjs", "react", "tailwind"]
  },
  {
    title: "Runway Gen-3 Alpha",
    slug: "runway-gen3",
    description: "A high-fidelity video generation model that converts text prompts or images into realistic video clips.",
    category: "Video",
    subCategory: "AI Video Generators",
    pricingType: "Paid",
    websiteUrl: "https://runwayml.com",
    tags: ["video-generator", "film", "vfx", "creative"]
  },
  {
    title: "Suno",
    slug: "suno",
    description: "An AI music generator that creates complete songs with lyrics, vocals, and instrumentation from simple text prompts.",
    category: "Audio",
    subCategory: "AI Music Creators",
    pricingType: "Freemium",
    websiteUrl: "https://suno.com",
    tags: ["music", "songwriting", "vocals", "audio"]
  },
  {
    title: "Claude 3.5 Sonnet",
    slug: "claude-sonnet",
    description: "Anthropic's most intelligent LLM setting new benchmarks for coding, multi-step reasoning, and visual analysis.",
    category: "Chatbots",
    subCategory: "AI Assistants",
    pricingType: "Freemium",
    websiteUrl: "https://anthropic.com",
    tags: ["anthropic", "llm", "coding", "reasoning"]
  },
  {
    title: "Luma Dream Machine",
    slug: "luma-dream-machine",
    description: "A rapid, high-fidelity video generation model that creates realistic, cinematic 3D/2D videos from text and images.",
    category: "Video",
    subCategory: "AI Video Generators",
    pricingType: "Freemium",
    websiteUrl: "https://lumalabs.ai/dream-machine",
    tags: ["video-generator", "cinema", "3d", "luma"]
  }
];

// Helper to scrape Product Hunt RSS feed
async function scrapeProductHuntRSS() {
  console.log("Attempting to scrape Product Hunt RSS Feed...");
  try {
    const res = await fetch("https://www.producthunt.com/feed", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const xml = await res.text();
    const $ = cheerio.load(xml, { xmlMode: true });
    const items = [];
    
    $('item').each((i, el) => {
      const title = $(el).find('title').text();
      const link = $(el).find('link').text();
      const descText = $(el).find('description').text() || '';
      // Parse description HTML if it exists, otherwise use raw text
      const cleanDesc = cheerio.load(descText).text().trim() || descText;
      
      // Filter for AI-related items if possible
      if (
        title.toLowerCase().includes('ai') || 
        cleanDesc.toLowerCase().includes('ai ') || 
        cleanDesc.toLowerCase().includes('artificial intelligence') || 
        cleanDesc.toLowerCase().includes('machine learning')
      ) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        items.push({
          title,
          slug,
          description: cleanDesc.slice(0, 150) + (cleanDesc.length > 150 ? '...' : ''),
          category: "Productivity",
          subCategory: "AI Tools",
          pricingType: "Freemium",
          websiteUrl: link.split('?')[0] || "https://producthunt.com",
          tags: ["scraped", "ai", "product-hunt"]
        });
      }
    });
    
    console.log(`Successfully scraped ${items.length} AI tools from Product Hunt RSS.`);
    return items;
  } catch (err) {
    console.warn("Failed to scrape Product Hunt RSS feed. Detail:", err.message);
    return [];
  }
}

// Generate fallback reviews locally using pre-defined templates (for offline mode/no API key)
function generateLocalReview(tool) {
  const features = [
    `Easy-to-use interface built specifically for ${tool.category.toLowerCase()} workflows.`,
    `Advanced algorithm optimize execution speed, saving hours of manual labor.`,
    `Integrated sharing and collaboration tools for teams of all sizes.`,
    `Seamless export compatibility with standard industry formats.`
  ];
  
  const pros = [
    `Extremely fast and intuitive interface.`,
    `High-quality outputs customized to user needs.`,
    `Excellent documentation and developer resources.`
  ];

  const cons = [
    `Requires a stable internet connection for operations.`,
    `Higher tiers can be expensive for independent creators.`
  ];

  const longReview = `${tool.title} is a groundbreaking platform in the ${tool.category} sector. In our hands-on review, we found that it delivers exceptional performance by leveraging modern AI technology. The user onboarding is highly polished, enabling both novices and experienced professionals to get started within minutes. The core strengths of ${tool.title} lie in its robust feature set and clean design, which make it stand out from competitors. While there are a few minor limitations like pricing at the enterprise tier, the overall value proposition is extremely compelling. We highly recommend ${tool.title} for anyone looking to scale their creative or technical output.`;

  const faq = [
    {
      question: `Is ${tool.title} free to use?`,
      answer: `Yes, ${tool.title} is offered under a ${tool.pricingType} model, meaning it has accessible features or tiers for standard users.`
    },
    {
      question: `Who is the target audience for ${tool.title}?`,
      answer: `${tool.title} is designed for professionals and hobbyists looking to enhance their workflow in the ${tool.category.toLowerCase()} domain.`
    }
  ];

  return {
    longReview,
    features,
    pros,
    cons,
    faq,
    tags: tool.tags || [tool.title.toLowerCase(), "ai-tool", tool.category.toLowerCase()]
  };
}

// Main processing function
async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  let useGemini = false;
  let ai = null;

  if (apiKey) {
    console.log("GEMINI_API_KEY detected. Utilizing Google Gemini API for unique reviews!");
    try {
      ai = new GoogleGenAI({ apiKey });
      useGemini = true;
    } catch (err) {
      console.error("Failed to initialize Google Gemini API:", err.message);
    }
  } else {
    console.log("No GEMINI_API_KEY found. Running in OFFLINE/MOCK generator mode...");
  }

  // Combine scraped tools and fallback tools
  const scraped = await scrapeProductHuntRSS();
  const toolsToProcess = [...scraped, ...fallbackTools];
  
  // Deduplicate by slug
  const uniqueToolsMap = new Map();
  toolsToProcess.forEach(t => uniqueToolsMap.set(t.slug, t));
  const tools = Array.from(uniqueToolsMap.values());

  console.log(`Processing total of ${tools.length} unique tools...`);

  for (const tool of tools) {
    const filePath = path.join(outputDir, `${tool.slug}.md`);
    if (fs.existsSync(filePath)) {
      console.log(`File for ${tool.title} (${tool.slug}.md) already exists. Skipping.`);
      continue;
    }

    console.log(`Generating review for ${tool.title}...`);
    let aiData;

    if (useGemini) {
      try {
        const prompt = `
You are an expert tech reviewer. Generate a professional, search-engine-optimized, human-like product review and detailed data for the following tool:
Name: ${tool.title}
Description: ${tool.description}
Category: ${tool.category} / ${tool.subCategory}
Website: ${tool.websiteUrl}

You must return a JSON object with EXACTLY the following keys:
1. "longReview": string, a comprehensive 3-paragraph (around 150-250 words) deep-dive product review detailing what the tool does, how it performs, and who it is best for. Do not include markdown formatting inside this string.
2. "features": array of 4-5 strings, detailing key features of the tool.
3. "pros": array of 3-4 strings, outlining main advantages.
4. "cons": array of 2-3 strings, outlining main disadvantages.
5. "faq": array of objects, where each object has "question" (string) and "answer" (string). Give 2-3 common Q&As.
6. "tags": array of 3-5 strings, lowercase search tags.

Output only valid JSON. Do not add markdown backticks around the JSON.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text.trim());
        aiData = {
          longReview: parsed.longReview || tool.description,
          features: parsed.features || [],
          pros: parsed.pros || [],
          cons: parsed.cons || [],
          faq: parsed.faq || [],
          tags: parsed.tags || []
        };
      } catch (err) {
        console.warn(`Gemini generation failed for ${tool.title}, falling back to local review. Error:`, err.message);
        aiData = generateLocalReview(tool);
      }
    } else {
      aiData = generateLocalReview(tool);
    }

    // Default image if none exists
    const randomImageId = Math.floor(Math.random() * 1000);
    const imageUrl = `https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80&sig=${randomImageId}`;

    const todayStr = new Date().toISOString().split('T')[0];

    const markdownContent = `---
title: ${JSON.stringify(tool.title)}
slug: ${JSON.stringify(tool.slug)}
description: ${JSON.stringify(tool.description)}
longReview: ${JSON.stringify(aiData.longReview)}
category: ${JSON.stringify(tool.category)}
subCategory: ${JSON.stringify(tool.subCategory)}
pricingType: ${JSON.stringify(tool.pricingType)}
tags: ${JSON.stringify(aiData.tags)}
websiteUrl: ${JSON.stringify(tool.websiteUrl)}
features: ${JSON.stringify(aiData.features)}
pros: ${JSON.stringify(aiData.pros)}
cons: ${JSON.stringify(aiData.cons)}
faq: ${JSON.stringify(aiData.faq)}
image: ${JSON.stringify(imageUrl)}
dateAdded: ${JSON.stringify(todayStr)}
---

${aiData.longReview}
`;

    fs.writeFileSync(filePath, markdownContent, 'utf-8');
    console.log(`Successfully created ${filePath}`);
    
    // Slight delay to avoid hitting rate limits on Gemini
    if (useGemini) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log("Tool content generation process complete!");
}

run();
