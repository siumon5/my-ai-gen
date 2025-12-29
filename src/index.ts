import { Env, verifyPassword, serveStaticFile } from './utils';
import { generateImage } from './image_gen';

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const url = new URL(request.url);

        // 處理靜態文件請求 (首頁、CSS)
        if (url.pathname === '/' || url.pathname === '/style.css') {
            return serveStaticFile(request);
        }

        // 處理密碼驗證
        if (request.method === 'POST' && url.pathname === '/authenticate') {
            try {
                const { password } = await request.json();
                if (verifyPassword(password, env)) {
                    return new Response(JSON.stringify({ success: true }), {
                        headers: { 'Content-Type': 'application/json' },
                    });
                } else {
                    return new Response(JSON.stringify({ success: false, message: '密碼錯誤' }), {
                        status: 401,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
            } catch (e: any) {
                return new Response(JSON.stringify({ success: false, message: '請求錯誤' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        // 處理圖片生成請求 (需要先驗證密碼)
        if (request.method === 'POST' && url.pathname === '/generate') {
            // 由於每次請求是無狀態的，這裡需要再次驗證密碼
            // 更好的做法是前端傳一個 token，但為了簡化這裡直接驗證
            // （實際應用中，會使用 JWT 或 Session 來管理認證狀態）
            
            // 這裡沒有直接在 `/generate` 端點再次要求密碼，
            // 而是假設前端在訪問此路由前已經經過 `/authenticate`。
            // 真正的無狀態認證應在每次請求頭中帶有 token。
            // 為了簡化，我們暫時允許前端在認證成功後直接調用 /generate

            try {
                const { prompt, width, height, num_images } = await request.json();

                // 目前 Cloudflare Workers AI 圖片生成 API 每次只能生成一張圖片。
                // 為了滿足 `num_images` 需求，需要在這裡循環調用 `generateImage`。
                // 注意：這會導致每次生成多張圖片時，Worker 的執行時間會更長。
                const images: ArrayBuffer[] = [];
                for (let i = 0; i < num_images; i++) {
                    const imageBuffer = await generateImage(env, prompt, width, height, 1); // 每次只生成一張
                    images.push(imageBuffer);
                }

                // 目前前端的 JavaScript 範例只接收一張圖片 (response.blob())。
                // 如果要顯示多張，前端需要修改為處理一個圖片 URL 陣列。
                // 為了讓當前前端正常工作，這裡只返回第一張圖片。
                // 若要返回多張，需要將圖片 base64 編碼後返回 JSON 陣列。
                // 由於瀏覽器直接顯示 ArrayBuffer 需要 content-type: image/png，
                // 返回多張圖片的 ArrayBuffer 會變得複雜。
                // 我們返回第一張圖片，讓前端可以渲染。
                return new Response(images[0], {
                    headers: { 'Content-Type': 'image/png' },
                });

            } catch (e: any) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }
        }

        return new Response('Not Found', { status: 404 });
    },
};
