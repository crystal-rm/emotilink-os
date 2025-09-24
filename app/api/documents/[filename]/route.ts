import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;
    const filePath = path.join(process.cwd(), 'public', 'docs', filename);
    
    // Security check: ensure the file is within the docs directory
    const docsPath = path.join(process.cwd(), 'public', 'docs');
    const resolvedPath = path.resolve(filePath);
    const resolvedDocsPath = path.resolve(docsPath);
    
    if (!resolvedPath.startsWith(resolvedDocsPath)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Read file content
    const content = fs.readFileSync(filePath, 'utf-8');
    const stats = fs.statSync(filePath);
    
    return NextResponse.json({
      content,
      filename,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
      type: path.extname(filename).substring(1) || 'unknown'
    });
  } catch (error) {
    console.error('Error reading document:', error);
    return NextResponse.json(
      { error: 'Failed to read document' },
      { status: 500 }
    );
  }
}
