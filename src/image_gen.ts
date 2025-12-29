import { Env } from './utils'; // 引入 Env 接口

// Cloudflare Workers AI 目前的圖片生成模型
const IMAGE_GEN_MODEL = "@cf/black-forest-labs/flux-2-dev";

export async function generateImage(
    env: Env,
    prompt: string,
    width: number,
    height: number,
    num_images: number // 新增生成圖片數量參數
): Promise<ArrayBuffer> {
    // 檢查尺寸是否在合理範圍內 (根據模型能力調整)
    // flux-2-dev 由於是新模型，具體最佳尺寸還需測試，這裡給出通用範圍
    if (width < 256 || height < 256 || width > 2048 || height > 2048) {
        throw new Error("圖片寬高必須在 256 到 2048 像素之間。");
    }
    if (num_images < 1 || num_images > 4) {
        throw new Error("生成圖片數量必須在 1 到 4 之間。");
    }

    const inputs = {
        prompt: prompt,
        width: width,
        height: height,
        num_inference_steps: 20, // 增加步數通常能提高質量，但也增加延遲
        // num_images: num_images // 目前 Cloudflare Workers AI 的圖片生成 API 不直接支持一次生成多張圖片
                               // 你需要多次調用 API 來實現生成多張圖片
                               // 這裡我們暫時只返回一張，因為前端目前也只顯示一張
    };

    try {
        // Cloudflare Workers AI 的圖片生成 API 每次只能生成一張圖片。
        // 如果需要生成多張，前端需要多次發送請求，或後端多次調用 AI.run
        // 為了簡化，目前只生成一張。若要生成多張，需要調整前端多次請求邏輯
        const response = await env.AI.run(IMAGE_GEN_MODEL, inputs);
        return response; // response 預期為 ArrayBuffer
    } catch (error: any) {
        console.error("圖片生成失敗:", error);
        throw new Error(`AI 圖片生成失敗: ${error.message || '未知錯誤'}`);
    }
}
