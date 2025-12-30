export interface Env {
  AI: any;
  ACCESS_PASSWORD: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // --- 路由 1: 密碼驗證 ---
    if (url.pathname === "/authenticate" && request.method === "POST") {
      const { password } = await request.json() as any;
      if (password === env.ACCESS_PASSWORD) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: false }), { status: 401 });
    }

    // --- 路由 2: 圖片生成 (一次一張) ---
    if (url.pathname === "/generate" && request.method === "POST") {
      try {
        const { prompt, width, height } = await request.json() as any;

        const response = await 
          env.AI.run("@cf/black-forest-labs/flux-2-dev", {
          prompt: prompt,
          width: parseInt(width) || 1024,
          height: parseInt(height) || 1024,
        });

        return new Response(response, {
          headers: { "content-type": "image/png" },
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { "content-type": "application/json" },
        });
      }
    }

    // --- 路由 3: 前端頁面 (HTML/CSS) ---
    return new Response(getHTML(), {
      headers: { "Content-Type": "text/html;charset=utf-8" },
    });
  },
};

// 前端 UI 代碼
function getHTML() {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Flux AI Generator</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, sans-serif; background: #f4f7f9; display: flex; justify-content: center; padding: 20px; }
      .card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); width: 100%; max-width: 500px; }
      h2 { text-align: center; color: #333; }
      input, textarea, select, button { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; font-size: 16px; }
      button { background: #0070f3; color: white; border: none; font-weight: bold; cursor: pointer; transition: 0.2s; }
      button:hover { background: #0051ad; }
      button:disabled { background: #ccc; }
      #resultImg { width: 100%; border-radius: 8px; margin-top: 15px; display: none; border: 1px solid #eee; }
      .loader { text-align: center; color: #666; display: none; margin: 10px 0; }
    </style>
  </head>
  <body>
    <div class="card">
      <h2>Flux AI 圖片生成</h2>
      
      <div id="authBox">
        <input type="password" id="pass" placeholder="輸入訪問密碼">
        <button onclick="checkAuth()">進入系統</button>
      </div>

      <div id="mainBox" style="display:none">
        <textarea id="prompt" placeholder="輸入英文提示詞..." rows="3"></textarea>
        <div style="display:flex; gap:10px">
          <select id="width">
            <option value="512">寬: 512</option>
            <option value="1024" selected>寬: 1024</option>
            <option value="1280">寬: 1280</option>
            <option value="1920">寬: 1920</option>
          </select>
          <select id="height">
            <option value="512">高: 512</option>
            <option value="1024" selected>高: 1024</option>
            <option value="720">高: 720</option>
            <option value="1080">高: 1080</option>
          </select>
        </div>
        <button id="genBtn" onclick="generate()">立即生成圖片</button>
        <div class="loader" id="loader">AI 正在構思中 (約需 10-30 秒)...</div>
        <img id="resultImg" />
        <a id="dlLink" style="display:none; text-align:center; display:block; margin-top:10px; color:#0070f3; text-decoration:none;">下載圖片</a>
      </div>
    </div>

    <script>
      let userPass = "";

      async function checkAuth() {
        const pass = document.getElementById('pass').value;
        const res = await fetch('/authenticate', {
          method: 'POST',
          body: JSON.stringify({ password: pass })
        });
        if (res.ok) {
          userPass = pass;
          document.getElementById('authBox').style.display = 'none';
          document.getElementById('mainBox').style.display = 'block';
        } else {
          alert('密碼錯誤！');
        }
      }

      async function generate() {
        const prompt = document.getElementById('prompt').value;
        const width = document.getElementById('width').value;
        const height = document.getElementById('height').value;
        const btn = document.getElementById('genBtn');
        const loader = document.getElementById('loader');
        const img = document.getElementById('resultImg');
        const dl = document.getElementById('dlLink');

        if(!prompt) return alert('請輸入提示詞');

        btn.disabled = true;
        loader.style.display = 'block';
        img.style.display = 'none';
        dl.style.display = 'none';

        try {
          const res = await fetch('/generate', {
            method: 'POST',
            body: JSON.stringify({ prompt, width, height })
          });
          
          if(!res.ok) throw new Error('生成失敗，可能超時或額度不足');

          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          img.src = url;
          img.style.display = 'block';
          dl.href = url;
          dl.download = "flux_image.png";
          dl.style.display = 'block';
          dl.innerText = "保存圖片";
        } catch (e) {
          alert(e.message);
        } finally {
          btn.disabled = false;
          loader.style.display = 'none';
        }
      }
    </script>
  </body>
  </html>
  `;
}
