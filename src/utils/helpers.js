const fs = require('fs');
const path = require('path');

const getImageUrl = (location, filename) => {
  let baseUrl = (process.env.APP_URL || '').trim().replace(/\/+$/, '');
  if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = baseUrl.includes('localhost') ? `http://${baseUrl}` : `https://${baseUrl}`;
  }
  
  if (!filename) {
    return `${baseUrl}/logo.png`;
  }
  
  if (filename.startsWith('http://') || filename.startsWith('https://')) {
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
