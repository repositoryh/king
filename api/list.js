// Save as /api/list.js
const { Buffer } = require('buffer');

module.exports = async function handler(req,res){
  if(req.method !== 'GET') return res.status(405).json({message:'Method not allowed'});
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;
  if(!owner || !repo || !token) return res.status(500).json({message:'Missing GitHub env vars'});

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/data/data.json?ref=${branch}`;
  try{
    const r = await fetch(url,{headers:{Authorization:`token ${token}`,Accept:'application/vnd.github.v3+json'}});
    if(r.status===404) return res.status(200).json([]);
    if(!r.ok) throw new Error('GitHub GET failed '+r.status);
    const json = await r.json();
    const decoded = Buffer.from(json.content,'base64').toString();
    const data = JSON.parse(decoded||'[]');
    return res.status(200).json(data);
  }catch(err){
    console.error(err);
    return res.status(500).json({message:err.message});
  }
}
