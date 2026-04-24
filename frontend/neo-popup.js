function showNeoPopup(message, type = 'info', redirectUrl = null) {
  // Remove existing popup if any
  const existing = document.getElementById('neo-popup-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'neo-popup-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    backdrop-filter: blur(2px);
  `;

  const popup = document.createElement('div');
  
  // Set color based on type
  let bgColor = 'var(--color-tertiary)'; // default yellow
  if (type === 'error') bgColor = '#ff3333';
  else if (type === 'success') bgColor = 'var(--color-primary)';

  popup.style.cssText = `
    background: ${bgColor};
    color: #000;
    border: 4px solid #000;
    box-shadow: 12px 12px 0px #000;
    padding: 30px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    min-width: 320px;
    text-align: center;
    transform: translateY(-20px);
    animation: popIn 0.2s forwards ease-out;
  `;

  // Add animation style if not present
  if (!document.getElementById('neo-popup-style')) {
    const style = document.createElement('style');
    style.id = 'neo-popup-style';
    style.innerHTML = `
      @keyframes popIn {
        to { transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
  }

  const text = document.createElement('div');
  text.innerText = message;
  text.style.fontSize = '1.2rem';
  text.style.textTransform = 'uppercase';
  
  const closeBtn = document.createElement('button');
  closeBtn.innerText = 'OK';
  closeBtn.className = 'neo-btn';
  closeBtn.style.padding = '10px 30px';
  closeBtn.style.backgroundColor = '#fff';
  
  closeBtn.onclick = () => {
    overlay.remove();
    if (redirectUrl) window.location.href = redirectUrl;
  };

  popup.appendChild(text);
  popup.appendChild(closeBtn);
  overlay.appendChild(popup);
  document.body.appendChild(overlay);
}
