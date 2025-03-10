import { AIModelConfig } from '@/lib/ai-service'

/**
 * 处理需求书转Markdown的服务
 */
export class RequirementToMdService {
  /**
   * 流式调用API，将需求文档转换为Markdown格式
   * @param fileIds 上传的文件ID列表
   * @param config AI模型配置
   * @param onContent 流式返回内容回调
   */
  async convertToMd(
    fileIds: string[],
    config: AIModelConfig,
    onContent: (content: string) => void
  ): Promise<void> {
    try {
      console.log(`[${new Date().toISOString()}] 开始调用convertToMd，模型: ${config.model}，文件ID: ${fileIds.join(', ')}`);

      const response = await fetch('/api/convert-to-md', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          fileIds,
          apiConfig: config
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('API错误响应:', error);
        throw new Error(`API请求失败 (${response.status}): ${error}`);
      }

      if (!response.body) {
        throw new Error('响应中没有body');
      }

      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      let chunkCounter = 0;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`[${new Date().toISOString()}] 流读取完成，共处理${chunkCounter}个数据块`);
            break;
          }
          
          chunkCounter++;
          const chunk = decoder.decode(value, { stream: true });
          console.log(`[${new Date().toISOString()}] 收到数据块#${chunkCounter}，长度: ${chunk.length}字节`);
          
          if (chunk && chunk.length > 0) {
            // 确保回调被调用，即使内容块很小
            onContent(chunk);
          }
        }
      } catch (readError) {
        console.error(`[${new Date().toISOString()}] 流读取错误:`, readError);
        throw readError;
      }

      console.log(`[${new Date().toISOString()}] 转换完成`);
    } catch (error) {
      console.error(`[${new Date().toISOString()}] 转换为Markdown失败:`, error);
      throw error;
    }
  }
} 