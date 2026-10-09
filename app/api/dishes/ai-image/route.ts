import { NextRequest, NextResponse } from 'next/server';
import { getDishVisualAssets } from '@/lib/dishAssets';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dishName = searchParams.get('dish') || searchParams.get('name') || searchParams.get('q') || 'Special Dish';
    const rawImage = searchParams.get('raw') === 'true';

    // Resolve accurate visual assets (AI generated PNG prioritized)
    const visual = getDishVisualAssets(dishName);
    const imagePath = visual.plateImage || '/images/eating/mango_mastani_dish.png';

    // If client requested the raw image binary directly (e.g. for <img src="..." />)
    if (rawImage || req.headers.get('accept')?.includes('image/')) {
      try {
        const cleanRelative = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
        const fullPath = path.join(process.cwd(), 'public', cleanRelative);
        if (fs.existsSync(fullPath)) {
          const buffer = fs.readFileSync(fullPath);
          const ext = path.extname(fullPath).toLowerCase();
          const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, immutable'
            }
          });
        }
      } catch (err) {
        console.warn('Raw image stream fallback:', err);
      }
    }

    return NextResponse.json(
      {
        success: true,
        dishName,
        image: imagePath,
        flyingImage: visual.flyingImage,
        format: imagePath.endsWith('.png') ? 'png' : 'jpg',
        isAiGenerated: true
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400'
        }
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: true,
        dishName: 'Dish',
        image: '/images/eating/mango_mastani_dish.png',
        flyingImage: '/images/eating/mango_mastani_dish.png',
        format: 'png',
        isAiGenerated: true
      },
      { status: 200 }
    );
  }
}
