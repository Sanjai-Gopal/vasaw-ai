import fs from 'fs';
import path from 'path';

const SCREENS = [
  {
    id: '63015dd03744404ea788866ee0ecb4f0',
    slug: 'automation',
    title: 'VASAW AI — Automation (Interactive Light/Dark)',
    screenshotUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1XJVX7CfPFo8yMrPOOk_f1iKAoFn7xUhk3dCgMj6EpkYVkVnXjRs119gLf1_zs0udUFp_bPJxaf5nIxkdxJpAv-_7lu7odn4NJMqU8085agkHoinbqhvjm87nqCngLSl3EGVQ4TIH6r1OERhiA9EjGWKolpZD2T91VjqJqEcUuA9nkYbfMvxKg0fOn9e-Fvu0KXWOh49p8fr7DwVoqVxqZm-u0migAcneAFS3uYx_cTkb4sb4cnBNp_fA',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1YjM1ZTVkMjRjODkwMzgzYTEyMzBjMjBkYzYyEgsSBxD9vteOkxoYAZIBIgoKcHJvamVjdF9pZBIUQhI1NjQ4OTc1NjM3MjI0MTc4MzM&filename=&opi=89354086'
  },
  {
    id: '8f503bccdb254ff8b8c877944a49139c',
    slug: 'agents-fleets',
    title: 'VASAW AI — Agents & Fleets (Interactive Light/Dark)',
    screenshotUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1WU2-h3HUs0SXvvNMU-9096aJoltI3HPxKSHcO0t7ZktBrU2WAbx9akU-_dfJbjvPQetwW4_0Vgwr7XRK_56V-3esBwM5ClCweYXWSHt9i2IK2pAedWehcVENSY5UghtPYIwxTfn7yALjnVLArWAf2oCcWzAOUfT-s9KMxEPu6cVl2BOAHCs83ClWCtzUFcZBBiiCe1LR5KW8CK7f5Hf-DKgLlJvXtcu2pyHpoD4zw0gNqHjC7-P2yXXw',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1YjM1ZTU5ODg1MTUwMWI0ZTdhZmZkMTRlZjMyEgsSBxD9vteOkxoYAZIBIgoKcHJvamVjdF9pZBIUQhI1NjQ4OTc1NjM3MjI0MTc4MzM&filename=&opi=89354086'
  },
  {
    id: 'cf7253490bb54708aa69c4503e99cdb6',
    slug: 'messages-inbox',
    title: 'VASAW AI — Messages & Inbox (Interactive Light/Dark)',
    screenshotUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1VnK1YOzGYadF8IObH7BHy1C_IxUJ48kyLgcwxBxzIVh5Kv2vCNJ6ijwy8NMfE65oOLAGdb4mNexU3uVE0qRkXtuk6cxM8Uxq8hnnq6MyA2ZTxV7hma6XLPBa_VQYMyuyU83hhF69BKOsYZpubSlfOChe2vYDOt9s76lrqgo3v9D2UpXF0PDzjsBM9q_Gg_OPfTb8_ukcTef7IcMxFfC6yGKl3pCvVBVMKcLtcC0cNP8k1VsCgoJKToWQ',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1YjM1ZTVhYmViYTQwMWI0ZTNiNmM2MTk5NjczEgsSBxD9vteOkxoYAZIBIgoKcHJvamVjdF9pZBIUQhI1NjQ4OTc1NjM3MjI0MTc4MzM&filename=&opi=89354086'
  },
  {
    id: '23a7db2644614d3ea1c5406252c77f31',
    slug: 'command-center',
    title: 'VASAW AI — Command Center (Interactive Light/Dark)',
    screenshotUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1XfEAgoggQ2KV4r0Vp04RQE6ld9r2SYfT8DiPnTRV0uGBIePMbztv9Xqsh1u7TZniTnJe44vr9WYYa6xqbvPvCMzGG7hu7qRL9wJCUfBbYMoA-0MkSVeEUZWjWjFqHy_3Y0x6Nxj85JJlEyzFIjiTU2l45eZwdDy8Zb7Zy2RDwEtLtMYkhT12IN1BcBs9CwiUF49bzlEBHNOoO5KkbHZCmYYKGQwWSCxo_4PtO9e4z0dsNBo7E3A6er',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1YjM1ZTVkZmU3YjUwMWI0ZTNiNmM2MTk5NjczEgsSBxD9vteOkxoYAZIBIgoKcHJvamVjdF9pZBIUQhI1NjQ4OTc1NjM3MjI0MTc4MzM&filename=&opi=89354086'
  },
  {
    id: 'e619518cd628467c92f51ee5c1b344fb',
    slug: 'campaigns',
    title: 'VASAW AI — Campaigns (Interactive Light/Dark)',
    screenshotUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1XCRUwq5CJvXjutpUOIOUnWfSwMUj4aojHQVSv3dfK0RJz75dGapc-JJe80DlmOQJoMpuxNrKNElbv-TBwKqniYlssYQ4MKrs0wpMQNfICNYZ2QqruuJkTVE5IzI4uVEV4Wczqqybs9T6oxY6DSqu2mlqLeMJ05LoXOZis032RKxwZDMLVgD3a0bkIvLJ22Di85tcSvDGs1EoryhEXwozBhkKMnLtip4_4AU2dSjdQ57PV3UFZsl7-PfQ',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1YjM1YjFkMWYyNWMwNzc5OWVhZDU4MThkYjAyEgsSBxD9vteOkxoYAZIBIgoKcHJvamVjdF9pZBIUQhI1NjQ4OTc1NjM3MjI0MTc4MzM&filename=&opi=89354086'
  },
  {
    id: '8530a32f6dc24bafbc8426f0a854a56d',
    slug: 'leads-pipeline',
    title: 'VASAW AI — Leads & Pipeline (Clean & Aligned)',
    screenshotUrl: 'https://lh3.googleusercontent.com/aida/AEtjO1Uzplp2_y65BL6iI9XEGimY0mdLZTk2K_dGklK7HBKAUXfxmqvV1Y3Cu_UX7Clp8YRcpuQWj5tOHRDnpHFhykfHccat8aEXtUfObABYdEUsmfnyVFD7AFfOttszoxqgnTAbSUXpy2_qBYg_mjP3HO6UKnLXFOxPkBkKTaYO5KPliblycTRLAfcChWX0Isn0MthCmqXxZAGX8K72uH31s3hAnJSz5WWebX0xEOkZxLCMi8KlwXZ6h0PLBw',
    htmlUrl: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ6Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpZCiVodG1sXzAwMDY1YjM1ZTkxZWNlYjAwMmE5OWYxMWM5MGIwMGMyEgsSBxD9vteOkxoYAZIBIgoKcHJvamVjdF9pZBIUQhI1NjQ4OTc1NjM3MjI0MTc4MzM&filename=&opi=89354086'
  }
];

