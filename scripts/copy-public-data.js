#!/usr/bin/env node

/**
 * 빌드 후 public/data를 dist/data로 복사하는 스크립트
 *
 * 사용법:
 * - package.json의 postbuild:web 스크립트에서 자동 실행
 * - 또는 수동: node scripts/copy-public-data.js
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DATA = path.join(__dirname, '../public/data');
const DIST_DATA = path.join(__dirname, '../dist/data');

console.log('📦 Copying public/data to dist/data...');
console.log(`   Source: ${PUBLIC_DATA}`);
console.log(`   Target: ${DIST_DATA}`);

// public/data 폴더 존재 확인
if (!fs.existsSync(PUBLIC_DATA)) {
  console.error('❌ public/data folder does not exist!');
  console.error('   Run "npm run fetch-data" first to generate data.');
  process.exit(1);
}

// dist 폴더 확인
if (!fs.existsSync(path.join(__dirname, '../dist'))) {
  console.error('❌ dist folder does not exist!');
  console.error('   Run "npm run build:web" first.');
  process.exit(1);
}

/**
 * 디렉토리를 재귀적으로 복사
 */
function copyRecursive(src, dest) {
  // 대상 디렉토리 생성
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  // 복사 실행
  copyRecursive(PUBLIC_DATA, DIST_DATA);

  // 파일 개수 확인
  const countFiles = (dir) => {
    let count = 0;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        count += countFiles(path.join(dir, entry.name));
      } else {
        count++;
      }
    }

    return count;
  };

  const fileCount = countFiles(DIST_DATA);

  console.log(`✅ Successfully copied ${fileCount} files to dist/data/`);

  // 주요 폴더 확인
  const importantFolders = [
    'undervalued-stocks',
    'recommendations',
  ];

  console.log('\n📁 Folder structure:');
  for (const folder of importantFolders) {
    const folderPath = path.join(DIST_DATA, folder);
    if (fs.existsSync(folderPath)) {
      const files = fs.readdirSync(folderPath);
      console.log(`   ✓ ${folder}/ (${files.length} files)`);
    } else {
      console.log(`   ⚠ ${folder}/ (not found)`);
    }
  }

  // 주요 파일 확인
  const importantFiles = [
    'undervalued-stocks.json',
    'featured-stocks.json',
    'filings.json',
    'metadata.json',
  ];

  console.log('\n📄 Important files:');
  for (const file of importantFiles) {
    const filePath = path.join(DIST_DATA, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   ✓ ${file} (${sizeMB} MB)`);
    } else {
      console.log(`   ⚠ ${file} (not found)`);
    }
  }

  console.log('\n✅ Copy complete!\n');

} catch (error) {
  console.error('❌ Error copying files:', error.message);
  process.exit(1);
}
