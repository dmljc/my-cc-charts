/**
 * lowcode:build 后的独立后处理：重命名 3 个产物并更新 assets 引用。
 * 不介入 webpack / 插件链路，可随时删除本文件并还原 package.json 脚本。
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../build/lowcode');
const renames = [
  ['meta.js', 'my-meta.js'],
  ['view.js', 'my-view.js'],
  ['view.css', 'my-view.css'],
];
const pathReplacements = [
  ['./meta.js', './my-meta.js'],
  ['./view.js', './my-view.js'],
  ['./view.css', './my-view.css'],
  ['/build/lowcode/meta.js', '/build/lowcode/my-meta.js'],
  ['/build/lowcode/view.js', '/build/lowcode/my-view.js'],
  ['/build/lowcode/view.css', '/build/lowcode/my-view.css'],
];

if (!fs.existsSync(dir)) {
  console.error('[rename-lowcode-outputs] build/lowcode not found');
  process.exit(1);
}

renames.forEach(([from, to]) => {
  const src = path.join(dir, from);
  const dest = path.join(dir, to);
  if (!fs.existsSync(src)) return;
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  fs.renameSync(src, dest);
});

fs.readdirSync(dir)
  .filter((name) => name.startsWith('assets-') && name.endsWith('.json'))
  .forEach((name) => {
    const file = path.join(dir, name);
    const next = pathReplacements.reduce((text, [from, to]) => text.split(from).join(to), fs.readFileSync(file, 'utf8'));
    fs.writeFileSync(file, next, 'utf8');
  });

// 校验：确保新文件存在，且 assets 不再引用根目录旧文件名
const required = ['my-meta.js', 'my-view.js', 'my-view.css'];
const missing = required.filter((name) => !fs.existsSync(path.join(dir, name)));
if (missing.length) {
  console.error('[rename-lowcode-outputs] missing files:', missing.join(', '));
  process.exit(1);
}

const staleRefs = [];
fs.readdirSync(dir)
  .filter((name) => name.startsWith('assets-') && name.endsWith('.json'))
  .forEach((name) => {
    const content = fs.readFileSync(path.join(dir, name), 'utf8');
    if (content.includes('./meta.js') || content.includes('./view.js') || content.includes('./view.css')) {
      staleRefs.push(name);
    }
  });

if (staleRefs.length) {
  console.error('[rename-lowcode-outputs] stale asset refs in:', staleRefs.join(', '));
  process.exit(1);
}
