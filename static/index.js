const terminal = document.getElementById('terminal');
let ws;


function connectWebSocket (sshCredentials) {
  ws = new WebSocket(`ws://${location.hostname}:3000`);

  ws.addEventListener('open', (event) => {
    ws.send(JSON.stringify(sshCredentials));
    overlay.style.display = 'none';

    ws.onmessage = (event) => {
      term.write(event.data)

      debounce(() => {
        fitAddon.fit();
        term.resize(80, term.rows);
      }, 1000)();
    };

    term.onData((e) => {
      ws.send(e)
    });
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
});


const term = new Terminal({
  rendererType: "canvas",
  rows: 45,
  convertEol: true,
  cursorStyle: "underline",
  cursorBlink: true,
  rightClickSelectsWord: true,
  theme: {
    foreground: '#F8F8F8',
    background: '#2D2E2C',
    cursor: "help",
    lineHeight: 14,
  },
  fontFamily: '"Cascadia Code", Menlo, monospace'
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

term.writeln("Welcome to \x1b[1;32mYorlg\x1b[0m.")
term.writeln('This is Web Terminal of Modb;\n')

fitAddon.fit();

window.addEventListener('resize', () => {
  fitAddon.fit();
  term.resize(80, term.rows);
});

term.open(terminal);
term.focus();

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