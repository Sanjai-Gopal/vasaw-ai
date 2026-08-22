const fs = require('fs');
const path = require('path');

const sites = [
  'nagerkovil-arya-bhavan-7e7a7d98',
  'welcomcafe-kovai-beb1bf5f',
  'kovai-kitchen-fac214d9',
];

function fixLayoutTsx(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix: export const metadata = Metadata = {  ->  export const metadata: Metadata = {
  content = content.replace(
    /export const metadata = Metadata = \{/,
    'export const metadata: Metadata = {'
  );
  
  // Fix: export default function RootLayout({ children })  ->  export default function RootLayout({ children }: { children: React.ReactNode })
  content = content.replace(
    /export default function RootLayout\(\{ children \}\)/,
    'export default function RootLayout({ children }: { children: React.ReactNode })'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed:', filePath);
}

function fixPageTsx(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix component function signatures to add proper types
  // function HeroSection({ business }) -> function HeroSection({ business }: { business: Business })
  content = content.replace(
    /function (\w+)Section\(\{ business \}\)/g,
    'function $1Section({ business }: { business: Business })'
  );
  
  // Fix map callbacks: (service: string, i: number) -> (service: string, i: number)
  content = content.replace(
    /\.map\(\(service: string, i: number\) =>/g,
    '.map((service: string, i: number) =>'
  );
  
  content = content.replace(
    /\.map\(\(item: \{ day: string; hours: string \}, i: number\) =>/g,
    '.map((item: { day: string; hours: string }, i: number) =>'
  );
  
  // Fix iframe allowFullScreen="" -> allowFullScreen
  content = content.replace(
    /allowFullScreen=""\s*/g,
    'allowFullScreen '
  );
  
  // Fix loading="lazy" -> loading="lazy"
  // This is fine
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed:', filePath);
}

function fixContactPageTsx(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Fix component function signatures
  content = content.replace(
    /function (\w+)Section\(\{ business \}\)/g,
    'function $1Section({ business }: { business: Business })'
  );
  
  content = content.replace(
    /\.map\(\(item: \{ day: string; hours: string \}, i: number\) =>/g,
    '.map((item: { day: string; hours: string }, i: number) =>'
  );
  
  content = content.replace(
    /allowFullScreen=""\s*/g,
    'allowFullScreen '
  );
  
  // Fix ContactPage function signature
  content = content.replace(
    /export default function ContactPage\(\)/,
    'export default function ContactPage()'
  );
  
  fs.writeFileSync(filePath, content);
  console.log('Fixed:', filePath);
}

for (const site of sites) {
  const baseDir = path.join('generated-websites', site, 'src', 'app');
  
  fixLayoutTsx(path.join(baseDir, 'layout.tsx'));
  fixPageTsx(path.join(baseDir, 'page.tsx'));
  fixContactPageTsx(path.join(baseDir, 'contact', 'page.tsx'));
  
  // Rebuild
  console.log('Rebuilding', site, '...');
  const { execSync } = require('child_process');
  try {
    execSync('npm run build', { cwd: path.join('generated-websites', site), stdio: 'inherit' });
    console.log('Build successful for', site);
  } catch (e) {
    console.error('Build failed for', site);
  }
}

console.log('All fixes applied');