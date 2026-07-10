// Automatically determine the backend URL
// If opened directly from file system (file://), use localhost:20000
// If accessed via a server (http:// or https://), use relative paths
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:20000' 
    : window.location.origin;
