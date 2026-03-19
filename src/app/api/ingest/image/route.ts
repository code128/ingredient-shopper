import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(request: Request) {
  try {
    const { image, mimeType } = await request.json();
    
    if (!image) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Clean base64 string if it contains data URI prefix
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const resolvedMimeType = mimeType || 'image/jpeg';

    // 1. extract ingredients with Gemini Vision
    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: resolvedMimeType,
            data: base64Data
          }
        },
        'Extract the recipe title and ingredients list from this image. For each ingredient, extract the name (standardized), quantity, unit, original text, and a food category (e.g., Produce, Dairy, Meat, Pantry, Frozen, Spices).'
      ],
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
                  name: { type: 'string', description: 'Standardized ingredient name' },
                  quantity: { type: 'number', description: 'Numeric quantity' },
                  unit: { type: 'string', description: 'e.g., cups, tbsp' },
                  originalText: { type: 'string', description: 'The text as it appears in the image' },
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

    // 2. Save to Database
    const recipe = await prisma.recipe.create({
      data: {
        title: parsed.title,
        sourceUrl: 'Uploaded Image',
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
    console.error('Image Ingest Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
