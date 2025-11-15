// Save as /api/submit.js
// Requires env vars: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_BRANCH (default main)

const { Buffer } = require('buffer');

module.exports = async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({message:'Method not allowed'});
  const body = req.body;
  if(!body || !body.name || !body.phone) return res.status(400).json({message:'name and phone required'});

  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;
  if(!owner || !repo || !token) return res.status(500).json({message:'Missing GitHub env vars'});

  // helper to call GitHub contents API
  async function getFile(path){
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`;
    const r = await fetch(url,{headers:{Authorization:`token ${token}`,Accept:'application/vnd.github.v3+json'}});
    if(r.status===404) return null;
    if(!r.ok) throw new Error('GitHub GET failed: '+r.status);
    return r.json();
  }

  async function putFile(path,content,sha, message){
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
    const body = {message: message || `Update ${path}`, content: Buffer.from(content).toString('base64'), branch};
    if(sha) body.sha = sha;
    const r = await fetch(url,{method:'PUT',headers:{Authorization:`token ${token}`,Accept:'application/vnd.github.v3+json','Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok) {
      const txt = await r.text();
      throw new Error('GitHub PUT failed: '+r.status+' '+txt);
    }
    return r.json();
  }

  try{
    // 1) Update data/data.json
    const dataPath = 'data/data.json';
    const existing = await getFile(dataPath);
    let dataArr = [];
    if(existing && existing.content){
      const decoded = Buffer.from(existing.content,'base64').toString();
      dataArr = JSON.parse(decoded || '[]');
    }
    dataArr.push(body);
    const newJson = JSON.stringify(dataArr, null, 2);
    await putFile(dataPath, newJson, existing ? existing.sha : undefined, `Add entry for ${body.name}`);

    // 2) Append to monthly VCF
    const now = new Date();
    const year = now.getUTCFullYear();
    const mm = String(now.getUTCMonth()+1).padStart(2,'0');
    const vcfPath = `vcf/${year}_${mm}.vcf`;
    const vcfEntry = `BEGIN:VCARD\nVERSION:3.0\nFN:${escapeVCard(body.name)}\nTEL;TYPE=CELL:${escapeVCard(body.phone)}\nEND:VCARD\n`;

    const existingV = await getFile(vcfPath);
    let vContent = '';
    if(existingV && existingV.content){
      vContent = Buffer.from(existingV.content,'base64').toString();
      vContent += vcfEntry;
    } else {
      vContent = vcfEntry;
    }
    await putFile(vcfPath, vContent, existingV ? existingV.sha : undefined, `Add vCard for ${body.name}`);

    return res.status(200).json({ok:true});
  }catch(err){
    console.error(err);
    return res.status(500).json({message: err.message});
  }
}

function escapeVCard(s){
  if(!s) return '';
  return s.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
      }
