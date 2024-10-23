import { Terminal } from 'xterm';
require('xterm/css/xterm.css');
import { FitAddon } from 'xterm-addon-fit';
require('../css/style.css');

const terminal = document.getElementById('terminal');
let ws;

function connectWebSocket (sshCredentials) {
  const isHttps = location.protocol === 'https:';
  ws = new WebSocket(`${isHttps ? "wss" : "ws"}://${location.hostname}:${location.port}/ssh`);

  ws.addEventListener('open', (event) => {
    ws.send(JSON.stringify(sshCredentials));
    overlay.style.display = 'none';

    ws.onmessage = (event) => {
      term.write(event.data)
      debounce(() => {
        resize();
      }, 1000)();
    };

    term.onData((e) => {
      console.log(111, e);
      ws.send(e)
    });
  });

  ws.addEventListener('error', (event) => {
    showErrorModal('WebSocket connection error. Please try reconnecting.');
  });

  ws.addEventListener('close', (event) => {
    showErrorModal('WebSocket connection closed. Attempting to reconnect...');
    setTimeout(() => {
      connectWebSocket(sshCredentials);
    }, 5000);
  });
}

const form = document.getElementById('ssh-form');
form.addEventListener('submit', (event) => {
  event.preventDefault();

  const ip = document.getElementById('ip').value;
  const port = document.getElementById('port').value;
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const sshCredentials = {
    ip,
    port,
    username,
    password,
  };

  // 将 SSH 凭据存储在本地
  localStorage.setItem('sshCredentials', JSON.stringify(sshCredentials));

  connectWebSocket(sshCredentials);
});

// 在页面加载时显示弹窗
window.addEventListener('load', () => {
  const storedCredentials = localStorage.getItem('sshCredentials');

  if (storedCredentials) {
    const sshCredentials = JSON.parse(storedCredentials);
    document.getElementById('ip').value = sshCredentials.ip;
    document.getElementById('port').value = sshCredentials.port;
    document.getElementById('username').value = sshCredentials.username;
    document.getElementById('password').value = sshCredentials.password;

    connectWebSocket(sshCredentials);
  } else {
    overlay.style.display = 'block';
  }


  resize();
});


const term = new Terminal({
  cursorStyle: "underline",
  cursorBlink: true,
  rightClickSelectsWord: true,
  theme: {
    foreground: '#F8F8F8',
    background: '#2D2E2C',
    cursor: "help",
    lineHeight: 10,

  },
  fontFamily: '"Cascadia Code", Menlo, monospace',
  screenKeys: true,
  useStyle: true,
});

const fitAddon = new FitAddon();
term.loadAddon(fitAddon);

term.writeln("Welcome to \x1b[1;32mYorlg\x1b[0m.")
term.writeln('This is Web Terminal of Modb;\n')

term.open(terminal);
term.focus()



const resize = () => {
  const dimensions = fitAddon.proposeDimensions();
  if (dimensions?.cols && dimensions?.rows) {
    fitAddon.fit();

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'resize', cols: dimensions.cols, rows: dimensions.rows }));
    }
  }

}

window.onresize = debounce(() => {
  resize();
}, 1000);

// 获取右上角退出按钮
const closeBtn = document.getElementById('exit');

closeBtn.addEventListener('click', () => {
  ws.close(); // 关闭 WebSocket 连接
  // 并且清除本地存储的 SSH 凭据 
  localStorage.removeItem('sshCredentials');

  location.reload();
});

// 用于防抖的函数
function debounce (fn, delay) {
  let timer = null;
  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, arguments);
    }, delay);
  };
}

function showErrorModal(message) {
  const errorModal = document.createElement('div');
  errorModal.classList.add('error-modal');
  errorModal.innerHTML = `
    <div class="error-modal-content">
      <span class="error-modal-close">&times;</span>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(errorModal);

  const closeModal = errorModal.querySelector('.error-modal-close');
  closeModal.addEventListener('click', () => {
    document.body.removeChild(errorModal);
  });
}
