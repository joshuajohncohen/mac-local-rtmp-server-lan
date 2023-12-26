const { ipcRenderer, remote, clipboard } = require('electron');
const template = require('lodash/template');
const fs = require('fs');
const path = require('path');
const filesize = require('filesize');
const shortid = require('shortid');

const randomStreamKey = shortid.generate();
const streamsTemplate = template(
  fs.readFileSync(
    path.join(remote.app.getAppPath(), 'assets/streams.ejs'),
    'utf8'
  )
);
const streamsContainer = document.getElementById('streams');

/* ************************** *
 * To anyone reading this and *
 * trying to run on Windows   *
 * or Linux, the IP finding   *
 * code must be changed       *
 * because it assumes that    *
 * the Wi-Fi interface is     *
 * "en0" which is only true   *
 * for Macs                   *
 * ************************** */

// IP FINDING CODE:
const localLanIp = require("os").networkInterfaces()['en0'].filter(({ family }) => family === "IPv4")[0].address;
// END IP FINDING CODE

function fetchStreamInfo(port = 8000) {
  fetch(`http://localhost:${port}/api/streams`)
    .then(res => res.json())
    .then(res => {
      console.log(
        Object.assign({}, res, {
          rtmpUri: `rtmp://${localLanIp}/live`,
          randomStreamKey,
          tools: {
            filesize
          }
        })
      );
      streamsContainer.innerHTML = streamsTemplate(
        Object.assign({}, res, {
          rtmpUri: 'rtmp://${localLanIp}/live',
          randomStreamKey,
          tools: {
            filesize
          }
        })
      );

      [...streamsContainer.querySelectorAll('.copy')].forEach(el => {
        el.addEventListener('click', e => {
          e.preventDefault();
          const text = el.parentElement.querySelector('code').innerText;
          clipboard.writeText(text);
        });
      });
    });
}

document.querySelector('.quit').addEventListener('click', () => {
  remote.app.quit();
});

ipcRenderer.on('port-ready', (e, port) => {
  fetchStreamInfo(port);
  setInterval(() => fetchStreamInfo(port), 5000);
});

ipcRenderer.send('app-ready');
