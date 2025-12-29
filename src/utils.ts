export interface Env {
    AI: any;
    ACCESS_PASSWORD: string; // 從 wrangler.toml vars 讀取
}

// 驗證密碼
export function verifyPassword(inputPassword: string, env: Env): boolean {
    return inputPassword === env.ACCESS_PASSWORD;
}

// 根據請求路徑提供靜態文件
export async function serveStaticFile(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname === '/' ? '/index.html' : url.pathname;

    // 模擬從文件系統讀取，但在 Worker 中我們會直接嵌入或使用 KV
    // 為簡化起見，這裡直接內嵌了 HTML 和 CSS
    if (path === '/index.html') {
        return new Response(INDEX_HTML_CONTENT, {
            headers: { 'Content-Type': 'text/html;charset=utf-8' },
        });
    } else if (path === '/style.css') {
        return new Response(CSS_CONTENT, {
            headers: { 'Content-Type': 'text/css;charset=utf-8' },
        });
    }

    return new Response('Not Found', { status: 404 });
}

// 將 HTML 和 CSS 內容直接複製到這裡
const INDEX_HTML_CONTENT = `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI 圖片生成器</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="container">
        <h1>AI 圖片生成器</h1>

        <div id="password-section">
            <input type="password" id="passwordInput" placeholder="輸入訪問密碼">
            <button id="submitPassword">進入</button>
            <p id="password-error" class="error"></p>
        </div>

        <div id="generator-section" style="display: none;">
            <label for="prompt">提示詞 (Prompt):</label>
            <textarea id="prompt" rows="3" placeholder="例如：A futuristic city at sunset, highly detailed"></textarea>

            <div class="input-group">
                <label for="width">寬度 (Width):</label>
                <select id="width">
                    <option value="512">512</option>
                    <option value="768">768</option>
                    <option value="1024" selected>1024</option>
                    <option value="1280">1280</option>
                    <option value="1536">1536</option>
                    <option value="1920">1920</option>
                </select>
            </div>

            <div class="input-group">
                <label for="height">高度 (Height):</label>
                <select id="height">
                    <option value="512">512</option>
                    <option value="768">768</option>
                    <option value="1024" selected>1024</option>
                    <option value="1280">1280</option>
                    <option value="1536">1536</option>
                    <option value="1920">1920</option>
                </select>
            </div>

            <div class="input-group">
                <label for="num_images">生成數量 (1-4):</label>
                <input type="number" id="num_images" value="1" min="1" max="4">
            </div>

            <button id="generateBtn">生成圖片</button>
            <p id="status" class="status"></p>

            <div id="image-gallery">
                </div>
        </div>
    </div>

    <script>
        const passwordInput = document.getElementById('passwordInput');
        const submitPasswordBtn = document.getElementById('submitPassword');
        const passwordError = document.getElementById('password-error');
        const passwordSection = document.getElementById('password-section');
        const generatorSection = document.getElementById('generator-section');

        const promptInput = document.getElementById('prompt');
        const widthSelect = document.getElementById('width');
        const heightSelect = document.getElementById('height');
        const numImagesInput = document.getElementById('num_images');
        const generateBtn = document.getElementById('generateBtn');
        const statusDiv = document.getElementById('status');
        const imageGallery = document.getElementById('image-gallery');

        let isAuthenticated = false;

        submitPasswordBtn.addEventListener('click', async () => {
            const password = passwordInput.value;
            const response = await fetch('/authenticate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await response.json();

            if (data.success) {
                isAuthenticated = true;
                passwordSection.style.display = 'none';
                generatorSection.style.display = 'block';
                passwordError.textContent = '';
            } else {
                passwordError.textContent = data.message || '密碼錯誤';
            }
        });

        generateBtn.addEventListener('click', async () => {
            if (!isAuthenticated) {
                statusDiv.textContent = '請先輸入密碼。';
                return;
            }

            const prompt = promptInput.value;
            const width = parseInt(widthSelect.value);
            const height = parseInt(heightSelect.value);
            const numImages = parseInt(numImagesInput.value);

            if (!prompt) {
                statusDiv.textContent = '請輸入提示詞！';
                return;
            }
            if (numImages < 1 || numImages > 4) {
                 statusDiv.textContent = '生成數量必須在 1 到 4 之間。';
                 return;
            }

            statusDiv.textContent = '正在生成圖片，請稍候... (可能需要30秒)';
            generateBtn.disabled = true;
            imageGallery.innerHTML = ''; // 清空之前的圖片

            try {
                const response = await fetch('/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt, width, height, num_images: numImages })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || '圖片生成失敗');
                }

                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                const img = document.createElement('img');
                img.src = imageUrl;
                img.alt = prompt;
                imageGallery.appendChild(img);
                
                statusDiv.textContent = '圖片生成成功！';

            } catch (error) {
                statusDiv.textContent = `錯誤: ${error.message}`;
                console.error('生成錯誤:', error);
            } finally {
                generateBtn.disabled = false;
            }
        });
    </script>
</body>
</html>
`;

const CSS_CONTENT = `body {
    font-family: sans-serif;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    background-color: #f0f2f5;
    margin: 20px;
}

.container {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 10px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 600px;
    box-sizing: border-box;
}

h1 {
    text-align: center;
    color: #333;
    margin-bottom: 25px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: bold;
    color: #555;
}

input[type="password"],
textarea,
select,
input[type="number"] {
    width: calc(100% - 20px);
    padding: 12px;
    margin-bottom: 20px;
    border: 1px solid #ccc;
    border-radius: 5px;
    font-size: 16px;
    box-sizing: border-box;
}

textarea {
    resize: vertical;
}

button {
    background-color: #007bff;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
    margin-top: 10px;
    transition: background-color 0.3s ease;
}

button:hover:not(:disabled) {
    background-color: #0056b3;
}

button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.input-group {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
}

.input-group label {
    flex: 1;
    margin-bottom: 0;
}

.input-group select,
.input-group input[type="number"] {
    flex: 2;
    margin-bottom: 0;
    width: auto; /* override 100% */
}

.status {
    text-align: center;
    margin-top: 20px;
    font-weight: bold;
    color: #333;
}

.error {
    color: red;
    text-align: center;
    margin-top: 10px;
}

#image-gallery {
    margin-top: 30px;
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    justify-content: center;
}

#image-gallery img {
    max-width: 100%;
    height: auto;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
`;
