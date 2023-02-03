export function xmlhttpRequest(method, url, rest) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method,
      url,
      onload: (response) => resolve(response),
      onerror: (error) => reject(error),
      ...rest
    })
  })
}
