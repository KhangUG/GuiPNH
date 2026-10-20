(() => {
  'use strict';

  /**
   * Personalized greeting from URL (lightweight):
   *   ?to=Lan
   *   ?to=Lan&from=Anh
   *   ?to=Lan&msg=Chúc+mày...&from=Anh
   *   ?to=Lan&title=Mong+những+điều...&msg=...&sign=Thương+mến
   *
   * Use encodeURIComponent for Vietnamese text when building links.
   */
  function readGreetingParams() {
    const params = new URLSearchParams(window.location.search);
    const to = (params.get('to') || params.get('name') || '').trim();
    const msg = (params.get('msg') || params.get('message') || '').trim();
    const from = (params.get('from') || params.get('sign') || params.get('sender') || '').trim();
    const title = (params.get('title') || '').trim();
    if (!to && !msg && !from && !title) return null;
    return {
      recipient: to,
      message: msg,
      sender: from,
      signature: from,
      title: title,
      fromUrl: true
    };
  }

  /** Keep ?to=... when going bouquet → garden */
  function withCurrentParams(path) {
    const q = window.location.search;
    return q ? path + q : path;
  }

  window.FlowerGreetingParams = {
    read: readGreetingParams,
    withCurrentParams
  };
})();
