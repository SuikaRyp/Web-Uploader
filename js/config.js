// ============================================================
//  ⚙️ CONFIG — GitHub repo target, Instagram downloader keys
//  EDIT DI SINI SEBELUM DEPLOY
// ============================================================
const GITHUB_CONFIG = {
  owner:  'SuikaRYP',   // github username lo
  repo:   'SuikaUploader',       // nama repo
  branch: 'main',            // branch target
  folder: 'Suika',         // folder di dalam repo
  token:  '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',      // ghp_xxxxxxxxxxxxxxxxxxxx
};
// ============================================================

let queue = [];
let uploadHistory = JSON.parse(localStorage.getItem('suika_history') || '[]');

const IG_CONFIG = {
  secretKeyHex: "34ac9a1aa6aaa7d69a7075611898f16a85d496b1d8f1c7aaa5640a2d93d7af80",
  appVersionTS: "1770240123231",
  userAgent: "Mozilla/5.0 (Linux; Android 10; RMX2185 Build/QP1A.190711.020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.7559.109 Mobile Safari/537.36",
};
const CORS = "https://cors.yardansh.com/";