const exportDir = path.resolve(process.cwd(), 'stitch-exports');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

async function downloadFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  return buffer.length;
}

(async () => {
  console.log(`Starting Stitch Screen Asset Download for Project: 564897563722417833...`);
  const manifest = [];

  for (const screen of SCREENS) {
    console.log(`\n⬇️ Downloading Screen [${screen.title}]...`);
    const imgFilename = `${screen.slug}.png`;
    const htmlFilename = `${screen.slug}.html`;
    const imgPath = path.join(exportDir, imgFilename);
    const htmlPath = path.join(exportDir, htmlFilename);

    try {
      const imgBytes = await downloadFile(screen.screenshotUrl, imgPath);
      console.log(`  ✓ Image saved: ${imgFilename} (${(imgBytes / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ Image download failed:`, err.message);
    }

    try {
      const htmlBytes = await downloadFile(screen.htmlUrl, htmlPath);
      console.log(`  ✓ HTML saved: ${htmlFilename} (${(htmlBytes / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`  ✗ HTML download failed:`, err.message);
    }

    manifest.push({
      id: screen.id,
      slug: screen.slug,
      title: screen.title,
      imageFile: imgFilename,
      htmlFile: htmlFilename
    });
  }

  const manifestPath = path.join(exportDir, 'screens-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  console.log(`\n🎉 All 6 Stitch screens downloaded successfully to: ${exportDir}`);
  console.log(`Manifest: ${manifestPath}`);
})();
