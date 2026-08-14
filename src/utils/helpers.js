const fs = require('fs');
const path = require('path');

const getImageUrl = (location, filename) => {
  const baseUrl = process.env.APP_URL; // Now guaranteed to exist due to index.js check
  
  if (!filename) {
    return `${baseUrl}/logo.png`;
  }
  
  if (filename.startsWith('http')) {
    return filename;
  }
  
  // Check if file exists locally ONLY if opted in via .env
  if (process.env.USE_LOCAL_IMAGES === 'true') {
    const localPath = path.join(__dirname, '../../public/frontend/images', location, filename);
    if (fs.existsSync(localPath)) {
      return `${baseUrl}/frontend/images/${location}/${filename}`;
    }
  }
  
  // Return dynamic Supabase URL proxied through our backend
  return `${baseUrl}/api/media/${location}/${filename}`;
};

module.exports = {
  getImageUrl
};
