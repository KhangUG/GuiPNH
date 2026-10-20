(() => {
  'use strict';

  const STORAGE_KEY = 'flower.greeting.20-10.v5';
  /* Lời chúc mặc định — sửa ở đây (hoặc sửa tên/chữ ký trong index.html).
     Phần message bắt buộc sửa ở đây vì #cardMessage trong HTML để trống cho JS đổ vào. */
  const defaultGreeting = {
    recipient: (document.getElementById('cardRecipient')?.textContent || 'Phạm Ngọc Huyền').trim(),
    message: 'Chúc mừng 20/10 nhé. Hôm nay mày được quyền vui vẻ, ăn ngon, ngủ ngon và nhận lời chúc cho đã. Còn nếu có chuyện gì làm mày cụt hứng, cứ bình tĩnh đọc hết tấm thiệp này đã, rồi tính sau.\n\nĐùa một chút thôi. Tao mong mày có những ngày thức dậy với tâm trạng nhẹ, có người để kể chuyện vui, có chỗ để về khi mệt, và đủ tự tin để sống theo cách mày muốn. Mày không cần hoàn hảo thì mới xứng đáng với điều tốt đẹp.\n\nNếu chỉ được gửi một điều hôm nay, tao muốn mày bình an. Mong những thứ làm mày mỉm cười nhiều hơn những thứ làm mày phải nghĩ nhiều. Mong mày gặp được những người biết quý sự tử tế và chân thành của mày. Cảm ơn mày vì đã xuất hiện, và vì đã đáng quý theo một cách rất riêng.',
    sender: (document.getElementById('cardSender')?.textContent || 'Giáp Văn Khang').trim()
  };
  const dialog = document.getElementById('greetingCard');
  const openButton = document.getElementById('openCard');
  const reading = document.getElementById('cardReading');
  const editor = document.getElementById('cardEditor');
  const editButton = document.getElementById('editCard');
  const status = document.getElementById('cardStatus');
  const closeButton = document.getElementById('closeCard');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopLayout = window.matchMedia('(min-width: 1100px)');
  const sceneElements = [...document.querySelectorAll('.bouquet-composition, .scene-footer')];
  const layoutAnimations = new Set();
  const album = document.getElementById('memoryAlbum');
  const albumToggle = document.getElementById('toggleAlbum');
  const albumObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      album.classList.add('is-revealed');
      albumObserver.unobserve(album);
    }
  }, { threshold: 0.08 });

  let albumRevealPromise;
  function revealAlbum() {
    if (albumRevealPromise) return albumRevealPromise;
    // Restore saved photos and decode them before revealing the paper frames.
    const photos = [...album.querySelectorAll('img')];
    photos.forEach(photo => { photo.loading = 'eager'; });
    albumRevealPromise = Promise.resolve(window.albumPhotosReady)
      .then(() => Promise.allSettled(photos.map(photo => photo.decode())))
      .then(() => {
        album.hidden = false;
        albumObserver.observe(album);
      });
    return albumRevealPromise;
  }

  albumToggle.addEventListener('click', () => {
    const expanded = album.classList.toggle('is-spread');
    albumToggle.setAttribute('aria-expanded', String(expanded));
    albumToggle.innerHTML = expanded ? 'Gấp album <span aria-hidden="true">♡</span>' : 'Xòe album <span aria-hidden="true">♡</span>';
  });
  document.getElementById('viewAlbum').addEventListener('click', async () => {
    await revealAlbum();
    album.classList.add('is-revealed');
    album.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    albumToggle.focus({ preventScroll: true });
  });

  function reflowScene(changeLayout) {
    layoutAnimations.forEach(animation => animation.cancel());
    layoutAnimations.clear();
    const before = sceneElements.map(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    });
    changeLayout();
    if (motion.matches) return;
    sceneElements.forEach((element, index) => {
      const after = element.getBoundingClientRect();
      if (!after.width || !after.height) return;
      const dx = before[index].left - after.left - window.scrollX;
      const dy = before[index].top - after.top - window.scrollY;
      const scale = element.matches('.bouquet-composition')
        ? ` scale(${before[index].width / after.width}, ${before[index].height / after.height})` : '';
      const animation = element.animate([
        { transform: `translate(${dx}px, ${dy}px)${scale}` },
        { transform: 'none' }
      ], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
      layoutAnimations.add(animation);
      animation.onfinish = () => layoutAnimations.delete(animation);
    });
  }

  function revealCard() {
    const rect = dialog.getBoundingClientRect();
    if (!desktopLayout.matches || rect.top < 16 || rect.top > window.innerHeight * 0.35 || rect.bottom > window.innerHeight - 16) {
      dialog.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    }
  }

  function setCardOpen(open) {
    if (dialog.open === open) return;
    reflowScene(() => {
      if (open) {
        showReading();
        status.textContent = '';
        // A non-modal dialog participates in the page grid and reserves its own space.
        document.body.classList.add('card-open');
        dialog.show();
      } else {
        dialog.close();
        document.body.classList.remove('card-open');
        showReading();
      }
      openButton.setAttribute('aria-expanded', String(open));
      openButton.querySelector('.envelope-action').textContent = open ? 'Gấp thiệp' : 'Mở thiệp';
    });
    if (open) {
      closeButton.focus({ preventScroll: true });
      revealAlbum();
      revealCard();
      document.dispatchEvent(new Event('bouquet:celebrate'));
    } else {
      openButton.focus({ preventScroll: true });
      const rect = openButton.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        openButton.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
      }
    }
  }

  motion.addEventListener('change', () => {
    if (motion.matches) {
      layoutAnimations.forEach(animation => animation.cancel());
      layoutAnimations.clear();
    }
  });
  const inputs = {
    recipient: document.getElementById('recipientInput'),
    message: document.getElementById('messageInput'),
    sender: document.getElementById('senderInput')
  };
  let greeting = { ...defaultGreeting };
  const urlGreeting = window.FlowerGreetingParams && window.FlowerGreetingParams.read();

  if (urlGreeting && urlGreeting.recipient) {
    // Link cá nhân hóa (?to=...) ưu tiên hơn localStorage trên máy anh.
    greeting = {
      recipient: urlGreeting.recipient,
      message: urlGreeting.message || defaultGreeting.message,
      sender: urlGreeting.sender || defaultGreeting.sender
    };
  } else {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && Object.keys(inputs).every(key => typeof saved[key] === 'string'
        && saved[key].trim().length > 0 && saved[key].length <= inputs[key].maxLength)) {
        greeting = Object.fromEntries(Object.keys(inputs).map(key => [key, saved[key].trim()]));
      }
    } catch {
      // The default letter stays usable when storage is unavailable or malformed.
    }
  }

  function renderGreeting() {
    document.getElementById('cardRecipient').textContent = greeting.recipient;
    const paragraphs = greeting.message.split(/\n\s*\n/).map(text => {
      const paragraph = document.createElement('span');
      paragraph.className = 'message-paragraph';
      paragraph.textContent = text;
      return paragraph;
    });
    document.getElementById('cardMessage').replaceChildren(...paragraphs);
    document.getElementById('cardSender').textContent = greeting.sender;
  }

  function showReading() {
    reading.hidden = false;
    editor.hidden = true;
    dialog.setAttribute('aria-labelledby', 'cardTitle');
    dialog.scrollTop = 0;
  }

  document.addEventListener('bouquet:ready', () => { openButton.hidden = false; });
  document.addEventListener('bouquet:rose', event => {
    const wish = document.getElementById('roseWish');
    wish.classList.remove('is-new');
    wish.textContent = event.detail.message;
    // Restart the brief reveal even when two flowers share the same wish.
    void wish.offsetWidth;
    wish.classList.add('is-new');
  });
  document.getElementById('replayBloom').addEventListener('click', () => {
    document.dispatchEvent(new Event('bouquet:replay'));
    const wish = document.getElementById('roseWish');
    wish.classList.remove('is-new');
    wish.textContent = 'Vườn hoa nở lại. Tình cảm vẫn nguyên, chỉ làm mới một lượt hoa thôi.';
    void wish.offsetWidth;
    wish.classList.add('is-new');
  });

  openButton.addEventListener('click', () => setCardOpen(!dialog.open));
  closeButton.addEventListener('click', () => setCardOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.open && !event.defaultPrevented) {
      event.preventDefault();
      setCardOpen(false);
    }
  });
  dialog.addEventListener('close', () => {
    if (dialog.open || !document.body.classList.contains('card-open')) return;
    document.body.classList.remove('card-open');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.querySelector('.envelope-action').textContent = 'Mở thiệp';
    showReading();
  });

  editButton.addEventListener('click', () => {
    Object.keys(inputs).forEach(key => {
      inputs[key].value = greeting[key];
      inputs[key].setCustomValidity('');
    });
    reading.hidden = true;
    editor.hidden = false;
    status.textContent = '';
    dialog.setAttribute('aria-labelledby', 'editorTitle');
    dialog.scrollTop = 0;
    inputs.recipient.focus({ preventScroll: true });
    revealCard();
  });
  document.getElementById('cancelEdit').addEventListener('click', () => {
    showReading();
    editButton.focus({ preventScroll: true });
    revealCard();
  });
  Object.values(inputs).forEach(input => {
    input.addEventListener('input', () => input.setCustomValidity(''));
  });
  editor.addEventListener('submit', event => {
    event.preventDefault();
    for (const input of Object.values(inputs)) {
      input.setCustomValidity(input.value.trim() ? '' : 'Mày viết vài chữ vào đây nhé.');
    }
    if (!editor.reportValidity()) return;
    greeting = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value.trim()]));
    renderGreeting();
    showReading();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(greeting));
      status.textContent = 'Đã giữ lời chúc này lại. Lần sau mở trang, nó vẫn nằm ở đây.';
    } catch {
      status.textContent = 'Đã cập nhật thiệp. Trình duyệt chưa cho phép lưu để dùng lần sau.';
    }
    editButton.focus({ preventScroll: true });
    revealCard();
  });
  renderGreeting();
})();
