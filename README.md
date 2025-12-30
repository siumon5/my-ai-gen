# my-ai-gen
AI text to image generator 

12.30更新
功能修改：一次只能生成一張圖片。
代碼簡化：移除原public文件夾的index.html和css，合併到scr/index.ts

Original version
注意事項：
• ACCESS_PASSWORD：務必在 wrangler.toml 中修改為一個安全的密碼！
• 前端顯示多張圖片：目前 src/image_gen.ts 和 src/index.ts 已經修改為在後端依據 num_images 參數多次調用 AI 模型生成圖片。但是，前端的 index.html 目前僅顯示一張圖片。若要顯示多張，你需要：
1. 修改 Worker 的 /generate 端點，將所有生成的 ArrayBuffer 圖片進行 Base64 編碼，然後作為一個 JSON 陣列返回給前端。
2. 修改 index.html 中的 JavaScript 代碼，使其能夠接收這個 JSON 陣列，然後遍歷陣列並為每張圖片建立一個 <img> 標籤來顯示。
• Worker 超時：生成高解析度圖片或一次生成多張圖片可能會非常耗時。Cloudflare Workers 默認有 30 秒 的執行時間限制（Pro 方案可以更高）。如果你生成 1920 \times 1080 或一次生成 4 張，很有可能會超時。在這種情況下，你可能需要考慮：
• 降低圖片質量（減少 num_inference_steps）。
• 降低最大生成尺寸。
• 升級 Cloudflare Workers 方案以獲得更長的執行時間。
• 將圖片生成任務分發到一個異步隊列（例如 Cloudflare Queues），完成後再通知前端。
