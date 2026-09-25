export function parseAccessTokenPayload(accessToken) {
  if (!accessToken) return null
  try {
    const segment = accessToken.split('.')[1] || ''
    const parsed = JSON.parse(atob(segment))
    // #region agent log
    fetch('http://127.0.0.1:7816/ingest/dbbb5d66-7a06-4fee-b792-2e85a6c2258b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a93659'},body:JSON.stringify({sessionId:'a93659',hypothesisId:'H5',location:'token.js:parseAccessTokenPayload',message:'jwt payload parse',data:{ok:true,hasUrlChars:/[-_]/.test(segment),hasExp:Boolean(parsed?.exp)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return parsed
  } catch {
    // #region agent log
    fetch('http://127.0.0.1:7816/ingest/dbbb5d66-7a06-4fee-b792-2e85a6c2258b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a93659'},body:JSON.stringify({sessionId:'a93659',hypothesisId:'H5',location:'token.js:parseAccessTokenPayload',message:'jwt payload parse',data:{ok:false,hasUrlChars:/[-_]/.test((accessToken.split('.')[1]||''))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return null
  }
}

export function getAccessTokenExpiryMs(accessToken) {
  const payload = parseAccessTokenPayload(accessToken)
  if (!payload?.exp) return null
  return payload.exp * 1000
}

export function isAccessTokenExpired(accessToken, skewMs = 0) {
  const expiry = getAccessTokenExpiryMs(accessToken)
  if (!expiry) return true
  return Date.now() >= expiry - skewMs
}
