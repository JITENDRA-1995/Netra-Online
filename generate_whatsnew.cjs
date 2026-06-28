const fs = require('fs');
const path = require('path');

try {
  const changelogPath = path.join(__dirname, 'CHANGELOG.md');
  const changelog = fs.readFileSync(changelogPath, 'utf8');

  // Split by session headers: "## "
  const sessions = changelog.split(/\n## /);
  
  if (sessions.length < 2) {
    console.warn("No sessions found in CHANGELOG.md");
    process.exit(0);
  }

  // The first section after split is the intro text, the second (index 1) is the latest session since the file starts with "## Session"
  const latestSessionText = sessions[1];
  
  // Extract session header, e.g. "Session 4 — 2026-06-28 (Magic Link / Token Auto-Login)"
  const lines = latestSessionText.split('\n');
  const header = lines[0].trim();
  
  // Extract version from header (e.g. Session 4) or just use the header as the version tag
  const versionKey = header.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  // Parse jobs/bullets
  const jobs = [];
  let currentJob = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if it's a job header, e.g., "### ✅ JOB-015 — Secure Magic Link Auto-Login"
    if (line.startsWith('### ')) {
      if (currentJob) {
        jobs.push(currentJob);
      }
      const title = line
        .replace(/^###\s*(?:✅|❌|🔧|✨)?\s*/, '')
        .replace(/\*\*/g, '')
        .replace(/`/g, '')
        .trim();
      currentJob = {
        title,
        description: []
      };
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      // It's a bullet point description
      if (currentJob) {
        const cleaned = line
          .replace(/^[-*]\s*/, '')
          .replace(/\*\*/g, '')
          .replace(/`/g, '')
          .trim();
        currentJob.description.push(cleaned);
      }
    } else {
      // It's normal text or sub-bullet, append to the description
      if (currentJob && currentJob.description.length > 0) {
        const lastIdx = currentJob.description.length - 1;
        const cleaned = line
          .replace(/\*\*/g, '')
          .replace(/`/g, '')
          .trim();
        currentJob.description[lastIdx] += ' ' + cleaned;
      }
    }
  }
  
  if (currentJob) {
    jobs.push(currentJob);
  }

  // Determine summary message
  const summary = `Netra OS updates in ${header.split(' — ')[0] || 'this version'}.`;

  const result = {
    version: versionKey,
    title: header,
    summary,
    features: jobs.map(j => ({
      title: j.title,
      description: j.description.map(d => `• ${d}`).join('\n')
    }))
  };

  const outputPath = path.join(__dirname, 'src', 'components', 'whatsnew.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Successfully generated whatsnew.json for ${header}`);
} catch (err) {
  console.error("Failed to generate whatsnew.json:", err);
}
