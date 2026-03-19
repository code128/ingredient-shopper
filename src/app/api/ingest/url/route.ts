import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import * as cheerio from 'cheerio';
import prisma from '@/lib/prisma';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // 1. Fetch the URL content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();

    // 2. Clean HTML with Cheerio to reduce token count
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, iframe, noscript, .ads, .sidebar').remove();
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    // 3. extract ingredients with Gemini
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract the recipe title and ingredients list from the following text.
      For each ingredient, extract the name (deduplicated/standardized), quantity, unit, original text, and a food category (e.g., Produce, Dairy, Meat, Pantry, Frozen, Spices).

      Text: ${text.substring(0, 60000)}`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string', description: 'Standardized ingredient name, e.g., "garlic" instead of "garlic cloves"' },
                  quantity: { type: 'number', description: 'Numeric quantity, convert fractions to decimals if possible' },
                  unit: { type: 'string', description: 'e.g., cups, tbsp, g, lb' },
                  originalText: { type: 'string', description: 'The exact line from the recipe' },
                  category: { type: 'string', description: 'Categorize as: Produce, Dairy, Meat, Pantry, Frozen, Spices, Bakery, or Other' }
                },
                required: ['name', 'originalText', 'category']
              }
            }
          },
          required: ['title', 'ingredients']
        }
      }
    });

    const jsonText = aiResponse.text;
    if (!jsonText) {
      throw new Error('Gemini failed to return structured data');
    }

    const parsed = JSON.parse(jsonText);

    // 4. Save to Database using Prisma
    const recipe = await prisma.recipe.create({
      data: {
        title: parsed.title,
        sourceUrl: url,
        ingredients: {
          create: parsed.ingredients.map((ing: any) => ({
            quantity: ing.quantity || null,
            unit: ing.unit || null,
            originalText: ing.originalText,
            ingredient: {
              connectOrCreate: {
                where: { name: ing.name.toLowerCase() },
                create: {
                  name: ing.name.toLowerCase(),
                  category: ing.category
                }
              }
            }
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, recipe });

  } catch (error: any) {
    console.error('Ingest Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
