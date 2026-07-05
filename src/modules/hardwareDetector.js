/* ============================================
   Hardware Detector
   Detects browser & hardware info via JS APIs.
   ============================================ */

/**
 * Detect hardware information from browser APIs.
 */
export function detectHardware() {
  const info = {
    cores: '—',
    ram: '—',
    gpu: '—',
    browser: '—',
    browserVersion: '—',
    os: '—',
    platform: '—',
  };

  // CPU Cores
  if (navigator.hardwareConcurrency) {
    info.cores = `${navigator.hardwareConcurrency} threads`;
  }

  // RAM (Chrome/Edge only)
  if (navigator.deviceMemory) {
    info.ram = `~${navigator.deviceMemory} GB`;
  } else {
    info.ram = 'N/A';
  }

  // GPU via WebGL
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        // Truncate long GPU names
        info.gpu = renderer.length > 40 ? renderer.substring(0, 40) + '…' : renderer;
      } else {
        info.gpu = 'WebGL (masked)';
      }
      // Clean up
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  } catch (e) {
    info.gpu = 'Not available';
  }

  // Browser detection from User Agent
  const ua = navigator.userAgent;
  if (ua.includes('Firefox/')) {
    const match = ua.match(/Firefox\/([\d.]+)/);
    info.browser = 'Firefox';
    info.browserVersion = match ? match[1] : '';
  } else if (ua.includes('Edg/')) {
    const match = ua.match(/Edg\/([\d.]+)/);
    info.browser = 'Edge';
    info.browserVersion = match ? match[1] : '';
  } else if (ua.includes('Chrome/')) {
    const match = ua.match(/Chrome\/([\d.]+)/);
    info.browser = 'Chrome';
    info.browserVersion = match ? match[1] : '';
  } else if (ua.includes('Safari/') && !ua.includes('Chrome')) {
    const match = ua.match(/Version\/([\d.]+)/);
    info.browser = 'Safari';
    info.browserVersion = match ? match[1] : '';
  } else {
    info.browser = 'Unknown';
  }

  // OS Detection
  if (ua.includes('Windows NT 10')) info.os = 'Windows 10/11';
  else if (ua.includes('Windows')) info.os = 'Windows';
  else if (ua.includes('Mac OS X')) info.os = 'macOS';
  else if (ua.includes('Linux')) info.os = 'Linux';
  else if (ua.includes('Android')) info.os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone')) info.os = 'iOS';
  else info.os = 'Unknown';

  info.platform = navigator.platform || 'Unknown';

  return info;
}

/**
 * Get a compact summary string for the navbar badge.
 */
export function getHardwareSummary(info) {
  const parts = [];
  if (info.cores !== '—') parts.push(info.cores);
  if (info.browser !== 'Unknown') parts.push(`${info.browser} ${info.browserVersion.split('.')[0]}`);
  return parts.join(' • ') || 'Hardware info unavailable';
}
