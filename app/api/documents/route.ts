import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const docsPath = path.join(process.cwd(), 'public', 'docs');
    
    // Check if the docs directory exists
    if (!fs.existsSync(docsPath)) {
      return NextResponse.json({ documents: [] });
    }

    // Read all files in the docs directory
    const files = fs.readdirSync(docsPath);
    
    const documents = files
      .filter(file => {
        const filePath = path.join(docsPath, file);
        const stats = fs.statSync(filePath);
        return stats.isFile() && !file.startsWith('.');
      })
      .map(file => {
        const filePath = path.join(docsPath, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file.replace(/\.(md|txt|pdf)$/, ''),
          filename: file,
          path: `/docs/${file}`,
          size: stats.size,
          lastModified: stats.mtime.toISOString().split('T')[0],
          type: path.extname(file).substring(1) || 'unknown'
        };
      })
      .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error reading documents:', error);
    return NextResponse.json(
      { error: 'Failed to read documents' },
      { status: 500 }
    );
  }
}
