/* ============================================
   Hardware Detector
   Detects browser & hardware info via JS APIs.
   ============================================ */

/**
 * Extract a clean GPU model name from the raw WebGL renderer string.
 * Examples:
 *   "ANGLE (NVIDIA, NVIDIA GeForce RTX 4060 Laptop GPU Direct3D11 vs_5_0 ps_5_0, D3D11)" → "GeForce RTX 4060"
 *   "ANGLE (Intel, Intel(R) UHD Graphics 770 Direct3D11 vs_5_0 ps_5_0, D3D11)" → "Intel UHD Graphics 770"
 *   "ANGLE (Qualcomm, Adreno (TM) 730, OpenGL ES 3.2)" → "Adreno 730"
 *   "Mali-G710 MP7" → "Mali-G710 MP7"
 *   "Apple GPU" → "Apple GPU"
 */
function cleanGpuName(raw) {
  if (!raw) return 'Unknown';

  let name = raw;

  // Strip ANGLE(...) wrapper — extract the second comma-separated part (the actual GPU)
  const angleMatch = raw.match(/ANGLE\s*\([^,]*,\s*([^,]+)/i);
  if (angleMatch) {
    name = angleMatch[1].trim();
  }

  // Remove Direct3D / OpenGL driver version suffixes
  name = name.replace(/\s*(Direct3D|OpenGL)\s*(ES)?\s*[\d.]+.*$/i, '');
  name = name.replace(/\s*vs_[\d_]+\s*ps_[\d_]+/i, '');
  name = name.replace(/\s*D3D\d+/i, '');

  // Remove vendor prefix duplication like "NVIDIA NVIDIA GeForce" → "NVIDIA GeForce"
  name = name.replace(/^(NVIDIA|AMD|Intel|Qualcomm)\s+\1/i, '$1');

  // Remove vendor-only prefix if the model name follows — "NVIDIA GeForce RTX 4060" → "GeForce RTX 4060"
  name = name.replace(/^NVIDIA\s+/i, '');
  name = name.replace(/^AMD\s+/i, '');

  // Clean up Intel prefix to keep it readable
  name = name.replace(/^Intel\(R\)\s*/i, 'Intel ');

  // Remove "(TM)", "(R)" markers
  name = name.replace(/\s*\((?:TM|R)\)\s*/gi, ' ');

  // Remove "Laptop GPU" suffix — keep just the model
  name = name.replace(/\s*Laptop\s*GPU/i, '');

  // Collapse whitespace
  name = name.replace(/\s+/g, ' ').trim();

  return name || raw;
}

/**
 * Detect hardware information from browser APIs.
 */
export function detectHardware() {
  const info = {
    cores: '—',
    ram: '—',
    gpu: '—',
    gpuRaw: '',
    cpuName: '',
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
        info.gpuRaw = renderer;
        info.gpu = cleanGpuName(renderer);
      } else {
        info.gpu = 'WebGL (masked)';
        info.gpuRaw = '';
      }
      // Clean up
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    }
  } catch (e) {
    info.gpu = 'Not available';
    info.gpuRaw = '';
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
